import { NextRequest, NextResponse } from "next/server";
import { compose } from "@/lib/utils/compose";
import { withLogging } from "@/lib/hooks/withLogging";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import type { LogFunction } from "@/lib/logger";
import { getAnalysisJobStats } from "@/lib/utils/analysisJobStore";
import { withAuthUser, AuthenticatedUser } from "@/lib/hooks/withAuthUser";

export const GET = compose(
  withLogging,
  withErrorHandling,
  withAuthUser
)(async (_req: NextRequest, _log: LogFunction, user: AuthenticatedUser): Promise<NextResponse> => {

  const stats = await getAnalysisJobStats(user.userId);
  return NextResponse.json(stats);
});

