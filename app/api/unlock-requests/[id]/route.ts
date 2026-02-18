// GET /api/unlock-requests/[id] - Get unlock request detail
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const unlockRequest = await prisma.unlockRequest.findUnique({
      where: { id: params.id },
      include: {
        listing: {
          select: { id: true, neighborhood: true, city: true, priceMonthly: true, roomType: true },
        },
        host: {
          select: {
            id: true,
            email: true,
            phone: true,
            profile: { select: { displayName: true } },
          },
        },
        seeker: {
          select: {
            id: true,
            profile: { select: { displayName: true } },
          },
        },
        contactReveals: true,
      },
    })

    if (!unlockRequest) {
      return NextResponse.json({ error: 'Unlock request not found' }, { status: 404 })
    }

    if (unlockRequest.hostUserId !== user.id && unlockRequest.seekerUserId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only show contact info if CONTACT_REVEALED
    const response: any = {
      id: unlockRequest.id,
      status: unlockRequest.status,
      unlockFee: unlockRequest.unlockFee,
      listing: unlockRequest.listing,
      host: {
        id: unlockRequest.host.id,
        displayName: unlockRequest.host.profile?.displayName,
      },
      seeker: {
        id: unlockRequest.seeker.id,
        displayName: unlockRequest.seeker.profile?.displayName,
      },
      createdAt: unlockRequest.createdAt,
    }

    if (unlockRequest.status === 'CONTACT_REVEALED' && unlockRequest.seekerUserId === user.id) {
      response.revealedContact = {
        phone: unlockRequest.host.phone,
        email: unlockRequest.host.email,
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Unlock request detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
