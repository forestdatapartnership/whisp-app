import { NextResponse, NextRequest } from 'next/server';
import { validateApiKey } from '@/lib/utils/apiKeyValidator';
import { ApiKey } from '@/types/api';
import { LogFunction } from '../logger';

export function withApiKey(
  handler: (req: NextRequest, apiKey: ApiKey, log: LogFunction, ...args: any[]) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const [log, ...rest] = args as [LogFunction, ...any[]];

    const apiKey = await validateApiKey(req);

    const enrichedLog: LogFunction = (level, message, source, meta) =>
      log(level, message, source, {
        ...meta,
        userEmail: apiKey.userEmail,
        apiKey: apiKey.key,
      });

    return handler(req, apiKey, enrichedLog, ...rest);
  };
}

