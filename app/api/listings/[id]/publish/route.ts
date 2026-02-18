// POST /api/listings/[id]/publish - Publish a listing
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const listing = await prisma.listing.findUnique({ where: { id: params.id } })
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }
    if (listing.hostUserId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check host is verified
    const verification = await prisma.verificationRequest.findFirst({
      where: { userId: user.id, status: 'APPROVED' },
    })
    if (!verification) {
      return NextResponse.json(
        { error: 'You must be verified to publish a listing' },
        { status: 403 }
      )
    }

    if (!['DRAFT', 'PAUSED'].includes(listing.status)) {
      return NextResponse.json({ error: `Cannot publish from status ${listing.status}` }, { status: 400 })
    }

    const updated = await prisma.listing.update({
      where: { id: params.id },
      data: { status: 'PUBLISHED' },
    })

    return NextResponse.json({ message: 'Listing published', listing: updated })
  } catch (error) {
    console.error('Publish listing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
