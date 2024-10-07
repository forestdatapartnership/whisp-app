import { NextResponse, NextRequest } from 'next/server';
import { useJsonOrNull } from './requests';
import { useMissingOrInvalidBodyResponse } from './responses';

export function withRequiredJsonBody(handler: (req: NextRequest, jsonBody: any) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    let body = await useJsonOrNull(req);
    if (body === null) {
      return useMissingOrInvalidBodyResponse();
    }
    return handler(req, body);
  };
}