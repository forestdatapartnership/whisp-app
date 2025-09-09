import { NextResponse, NextRequest } from 'next/server';
import { useResponse } from './responses';
import { LogFunction } from "@/lib/logger";
import { SystemCode } from '@/types/systemCodes';
import { SystemError } from '@/types/systemError';

export function withErrorHandling(
  handler: (req: NextRequest, log: LogFunction, ...args: any[]) => Promise<NextResponse>
) {
  return async function(req: NextRequest, ...args: any[]): Promise<NextResponse> {
    const [log, ...rest] = args;
    try {
      return await handler(req, log, ...rest);
    } catch (error: any) {
      if (error instanceof SystemError) {
        // Log the error with system code information
        log('error', `SystemError: ${error.systemCode} - ${error.message}`);
        
        // Return response with system code and optional format args
        if (error.formatArgs && error.formatArgs.length > 0) {
          return useResponse(error.systemCode, error.formatArgs);
        } else {
          return useResponse(error.systemCode);
        }
      } else {
        // Handle generic errors
        log('error', 'Unexpected error occurred: ' + error);
        return useResponse(SystemCode.SYSTEM_INTERNAL_SERVER_ERROR);
      }
    }
  };
}

