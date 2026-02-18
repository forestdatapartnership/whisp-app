import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify, SignJWT } from 'jose'
import { assertEnvVar } from '@/lib/utils'
import { AuthUser } from '@/types/auth'
import { SystemError } from '@/types/systemError'
import { SystemCode } from '@/types/systemCodes'

export const TOKEN_EXPIRATION = {
  access: '30m',
  refresh: '7d'
}

const COOKIE_MAX_AGE = {
  access: 1800,
  refresh: 604800
}

function getSecretBytes(): Uint8Array {
  return new TextEncoder().encode(assertEnvVar('JWT_SECRET'))
}

export async function verifyToken(token: string | undefined): Promise<AuthUser | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecretBytes())
    if (!payload.sub) return null
    return {
      id: payload.sub,
      email: (payload.email as string) || '',
      isAdmin: (payload.isAdmin as boolean) || false
    }
  } catch {
    return null
  }
}

export async function createToken(user: AuthUser, expiresIn: string): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    isAdmin: user.isAdmin
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecretBytes())
}

export async function createTokens(user: AuthUser): Promise<{ accessToken: string; refreshToken: string }> {
  const [accessToken, refreshToken] = await Promise.all([
    createToken(user, TOKEN_EXPIRATION.access),
    createToken(user, TOKEN_EXPIRATION.refresh)
  ])
  return { accessToken, refreshToken }
}

export function setTokenCookies(
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string }
): void {
  const isProduction = process.env.NODE_ENV === 'production'

  response.cookies.set('token', tokens.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: COOKIE_MAX_AGE.access
  })

  response.cookies.set('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: COOKIE_MAX_AGE.refresh
  })
}

export async function getAuthUser(req?: NextRequest): Promise<AuthUser | null> {
  const token = req ? req.cookies.get('token')?.value : cookies().get('token')?.value
  return verifyToken(token)
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await getAuthUser()
  if (!user) throw new SystemError(SystemCode.AUTH_UNAUTHORIZED)
  if (!user.isAdmin) throw new SystemError(SystemCode.AUTH_ADMIN_REQUIRED)
  return user
}

