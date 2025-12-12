import { getPool } from "@/lib/db";
import { NextRequest } from "next/server";
import { SystemCode } from "@/types/systemCodes";
import { SystemError } from "@/types/systemError";
import { checkRateLimit, getDefaultRateLimitConfig } from "./rateLimiter";

/**
 * Validates the API key in the request headers
 * @param request NextRequest object
 * @param log LogFunction for logging validation activities
 * @returns NextResponse error if validation fails or null if successful along with userId
 */
export async function validateApiKey(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) {
    throw new SystemError(SystemCode.AUTH_MISSING_API_KEY);
  }
  const pool = getPool();
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT id, user_id, rate_limit_window_ms, rate_limit_max_requests, max_concurrent_analyses FROM find_api_key($1)",
      [apiKey]
    );
    if (result.rowCount === 0) {
      throw new SystemError(SystemCode.AUTH_INVALID_API_KEY);
    }
    const row = result.rows[0];
    const defaults = getDefaultRateLimitConfig();
    const cfg = {
      windowMs: row.rate_limit_window_ms ?? defaults.windowMs,
      limit: row.rate_limit_max_requests ?? defaults.limit
    };
    const rate = checkRateLimit(`${row.id}:${request.nextUrl.pathname}`, cfg);
    if (!rate.allowed) {
      throw new SystemError(SystemCode.AUTH_RATE_LIMIT_EXCEEDED, [rate.retryAfter]);
    }
    return { 
      apiKeyId: row.id as number, 
      userId: row.user_id as number, 
      rateLimit: { ...rate, windowMs: cfg.windowMs, limit: cfg.limit },
      maxConcurrentAnalyses: row.max_concurrent_analyses as number | null
    };
  } finally {
    client.release();
  }
}