// GET /api/verification/status - Get current verification status
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const verification = await prisma.verificationRequest.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    if (!verification) {
      return NextResponse.json({ status: 'NOT_STARTED' })
    }

    return NextResponse.json({
      id: verification.id,
      status: verification.status,
      level: verification.level,
      submittedAt: verification.submittedAt,
      decidedAt: verification.decidedAt,
      decisionReasonCode: verification.decisionReasonCode,
      decisionNote: verification.decisionNote,
    })
  } catch (error) {
    console.error('Verification status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
