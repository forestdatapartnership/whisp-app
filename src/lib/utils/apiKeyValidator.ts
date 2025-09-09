import { getPool } from "@/lib/db";
import { NextRequest } from "next/server";
import { SystemCode } from "@/types/systemCodes";
import { SystemError } from "@/types/systemError";

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

  // Get the database pool and a client
  const pool = getPool();
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT user_id FROM find_api_key($1)",
      [apiKey]
    );

    if (result.rowCount === 0) {
      throw new SystemError(SystemCode.AUTH_INVALID_API_KEY);
    }
  } finally {
    client.release();
  }
}