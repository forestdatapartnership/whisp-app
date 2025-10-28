import { NextRequest, NextResponse } from 'next/server';
import { compose } from "@/lib/utils/compose";
import { withLogging } from "@/lib/hooks/withLogging";
import { LogFunction } from "@/lib/logger";
import { getWhispPythonVersion } from "@/lib/utils/configUtils";

export const GET = compose(
  withLogging
)(async (req: NextRequest, log: LogFunction): Promise<NextResponse> => {

  const publicConfig = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => 
      key.startsWith('NEXT_PUBLIC_') && key !== 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'
    )
  );

  const whispPythonVersion = getWhispPythonVersion();

  return NextResponse.json({
    ...publicConfig,
    WHISP_PYTHON_VERSION: whispPythonVersion
  });
});
