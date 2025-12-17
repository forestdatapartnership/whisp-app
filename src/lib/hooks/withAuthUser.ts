import { NextRequest, NextResponse } from 'next/server';
import { LogFunction } from '../logger';
import { getAuthUser } from '@/lib/auth';
import { SystemCode } from '@/types/systemCodes';
import { SystemError } from '@/types/systemError';

export type AuthenticatedUser = {
  userId: number;
};

export function withAuthUser(
  handler: (req: NextRequest, log: LogFunction, user: AuthenticatedUser, ...args: any[]) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const [log, ...rest] = args;

    const authUser = await getAuthUser(req);
    if (!authUser) {
      throw new SystemError(SystemCode.AUTH_UNAUTHORIZED);
    }

    const userId = parseInt(String(authUser.id), 10);
    if (Number.isNaN(userId)) {
      throw new SystemError(SystemCode.USER_INVALID_USER_ID);
    }

    // TODO: Add email to the authenticated user
    // TODO: Add log enrichment for the authenticated user
    
    const user: AuthenticatedUser = { userId };

    return handler(req, log, user, ...rest);
  };
}

