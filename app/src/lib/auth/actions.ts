'use server';

import { randomBytes } from 'crypto';
import { createTokens, setAuthCookies } from '@/lib/auth/session';
import { SystemError } from '@/types/system-error';
import { SystemCode } from '@/types/system-codes';
import { action } from '@/lib/server/action';
import { validateRequiredFields, isValidPassword } from '@/lib/shared/field-validation';
import { normalizeEmail } from '@/lib/shared/email-format';
import { sendPasswordResetEmail } from '@/lib/server/mailer';
import {
  loginUser as dalLoginUser,
  createPasswordResetToken,
  resetPasswordWithToken,
  isSsoLinkedEmail,
} from '@/lib/db/users-service';
import type { UserProfile } from '@/types/user';

export const loginUser = action(async (email: string, password: string): Promise<UserProfile> => {
  validateRequiredFields({ email, password }, ['email', 'password']);
  const normalized = normalizeEmail(email);

  if (await isSsoLinkedEmail(normalized)) {
    throw new SystemError(SystemCode.AUTH_SSO_REQUIRED);
  }

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

export const forgotPassword = action(async (email: string): Promise<void> => {
  validateRequiredFields({ email }, ['email']);
  const normalized = normalizeEmail(email);

  if (await isSsoLinkedEmail(normalized)) {
    throw new SystemError(SystemCode.AUTH_SSO_REQUIRED);
  }

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  const status = await createPasswordResetToken(normalized, token, expiresAt);

  if (status === 'Password reset token created successfully') {
    await sendPasswordResetEmail(normalized, token);
  }
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
