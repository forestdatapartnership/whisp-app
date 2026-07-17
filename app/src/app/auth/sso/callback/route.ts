import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, verifyIdToken } from '@/lib/auth/keycloak';
import { createTokens, setAuthCookies, setKcRefreshToken, getAndClearSsoState } from '@/lib/auth/session';
import { findOrCreateSsoUser } from '@/lib/db/users-service';
import { getCacheableApiKeyByUser, createApiKeyForUser } from '@/lib/db/api-keys-service';
import { normalizeEmail } from '@/lib/shared/email-format';
import { config } from '@/lib/server/env';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const loginUrl = new URL('/login', config.hostUrl);

  const saved = await getAndClearSsoState();
  if (!code || !state || !saved || saved.state !== state) {
    loginUrl.searchParams.set('error', 'sso_failed');
    return NextResponse.redirect(loginUrl);
  }

  try {
    const tokens = await exchangeCodeForTokens(code, saved.codeVerifier);
    const claims = await verifyIdToken(tokens.id_token);

    const profile = await findOrCreateSsoUser({
      keycloakSub: claims.sub,
      email: normalizeEmail(claims.email),
      name: claims.given_name || claims.email,
      lastName: claims.family_name || '',
    });

    const appTokens = await createTokens({ id: profile.uuid, email: profile.email, isAdmin: profile.is_admin });
    await setAuthCookies(appTokens);
    await setKcRefreshToken(tokens.refresh_token);

    const existingKey = await getCacheableApiKeyByUser(profile.uuid);
    if (!existingKey) await createApiKeyForUser(profile.uuid);

    const redirectTo = new URL(saved.next, config.hostUrl);
    return NextResponse.redirect(redirectTo);
  } catch (err) {
    console.error('[sso callback]', err);
    loginUrl.searchParams.set('error', 'sso_failed');
    return NextResponse.redirect(loginUrl);
  }
}
