import { getPool } from "@/lib/db";
import { NextRequest } from "next/server";
import { SystemCode } from "@/types/systemCodes";
import { SystemError } from "@/types/systemError";
import { checkRateLimit, getDefaultRateLimitConfig } from "./rateLimiter";
import { ApiKey } from "@/types/api";

export async function validateApiKey(request: NextRequest): Promise<ApiKey> {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) {
    throw new SystemError(SystemCode.AUTH_MISSING_API_KEY);
  }
  const pool = getPool();
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT id, user_id, user_email, rate_limit_window_ms, rate_limit_max_requests, max_concurrent_analyses FROM find_api_key($1)",
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
      keyId: row.id as number, 
      userId: row.user_id as number, 
      userEmail: row.user_email as string,
      maxConcurrentAnalyses: row.max_concurrent_analyses as number | undefined,
      key: apiKey
    };
  } finally {
    client.release();
  }
}