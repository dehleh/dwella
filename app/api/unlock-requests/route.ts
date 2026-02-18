// POST /api/unlock-requests - Create unlock request
// GET /api/unlock-requests - List unlock requests for user
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { sendUnlockRequestEmail } from '@/lib/email'
import { notifyUnlockRequest } from '@/lib/notifications'

const UNLOCK_FEE = 2000 // ₦2,000 MVP unlock fee

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check seeker is verified
    const verification = await prisma.verificationRequest.findFirst({
      where: { userId: user.id, status: 'APPROVED' },
    })
    if (!verification) {
      return NextResponse.json({ error: 'You must be verified to request contact unlock' }, { status: 403 })
    }

    const { listingId } = await request.json()
    if (!listingId) {
      return NextResponse.json({ error: 'listingId is required' }, { status: 400 })
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } })
    if (!listing || listing.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Listing not available' }, { status: 404 })
    }

    // Host must also be verified
    const hostVerification = await prisma.verificationRequest.findFirst({
      where: { userId: listing.hostUserId, status: 'APPROVED' },
    })
    if (!hostVerification) {
      return NextResponse.json({ error: 'Host is not yet verified' }, { status: 400 })
    }

    if (listing.hostUserId === user.id) {
      return NextResponse.json({ error: 'Cannot unlock your own listing' }, { status: 400 })
    }

    // Check existing
    const existing = await prisma.unlockRequest.findFirst({
      where: {
        listingId,
        seekerUserId: user.id,
        status: { notIn: ['DECLINED', 'REFUNDED'] },
      },
    })
    if (existing) {
      return NextResponse.json({ error: 'You already have an active unlock request', requestId: existing.id }, { status: 409 })
    }

    const unlockRequest = await prisma.unlockRequest.create({
      data: {
        listingId,
        hostUserId: listing.hostUserId,
        seekerUserId: user.id,
        status: 'PENDING_HOST_APPROVAL',
        unlockFee: UNLOCK_FEE,
        hostAutoApprove: false,
      },
    })

    // Notify host via email (fire-and-forget)
    const [hostUser, seekerProfile] = await Promise.all([
      prisma.user.findUnique({ where: { id: listing.hostUserId }, include: { profile: true } }),
      prisma.userProfile.findUnique({ where: { userId: user.id } }),
    ])
    if (hostUser?.email) {
      sendUnlockRequestEmail(
        hostUser.email,
        hostUser.profile?.displayName || 'Host',
        seekerProfile?.displayName || 'A seeker',
        listing.neighborhood
      ).catch(() => {})
    }

    // In-app notification
    notifyUnlockRequest(
      listing.hostUserId,
      seekerProfile?.displayName || 'A seeker',
      listing.neighborhood
    ).catch(() => {})

    return NextResponse.json(unlockRequest, { status: 201 })
  } catch (error) {
    console.error('Create unlock request error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = request.nextUrl.searchParams.get('role') || 'seeker'

    const requests = await prisma.unlockRequest.findMany({
      where: role === 'host'
        ? { hostUserId: user.id }
        : { seekerUserId: user.id },
      include: {
        listing: {
          select: { id: true, neighborhood: true, city: true, priceMonthly: true },
        },
        host: {
          select: { id: true, profile: { select: { displayName: true } } },
        },
        seeker: {
          select: { id: true, profile: { select: { displayName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(requests)
  } catch (error) {
    console.error('List unlock requests error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
