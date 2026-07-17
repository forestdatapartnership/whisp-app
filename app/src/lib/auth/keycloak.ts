import 'server-only';
import { randomBytes, createHash } from 'crypto';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { config } from '@/lib/server/env';

type OidcConfig = {
  authorization_endpoint: string;
  token_endpoint: string;
  end_session_endpoint: string;
  jwks_uri: string;
};

let cachedOidcConfig: OidcConfig | null = null;
let cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null;

async function getOidcConfig(): Promise<OidcConfig> {
  if (cachedOidcConfig) return cachedOidcConfig;
  const res = await fetch(`${config.keycloak.issuer}/.well-known/openid-configuration`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load Keycloak OIDC configuration');
  cachedOidcConfig = (await res.json()) as OidcConfig;
  return cachedOidcConfig;
}

function getJwks() {
  if (!cachedJwks) {
    cachedJwks = createRemoteJWKSet(new URL(`${config.keycloak.issuer}/protocol/openid-connect/certs`));
  }
  return cachedJwks;
}

export function generatePkce(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = randomBytes(32).toString('base64url');
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
}

export function generateState(): string {
  return randomBytes(16).toString('base64url');
}

function baseAuthParams(params: { state: string; codeChallenge: string }): URLSearchParams {
  const search = new URLSearchParams();
  search.set('client_id', config.keycloak.clientId);
  search.set('redirect_uri', config.keycloak.redirectUri);
  search.set('response_type', 'code');
  search.set('scope', config.keycloak.scope);
  search.set('state', params.state);
  search.set('code_challenge', params.codeChallenge);
  search.set('code_challenge_method', 'S256');
  return search;
}

export async function buildAuthorizationUrl(params: {
  state: string;
  codeChallenge: string;
  loginHint?: string;
}): Promise<string> {
  const oidc = await getOidcConfig();
  const url = new URL(oidc.authorization_endpoint);
  url.search = baseAuthParams(params).toString();
  if (params.loginHint) url.searchParams.set('login_hint', params.loginHint);
  return url.toString();
}

export async function buildRegistrationUrl(params: {
  state: string;
  codeChallenge: string;
}): Promise<string> {
  const oidc = await getOidcConfig();
  const url = new URL(oidc.authorization_endpoint.replace(/\/auth$/, '/registrations'));
  url.search = baseAuthParams(params).toString();
  return url.toString();
}

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  id_token: string;
  expires_in: number;
};

export async function exchangeCodeForTokens(code: string, codeVerifier: string): Promise<TokenResponse> {
  const oidc = await getOidcConfig();
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.keycloak.clientId,
    redirect_uri: config.keycloak.redirectUri,
    code,
    code_verifier: codeVerifier,
  });
  if (config.keycloak.clientSecret) body.set('client_secret', config.keycloak.clientSecret);

  const res = await fetch(oidc.token_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Keycloak token exchange failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function refreshTokens(refreshToken: string): Promise<TokenResponse> {
  const oidc = await getOidcConfig();
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: config.keycloak.clientId,
    refresh_token: refreshToken,
  });
  if (config.keycloak.clientSecret) body.set('client_secret', config.keycloak.clientSecret);

  const res = await fetch(oidc.token_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Keycloak token refresh failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export type KeycloakClaims = {
  sub: string;
  email: string;
  given_name?: string;
  family_name?: string;
  email_verified?: boolean;
};

export async function verifyIdToken(idToken: string): Promise<KeycloakClaims> {
  const { payload } = await jwtVerify(idToken, getJwks(), {
    issuer: config.keycloak.issuer,
    audience: config.keycloak.clientId,
  });
  if (!payload.sub || !payload.email) throw new Error('Keycloak ID token missing required claims');
  return payload as unknown as KeycloakClaims;
}

export async function getEndSessionUrl(postLogoutRedirectUri: string, idTokenHint?: string): Promise<string> {
  const oidc = await getOidcConfig();
  const url = new URL(oidc.end_session_endpoint);
  url.searchParams.set('client_id', config.keycloak.clientId);
  if (idTokenHint) url.searchParams.set('id_token_hint', idTokenHint);
  url.searchParams.set('post_logout_redirect_uri', postLogoutRedirectUri);
  return url.toString();
}
