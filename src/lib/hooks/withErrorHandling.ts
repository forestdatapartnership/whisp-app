import { NextResponse, NextRequest } from 'next/server';
import { useBadRequestResponse } from './responses';

export function withErrorHandling(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async function (req: NextRequest): Promise<NextResponse> {
    try {
      return await handler(req);
    } catch (error: any) {
      console.error('Error occurred:', error);
      return useBadRequestResponse("Error in analysis. Please check your input.");
    }
  };
}