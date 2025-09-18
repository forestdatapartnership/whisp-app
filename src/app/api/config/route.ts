import { NextRequest, NextResponse } from 'next/server';
import { compose } from "@/lib/utils/compose";
import { withLogging } from "@/lib/hooks/withLogging";
import { LogFunction } from "@/lib/logger";

export const GET = compose(
  withLogging
)(async (req: NextRequest, log: LogFunction): Promise<NextResponse> => {
  const logSource = "config/route.ts";

  // Log all environment variables with their values
  const allEnvVars = Object.fromEntries(
    Object.entries(process.env).map(([key, value]) => [
      key, 
      value ? (value.length > 100 ? `${value.substring(0, 100)}...` : value) : 'undefined'
    ])
  );
  
  log("info", "Environment variables accessed", logSource, { 
    envVars: allEnvVars,
    totalCount: Object.keys(process.env).length 
  });

  // Dynamically collect all NEXT_PUBLIC_* environment variables except Google Maps API key
  const publicConfig = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => 
      key.startsWith('NEXT_PUBLIC_') && key !== 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'
    )
  );

  log("info", "Public config returned", logSource, { 
    publicConfigKeys: Object.keys(publicConfig),
    publicConfigCount: Object.keys(publicConfig).length 
  });

  return NextResponse.json(publicConfig);
});
