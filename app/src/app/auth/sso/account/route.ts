import { NextResponse } from 'next/server';
import { config } from '@/lib/server/env';

export async function GET() {
  if (!config.keycloak.enabled) {
    return new NextResponse('SSO is not configured', { status: 501 });
  }

  const url = new URL(`${config.keycloak.issuer}/account`);
  url.searchParams.set('referrer', config.keycloak.clientId);
  url.searchParams.set('referrer_uri', config.hostUrl || '/');
  return NextResponse.redirect(url);
}
