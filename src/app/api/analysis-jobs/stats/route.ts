import { NextRequest, NextResponse } from "next/server";
import { compose } from "@/lib/utils/compose";
import { withLogging } from "@/lib/hooks/withLogging";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { getAuthUser } from "@/lib/auth";
import { SystemCode } from "@/types/systemCodes";
import { SystemError } from "@/types/systemError";
import type { LogFunction } from "@/lib/logger";
import { getAnalysisJobStats } from "@/lib/utils/analysisJobStore";

export const GET = compose(
  withLogging,
  withErrorHandling
)(async (req: NextRequest, _log: LogFunction): Promise<NextResponse> => {
  const user = await getAuthUser(req);
  if (!user) throw new SystemError(SystemCode.AUTH_UNAUTHORIZED);
  const userId = parseInt(String(user.id), 10);
  if (Number.isNaN(userId)) throw new SystemError(SystemCode.AUTH_UNAUTHORIZED);

  const stats = await getAnalysisJobStats(userId);
  return NextResponse.json(stats);
});

