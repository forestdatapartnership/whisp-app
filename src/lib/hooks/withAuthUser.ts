import { NextRequest, NextResponse } from 'next/server';
import { LogFunction } from '../logger';
import { getAuthUser } from '@/lib/auth';
import { SystemCode } from '@/types/systemCodes';
import { SystemError } from '@/types/systemError';

export type AuthenticatedUser = {
  userId: number;
  userEmail: string;
  isAdmin: boolean;
};

export type AuthOptions = {
  requireAdmin?: boolean;
};

export function withAuth(options: AuthOptions = {}) {
  return function(
    handler: (req: NextRequest, log: LogFunction, user: AuthenticatedUser, ...args: any[]) => Promise<NextResponse>
  ) {
    return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
      const [log, ...rest] = args;

      const authUser = await getAuthUser(req);
      if (!authUser) {
        throw new SystemError(SystemCode.AUTH_UNAUTHORIZED);
      }

      if (options.requireAdmin && !authUser.isAdmin) {
        throw new SystemError(SystemCode.AUTH_ADMIN_REQUIRED);
      }

      const userId = parseInt(String(authUser.id), 10);
      if (Number.isNaN(userId)) {
        throw new SystemError(SystemCode.USER_INVALID_USER_ID);
      }

      const user: AuthenticatedUser = { 
        userId, 
        userEmail: authUser.email, 
        isAdmin: authUser.isAdmin 
      };
      log.enrich(user);

      return handler(req, log, user, ...rest);
    };
  };
}

export const withAuthUser = withAuth();
export const withAdminAuth = withAuth({ requireAdmin: true });

