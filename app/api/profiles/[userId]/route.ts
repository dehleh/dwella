// GET /api/profiles/[userId] - Get public profile of a user
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: params.userId },
      include: {
        user: {
          select: {
            id: true,
            status: true,
            roles: true,
            verificationRequests: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { status: true },
            },
          },
        },
      },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const verificationStatus = profile.user.verificationRequests[0]?.status || 'NOT_STARTED'

    return NextResponse.json({
      userId: profile.userId,
      displayName: profile.displayName,
      bio: profile.bio,
      occupation: profile.occupation,
      neighborhood: profile.neighborhood,
      city: profile.city,
      photos: profile.photos,
      verified: verificationStatus === 'APPROVED',
      roles: profile.user.roles,
    })
  } catch (error) {
    console.error('Profile GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
