import { NextRequest } from 'next/server'

export async function getAuthUser(req: NextRequest) {
  // Simply get the userId from the cookie set by withAuth middleware
  const userId = req.cookies.get('userId')?.value
  
  if (!userId) {
    return null
  }
  
  return { id: userId }
}

