// POST /api/conversations/[id]/block - Block user in conversation
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

    const conversation = await prisma.conversation.findUnique({ where: { id: params.id } })
    if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

    if (conversation.hostUserId !== user.id && conversation.seekerUserId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const otherUserId = conversation.hostUserId === user.id
      ? conversation.seekerUserId
      : conversation.hostUserId

    // Create block
    await prisma.block.upsert({
      where: {
        blockerUserId_blockedUserId: { blockerUserId: user.id, blockedUserId: otherUserId },
      },
      create: {
        blockerUserId: user.id,
        blockedUserId: otherUserId,
        context: { conversationId: params.id, listingId: conversation.listingId },
      },
      update: {},
    })

    // Update conversation status
    await prisma.conversation.update({
      where: { id: params.id },
      data: { status: 'BLOCKED' },
    })

    return NextResponse.json({ message: 'User blocked successfully' })
  } catch (error) {
    console.error('Block user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
