// POST /api/viewings - Propose viewing slots
// GET  /api/viewings - List viewings for current user
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { listingId, proposedSlots, notes } = body

    if (!listingId || !proposedSlots || !Array.isArray(proposedSlots) || proposedSlots.length === 0) {
      return NextResponse.json({ error: 'listingId and proposedSlots (array of ISO dates) required' }, { status: 400 })
    }

    if (proposedSlots.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 proposed slots allowed' }, { status: 400 })
    }

    // Validate slot dates are in the future
    const now = new Date()
    for (const slot of proposedSlots) {
      const date = new Date(slot)
      if (isNaN(date.getTime()) || date <= now) {
        return NextResponse.json({ error: 'All proposed slots must be valid future dates' }, { status: 400 })
      }
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } })
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    if (listing.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Listing is not published' }, { status: 400 })
    }
    if (listing.hostUserId === user.id) {
      return NextResponse.json({ error: 'Cannot schedule viewing for your own listing' }, { status: 400 })
    }

    // Check for existing active viewing
    const existing = await prisma.viewing.findFirst({
      where: {
        listingId,
        seekerUserId: user.id,
        status: { in: ['PROPOSED', 'CONFIRMED'] },
      },
    })
    if (existing) {
      return NextResponse.json({ error: 'You already have an active viewing for this listing', existingViewing: existing }, { status: 409 })
    }

    const viewing = await prisma.viewing.create({
      data: {
        listingId,
        hostUserId: listing.hostUserId,
        seekerUserId: user.id,
        proposedSlots: proposedSlots.map((s: string) => new Date(s).toISOString()),
        notes: notes || null,
        status: 'PROPOSED',
      },
    })

    return NextResponse.json({ message: 'Viewing proposed', viewing }, { status: 201 })
  } catch (error) {
    console.error('Create viewing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') // 'host' or 'seeker'
    const status = searchParams.get('status')
    const listingId = searchParams.get('listingId')

    const where: any = {}

    if (role === 'host') {
      where.hostUserId = user.id
    } else if (role === 'seeker') {
      where.seekerUserId = user.id
    } else {
      where.OR = [{ hostUserId: user.id }, { seekerUserId: user.id }]
    }

    if (status) where.status = status
    if (listingId) where.listingId = listingId

    const viewings = await prisma.viewing.findMany({
      where,
      include: {
        listing: { select: { id: true, neighborhood: true, city: true, priceMonthly: true, roomType: true, photos: true } },
        host: { select: { id: true, profile: { select: { displayName: true } } } },
        seeker: { select: { id: true, profile: { select: { displayName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ viewings })
  } catch (error) {
    console.error('List viewings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
