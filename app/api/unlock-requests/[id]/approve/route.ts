// POST /api/unlock-requests/[id]/approve - Host approves unlock request
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { sendUnlockApprovedEmail } from '@/lib/email'
import { sendUnlockApprovedSms } from '@/lib/sms'
import { notifyUnlockApproved } from '@/lib/notifications'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const unlockRequest = await prisma.unlockRequest.findUnique({ where: { id: params.id } })
    if (!unlockRequest) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (unlockRequest.hostUserId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (unlockRequest.status !== 'PENDING_HOST_APPROVAL') {
      return NextResponse.json({ error: `Cannot approve from status ${unlockRequest.status}` }, { status: 400 })
    }

    const updated = await prisma.unlockRequest.update({
      where: { id: params.id },
      data: { status: 'APPROVED' },
      include: {
        listing: { select: { neighborhood: true, city: true } },
        seeker: { select: { email: true, phone: true, profile: { select: { displayName: true } } } },
      },
    })

    // Send notification to seeker (fire-and-forget)
    const seekerData = updated.seeker as any
    const seekerName = seekerData?.profile?.displayName || 'there'
    if (seekerData?.email) {
      sendUnlockApprovedEmail(seekerData.email, seekerName, updated.listing.neighborhood, updated.listing.city).catch(() => {})
    }
    if (seekerData?.phone) {
      sendUnlockApprovedSms(seekerData.phone, updated.listing.neighborhood).catch(() => {})
    }

    // In-app notification
    notifyUnlockApproved(unlockRequest.seekerUserId, updated.listing.neighborhood).catch(() => {})

    return NextResponse.json({ message: 'Unlock request approved', unlockRequest: updated })
  } catch (error) {
    console.error('Approve unlock error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
