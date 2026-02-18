// GET /api/dashboard - Dashboard stats and recent activity
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roles = user.roles || {}

    // Count stats
    const [
      listingsCount,
      conversationsCount,
      unlockRequestsCount,
      viewingsCount,
    ] = await Promise.all([
      roles.host
        ? prisma.listing.count({ where: { hostUserId: user.id, status: { in: ['PUBLISHED', 'PAUSED'] } } })
        : 0,
      prisma.conversation.count({
        where: {
          OR: [{ hostUserId: user.id }, { seekerUserId: user.id }],
          status: 'ACTIVE',
        },
      }),
      prisma.unlockRequest.count({
        where: {
          OR: [{ hostUserId: user.id }, { seekerUserId: user.id }],
        },
      }),
      prisma.viewing.count({
        where: {
          OR: [{ hostUserId: user.id }, { seekerUserId: user.id }],
          status: { in: ['PROPOSED', 'CONFIRMED'] },
        },
      }),
    ])

    // Recent activity (last 7 days of messages, unlock requests, viewings)
    const recentMessages = await prisma.message.findMany({
      where: {
        conversation: {
          OR: [{ hostUserId: user.id }, { seekerUserId: user.id }],
        },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        sender: { include: { profile: true } },
        conversation: { include: { listing: true } },
      },
    })

    const recentActivity = recentMessages.map((msg: any) => ({
      type: 'message',
      message: `${msg.sender.profile?.displayName || 'Someone'} sent a message about "${msg.conversation.listing.neighborhood}"`,
      time: msg.createdAt.toISOString(),
    }))

    return NextResponse.json({
      stats: {
        listingsCount,
        conversationsCount,
        unlockRequestsCount,
        viewingsCount,
        matchesCount: 0, // computed on-demand via matching
      },
      recentActivity,
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
