// GET /api/profiles/me - Get current user profile
// PATCH /api/profiles/me - Update current user profile
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { profileSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } })
    if (!profile) {
      return NextResponse.json({
        displayName: '',
        bio: '',
        occupation: '',
        neighborhood: '',
        city: '',
        photos: [],
      })
    }

    return NextResponse.json({
      displayName: profile.displayName,
      bio: profile.bio || '',
      occupation: profile.occupation || '',
      neighborhood: profile.neighborhood || '',
      city: profile.city || '',
      photos: profile.photos || [],
    })
  } catch (error) {
    console.error('Profile GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = profileSchema.parse(body)

    const profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        displayName: data.displayName,
        bio: data.bio,
        occupation: data.occupation,
        neighborhood: data.neighborhood,
        city: data.city,
      },
      create: {
        userId: user.id,
        displayName: data.displayName,
        bio: data.bio,
        occupation: data.occupation,
        neighborhood: data.neighborhood,
        city: data.city,
      },
    })

    return NextResponse.json({
      displayName: profile.displayName,
      bio: profile.bio,
      occupation: profile.occupation,
      neighborhood: profile.neighborhood,
      city: profile.city,
      photos: profile.photos,
    })
  } catch (error: any) {
    console.error('Profile PATCH error:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
