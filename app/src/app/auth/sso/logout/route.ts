import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies, clearKcRefreshToken, getKcRefreshToken } from '@/lib/auth/session';
import { getEndSessionUrl } from '@/lib/auth/keycloak';
import { invalidateGeoidTokenCache } from '@/lib/server/api-client';
import { config } from '@/lib/server/env';

export async function GET(req: NextRequest) {
  const hadKcSession = Boolean(await getKcRefreshToken());

  await clearAuthCookies();
  await clearKcRefreshToken();
  invalidateGeoidTokenCache();

  if (hadKcSession && config.keycloak.enabled) {
    const endSessionUrl = await getEndSessionUrl(`${config.hostUrl}/`);
    return NextResponse.redirect(endSessionUrl);
  }

  return NextResponse.redirect(new URL('/', config.hostUrl));
}
