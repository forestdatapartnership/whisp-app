'use server';

import { getAuthUser } from '@/lib/auth/session';
import { SystemError } from '@/types/systemError';
import { SystemCode } from '@/types/systemCodes';
import { action } from '@/lib/server/action';
import {
  getTempApiKey,
  getApiKeyByUser,
  createApiKeyForUser,
  deleteApiKeyByUser,
} from '@/lib/db/api-keys-service';

type ApiKeyResult = {
  apiKey: string;
  createdAt: string | null;
  expiresAt: string | null;
};

const EMPTY_KEY: ApiKeyResult = { apiKey: '', createdAt: null, expiresAt: null };

export const fetchTempApiKey = action(
  async (): Promise<{ apiKey: string; expiresAt: string | null }> => getTempApiKey()
);

export const fetchUserApiKey = action(async (): Promise<ApiKeyResult> => {
  const user = await getAuthUser();
  if (!user) return EMPTY_KEY;
  return (await getApiKeyByUser(user.id)) ?? EMPTY_KEY;
});

export const createUserApiKey = action(async (): Promise<ApiKeyResult> => {
  const user = await getAuthUser();
  if (!user) throw new SystemError(SystemCode.AUTH_UNAUTHORIZED);
  return createApiKeyForUser(user.id);
});

export const deleteUserApiKey = action(async (): Promise<void> => {
  const user = await getAuthUser();
  if (!user) throw new SystemError(SystemCode.AUTH_UNAUTHORIZED);
  await deleteApiKeyByUser(user.id);
});
