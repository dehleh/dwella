// GET /api/matches/recommended - Get personalized listing recommendations
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verify } from 'jsonwebtoken'
import { calculateMatchScore, applyHardConstraints } from '@/lib/matching'

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  
  const token = authHeader.substring(7)
  try {
    return verify(token, process.env.NEXTAUTH_SECRET || 'dev-secret') as any
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get user preferences
    const preferences = await prisma.preferences.findUnique({
      where: { userId: user.userId }
    })
    
    if (!preferences) {
      return NextResponse.json(
        { error: 'Please complete your preferences first' },
        { status: 400 }
      )
    }
    
    // Get published listings
    let listings = await prisma.listing.findMany({
      where: {
        status: 'PUBLISHED',
        hostUserId: { not: user.userId } // Don't show own listings
      },
      include: {
        host: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
                photos: true
              }
            },
            verificationRequests: {
              where: { status: 'APPROVED' },
              take: 1,
              select: { level: true, status: true }
            }
          }
        }
      }
    })
    
    // Apply hard constraints first
    const filteredListings = applyHardConstraints(listings as any, preferences) as typeof listings
    
    // Calculate match scores
    const matches = filteredListings.map(listing => {
      const matchScore = calculateMatchScore(preferences, listing as any)
      return {
        listing,
        score: matchScore.score,
        reasons: matchScore.reasons
      }
    })
    
    // Sort by score descending
    matches.sort((a, b) => b.score - a.score)
    
    // Pagination
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    const total = matches.length
    const paginatedMatches = matches.slice((page - 1) * limit, page * limit)
    
    return NextResponse.json({
      matches: paginatedMatches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
    
  } catch (error) {
    console.error('Recommended matches error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
