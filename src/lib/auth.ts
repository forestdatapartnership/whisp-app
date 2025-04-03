import { NextRequest } from 'next/server'

export async function getAuthUser(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return null

  return { id: userId }
}

