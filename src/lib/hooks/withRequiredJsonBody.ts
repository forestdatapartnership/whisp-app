
import { NextResponse, NextRequest } from 'next/server';
import { useJsonOrNull } from './requests';
import { useResponse } from './responses';
import { LogFunction } from '../logger';
import { SystemCode } from '@/types/systemCodes';

export function withRequiredJsonBody(handler: (req: NextRequest, jsonBody: any, log: LogFunction, ...args: any[]) => Promise<NextResponse>) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const [log, ...rest] = args;
    const body = await useJsonOrNull(req, log);
    if (body === null) {
      return useResponse(SystemCode.SYSTEM_MISSING_REQUEST_BODY);
    }
    return handler(req, log, body, ...rest);
  };
}

