import NodeCache from 'node-cache';
import { toIntOrDefault } from './valueUtils';

const store = new NodeCache({ stdTTL: 0, checkperiod: 0, useClones: false });

export type RateLimitConfig = {
  windowMs: number;
  limit: number;
};

export type RateLimitResult = {
  allowed: boolean;
  retryAfter: number;
  limit: number;
  remaining: number;
  resetAt: number;
};

export function getDefaultRateLimitConfig(): RateLimitConfig {
  return {
    windowMs: toIntOrDefault(process.env.RATE_LIMIT_WINDOW_MS, 60000),
    limit: toIntOrDefault(process.env.RATE_LIMIT_MAX_REQUESTS, 30)
  };
}

export function checkRateLimit(key: string, config?: Partial<RateLimitConfig>): RateLimitResult {
  const base = getDefaultRateLimitConfig();
  const windowMs = config?.windowMs ?? base.windowMs;
  const maxRequests = config?.limit ?? base.limit;
  const now = Date.now();
  const entry = store.get<{ count: number; resetAt: number }>(key);
  if (!entry || entry.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt }, Math.max(1, Math.ceil(windowMs / 1000)));
    return { allowed: true, retryAfter: 0, limit: maxRequests, remaining: maxRequests - 1, resetAt };
  }
  if (entry.count >= maxRequests) {
    const retryAfterMs = entry.resetAt - now;
    const retryAfter = Math.max(1, Math.ceil(retryAfterMs / 1000));
    return { allowed: false, retryAfter, limit: maxRequests, remaining: 0, resetAt: entry.resetAt };
  }
  const updated = { count: entry.count + 1, resetAt: entry.resetAt };
  const ttlSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
  store.set(key, updated, ttlSeconds);
  return { allowed: true, retryAfter: 0, limit: maxRequests, remaining: maxRequests - updated.count, resetAt: entry.resetAt };
}

