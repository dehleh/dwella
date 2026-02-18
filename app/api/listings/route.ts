// POST /api/listings - Create new listing (Host only)
// GET /api/listings - Browse/search listings
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { listingSchema } from '@/lib/validations'
import { verify } from 'jsonwebtoken'

// Helper to get user from token
async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.substring(7)
  try {
    const decoded = verify(token, process.env.NEXTAUTH_SECRET || 'dev-secret') as any
    return decoded
  } catch {
    return null
  }
}

// POST - Create listing
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user has host role
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      include: {
        verificationRequests: {
          where: { status: 'APPROVED' },
          take: 1
        }
      }
    })
    
    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    const roles = userData.roles as any
    if (!roles.host) {
      return NextResponse.json({ error: 'Host role required' }, { status: 403 })
    }
    
    // Check verification status
    if (userData.verificationRequests.length === 0) {
      return NextResponse.json(
        { error: 'Verification required to create listings' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const validatedData = listingSchema.parse(body)
    
    // Accept optional photos array (Cloudinary URLs)
    const photos = Array.isArray(body.photos) ? body.photos : []

    // Create listing
    const listing = await prisma.listing.create({
      data: {
        hostUserId: user.userId,
        city: validatedData.city,
        neighborhood: validatedData.neighborhood,
        priceMonthly: validatedData.priceMonthly,
        deposit: validatedData.deposit,
        roomType: validatedData.roomType,
        furnished: validatedData.furnished,
        utilitiesIncluded: validatedData.utilitiesIncluded,
        minStayMonths: validatedData.minStayMonths,
        availableFrom: new Date(validatedData.availableFrom),
        rules: validatedData.rules as any,
        photos: photos as any,
        status: 'DRAFT', // Must publish separately
      }
    })
    
    return NextResponse.json({
      message: 'Listing created successfully',
      listing,
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('Create listing error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Browse listings with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const city = searchParams.get('city')
    const neighborhood = searchParams.get('neighborhood')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const roomType = searchParams.get('roomType')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    // Build where clause
    const where: any = {
      status: 'PUBLISHED',
    }
    
    if (city) where.city = city
    if (neighborhood) where.neighborhood = neighborhood
    if (minPrice || maxPrice) {
      where.priceMonthly = {}
      if (minPrice) where.priceMonthly.gte = parseInt(minPrice)
      if (maxPrice) where.priceMonthly.lte = parseInt(maxPrice)
    }
    if (roomType) where.roomType = roomType
    
    // Get total count
    const total = await prisma.listing.count({ where })
    
    // Get listings
    const listings = await prisma.listing.findMany({
      where,
      include: {
        host: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
                photos: true,
              }
            },
            verificationRequests: {
              where: { status: 'APPROVED' },
              take: 1,
              select: { level: true, status: true }
            }
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({
      listings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
    
  } catch (error) {
    console.error('Browse listings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
