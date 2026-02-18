// Admin API middleware helper
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'

export async function requireAdmin(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const roles = user.roles as any
  if (!roles?.admin) return { error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) }

  return { user }
}
