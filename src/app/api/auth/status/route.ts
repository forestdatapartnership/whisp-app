export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { useResponse } from "@/lib/hooks/responses";
import { SystemCode } from "@/types/systemCodes";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { withLogging } from "@/lib/hooks/withLogging";
import { compose } from "@/lib/utils/compose";
import { LogFunction } from "@/lib/logger";
import { verifyToken, createTokens, setTokenCookies } from "@/lib/auth";

export const GET = compose(
  withLogging,
  withErrorHandling
)(async (req: NextRequest, _log: LogFunction): Promise<NextResponse> => {
  const accessToken = req.cookies.get("token")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;

  const accessUser = await verifyToken(accessToken);
  if (accessUser) {
    return useResponse(SystemCode.AUTH_STATUS_AUTHENTICATED);
  }

  const refreshUser = await verifyToken(refreshToken);
  if (refreshUser) {
    const tokens = await createTokens(refreshUser);
    const response = useResponse(SystemCode.AUTH_STATUS_AUTHENTICATED);
    setTokenCookies(response, tokens);
    return response;
  }

  return useResponse(SystemCode.AUTH_STATUS_UNAUTHENTICATED);
});


