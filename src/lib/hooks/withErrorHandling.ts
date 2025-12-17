import { NextResponse, NextRequest } from 'next/server';
import { useResponse, useResponseWithFormat } from './responses';
import { LogFunction } from "@/lib/logger";
import { SystemCode, getSystemCodeInfo } from '@/types/systemCodes';
import { SystemError } from '@/types/systemError';

function getLogLevelFromHttpStatus(httpStatus?: number): 'debug' | 'info' | 'warn' | 'error' {
  if (!httpStatus) return 'error';
  
  if (httpStatus >= 500) return 'error';
  if (httpStatus >= 400) return 'warn';
  return 'info';
}

function handleError(error: any, log: LogFunction): NextResponse {
  if (error instanceof SystemError) {
    const codeInfo = getSystemCodeInfo(error.systemCode);
    const httpStatus = codeInfo.httpStatus || 
      (codeInfo.publicCode ? getSystemCodeInfo(codeInfo.publicCode).httpStatus : undefined);
    const logLevel = getLogLevelFromHttpStatus(httpStatus);
    
    let logMessage = error.message;
    if (error.innerError !== undefined) {
      logMessage += ` - InnerError: ${error.innerError}`;
    }
    log(logLevel, logMessage, undefined, { 
      systemCode: error.systemCode,
      httpStatus
    });
    
    if (error.formatArgs && error.formatArgs.length > 0) {
      return useResponseWithFormat(error.systemCode, error.formatArgs);
    } else {
      return useResponse(error.systemCode);
    }
  } else {
    log('error', 'Unexpected error occurred: ' + error);
    return useResponse(SystemCode.SYSTEM_INTERNAL_SERVER_ERROR);
  }
}

export function withErrorHandling(
  handler: (req: NextRequest, log: LogFunction, ...args: any[]) => Promise<NextResponse>
) {
  return async function(req: NextRequest, ...args: any[]): Promise<NextResponse> {
    const [log, ...rest] = args;
    try {
      return await handler(req, log, ...rest);
    } catch (error: any) {
      return handleError(error, log);
    }
  };
}

