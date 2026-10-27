import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies, clearKcRefreshToken, getKcRefreshToken } from '@/lib/auth/session';
import { getEndSessionUrl } from '@/lib/auth/keycloak';
import { invalidateGeoidTokenCache } from '@/lib/server/api-client';
import { config } from '@/lib/server/env';

export async function GET(req: NextRequest) {
  const hadKcSession = Boolean(await getKcRefreshToken());
  const keepSso = req.nextUrl.searchParams.has('keep_sso');

  await clearAuthCookies();
  await clearKcRefreshToken();
  invalidateGeoidTokenCache();

  if (hadKcSession && config.keycloak.enabled && !keepSso) {
    const endSessionUrl = await getEndSessionUrl(`${config.hostUrl}/`);
    return NextResponse.redirect(endSessionUrl);
  }

  return NextResponse.redirect(new URL('/', config.hostUrl));
}
