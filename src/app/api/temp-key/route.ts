import { NextRequest, NextResponse } from "next/server";
import { withLogging } from "@/lib/hooks/withLogging";
import { compose } from "@/lib/utils/compose";
import { LogFunction } from "@/lib/logger";
import { getPool } from "@/lib/db";
import { headers } from "next/headers";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { SystemCode } from "@/types/systemCodes";
import { SystemError } from "@/types/systemError";

const UI_CLIENT_SECRET = process.env.UI_CLIENT_SECRET || 'whisp-ui-client-access';

export const GET = compose(
  withLogging,
  withErrorHandling,
)(async (req: NextRequest, log: LogFunction): Promise<NextResponse> => {
  const logSource = "temp-key/route.ts";
  
  // Get request headers
  const headersList = headers();
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
    const result = await client.query('SELECT get_temp_api_key() AS api_key');
    const apiKey = result.rows[0].api_key;
    
    // todo: use useResponse and system code
    return NextResponse.json(
      {
        success: true,
        apiKey: apiKey
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