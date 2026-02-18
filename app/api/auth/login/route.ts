// POST /api/auth/login - Authenticate user
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'
import { sign } from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = loginSchema.parse(body)
    
    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { phone: validatedData.phone }
        ],
        status: { not: 'BANNED' }
      },
      include: {
        profile: true,
        verificationRequests: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })
    
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(validatedData.password, user.passwordHash)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }
    
    // Check if suspended
    if (user.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'Account temporarily suspended' },
        { status: 403 }
      )
    }
    
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })
    
    // Generate JWT token (in production, use proper JWT secret)
    const token = sign(
      { 
        userId: user.id,
        email: user.email,
        phone: user.phone,
        roles: user.roles,
      },
      process.env.NEXTAUTH_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    )
    
    const verificationStatus = user.verificationRequests[0]?.status || 'NOT_STARTED'
    
    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        roles: user.roles,
        profile: user.profile,
        verificationStatus,
      }
    })
    
  } catch (error: any) {
    console.error('Login error:', error)
    
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
