// GET  /api/admin/verifications - List pending verification requests
// POST /api/admin/verifications - not used (use [id] routes)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request)
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    const where: any = {}
    if (status !== 'all') where.status = status

    const [requests, total] = await Promise.all([
      prisma.verificationRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: { select: { displayName: true, city: true } },
            },
          },
          artifacts: { select: { id: true, artifactType: true, secureUri: true } },
        },
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.verificationRequest.count({ where }),
    ])

    return NextResponse.json({
      requests,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Admin verifications error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
