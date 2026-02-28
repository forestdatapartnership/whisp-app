import { NextRequest, NextResponse } from "next/server";
import { compose } from "@/lib/api-middleware/compose";
import { withLogging } from "@/lib/api-middleware/withLogging";
import { withErrorHandling } from "@/lib/api-middleware/withErrorHandling";
import type { LogFunction } from "@/lib/logger";
import { getAnalysisJobStats } from "@/lib/dal/analysisJobsService";
import { withAuthUser, AuthUser } from "@/lib/api-middleware/withAuthUser";

export const GET = compose(
  withLogging,
  withErrorHandling,
  withAuthUser
)(async (_req: NextRequest, _log: LogFunction, user: AuthUser): Promise<NextResponse> => {

  const stats = await getAnalysisJobStats(user.id);
  return NextResponse.json(stats);
});

