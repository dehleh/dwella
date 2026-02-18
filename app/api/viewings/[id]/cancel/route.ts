// POST /api/viewings/[id]/cancel - Cancel a viewing (either party)
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

    // Either party can cancel
    if (viewing.hostUserId !== user.id && viewing.seekerUserId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (viewing.status === 'CANCELLED' || viewing.status === 'COMPLETED') {
      return NextResponse.json({ error: `Cannot cancel from status ${viewing.status}` }, { status: 400 })
    }

    const updated = await prisma.viewing.update({
      where: { id: params.id },
      data: { status: 'CANCELLED' },
    })

    return NextResponse.json({ message: 'Viewing cancelled', viewing: updated })
  } catch (error) {
    console.error('Cancel viewing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
