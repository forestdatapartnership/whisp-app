'use server';

import { randomBytes } from 'crypto';
import { createTokens, setAuthCookies, clearAuthCookies } from '@/lib/auth/session';
import { SystemError } from '@/types/system-error';
import { SystemCode } from '@/types/system-codes';
import { action } from '@/lib/server/action';
import { validateRequiredFields, isValidPassword } from '@/lib/shared/field-validation';
import { normalizeEmail } from '@/lib/shared/email-format';
import { validateEmail } from '@/lib/server/email-domain';
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/server/mailer';
import {
  loginUser as dalLoginUser,
  registerUser as dalRegisterUser,
  insertVerificationToken,
  createPasswordResetToken,
  resetPasswordWithToken,
  verifyEmailByToken,
} from '@/lib/db/users-service';
import { subscribeNotifications as dalSubscribeNotifications } from '@/lib/db/notifications-service';
import type { UserProfile } from '@/types/user';

export const loginUser = action(async (email: string, password: string): Promise<UserProfile> => {
  validateRequiredFields({ email, password }, ['email', 'password']);
  const normalized = normalizeEmail(email);
  const profile = await dalLoginUser(normalized, password);
  if (!profile) throw new SystemError(SystemCode.AUTH_INVALID_CREDENTIALS);
  if (!profile.email_verified) throw new SystemError(SystemCode.AUTH_EMAIL_NOT_VERIFIED);

  const tokens = await createTokens({
    id: profile.uuid,
    email: profile.email,
    isAdmin: profile.is_admin,
  });
  await setAuthCookies(tokens);
  return profile;
});

export const logoutUser = action(async (): Promise<void> => {
  await clearAuthCookies();
});

const emailAttemptCache = new Map<string, { count: number; firstAttempt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000;

export const registerUser = action(async (data: {
  name: string;
  lastName: string;
  organization?: string | null;
  email: string;
  password: string;
  subscribeNotifications?: boolean;
}): Promise<void> => {
  validateRequiredFields(data, ['name', 'lastName', 'email', 'password']);

  const normalizedEmail = normalizeEmail(data.email);

  const now = Date.now();
  const attemptRecord = emailAttemptCache.get(normalizedEmail);
  if (attemptRecord && now - attemptRecord.firstAttempt < WINDOW_MS && attemptRecord.count >= MAX_ATTEMPTS) {
    throw new SystemError(SystemCode.AUTH_RATE_LIMIT_EXCEEDED);
  }
  if (!attemptRecord || now - attemptRecord.firstAttempt >= WINDOW_MS) {
    emailAttemptCache.set(normalizedEmail, { count: 1, firstAttempt: now });
  } else {
    attemptRecord.count += 1;
  }

  const validatedEmail = await validateEmail(data.email);
  if (!validatedEmail) throw new SystemError(SystemCode.USER_INVALID_EMAIL);

  if (!isValidPassword(data.password)) throw new SystemError(SystemCode.USER_WEAK_PASSWORD);

  const message = await dalRegisterUser(
    data.name,
    data.lastName,
    data.organization ?? null,
    validatedEmail,
    data.password
  );

  if (message === 'Email already exists') throw new SystemError(SystemCode.USER_EMAIL_ALREADY_EXISTS);
  if (message !== 'User registered successfully') throw new SystemError(SystemCode.USER_REGISTRATION_FAILED);

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await insertVerificationToken(validatedEmail, token, expiresAt);
  await sendVerificationEmail(validatedEmail, token);

  if (data.subscribeNotifications) {
    await dalSubscribeNotifications(validatedEmail);
  }
});

export const forgotPassword = action(async (email: string): Promise<void> => {
  validateRequiredFields({ email }, ['email']);

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  const status = await createPasswordResetToken(email, token, expiresAt);

  if (status === 'Password reset token created successfully') {
    await sendPasswordResetEmail(email, token);
  }
});

export const verifyEmail = action(async (token: string): Promise<string> => {
  validateRequiredFields({ token }, ['token']);
  const message = await verifyEmailByToken(token);
  if (message === 'Email verified successfully') return message;
  throw new SystemError(SystemCode.AUTH_INVALID_TOKEN);
});

export const resetPassword = action(async (token: string, newPassword: string): Promise<void> => {
  validateRequiredFields({ token, newPassword }, ['token', 'newPassword']);
  if (!isValidPassword(newPassword)) throw new SystemError(SystemCode.USER_WEAK_PASSWORD);

  const status = await resetPasswordWithToken(token, newPassword);

  if (status === 'INVALID_OR_EXPIRED_TOKEN') {
    throw new SystemError(SystemCode.AUTH_INVALID_TOKEN);
  }
  if (status !== 'PASSWORD_RESET_SUCCESSFUL') {
    throw new SystemError(SystemCode.SYSTEM_INTERNAL_SERVER_ERROR);
  }
});
