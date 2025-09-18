import { NextRequest, NextResponse } from 'next/server';
import { compose } from "@/lib/utils/compose";
import { withLogging } from "@/lib/hooks/withLogging";
import { LogFunction } from "@/lib/logger";

export const GET = compose(
  withLogging
)(async (req: NextRequest, log: LogFunction): Promise<NextResponse> => {

  // return all NEXT_PUBLIC_* environment variables except Google Maps API key
  const publicConfig = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => 
      key.startsWith('NEXT_PUBLIC_') && key !== 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'
    )
  );

  return NextResponse.json(publicConfig);
});
