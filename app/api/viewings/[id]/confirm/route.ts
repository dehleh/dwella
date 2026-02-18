// POST /api/viewings/[id]/confirm - Host confirms a proposed slot
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { sendViewingConfirmedEmail } from '@/lib/email'
import { sendViewingConfirmedSms } from '@/lib/sms'
import { notifyViewingConfirmed } from '@/lib/notifications'

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
      include: {
        listing: { select: { neighborhood: true, city: true } },
        host: { select: { email: true, phone: true, profile: { select: { displayName: true } } } },
        seeker: { select: { email: true, phone: true, profile: { select: { displayName: true } } } },
      },
    })

    // Send notifications to both parties (fire-and-forget)
    const dateStr = slotDate.toLocaleString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    const hostData = updated.host as any
    const seekerData = updated.seeker as any
    const neighborhood = updated.listing.neighborhood

    if (seekerData?.email) {
      sendViewingConfirmedEmail(seekerData.email, seekerData.profile?.displayName || 'there', neighborhood, slotDate.toISOString(), 'seeker').catch(() => {})
    }
    if (seekerData?.phone) {
      sendViewingConfirmedSms(seekerData.phone, neighborhood, dateStr).catch(() => {})
    }
    if (hostData?.email) {
      sendViewingConfirmedEmail(hostData.email, hostData.profile?.displayName || 'there', neighborhood, slotDate.toISOString(), 'host').catch(() => {})
    }

    // In-app notifications for both
    notifyViewingConfirmed(viewing.seekerUserId, neighborhood, slotDate.toISOString()).catch(() => {})
    notifyViewingConfirmed(viewing.hostUserId, neighborhood, slotDate.toISOString()).catch(() => {})

    return NextResponse.json({ message: 'Viewing confirmed', viewing: updated })
  } catch (error) {
    console.error('Confirm viewing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
