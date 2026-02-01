import { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { assertEnvVar } from '@/lib/utils'

export async function getAuthUser(req: NextRequest) {
  const SECRET_KEY = assertEnvVar('JWT_SECRET')
  
  const token = req.cookies.get('token')?.value
  
  if (!token) {
    return null
  }
  
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(SECRET_KEY)
    )
    
    if (payload.sub) {
      return { 
        id: payload.sub.toString(),
        email: (payload.email as string) || '',
        isAdmin: (payload.isAdmin as boolean) || false
      }
    }
  } catch (error) {
    console.error('Failed to verify access token in getAuthUser:', error)
  }
  
  return null
}

