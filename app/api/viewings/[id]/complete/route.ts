// POST /api/viewings/[id]/complete - Host marks viewing as completed or no-show
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

    const viewing = await prisma.viewing.findUnique({ where: { id: params.id } })
    if (!viewing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (viewing.hostUserId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (viewing.status !== 'CONFIRMED') {
      return NextResponse.json({ error: `Cannot complete from status ${viewing.status}` }, { status: 400 })
    }

    const body = await request.json()
    const { outcome } = body // 'COMPLETED' or 'NO_SHOW'

    if (!['COMPLETED', 'NO_SHOW'].includes(outcome)) {
      return NextResponse.json({ error: 'outcome must be COMPLETED or NO_SHOW' }, { status: 400 })
    }

    const updated = await prisma.viewing.update({
      where: { id: params.id },
      data: { status: outcome },
    })

    return NextResponse.json({ message: `Viewing marked as ${outcome.toLowerCase()}`, viewing: updated })
  } catch (error) {
    console.error('Complete viewing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
