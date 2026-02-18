// GET /api/notifications — List notifications for current user
// PATCH /api/notifications — Mark notifications as read (bulk)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 100)
    const cursor = searchParams.get('cursor') // for pagination

    const where: any = { userId: user.id }
    if (unreadOnly) where.isRead = false
    if (cursor) where.createdAt = { lt: new Date(cursor) }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.notification.count({
        where: { userId: user.id, isRead: false },
      }),
    ])

    return NextResponse.json({
      notifications,
      unreadCount,
      nextCursor:
        notifications.length === limit
          ? notifications[notifications.length - 1].createdAt.toISOString()
          : null,
    })
  } catch (error) {
    console.error('Notifications GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { ids, markAllRead } = body

    if (markAllRead) {
      // Mark all unread notifications as read
      const result = await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      })
      return NextResponse.json({ updated: result.count })
    }

    if (Array.isArray(ids) && ids.length > 0) {
      const result = await prisma.notification.updateMany({
        where: { id: { in: ids }, userId: user.id },
        data: { isRead: true },
      })
      return NextResponse.json({ updated: result.count })
    }

    return NextResponse.json({ error: 'Provide ids array or markAllRead: true' }, { status: 400 })
  } catch (error) {
    console.error('Notifications PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
