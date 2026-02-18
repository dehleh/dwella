// PATCH /api/admin/users/[id] - Update user status/roles
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user: admin, error } = await requireAdmin(request)
  if (error) return error

  try {
    const target = await prisma.user.findUnique({ where: { id: params.id } })
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await request.json()
    const { status, roles } = body

    const updateData: any = {}
    if (status && ['ACTIVE', 'SUSPENDED', 'BANNED'].includes(status)) {
      updateData.status = status
    }
    if (roles && typeof roles === 'object') {
      updateData.roles = roles
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: { id: true, email: true, status: true, roles: true },
    })

    // Log admin action
    await prisma.adminActionLog.create({
      data: {
        adminUserId: admin!.id,
        action: `UPDATE_USER`,
        targetType: 'User',
        targetId: params.id,
        metadata: { changes: updateData, previousStatus: target.status },
      },
    })

    return NextResponse.json({ message: 'User updated', user: updated })
  } catch (error) {
    console.error('Admin update user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
