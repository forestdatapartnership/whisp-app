import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { withLogging } from "@/lib/middleware/withLogging";
import { compose } from "@/lib/middleware/compose";
import { LogFunction } from "@/lib/logger";
import { getPool } from "@/lib/dal/db";
import { headers } from "next/headers";
import { withErrorHandling } from "@/lib/middleware/withErrorHandling";
import { SystemCode } from "@/types/systemCodes";
import { SystemError } from "@/types/systemError";

const UI_CLIENT_SECRET = config.app.uiClientSecret;

export const GET = compose(
  withLogging,
  withErrorHandling,
)(async (req: NextRequest, log: LogFunction): Promise<NextResponse> => {
  const logSource = "temp-key/route.ts";
  
  // Get request headers
  const headersList = await headers();
  const origin = headersList.get('origin');
  const clientSecret = headersList.get('x-client-secret');

  // Check the client secret
  if (clientSecret !== UI_CLIENT_SECRET) {
    throw new SystemError(SystemCode.AUTH_UNAUTHORIZED);
  }

  // Validate request origin is from our domain
  const hostUrl = req.nextUrl.origin;
  if (origin && origin !== hostUrl && !origin.includes('localhost')) {
    throw new SystemError(SystemCode.AUTH_UNAUTHORIZED);
  }

  const pool = getPool();
  const client = await pool.connect();
  
  try {
    // todo: use useResponse and system code
    const result = await client.query('SELECT * FROM get_temp_api_key()');
    const row = result.rows[0];

    if (!row) {
      throw new SystemError(SystemCode.SYSTEM_INTERNAL_SERVER_ERROR);
    }

    const apiKey = row.api_key;

    return NextResponse.json(
      {
        success: true,
        apiKey: apiKey,
        expiresAt: row.expires_at,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } finally {
    client.release();
  }
});