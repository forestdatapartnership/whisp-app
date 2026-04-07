import { NextResponse, NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { AnalysisJob } from '@/types/models/analysisJob';
import { ApiKey } from '@/types/api';
import { LogFunction } from '../logger';
import { config } from '@/lib/config';

export function withAnalysisJobContext(
  handler: (req: NextRequest, context: AnalysisJob, log: LogFunction, ...args: any[]) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const [apiKey, log, ...rest] = args as [ApiKey, LogFunction, ...any[]];

    const token = uuidv4();
    const createdAt = new Date();
    const agent = req.headers.get('x-whisp-agent') === 'ui' ? 'ui' : 'api';
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || undefined;
    const apiVersion = config.app.version;
    const endpoint = req.nextUrl?.pathname;

    const context: AnalysisJob = {
      id: token,
      createdAt,
      apiKey,
      agent,
      ipAddress,
      apiVersion,
      endpoint,
    };
    
    log.enrich({ token: context.id });

    return handler(req, context, log, ...rest);
  };
}
