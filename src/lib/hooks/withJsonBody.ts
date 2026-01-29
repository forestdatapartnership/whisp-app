
import { NextResponse, NextRequest } from 'next/server';
import { getRequestBodySize, useJsonOrNull } from './requests';
import { LogFunction } from '../logger';
import { SystemCode } from '@/types/systemCodes';
import { SystemError } from '@/types/systemError';
import { AnalysisJob } from '@/types/analysisJob';
import { getMaxFileSize } from '../utils/configUtils';

export function withAnalysisJobJsonBody(handler: (req: NextRequest, context: AnalysisJob, log: LogFunction, body: any, ...args: any[]) => Promise<NextResponse>) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const [context, log, ...rest] = args;
    
    const bodySize = getRequestBodySize(req);

    if (!bodySize || bodySize === 0) {
      throw new SystemError(SystemCode.SYSTEM_MISSING_REQUEST_BODY);
    }

    log.enrich({ bodySize });

    const maxFileSize = getMaxFileSize();
    
    if (maxFileSize && bodySize > maxFileSize) {
      const bodySizeKB = (bodySize / 1024).toFixed(2);
      const maxSizeKB = (maxFileSize / 1024).toFixed(2);
      throw new SystemError(SystemCode.VALIDATION_REQUEST_BODY_TOO_LARGE, [bodySizeKB, maxSizeKB]);
    }
    const body = await useJsonOrNull(req, log);
    
    return handler(req, context, log, body, ...rest);
  };
}

export function withJsonBody(handler: (req: NextRequest, log: LogFunction, body: any, ...args: any[]) => Promise<NextResponse>) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const [log, ...rest] = args as [LogFunction, ...any[]];

    const bodySize = getRequestBodySize(req);

    if (!bodySize || bodySize === 0) {
      throw new SystemError(SystemCode.SYSTEM_MISSING_REQUEST_BODY);
    }

    log.enrich({ bodySize });

    const body = await useJsonOrNull(req, log);

    return handler(req, log, body, ...rest);
  };
}

