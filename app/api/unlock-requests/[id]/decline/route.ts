// POST /api/unlock-requests/[id]/decline - Host declines unlock request
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { notifyUnlockDeclined } from '@/lib/notifications'

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
      return NextResponse.json({ error: `Cannot decline from status ${unlockRequest.status}` }, { status: 400 })
    }

    const updated = await prisma.unlockRequest.update({
      where: { id: params.id },
      data: { status: 'DECLINED' },
      include: { listing: { select: { neighborhood: true } } },
    })

    // Notify seeker
    notifyUnlockDeclined(unlockRequest.seekerUserId, updated.listing.neighborhood).catch(() => {})

    return NextResponse.json({ message: 'Unlock request declined', unlockRequest: updated })
  } catch (error) {
    console.error('Decline unlock error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
