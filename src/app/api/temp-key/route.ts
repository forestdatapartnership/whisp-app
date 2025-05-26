import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { withLogging } from "@/lib/hooks/withLogging";
import { compose } from "@/lib/utils/compose";
import { LogFunction } from "@/lib/logger";
import { getPool } from "@/lib/db";
import { headers } from "next/headers";

const UI_CLIENT_SECRET = process.env.UI_CLIENT_SECRET || 'whisp-ui-client-access';

export const GET = compose(
  withLogging,
  withErrorHandling
)(async (req: NextRequest, log: LogFunction): Promise<NextResponse> => {
  const logSource = "temp-key/route.ts";
  
  try {
    // Get request headers
    const headersList = headers();
    const origin = headersList.get('origin');
    const clientSecret = headersList.get('x-client-secret');

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

    const pool = await getPool();
    const client = await pool.connect();
    
    try {
      await client.query('SELECT generate_temp_api_key()');
      
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
            'Cache-Control': 'no-store, max-age=0, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    } finally {
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