import { NextRequest, NextResponse } from "next/server";
import { compose } from "@/lib/utils/compose";
import { withLogging } from "@/lib/hooks/withLogging";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { getAuthUser } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { randomUUID } from "crypto";
import { QueryResult } from "pg";
import { SystemCode } from "@/types/systemCodes";
import { useResponse } from "@/lib/hooks/responses";
import { SystemError } from "@/types/systemError";
import { LogFunction } from "@/lib/logger";

export const GET = compose(
  withLogging,
  withErrorHandling
)(async (req: NextRequest, log: LogFunction): Promise<NextResponse> => {
  const logSource = "apikey/route.ts";

  const user = await getAuthUser(req);
  if (!user) throw new SystemError(SystemCode.AUTH_UNAUTHORIZED);

  const pool = getPool();
  const client = await pool.connect();
  try {
    // Check if the user has an existing valid API key
    const existingKey: QueryResult = await client.query(
      "SELECT api_key FROM api_keys WHERE user_id = $1 AND revoked = false AND expires_at > NOW()",
      [user.id]
    );

    // If user has an existing valid API key, return it
    if (existingKey.rowCount && existingKey.rowCount > 0) {
      return useResponse(SystemCode.AUTH_STATUS_AUTHENTICATED, { apiKey: existingKey.rows[0].api_key });
    }

    // No valid API key found
    log("info", `No valid API key found for user ${user.id}`, logSource);
    return useResponse(SystemCode.AUTH_STATUS_AUTHENTICATED, { apiKey: null });
  } finally {
    client.release();
  }
});

export const POST = compose(
  withErrorHandling,
  withLogging
)(async (req: NextRequest, ...args): Promise<NextResponse> => {
  const user = await getAuthUser(req);
  if (!user) throw new SystemError(SystemCode.AUTH_UNAUTHORIZED);

  const pool = getPool();
  const client = await pool.connect();
  try {
    // Create a new API key (this will replace any existing one)
    const key = randomUUID();
    const expires_at = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365); // 1 year (365 days)

    await client.query(
      "SELECT * FROM create_or_replace_api_key($1, $2, $3)",
      [user.id, key, expires_at]
    );

    return useResponse(SystemCode.USER_API_KEY_CREATED_SUCCESS, { apiKey: key });
  } finally {
    client.release();
  }
});

export const DELETE = compose(
  withErrorHandling,
  withLogging
)(async (req: NextRequest, ...args): Promise<NextResponse> => {

  const user = await getAuthUser(req);
  if (!user) throw new SystemError(SystemCode.AUTH_UNAUTHORIZED);

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("SELECT delete_api_key_by_user($1)", [user.id]);
    return useResponse(SystemCode.USER_API_KEY_DELETED_SUCCESS);
  } finally {
    client.release();
  }
});
