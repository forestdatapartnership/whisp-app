import { NextRequest } from "next/server";
import { SystemCode } from "@/types/systemCodes";
import { SystemError } from "@/types/systemError";
import { checkRateLimit, getDefaultRateLimitConfig } from "./rateLimiter";
import { ApiKey } from "@/types/api";
import { LogFunction } from "../logger";
import { findApiKey } from "@/lib/dal/apiKeysService";

export async function validateApiKey(request: NextRequest, log: LogFunction): Promise<ApiKey> {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) {
    throw new SystemError(SystemCode.AUTH_MISSING_API_KEY);
  }
  
  log.enrich({ apiKey });
  
  const row = await findApiKey(apiKey);
  if (!row) {
    throw new SystemError(SystemCode.AUTH_INVALID_API_KEY);
  }

  log.enrich({ userEmail: row.user_email });

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
    keyId: row.id, 
    userId: row.user_id, 
    userEmail: row.user_email,
    maxConcurrentAnalyses: row.max_concurrent_analyses ?? undefined,
    key: apiKey
  };
}
