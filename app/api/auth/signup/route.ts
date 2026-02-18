// POST /api/auth/signup - Create new user account
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { signupSchema } from '@/lib/validations'
import { sendWelcomeEmail } from '@/lib/email'
import { sendWelcomeSms } from '@/lib/sms'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Transform roles object from form into role string for validation
    if (body.roles && !body.role) {
      const { host, seeker } = body.roles
      if (host && seeker) body.role = 'both'
      else if (host) body.role = 'host'
      else if (seeker) body.role = 'seeker'
    }
    
    // Validate input
    const validatedData = signupSchema.parse(body)
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { phone: validatedData.phone }
        ]
      }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email or phone' },
        { status: 400 }
      )
    }
    
    // Hash password
    const passwordHash = await hashPassword(validatedData.password)
    
    // Create user with role
    const roles = {
      host: validatedData.role === 'host' || validatedData.role === 'both',
      seeker: validatedData.role === 'seeker' || validatedData.role === 'both'
    }
    
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        phone: validatedData.phone,
        passwordHash,
        roles: roles as any,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        phone: true,
        roles: true,
        createdAt: true,
      }
    })
    
    // Create initial verification request
    await prisma.verificationRequest.create({
      data: {
        userId: user.id,
        level: 'STANDARD',
        status: 'NOT_STARTED',
      }
    })

    // Send welcome email/SMS (fire-and-forget)
    const name = validatedData.email?.split('@')[0] || 'there'
    if (validatedData.email) {
      sendWelcomeEmail(validatedData.email, name).catch(() => {})
    }
    if (validatedData.phone) {
      sendWelcomeSms(validatedData.phone, name).catch(() => {})
    }
    
    return NextResponse.json({
      message: 'Account created successfully',
      user,
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('Signup error:', error)
    
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
