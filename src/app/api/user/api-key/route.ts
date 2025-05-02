import { NextRequest, NextResponse } from "next/server";
import { compose } from "@/utils/compose";
import { withLogging } from "@/lib/hooks/withLogging";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { getAuthUser } from "@/lib/auth";
import { getPool } from "@/lib/db";

export const GET = compose(
  withLogging
)(async (req: NextRequest, ...args): Promise<NextResponse> => {
  const logSource = "apikey/route.ts";
  const [log] = args;

  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const key = randomUUID();
  // No longer hashing the key, storing it directly
  const expires_at = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365); // 1 year (365 days)

  const pool = await getPool();
  const client = await pool.connect();
  try {
    await client.query(
      "SELECT * FROM create_or_replace_api_key($1, $2, $3)",
      [user.id, key, expires_at]
    );

    return NextResponse.json({ key }); // Return the same key that was stored
  } catch (error) {
    log("error", error, logSource);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    client.release();
  }
});

export const DELETE = compose(
  withLogging,
  withErrorHandling
)(async (req: NextRequest, ...args): Promise<NextResponse> => {
  const logSource = "apikey/route.ts";
  const [log] = args;

  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pool = await getPool();
  const client = await pool.connect();

  try {
    await client.query("SELECT delete_api_key_by_user($1)", [user.id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    log("error", error, logSource);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    client.release();
  }
});
