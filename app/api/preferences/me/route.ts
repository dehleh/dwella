// GET /api/preferences/me - Get current user preferences
// PUT /api/preferences/me - Update current user preferences
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { preferencesSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prefs = await prisma.preferences.findUnique({ where: { userId: user.id } })
    if (!prefs) {
      return NextResponse.json({
        hardConstraints: {},
        compatibility: {},
        dealbreakers: [],
      })
    }

    return NextResponse.json({
      hardConstraints: prefs.hardConstraints,
      compatibility: prefs.compatibility,
      dealbreakers: prefs.dealbreakers,
    })
  } catch (error) {
    console.error('Preferences GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = preferencesSchema.parse(body)

    const prefs = await prisma.preferences.upsert({
      where: { userId: user.id },
      update: {
        hardConstraints: data.hardConstraints as any,
        compatibility: data.compatibility as any,
      },
      create: {
        userId: user.id,
        hardConstraints: data.hardConstraints as any,
        compatibility: data.compatibility as any,
      },
    })

    return NextResponse.json({
      hardConstraints: prefs.hardConstraints,
      compatibility: prefs.compatibility,
      dealbreakers: prefs.dealbreakers,
    })
  } catch (error: any) {
    console.error('Preferences PUT error:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
