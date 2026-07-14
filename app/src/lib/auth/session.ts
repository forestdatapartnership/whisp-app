import 'server-only';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';
import { config } from '@/lib/server/env';
import { AuthUser } from '@/types/auth';
import { SystemError } from '@/types/system-error';
import { SystemCode } from '@/types/system-codes';

export const TOKEN_EXPIRATION = {
  access: '30m',
  refresh: '7d',
};

const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

export const TOKEN_COOKIE_OPTIONS = {
  access: { ...COOKIE_BASE, maxAge: 1800 },
  refresh: { ...COOKIE_BASE, maxAge: 604800 },
};

function getSecretBytes(): Uint8Array {
  return new TextEncoder().encode(config.auth.jwtSecret);
}

export async function verifyToken(token: string | undefined): Promise<AuthUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretBytes());
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      email: (payload.email as string) || '',
      isAdmin: (payload.isAdmin as boolean) || false,
    };
  } catch {
    return null;
  }
}

export async function createToken(user: AuthUser, expiresIn: string): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    isAdmin: user.isAdmin,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecretBytes());
}

export async function createTokens(user: AuthUser): Promise<{ accessToken: string; refreshToken: string }> {
  const [accessToken, refreshToken] = await Promise.all([
    createToken(user, TOKEN_EXPIRATION.access),
    createToken(user, TOKEN_EXPIRATION.refresh),
  ]);
  return { accessToken, refreshToken };
}

export async function getAuthUser(req?: NextRequest): Promise<AuthUser | null> {
  const token = req ? req.cookies.get('token')?.value : (await cookies()).get('token')?.value;
  return verifyToken(token);
}

export async function setAuthCookies(tokens: { accessToken: string; refreshToken: string }): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('token', tokens.accessToken, TOKEN_COOKIE_OPTIONS.access);
  cookieStore.set('refreshToken', tokens.refreshToken, TOKEN_COOKIE_OPTIONS.refresh);
}

export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('token', '', { ...COOKIE_BASE, maxAge: 0 });
  cookieStore.set('refreshToken', '', { ...COOKIE_BASE, maxAge: 0 });
}

export async function getAuthUserWithRefresh(): Promise<AuthUser | null> {
  const cookieStore = await cookies();

  const accessUser = await verifyToken(cookieStore.get('token')?.value);
  if (accessUser) return accessUser;

  const refreshUser = await verifyToken(cookieStore.get('refreshToken')?.value);
  if (!refreshUser) return null;

  const tokens = await createTokens(refreshUser);
  await setAuthCookies(tokens);

  return refreshUser;
}

const KC_REFRESH_COOKIE_OPTIONS = { ...COOKIE_BASE, maxAge: 2592000 };

export async function setKcRefreshToken(refreshToken: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('kc_refresh_token', refreshToken, KC_REFRESH_COOKIE_OPTIONS);
}

export async function getKcRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('kc_refresh_token')?.value ?? null;
}

export async function clearKcRefreshToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('kc_refresh_token', '', { ...COOKIE_BASE, maxAge: 0 });
}

const SSO_STATE_COOKIE_OPTIONS = { ...COOKIE_BASE, maxAge: 300 };

export type SsoState = { state: string; codeVerifier: string; next: string };

export async function setSsoState(data: SsoState): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('sso_state', JSON.stringify(data), SSO_STATE_COOKIE_OPTIONS);
}

export async function getAndClearSsoState(): Promise<SsoState | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get('sso_state')?.value;
  cookieStore.set('sso_state', '', { ...COOKIE_BASE, maxAge: 0 });
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SsoState;
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) throw new SystemError(SystemCode.AUTH_UNAUTHORIZED);
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (!user.isAdmin) throw new SystemError(SystemCode.AUTH_ADMIN_REQUIRED);
  return user;
}
