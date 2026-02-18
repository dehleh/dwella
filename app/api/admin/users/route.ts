// GET  /api/admin/users - List users with filters
// PATCH /api/admin/users - Bulk actions (not implemented yet)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAdmin(request)
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')
    const verified = searchParams.get('verified')

    const where: any = {}
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { displayName: { contains: search, mode: 'insensitive' } } },
      ]
    }
    if (status) where.status = status
    if (verified === 'true') {
      where.verificationRequests = { some: { status: 'APPROVED' } }
    } else if (verified === 'false') {
      where.NOT = { verificationRequests: { some: { status: 'APPROVED' } } }
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          phone: true,
          roles: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
          profile: { select: { displayName: true, city: true } },
          verificationRequests: {
            select: { status: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: { select: { listings: true, sentMessages: true, reportsReceived: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      users: users.map((u: any) => ({
        ...u,
        verificationStatus: u.verificationRequests[0]?.status || 'NOT_STARTED',
        verificationRequests: undefined,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
