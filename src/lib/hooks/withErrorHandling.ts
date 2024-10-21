import { NextResponse, NextRequest } from 'next/server';
import { useBadRequestResponse } from './responses';
import { LogFunction } from "@/lib/logger"

export function withErrorHandling(
  handler: (req: NextRequest, log: LogFunction) => Promise<NextResponse>
) {
  return async function (req: NextRequest, log: LogFunction): Promise<NextResponse> {
    try {
      return await handler(req, log);
    } catch (error: any) {
      log('error', 'Error occurred: ' + error);
      return useBadRequestResponse("Error in analysis. Please check your input.");
    }
  };
}