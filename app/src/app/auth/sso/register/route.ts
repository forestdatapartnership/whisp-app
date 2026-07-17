import { NextRequest, NextResponse } from 'next/server';
import { generatePkce, generateState, buildRegistrationUrl } from '@/lib/auth/keycloak';
import { setSsoState } from '@/lib/auth/session';
import { config } from '@/lib/server/env';

export async function GET(req: NextRequest) {
  if (!config.keycloak.enabled) {
    return new NextResponse('SSO is not configured', { status: 501 });
  }

  const next = req.nextUrl.searchParams.get('next') || '/';
  const { codeVerifier, codeChallenge } = generatePkce();
  const state = generateState();

  await setSsoState({ state, codeVerifier, next: next.startsWith('/') ? next : '/' });

  const registrationUrl = await buildRegistrationUrl({ state, codeChallenge });
  return NextResponse.redirect(registrationUrl);
}
