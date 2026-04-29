'use server';

import { getAuthUser, createTokens, setAuthCookies, clearAuthCookies } from '@/lib/auth';
import { SystemError } from '@/types/systemError';
import { SystemCode } from '@/types/systemCodes';
import { validateRequiredFields, isValidPassword } from '@/lib/utils/fieldValidation';
import { normalizeEmail, validateEmail } from '@/lib/utils/emailValidation';
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/mailer';
import { randomBytes } from 'crypto';
import {
  getTempApiKey,
  getApiKeyByUser,
  createApiKeyForUser,
  deleteApiKeyByUser,
} from '@/lib/dal/apiKeysService';
import {
  loginUser as dalLoginUser,
  registerUser as dalRegisterUser,
  insertVerificationToken,
  createPasswordResetToken,
  resetPasswordWithToken,
} from '@/lib/dal/usersService';
import { subscribeNotifications as dalSubscribeNotifications } from '@/lib/dal/notificationsService';
import type { UserProfile } from '@/types/user';

type ApiKeyResult = {
  apiKey: string;
  createdAt: string | null;
  expiresAt: string | null;
};

export async function fetchTempApiKey(): Promise<{ apiKey: string; expiresAt: string | null }> {
  return getTempApiKey();
}

export async function fetchUserApiKey(): Promise<ApiKeyResult> {
  const user = await getAuthUser();
  if (!user) {
    return { apiKey: '', createdAt: null, expiresAt: null };
  }
  return (await getApiKeyByUser(user.id)) ?? { apiKey: '', createdAt: null, expiresAt: null };
}

export async function createUserApiKey(): Promise<ApiKeyResult> {
  const user = await getAuthUser();
  if (!user) throw new SystemError(SystemCode.AUTH_UNAUTHORIZED);
  return createApiKeyForUser(user.id);
}

export async function deleteUserApiKey(): Promise<void> {
  const user = await getAuthUser();
  if (!user) throw new SystemError(SystemCode.AUTH_UNAUTHORIZED);
  await deleteApiKeyByUser(user.id);
}

export async function loginUser(email: string, password: string): Promise<UserProfile> {
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
}

export async function logoutUser(): Promise<void> {
  await clearAuthCookies();
}

const emailAttemptCache = new Map<string, { count: number; firstAttempt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000;

export async function registerUser(data: {
  name: string;
  lastName: string;
  organization?: string | null;
  email: string;
  password: string;
  subscribeNotifications?: boolean;
}): Promise<void> {
  validateRequiredFields(data, ['name', 'lastName', 'email', 'password']);

  const normalizedEmail = normalizeEmail(data.email);

  const now = Date.now();
  const attemptRecord = emailAttemptCache.get(normalizedEmail);
  if (attemptRecord && now - attemptRecord.firstAttempt < WINDOW_MS && attemptRecord.count >= MAX_ATTEMPTS) {
    return;
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
}

export async function forgotPassword(email: string): Promise<void> {
  validateRequiredFields({ email }, ['email']);

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  const status = await createPasswordResetToken(email, token, expiresAt);

  if (status === 'Password reset token created successfully') {
    await sendPasswordResetEmail(email, token);
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  validateRequiredFields({ token, newPassword }, ['token', 'newPassword']);

  const status = await resetPasswordWithToken(token, newPassword);

  if (status === 'INVALID_OR_EXPIRED_TOKEN') {
    throw new SystemError(SystemCode.AUTH_INVALID_TOKEN);
  }
  if (status !== 'PASSWORD_RESET_SUCCESSFUL') {
    throw new SystemError(SystemCode.SYSTEM_INTERNAL_SERVER_ERROR);
  }
}
