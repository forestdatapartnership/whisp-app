import { NextRequest, NextResponse } from "next/server";
import { compose } from "@/lib/utils/compose";
import { withLogging } from "@/lib/hooks/withLogging";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { withAuthUser, AuthenticatedUser } from "@/lib/hooks/withAuthUser";
import { getPool } from "@/lib/db";
import { randomUUID } from "crypto";
import { QueryResult } from "pg";
import { SystemCode } from "@/types/systemCodes";
import { useResponse } from "@/lib/hooks/responses";
import { LogFunction } from "@/lib/logger";

export const GET = compose(
  withLogging,
  withErrorHandling,
  withAuthUser
)(async (_req: NextRequest, log: LogFunction, user: AuthenticatedUser): Promise<NextResponse> => {
  const logSource = "apikey/route.ts";

  const pool = getPool();
  const client = await pool.connect();
  try {
    // Check if the user has an existing valid API key
    const existingKey: QueryResult = await client.query(
      "SELECT api_key, created_at, expires_at FROM api_keys WHERE user_id = $1 AND revoked = false AND expires_at > NOW()",
      [user.userId]
    );

    // If user has an existing valid API key, return it
    if (existingKey.rowCount && existingKey.rowCount > 0) {
      const row = existingKey.rows[0];
      return useResponse(SystemCode.AUTH_STATUS_AUTHENTICATED, {
        apiKey: row.api_key,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
      });
    }

    // No valid API key found
    log("info", `No valid API key found for user ${user.userId}`, logSource);
    return useResponse(SystemCode.AUTH_STATUS_AUTHENTICATED, { apiKey: null });
  } finally {
    client.release();
  }
});

export const POST = compose(
  withLogging,
  withErrorHandling,
  withAuthUser
)(async (_req: NextRequest, _log: LogFunction, user: AuthenticatedUser): Promise<NextResponse> => {

  const pool = getPool();
  const client = await pool.connect();
  try {
    const key = randomUUID();
    const expires_at = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365); // 1 year (365 days)

    const inserted = await client.query(
      "SELECT api_key, created_at, expires_at FROM create_or_replace_api_key($1, $2, $3)",
      [user.userId, key, expires_at]
    );

    const row = inserted.rows[0];
    return useResponse(SystemCode.USER_API_KEY_CREATED_SUCCESS, {
      apiKey: row.api_key,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    });
  } finally {
    client.release();
  }
});

export const DELETE = compose(
  withLogging,
  withErrorHandling,
  withAuthUser
)(async (_req: NextRequest, _log: LogFunction, user: AuthenticatedUser): Promise<NextResponse> => {

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("SELECT delete_api_key_by_user($1)", [user.userId]);
    return useResponse(SystemCode.USER_API_KEY_DELETED_SUCCESS);
  } finally {
    client.release();
  }
});
