import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify, SignJWT } from 'jose'
import { config } from '@/lib/config'
import { AuthUser } from '@/types/auth'
import { SystemError } from '@/types/systemError'
import { SystemCode } from '@/types/systemCodes'

export const TOKEN_EXPIRATION = {
  access: '30m',
  refresh: '7d'
}

const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
}

export const TOKEN_COOKIE_OPTIONS = {
  access:  { ...COOKIE_BASE, maxAge: 1800 },
  refresh: { ...COOKIE_BASE, maxAge: 604800 },
}

function getSecretBytes(): Uint8Array {
  return new TextEncoder().encode(config.auth.jwtSecret)
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

export async function getAuthUser(req?: NextRequest): Promise<AuthUser | null> {
  const token = req ? req.cookies.get('token')?.value : (await cookies()).get('token')?.value
  return verifyToken(token)
}

export async function setAuthCookies(tokens: { accessToken: string; refreshToken: string }): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set('token', tokens.accessToken, TOKEN_COOKIE_OPTIONS.access)
  cookieStore.set('refreshToken', tokens.refreshToken, TOKEN_COOKIE_OPTIONS.refresh)
}

export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set('token', '', { ...COOKIE_BASE, maxAge: 0 })
  cookieStore.set('refreshToken', '', { ...COOKIE_BASE, maxAge: 0 })
}

export async function getAuthUserWithRefresh(): Promise<AuthUser | null> {
  const cookieStore = await cookies()

  const accessUser = await verifyToken(cookieStore.get('token')?.value)
  if (accessUser) return accessUser

  const refreshUser = await verifyToken(cookieStore.get('refreshToken')?.value)
  if (!refreshUser) return null

  const tokens = await createTokens(refreshUser)
  await setAuthCookies(tokens)

  return refreshUser
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser()
  if (!user) throw new SystemError(SystemCode.AUTH_UNAUTHORIZED)
  return user
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth()
  if (!user.isAdmin) throw new SystemError(SystemCode.AUTH_ADMIN_REQUIRED)
  return user
}

