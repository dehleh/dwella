// In-app notifications helper
import { prisma } from '@/lib/prisma'

type NotificationType =
  | 'MESSAGE'
  | 'UNLOCK_REQUEST'
  | 'UNLOCK_APPROVED'
  | 'UNLOCK_DECLINED'
  | 'PAYMENT_RECEIVED'
  | 'VERIFICATION_APPROVED'
  | 'VERIFICATION_REJECTED'
  | 'VIEWING_PROPOSED'
  | 'VIEWING_CONFIRMED'
  | 'VIEWING_CANCELLED'
  | 'REPORT_UPDATE'
  | 'SYSTEM'

interface CreateNotificationInput {
  userId: string
  type: NotificationType
  title: string
  body: string
  linkUrl?: string
  metadata?: Record<string, any>
}

/**
 * Create a single in-app notification
 */
export async function createNotification(input: CreateNotificationInput) {
  try {
    return await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        linkUrl: input.linkUrl || null,
        metadata: input.metadata || {},
      },
    })
  } catch (err) {
    console.error('[Notification] Failed to create:', err)
    return null
  }
}

/**
 * Create notifications for multiple users at once
 */
export async function createNotifications(inputs: CreateNotificationInput[]) {
  try {
    return await prisma.notification.createMany({
      data: inputs.map((input) => ({
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        linkUrl: input.linkUrl || null,
        metadata: input.metadata || {},
      })),
    })
  } catch (err) {
    console.error('[Notification] Failed to create batch:', err)
    return null
  }
}

// ── Notification shortcuts ──

export function notifyNewMessage(
  recipientId: string,
  senderName: string,
  listingNeighborhood: string,
  conversationId: string
) {
  return createNotification({
    userId: recipientId,
    type: 'MESSAGE',
    title: 'New message',
    body: `${senderName} sent you a message about the room in ${listingNeighborhood}`,
    linkUrl: `/messages/${conversationId}`,
  })
}

export function notifyUnlockRequest(
  hostId: string,
  seekerName: string,
  listingNeighborhood: string
) {
  return createNotification({
    userId: hostId,
    type: 'UNLOCK_REQUEST',
    title: 'Unlock request received',
    body: `${seekerName} wants to unlock contact details for your room in ${listingNeighborhood}`,
    linkUrl: '/dashboard',
  })
}

export function notifyUnlockApproved(
  seekerId: string,
  listingNeighborhood: string
) {
  return createNotification({
    userId: seekerId,
    type: 'UNLOCK_APPROVED',
    title: 'Unlock request approved',
    body: `Your unlock request for the room in ${listingNeighborhood} was approved! Proceed to payment.`,
    linkUrl: '/dashboard',
  })
}

export function notifyUnlockDeclined(
  seekerId: string,
  listingNeighborhood: string
) {
  return createNotification({
    userId: seekerId,
    type: 'UNLOCK_DECLINED',
    title: 'Unlock request declined',
    body: `Your unlock request for the room in ${listingNeighborhood} was declined.`,
    linkUrl: '/dashboard',
  })
}

export function notifyPaymentReceived(
  hostId: string,
  seekerName: string,
  amount: number
) {
  return createNotification({
    userId: hostId,
    type: 'PAYMENT_RECEIVED',
    title: 'Payment received',
    body: `${seekerName} has paid the unlock fee of ₦${amount.toLocaleString()}`,
    linkUrl: '/dashboard',
  })
}

export function notifyVerificationStatus(
  userId: string,
  status: 'APPROVED' | 'REJECTED',
  reason?: string
) {
  return createNotification({
    userId,
    type: status === 'APPROVED' ? 'VERIFICATION_APPROVED' : 'VERIFICATION_REJECTED',
    title: status === 'APPROVED' ? 'Identity verified!' : 'Verification update',
    body:
      status === 'APPROVED'
        ? 'Congratulations! Your identity has been verified. You now have full access to all features.'
        : `Your verification was not successful${reason ? `: ${reason}` : '. Please resubmit.'}`,
    linkUrl: status === 'APPROVED' ? '/dashboard' : '/verification',
  })
}

export function notifyViewingProposed(
  hostId: string,
  seekerName: string,
  listingNeighborhood: string
) {
  return createNotification({
    userId: hostId,
    type: 'VIEWING_PROPOSED',
    title: 'New viewing request',
    body: `${seekerName} wants to schedule a viewing for your room in ${listingNeighborhood}`,
    linkUrl: '/viewings',
  })
}

export function notifyViewingConfirmed(
  userId: string,
  listingNeighborhood: string,
  confirmedSlot: string
) {
  const dateStr = new Date(confirmedSlot).toLocaleDateString('en-NG', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return createNotification({
    userId,
    type: 'VIEWING_CONFIRMED',
    title: 'Viewing confirmed',
    body: `Viewing for ${listingNeighborhood} confirmed for ${dateStr}`,
    linkUrl: '/viewings',
  })
}

export function notifyViewingCancelled(
  userId: string,
  listingNeighborhood: string,
  cancelledBy: string
) {
  return createNotification({
    userId,
    type: 'VIEWING_CANCELLED',
    title: 'Viewing cancelled',
    body: `${cancelledBy} cancelled the viewing for ${listingNeighborhood}`,
    linkUrl: '/viewings',
  })
}
