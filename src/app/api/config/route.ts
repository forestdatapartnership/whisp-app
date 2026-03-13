import { NextRequest, NextResponse } from 'next/server';
import { compose } from "@/lib/middleware/compose";
import { withLogging } from "@/lib/middleware/withLogging";
import { LogFunction } from "@/lib/logger";

export const GET = compose(
  withLogging
)(async (req: NextRequest, log: LogFunction): Promise<NextResponse> => {
  const publicConfig = Object.fromEntries(
    Object.entries(process.env).filter(([key]) =>
      key.startsWith('NEXT_PUBLIC_') && key !== 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'
    )
  );

  return NextResponse.json(publicConfig);
});
