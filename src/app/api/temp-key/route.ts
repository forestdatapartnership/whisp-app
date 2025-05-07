import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { withLogging } from "@/lib/hooks/withLogging";
import { compose } from "@/lib/utils/compose";
import { LogFunction } from "@/lib/logger";
import { getPool } from "@/lib/db";
import { headers } from "next/headers";

// UI Secret Key - this should match what's used in your frontend
const UI_CLIENT_SECRET = process.env.UI_CLIENT_SECRET || 'whisp-ui-client-access';

export const GET = compose(
  withLogging,
  withErrorHandling
)(async (req: NextRequest, log: LogFunction): Promise<NextResponse> => {
  const logSource = "temp-key/route.ts";
  
  try {
    // Get request headers
    const headersList = headers();
    const referer = headersList.get('referer');
    const origin = headersList.get('origin');
    const clientSecret = headersList.get('x-client-secret');
    const csrfToken = headersList.get('x-csrf-token');

    // Check the client secret
    if (clientSecret !== UI_CLIENT_SECRET) {
      log("warn", "Unauthorized temp-key access - Invalid client secret", logSource);
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 }
      );
    }

    // Validate request origin is from our domain
    const hostUrl = req.nextUrl.origin;
    if (origin && origin !== hostUrl && !origin.includes('localhost')) {
      log("warn", `Unauthorized temp-key access - Invalid origin: ${origin}`, logSource);
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 }
      );
    }

    // Additional rate limiting check
    // You could implement a more sophisticated rate-limiting strategy here
    const requestIp = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    
    // Get a client from the pool instead of using pool directly
    const pool = await getPool();
    const client = await pool.connect();
    
    try {
      // First generate a temp API key
      await client.query('SELECT generate_temp_api_key()');
      
      // Then retrieve the generated key
      const result = await client.query('SELECT get_temp_api_key() AS api_key');
      const apiKey = result.rows[0].api_key;
      
      log("debug", "Temporary API key generated successfully", logSource);
      
      return NextResponse.json(
        {
          success: true,
          apiKey: apiKey
        },
        {
          headers: {
            // Set security headers to prevent caching
            'Cache-Control': 'no-store, max-age=0, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    } finally {
      // Always release the client back to the pool
      client.release();
    }
  } catch (error: any) {
    log("error", `Error generating temporary API key: ${error.message}`, logSource);
    return NextResponse.json(
      { success: false, error: "Failed to generate temporary API key" },
      { status: 500 }
    );
  }
});