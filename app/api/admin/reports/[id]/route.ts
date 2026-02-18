// PATCH /api/admin/reports/[id] - Update report status
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
    const report = await prisma.report.findUnique({ where: { id: params.id } })
    if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await request.json()
    const { status, priority, action } = body

    const updateData: any = {}
    if (status && ['OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED'].includes(status)) {
      updateData.status = status
    }
    if (priority && ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(priority)) {
      updateData.priority = priority
    }

    if (Object.keys(updateData).length === 0 && !action) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const updated = Object.keys(updateData).length > 0
      ? await prisma.report.update({ where: { id: params.id }, data: updateData })
      : report

    // Handle admin actions on the reported user
    if (action && report.reportedUserId) {
      if (action === 'suspend') {
        await prisma.user.update({
          where: { id: report.reportedUserId },
          data: { status: 'SUSPENDED' },
        })
      } else if (action === 'ban') {
        await prisma.user.update({
          where: { id: report.reportedUserId },
          data: { status: 'BANNED' },
        })
      } else if (action === 'warn') {
        // Log warning (in a real app, this would send a notification)
      }
    }

    // Log admin action
    await prisma.adminActionLog.create({
      data: {
        adminUserId: admin!.id,
        action: `UPDATE_REPORT`,
        targetType: 'Report',
        targetId: params.id,
        metadata: { changes: updateData, action: action || null },
      },
    })

    return NextResponse.json({ message: 'Report updated', report: updated })
  } catch (error) {
    console.error('Admin report update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
