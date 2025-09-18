
import { NextResponse, NextRequest } from 'next/server';
import { useJsonOrNull, getRequestBodySize } from './requests';
import { LogFunction } from '../logger';
import { SystemCode } from '@/types/systemCodes';
import { getMaxFileSize } from '@/lib/utils';
import { SystemError } from '@/types/systemError';

export function withRequiredJsonBody(handler: (req: NextRequest, jsonBody: any, log: LogFunction, ...args: any[]) => Promise<NextResponse>) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const [log, ...rest] = args;
    
    // Check request body size before parsing
    const maxFileSize = getMaxFileSize();
    log("info", `Max file size: ${maxFileSize}`, "withRequiredJsonBody.ts");
    if (maxFileSize) {
      const bodySize = getRequestBodySize(req);
      log("info", `Body size: ${bodySize}, max file size: ${maxFileSize}`, "withRequiredJsonBody.ts");
      if (bodySize > maxFileSize) {
        const bodySizeKB = (bodySize / 1024).toFixed(2);
        const maxSizeKB = (maxFileSize / 1024).toFixed(2);
        throw new SystemError(SystemCode.VALIDATION_REQUEST_BODY_TOO_LARGE, [bodySizeKB, maxSizeKB]);
      }
    }
    
    const body = await useJsonOrNull(req, log);
    if (body === null) {
      throw new SystemError(SystemCode.SYSTEM_MISSING_REQUEST_BODY);
    }
    return handler(req, log, body, ...rest);
  };
}

