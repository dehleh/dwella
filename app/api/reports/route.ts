// POST /api/reports - Submit a report
// GET  /api/reports - List reports for current user (or all for admin)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

const VALID_CATEGORIES = ['SCAM', 'HARASSMENT', 'IMPERSONATION', 'INAPPROPRIATE_CONTENT', 'SAFETY_RISK', 'OTHER']

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { reportedUserId, reportedListingId, reportedMessageId, category, description, evidenceUrls } = body

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` }, { status: 400 })
    }

    if (!description || description.trim().length < 10) {
      return NextResponse.json({ error: 'description must be at least 10 characters' }, { status: 400 })
    }

    if (!reportedUserId && !reportedListingId && !reportedMessageId) {
      return NextResponse.json({ error: 'At least one of reportedUserId, reportedListingId, or reportedMessageId is required' }, { status: 400 })
    }

    // Cannot report yourself
    if (reportedUserId === user.id) {
      return NextResponse.json({ error: 'Cannot report yourself' }, { status: 400 })
    }

    // Determine priority based on category
    let priority = 'MEDIUM'
    if (category === 'SCAM' || category === 'SAFETY_RISK') priority = 'HIGH'
    if (category === 'IMPERSONATION') priority = 'HIGH'

    // Check for duplicate recent reports
    const recentReport = await prisma.report.findFirst({
      where: {
        reporterUserId: user.id,
        reportedUserId: reportedUserId || undefined,
        reportedListingId: reportedListingId || undefined,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Within 24h
      },
    })

    if (recentReport) {
      return NextResponse.json({ error: 'You already submitted a report for this in the last 24 hours' }, { status: 429 })
    }

    const report = await prisma.report.create({
      data: {
        reporterUserId: user.id,
        reportedUserId: reportedUserId || null,
        reportedListingId: reportedListingId || null,
        reportedMessageId: reportedMessageId || null,
        category,
        description: description.trim(),
        evidenceUrls: evidenceUrls || null,
        priority: priority as any,
        status: 'OPEN',
      },
    })

    return NextResponse.json({ message: 'Report submitted. Our team will review it within 24 hours.', report }, { status: 201 })
  } catch (error) {
    console.error('Create report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const roles = user.roles as any
    const isAdmin = roles?.admin === true

    const where: any = isAdmin ? {} : { reporterUserId: user.id }

    const reports = await prisma.report.findMany({
      where,
      include: {
        reporter: { select: { id: true, email: true, profile: { select: { displayName: true } } } },
        reportedUser: { select: { id: true, email: true, profile: { select: { displayName: true } } } },
        reportedListing: { select: { id: true, neighborhood: true, city: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    })

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('List reports error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
