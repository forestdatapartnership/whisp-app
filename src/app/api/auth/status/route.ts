export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { useResponse } from "@/lib/hooks/responses";
import { SystemCode } from "@/types/systemCodes";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { withLogging } from "@/lib/hooks/withLogging";
import { compose } from "@/lib/utils/compose";
import { LogFunction } from "@/lib/logger";

export const GET = compose(
  withLogging,
  withErrorHandling
)(async (req: NextRequest, log: LogFunction): Promise<NextResponse> => {
  const access = req.cookies.get("token")?.value;
  const refresh = req.cookies.get("refreshToken")?.value;
  const secret = process.env.JWT_SECRET;

  const verify = async (value?: string) => {
    if (!value || !secret) return false;
    try {
      await jwtVerify(value, new TextEncoder().encode(secret));
      return true;
    } catch {
      return false;
    }
  };

  const authenticated = (await verify(access)) || (await verify(refresh));
  
  if (authenticated) {
    return useResponse(SystemCode.AUTH_STATUS_AUTHENTICATED);
  } else {
    return useResponse(SystemCode.AUTH_STATUS_UNAUTHENTICATED);
  }
});


