// GET /api/admin/stats - Admin dashboard statistics
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAdmin(request)
  if (error) return error

  try {
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      pendingVerifications,
      approvedVerifications,
      totalListings,
      publishedListings,
      totalConversations,
      totalMessages,
      openReports,
      totalPayments,
      successPayments,
      totalViewings,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: { in: ['SUSPENDED', 'BANNED'] } } }),
      prisma.verificationRequest.count({ where: { status: 'PENDING' } }),
      prisma.verificationRequest.count({ where: { status: 'APPROVED' } }),
      prisma.listing.count(),
      prisma.listing.count({ where: { status: 'PUBLISHED' } }),
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.report.count({ where: { status: { in: ['OPEN', 'IN_REVIEW'] } } }),
      prisma.paymentTransaction.count(),
      prisma.paymentTransaction.count({ where: { status: 'SUCCESS' } }),
      prisma.viewing.count(),
    ])

    // Revenue calculation
    const revenueResult = await prisma.paymentTransaction.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true },
    })

    // Recent signups (last 7 days)
    const recentSignups = await prisma.user.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    })

    return NextResponse.json({
      users: { total: totalUsers, active: activeUsers, suspended: suspendedUsers, recentSignups },
      verification: { pending: pendingVerifications, approved: approvedVerifications },
      listings: { total: totalListings, published: publishedListings },
      messaging: { conversations: totalConversations, messages: totalMessages },
      reports: { open: openReports },
      payments: { total: totalPayments, successful: successPayments, revenue: revenueResult._sum.amount || 0 },
      viewings: { total: totalViewings },
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
