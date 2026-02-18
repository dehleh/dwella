// GET /api/admin/audit-log - View admin action log
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request)
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 100)
    const targetType = searchParams.get('targetType')
    const adminUserId = searchParams.get('adminUserId')

    const where: any = {}
    if (targetType) where.targetType = targetType
    if (adminUserId) where.adminUserId = adminUserId

    const [logs, total] = await Promise.all([
      prisma.adminActionLog.findMany({
        where,
        include: {
          admin: { select: { id: true, email: true, profile: { select: { displayName: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.adminActionLog.count({ where }),
    ])

    return NextResponse.json({
      logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Admin audit log error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
