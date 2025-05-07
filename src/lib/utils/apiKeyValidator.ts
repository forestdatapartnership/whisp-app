import { getPool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { LogFunction } from "@/lib/logger";

/**
 * Validates the API key in the request headers
 * @param request NextRequest object
 * @param log LogFunction for logging validation activities
 * @returns NextResponse error if validation fails or null if successful along with userId
 */
export async function validateApiKey(request: NextRequest, log: LogFunction) {
  const logSource = "apiKeyValidator.ts";
  const apiKey = request.headers.get("x-api-key");
  
  if (!apiKey) {
    log("warn", "API request missing API key", logSource);
    return { 
      error: NextResponse.json({ error: "Missing API key" }, { status: 401 }),
      userId: null
    };
  }

  log("debug", "Validating API key", logSource);

  // Get the database pool and a client
  const pool = await getPool();
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT user_id FROM find_api_key($1)",
      [apiKey]
    );

    if (result.rowCount === 0) {
      log("warn", "Invalid or expired API key used in request", logSource);
      return { 
        error: NextResponse.json({ error: "Invalid or expired API key" }, { status: 401 }),
        userId: null
      };
    }

    const userId = result.rows[0].user_id;
    log("info", `API key validated successfully for user ID: ${userId}`, logSource);
    return { error: null, userId };
  } catch (error) {
    log("error", `Error validating API key: ${error}`, logSource);
    return {
      error: NextResponse.json({ error: "Error validating API key" }, { status: 500 }),
      userId: null
    };
  } finally {
    client.release();
  }
}