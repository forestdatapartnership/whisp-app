import { NextResponse, NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { AnalysisJob } from '@/types/analysisJob';
import { ApiKey } from '@/types/api';
import { LogFunction } from '../logger';

export function withAnalysisJobContext(
  handler: (req: NextRequest, context: AnalysisJob, log: LogFunction, ...args: any[]) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const [apiKey, log, ...rest] = args as [ApiKey, LogFunction, ...any[]];

    const token = uuidv4();
    const createdAt = new Date();
    
    const context: AnalysisJob = {
      token,
      createdAt,
      apiKey
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

