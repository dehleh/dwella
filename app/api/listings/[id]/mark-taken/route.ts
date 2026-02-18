// POST /api/listings/[id]/mark-taken - Mark listing as taken
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

    const updated = await prisma.listing.update({
      where: { id: params.id },
      data: { status: 'TAKEN' },
    })
    return NextResponse.json({ message: 'Listing marked as taken', listing: updated })
  } catch (error) {
    console.error('Mark taken error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
