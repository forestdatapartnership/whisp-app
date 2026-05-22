import 'server-only';
import { getAuthUser } from '@/lib/auth/session';
import { getCacheableApiKeyByUser, getTempApiKey, type CacheableApiKey } from '@/lib/db/api-keys-service';
import { config } from '@/lib/server/env';

const CACHE_SAFEGUARD_MS = 60_000;
const cache = new Map<string, { apiKey: string; validUntil: number }>();

function cacheUntil(expiresAt: string) {
  return new Date(expiresAt).getTime() - CACHE_SAFEGUARD_MS;
}

export function invalidateApiKeyCache(userId?: string) {
  if (userId) cache.delete(`user:${userId}`);
  cache.delete('temp');
}

async function cachedApiKey(
  cacheKey: string,
  fetch: () => Promise<CacheableApiKey | null>
): Promise<string | null> {
  const hit = cache.get(cacheKey);
  if (hit && Date.now() < hit.validUntil) return hit.apiKey;

  const row = await fetch();
  if (!row) return null;

  const validUntil = cacheUntil(row.expiresAt);
  if (Date.now() < validUntil) {
    cache.set(cacheKey, { apiKey: row.apiKey, validUntil });
  }
  return row.apiKey;
}

async function resolveApiKey(): Promise<string> {
  const user = await getAuthUser();
  if (user) {
    const userKey = await cachedApiKey(`user:${user.id}`, () => getCacheableApiKeyByUser(user.id));
    if (userKey) return userKey;
  }
  const tempKey = await cachedApiKey('temp', getTempApiKey);
  if (!tempKey) throw new Error('Failed to resolve API key');
  return tempKey;
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${config.api.url}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'X-API-KEY': await resolveApiKey(),
      'X-Whisp-Agent': 'ui',
      ...init?.headers,
    },
  });
}
