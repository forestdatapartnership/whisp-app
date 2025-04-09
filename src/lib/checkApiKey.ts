import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import pool from "@/lib/db";
import type { LogFunction } from "@/lib/logger";

export async function checkApiKey(
  request: NextRequest,
  log?: LogFunction
): Promise<NextResponse | true> {

  const logSource = "checkApiKey.ts"

  const rawKey = request.headers.get("x-api-key");
  if (!rawKey) {
    console.log(rawKey)
    log?.("warn", "Missing API key", "checkApiKey");
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });
  }

  const hashedKey = createHash("sha256").update(rawKey).digest("hex");
  log?.("debug", "Hashed API key", logSource, { hashedKey });

  const client = await pool.connect();
  try {
    const result = await client.query("SELECT find_api_key($1) AS is_valid", [hashedKey]);
    const isValid = result.rows[0].is_valid;
    
    console.log({isValid})
    log?.("info", "API key validation result", logSource, { isValid });


    if (!isValid) {
      log?.("warn", "Invalid or expired API key", logSource);
      return NextResponse.json({ error: "Invalid or expired API key" }, { status: 401 });
    }

    return true;
  } finally {
    client.release();
  }
}
