// PATCH /api/admin/verifications/[id] - Approve or reject verification
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

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

    return NextResponse.json({ message: `Verification ${decision.toLowerCase()}`, verification: updated })
  } catch (error) {
    console.error('Admin verify error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
