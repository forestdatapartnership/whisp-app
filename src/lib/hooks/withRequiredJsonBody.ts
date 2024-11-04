
import { NextResponse, NextRequest } from 'next/server';
import { useJsonOrNull } from './requests';
import { useMissingOrInvalidBodyResponse } from './responses';
import { LogFunction } from '../logger';

export function withRequiredJsonBody(handler: (req: NextRequest, jsonBody: any, log: LogFunction, ...args: any[]) => Promise<NextResponse>) {
  return async (req: NextRequest, log: LogFunction, ...args: any[]): Promise<NextResponse> => {
    const body = await useJsonOrNull(req, log);
    if (body === null) {
      return useMissingOrInvalidBodyResponse();
    }
    return handler(req, body, log, ...args);
  };
}
