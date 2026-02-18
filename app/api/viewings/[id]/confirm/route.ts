// POST /api/viewings/[id]/confirm - Host confirms a proposed slot
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

    const viewing = await prisma.viewing.findUnique({ where: { id: params.id } })
    if (!viewing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (viewing.hostUserId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (viewing.status !== 'PROPOSED') {
      return NextResponse.json({ error: `Cannot confirm from status ${viewing.status}` }, { status: 400 })
    }

    const body = await request.json()
    const { confirmedSlot } = body

    if (!confirmedSlot) {
      return NextResponse.json({ error: 'confirmedSlot (ISO date) is required' }, { status: 400 })
    }

    const slotDate = new Date(confirmedSlot)
    if (isNaN(slotDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    // Verify the confirmed slot is one of the proposed slots (or allow host to pick any time)
    const proposedSlots = viewing.proposedSlots as string[]
    const isProposed = proposedSlots.some(
      (s: string) => new Date(s).toISOString() === slotDate.toISOString()
    )
    // Allow host to confirm even non-proposed slots (counter-proposal)

    const updated = await prisma.viewing.update({
      where: { id: params.id },
      data: {
        status: 'CONFIRMED',
        confirmedSlot: slotDate,
      },
    })

    return NextResponse.json({ message: 'Viewing confirmed', viewing: updated })
  } catch (error) {
    console.error('Confirm viewing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
