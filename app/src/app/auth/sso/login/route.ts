import { NextRequest, NextResponse } from 'next/server';
import { generatePkce, generateState, buildAuthorizationUrl } from '@/lib/auth/keycloak';
import { setSsoState } from '@/lib/auth/session';
import { config } from '@/lib/server/env';

export async function GET(req: NextRequest) {
  if (!config.keycloak.enabled) {
    return new NextResponse('SSO is not configured', { status: 501 });
  }

  const next = req.nextUrl.searchParams.get('next') || '/';
  const loginHint = req.nextUrl.searchParams.get('login_hint') || undefined;
  const { codeVerifier, codeChallenge } = generatePkce();
  const state = generateState();

  await setSsoState({ state, codeVerifier, next: next.startsWith('/') ? next : '/' });

  const authUrl = await buildAuthorizationUrl({ state, codeChallenge, loginHint });
  return NextResponse.redirect(authUrl);
}
