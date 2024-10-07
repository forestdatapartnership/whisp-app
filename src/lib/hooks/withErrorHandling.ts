import { NextResponse, NextRequest } from 'next/server';
import { useBadRequestResponse } from './responses';
import { error as logError } from "@/lib/logger"

export function withErrorHandling(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async function (req: NextRequest): Promise<NextResponse> {
    try {
      return await handler(req);
    } catch (error: any) {
      logError('Error occurred: ' + error);
      return useBadRequestResponse("Error in analysis. Please check your input.");
    }
  };
}