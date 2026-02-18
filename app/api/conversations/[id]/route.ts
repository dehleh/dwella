// GET /api/conversations/[id] - Get conversation detail + messages
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

    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
      include: {
        listing: {
          select: {
            id: true,
            neighborhood: true,
            city: true,
            priceMonthly: true,
            roomType: true,
            photos: true,
            hostUserId: true,
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
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            senderUserId: true,
            messageType: true,
            body: true,
            mediaUrl: true,
            createdAt: true,
          },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Authorization check
    if (conversation.hostUserId !== user.id && conversation.seekerUserId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Conversation detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
