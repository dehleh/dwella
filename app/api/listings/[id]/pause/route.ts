// POST /api/listings/[id]/pause - Pause a listing
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const listing = await prisma.listing.findUnique({ where: { id: params.id } })
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    if (listing.hostUserId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (listing.status !== 'PUBLISHED') {
      return NextResponse.json({ error: `Cannot pause from status ${listing.status}` }, { status: 400 })
    }

    const updated = await prisma.listing.update({
      where: { id: params.id },
      data: { status: 'PAUSED' },
    })
    return NextResponse.json({ message: 'Listing paused', listing: updated })
  } catch (error) {
    console.error('Pause listing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
