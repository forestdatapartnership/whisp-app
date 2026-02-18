import { NextRequest, NextResponse } from 'next/server';
import { LogFunction } from '../logger';
import { getAuthUser } from '@/lib/auth';
import { SystemCode } from '@/types/systemCodes';
import { SystemError } from '@/types/systemError';
import { AuthUser } from '@/types/auth';

export type { AuthUser };

export type AuthOptions = {
  requireAdmin?: boolean;
};

export function withAuth(options: AuthOptions = {}) {
  return function(
    handler: (req: NextRequest, log: LogFunction, user: AuthUser, ...args: any[]) => Promise<NextResponse>
  ) {
    return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
      const [log, ...rest] = args;

      const user = await getAuthUser(req);
      if (!user) {
        throw new SystemError(SystemCode.AUTH_UNAUTHORIZED);
      }

      if (options.requireAdmin && !user.isAdmin) {
        throw new SystemError(SystemCode.AUTH_ADMIN_REQUIRED);
      }

      log.enrich({ userId: user.id, userEmail: user.email, isAdmin: user.isAdmin });

      return handler(req, log, user, ...rest);
    };
  };
}

export const withAuthUser = withAuth();
export const withAdminAuth = withAuth({ requireAdmin: true });

