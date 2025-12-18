import { NextResponse, NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { AnalysisJob } from '@/types/analysisJob';
import { ApiKey } from '@/types/api';
import { LogFunction } from '../logger';
import { getAppVersion } from '../utils/configUtils';

export function withAnalysisJobContext(
  handler: (req: NextRequest, context: AnalysisJob, log: LogFunction, ...args: any[]) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const [apiKey, log, ...rest] = args as [ApiKey, LogFunction, ...any[]];

    const token = uuidv4();
    const createdAt = new Date();
    const agent = req.headers.get('x-whisp-agent') === 'ui' ? 'ui' : 'api';
    const ipAddress = req.ip || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined;
    const apiVersion = getAppVersion();
    const endpoint = req.nextUrl?.pathname;

    const context: AnalysisJob = {
      token,
      createdAt,
      apiKey,
      agent,
      ipAddress,
      apiVersion,
      endpoint,
    };
    
    const enrichedLog: LogFunction = (level, message, source, meta) =>
      log(level, message, source, {
        ...meta,
        token: context.token,
        userEmail: apiKey?.userEmail,
        apiKey: apiKey?.key,
      });

    return handler(req, context, enrichedLog, ...rest);
  };
}

