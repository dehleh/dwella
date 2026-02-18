// POST /api/conversations - Create a new conversation
// GET /api/conversations - List user conversations
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check verified
    const verification = await prisma.verificationRequest.findFirst({
      where: { userId: user.id, status: 'APPROVED' },
    })
    if (!verification) {
      return NextResponse.json({ error: 'You must be verified to message' }, { status: 403 })
    }

    const { listingId } = await request.json()
    if (!listingId) {
      return NextResponse.json({ error: 'listingId is required' }, { status: 400 })
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } })
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (listing.hostUserId === user.id) {
      return NextResponse.json({ error: 'Cannot message your own listing' }, { status: 400 })
    }

    // Check for block
    const blocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerUserId: listing.hostUserId, blockedUserId: user.id },
          { blockerUserId: user.id, blockedUserId: listing.hostUserId },
        ],
      },
    })
    if (blocked) {
      return NextResponse.json({ error: 'Unable to create conversation' }, { status: 403 })
    }

    // Check existing conversation
    const existing = await prisma.conversation.findFirst({
      where: {
        listingId,
        hostUserId: listing.hostUserId,
        seekerUserId: user.id,
      },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Conversation already exists', conversationId: existing.id },
        { status: 409 }
      )
    }

    const conversation = await prisma.conversation.create({
      data: {
        listingId,
        hostUserId: listing.hostUserId,
        seekerUserId: user.id,
        status: 'ACTIVE',
      },
    })

    return NextResponse.json(conversation, { status: 201 })
  } catch (error) {
    console.error('Create conversation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ hostUserId: user.id }, { seekerUserId: user.id }],
        status: { not: 'BLOCKED' },
      },
      include: {
        listing: {
          select: {
            id: true,
            neighborhood: true,
            city: true,
            priceMonthly: true,
            roomType: true,
            photos: true,
          },
        },
        host: {
          select: {
            id: true,
            profile: { select: { displayName: true, photos: true } },
          },
        },
        seeker: {
          select: {
            id: true,
            profile: { select: { displayName: true, photos: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { body: true, createdAt: true, senderUserId: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(conversations)
  } catch (error) {
    console.error('List conversations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
