// POST /api/verification/submit - Submit KYC verification
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

const submitSchema = z.object({
  legalName: z.string().min(2),
  dateOfBirth: z.string(),
  idType: z.string(),
  idNumber: z.string().min(3),
  artifacts: z.array(
    z.object({
      type: z.string(),
      uri: z.string(),
    })
  ),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = submitSchema.parse(body)

    // Check if there's already a pending verification
    const existing = await prisma.verificationRequest.findFirst({
      where: { userId: user.id, status: 'PENDING' },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'You already have a pending verification request' },
        { status: 400 }
      )
    }

    // Create or update verification request
    const verification = await prisma.verificationRequest.create({
      data: {
        userId: user.id,
        level: 'STANDARD',
        status: 'PENDING',
        submittedAt: new Date(),
        providerRef: `manual_${Date.now()}`, // In production: integrate with KYC provider
      },
    })

    // Store artifacts (encrypted references in production)
    for (const artifact of data.artifacts) {
      await prisma.verificationArtifact.create({
        data: {
          verificationRequestId: verification.id,
          artifactType: artifact.type,
          secureUri: artifact.uri, // In production: encrypted/tokenized
        },
      })
    }

    return NextResponse.json({
      message: 'Verification submitted successfully',
      verificationId: verification.id,
      status: 'PENDING',
    })
  } catch (error: any) {
    console.error('Verification submit error:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
