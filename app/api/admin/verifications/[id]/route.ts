// PATCH /api/admin/verifications/[id] - Approve or reject verification
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import { sendVerificationStatusEmail } from '@/lib/email'
import { sendVerificationStatusSms } from '@/lib/sms'
import { notifyVerificationStatus } from '@/lib/notifications'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user: admin, error } = await requireAdmin(request)
  if (error) return error

  try {
    const verification = await prisma.verificationRequest.findUnique({
      where: { id: params.id },
      include: { user: { select: { id: true, email: true } } },
    })
    if (!verification) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await request.json()
    const { decision, reasonCode, note } = body

    if (!['APPROVED', 'REJECTED'].includes(decision)) {
      return NextResponse.json({ error: 'decision must be APPROVED or REJECTED' }, { status: 400 })
    }

    const updated = await prisma.verificationRequest.update({
      where: { id: params.id },
      data: {
        status: decision,
        decidedAt: new Date(),
        decisionReasonCode: reasonCode || null,
        decisionNote: note || null,
      },
    })

    // Log admin action
    await prisma.adminActionLog.create({
      data: {
        adminUserId: admin!.id,
        action: `VERIFICATION_${decision}`,
        targetType: 'VerificationRequest',
        targetId: params.id,
        metadata: { userId: verification.userId, reasonCode, note },
      },
    })

    // Send notification email/SMS (fire-and-forget)
    const profile = await prisma.userProfile.findUnique({ where: { userId: verification.userId } })
    const targetUser = await prisma.user.findUnique({ where: { id: verification.userId } })
    const displayName = profile?.displayName || 'there'
    if (targetUser?.email) {
      sendVerificationStatusEmail(targetUser.email, displayName, decision, note || undefined).catch(() => {})
    }
    if (targetUser?.phone) {
      sendVerificationStatusSms(targetUser.phone, decision).catch(() => {})
    }

    // In-app notification
    notifyVerificationStatus(verification.userId, decision, note || undefined).catch(() => {})

    return NextResponse.json({ message: `Verification ${decision.toLowerCase()}`, verification: updated })
  } catch (error) {
    console.error('Admin verify error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
