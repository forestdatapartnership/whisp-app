import { NextResponse, NextRequest } from 'next/server';
import { useBadRequestResponse } from './responses';
import { LogFunction } from "@/lib/logger";

export function withErrorHandling(
  handler: (req: NextRequest, log: LogFunction, ...args: any[]) => Promise<NextResponse>
) {
  return async function(req: NextRequest, ...args: any[]): Promise<NextResponse> {
    const [log, ...rest] = args;
    try {
      return await handler(req, log, ...rest);
    } catch (error: any) {
      log('error', 'Error occurred: ' + error);
      return useBadRequestResponse("Error in analysis. Please check your input.");
    }
  };
}

