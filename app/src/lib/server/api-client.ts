import 'server-only';
import { getAuthUser, getKcRefreshToken, setKcRefreshToken, clearKcRefreshToken } from '@/lib/auth/session';
import { getCacheableApiKeyByUser, getTempApiKey, type CacheableApiKey } from '@/lib/db/api-keys-service';
import { refreshTokens } from '@/lib/auth/keycloak';
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

export function invalidateGeoidTokenCache(userId?: string) {
  if (userId) tokenCache.delete(`user:${userId}`);
  else tokenCache.clear();
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

const TOKEN_CACHE_SAFEGUARD_MS = 30_000;
const tokenCache = new Map<string, { token: string; validUntil: number }>();

async function resolveGeoidToken(): Promise<string | null> {
  if (!config.keycloak.enabled) return null;

  const user = await getAuthUser();
  if (!user) return null;

  const kcRefreshToken = await getKcRefreshToken();
  if (!kcRefreshToken) return null;

  const cacheKey = `user:${user.id}`;
  const hit = tokenCache.get(cacheKey);
  if (hit && Date.now() < hit.validUntil) return hit.token;

  try {
    const tokens = await refreshTokens(kcRefreshToken);
    if (tokens.refresh_token) {
      await setKcRefreshToken(tokens.refresh_token);
    }
    const validUntil = Date.now() + tokens.expires_in * 1000 - TOKEN_CACHE_SAFEGUARD_MS;
    tokenCache.set(cacheKey, { token: tokens.access_token, validUntil });
    return tokens.access_token;
  } catch (err) {
    console.error('Failed to refresh Keycloak geoid token; clearing stale token', err);
    tokenCache.delete(cacheKey);
    await clearKcRefreshToken();
    return null;
  }
}

function isGeoidRoute(path: string) {
  return path.startsWith('/submit/geo-ids');
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const [apiKey, geoidToken] = await Promise.all([
    resolveApiKey(),
    isGeoidRoute(path) ? resolveGeoidToken() : Promise.resolve(null),
  ]);
  return fetch(`${config.api.url}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'X-API-KEY': apiKey,
      'X-Whisp-Agent': 'ui',
      ...(geoidToken ? { 'X-Geoid-Token': geoidToken } : {}),
      ...init?.headers,
    },
  });
}
