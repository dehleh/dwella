// GET /api/listings/[id] - Get listing detail
// PATCH /api/listings/[id] - Update listing
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      include: {
        host: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
                bio: true,
                photos: true,
                occupation: true,
              },
            },
            verificationRequests: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { status: true },
            },
          },
        },
      },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const hostVerified = listing.host.verificationRequests[0]?.status === 'APPROVED'

    return NextResponse.json({
      id: listing.id,
      city: listing.city,
      neighborhood: listing.neighborhood,
      priceMonthly: listing.priceMonthly,
      deposit: listing.deposit,
      roomType: listing.roomType,
      furnished: listing.furnished,
      utilitiesIncluded: listing.utilitiesIncluded,
      minStayMonths: listing.minStayMonths,
      availableFrom: listing.availableFrom,
      rules: listing.rules,
      photos: listing.photos,
      status: listing.status,
      createdAt: listing.createdAt,
      host: {
        id: listing.host.id,
        profile: listing.host.profile,
        verified: hostVerified,
      },
    })
  } catch (error) {
    console.error('Listing detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const listing = await prisma.listing.findUnique({ where: { id: params.id } })
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }
    if (listing.hostUserId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const updateData: any = {}

    // Whitelist updatable fields
    const allowedFields = [
      'city', 'neighborhood', 'priceMonthly', 'deposit', 'roomType',
      'furnished', 'utilitiesIncluded', 'minStayMonths', 'availableFrom',
      'rules', 'photos',
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'availableFrom') {
          updateData[field] = new Date(body[field])
        } else {
          updateData[field] = body[field]
        }
      }
    }

    const updated = await prisma.listing.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Listing update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
