import { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { assertEnvVar } from '@/lib/utils'

export async function getAuthUser(req: NextRequest) {
  // Get JWT secret for token verification
  const SECRET_KEY = assertEnvVar('JWT_SECRET')
  
  // Try to get token from cookies
  const token = req.cookies.get('token')?.value
  
  if (!token) {
    return null
  }
  
  try {
    // Verify and decode the token
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(SECRET_KEY)
    )
    
    // Extract user ID from sub claim
    if (payload.sub) {
      return { id: payload.sub.toString() }
    }
  } catch (error) {
    console.error('Failed to verify access token in getAuthUser:', error)
  }
  
  return null
}

