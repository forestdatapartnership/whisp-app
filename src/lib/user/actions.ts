'use server';

import { getAuthUser, getAuthUserWithRefresh } from '@/lib/auth';
import { SystemError } from '@/types/systemError';
import { SystemCode } from '@/types/systemCodes';
import { validateRequiredFields } from '@/lib/utils/fieldValidation';
import {
  getUserByUuid,
  updateUserProfile as dalUpdateProfile,
  verifyUserPassword,
  deleteUser,
  changeUserPassword,
} from '@/lib/dal/usersService';
import type { UserProfile } from '@/types/user';

export async function fetchUserProfile(): Promise<UserProfile | null> {
  const user = await getAuthUserWithRefresh();
  if (!user) return null;
  return getUserByUuid(user.id);
}

export async function updateUserProfile(data: {
  name: string;
  lastName: string;
  organization?: string | null;
}): Promise<UserProfile> {
  const user = await getAuthUser();
  if (!user) {
    throw new SystemError(SystemCode.AUTH_UNAUTHORIZED);
  }

  if (!data.name || !data.lastName) {
    throw new SystemError(SystemCode.VALIDATION_MISSING_REQUIRED_FIELDS);
  }

  const updated = await dalUpdateProfile(user.id, data);
  if (!updated) {
    throw new SystemError(SystemCode.USER_NOT_FOUND);
  }
  return updated;
}

export async function deleteUserAccount(password: string): Promise<void> {
  const user = await getAuthUser();
  if (!user) {
    throw new SystemError(SystemCode.AUTH_UNAUTHORIZED);
  }

  if (!password) {
    throw new SystemError(SystemCode.USER_PASSWORD_CONFIRMATION_REQUIRED);
  }

  const isValid = await verifyUserPassword(user.id, password);
  if (!isValid) {
    throw new SystemError(SystemCode.USER_INVALID_PASSWORD);
  }

  await deleteUser(user.id);
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = await getAuthUser();
  if (!user) throw new SystemError(SystemCode.AUTH_UNAUTHORIZED);
  validateRequiredFields({ currentPassword, newPassword }, ['currentPassword', 'newPassword']);
  const success = await changeUserPassword(user.id, currentPassword, newPassword);
  if (!success) throw new SystemError(SystemCode.USER_INVALID_PASSWORD);
}
