// POST /api/conversations/[id]/messages - Send a message
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { sendNewMessageEmail } from '@/lib/email'
import { notifyNewMessage } from '@/lib/notifications'

// Simple rate limiting (in-memory for MVP)
const rateLimits = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 20 // 20 messages per minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const timestamps = rateLimits.get(userId) || []
  const recent = timestamps.filter(t => t > now - RATE_LIMIT_WINDOW)
  rateLimits.set(userId, recent)
  if (recent.length >= RATE_LIMIT_MAX) return false
  recent.push(now)
  return true
}

// Suspicious content patterns
const SUSPICIOUS_PATTERNS = [
  /pay\s*(me|us)\s*(outside|directly|into|to)/i,
  /\b(western\s*union|moneygram)\b/i,
  /send\s*money\s*(to|via)/i,
  /account\s*number/i,
  /\b(bitcoin|btc|usdt|crypto)\b/i,
]

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Rate limit
    if (!checkRateLimit(user.id)) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please wait.' }, { status: 429 })
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    if (conversation.hostUserId !== user.id && conversation.seekerUserId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (conversation.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Conversation is closed or blocked' }, { status: 400 })
    }

    const { body, messageType = 'TEXT', mediaUrl } = await request.json()

    if (!body && !mediaUrl) {
      return NextResponse.json({ error: 'Message body or media is required' }, { status: 400 })
    }

    // Check for suspicious content
    let flagged = false
    if (body) {
      for (const pattern of SUSPICIOUS_PATTERNS) {
        if (pattern.test(body)) {
          flagged = true
          break
        }
      }
    }

    const message = await prisma.message.create({
      data: {
        conversationId: params.id,
        senderUserId: user.id,
        messageType: messageType === 'IMAGE' ? 'IMAGE' : 'TEXT',
        body: body || null,
        mediaUrl: mediaUrl || null,
      },
    })

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    })

    // Send email notification to the other party (fire-and-forget, throttled)
    const recipientId = conversation.hostUserId === user.id ? conversation.seekerUserId : conversation.hostUserId
    const [recipient, senderProfile, conversationWithListing] = await Promise.all([
      prisma.user.findUnique({ where: { id: recipientId }, include: { profile: true } }),
      prisma.userProfile.findUnique({ where: { userId: user.id } }),
      prisma.conversation.findUnique({ where: { id: params.id }, include: { listing: { select: { neighborhood: true } } } }),
    ])
    if (recipient?.email && conversationWithListing) {
      sendNewMessageEmail(
        recipient.email,
        recipient.profile?.displayName || 'there',
        senderProfile?.displayName || 'Someone',
        conversationWithListing.listing.neighborhood,
        params.id
      ).catch(() => {})
    }

    // In-app notification
    if (conversationWithListing) {
      notifyNewMessage(
        recipientId,
        senderProfile?.displayName || 'Someone',
        conversationWithListing.listing.neighborhood,
        params.id
      ).catch(() => {})
    }

    return NextResponse.json({
      ...message,
      safetyWarning: flagged ? '⚠️ Reminder: Never pay or share financial details outside Dwella.' : undefined,
    }, { status: 201 })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
