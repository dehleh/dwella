// Authentication utilities
import { compare, hash } from 'bcryptjs'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword)
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        phone: { label: 'Phone', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.password || (!credentials.email && !credentials.phone)) {
          return null
        }
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              ...(credentials.email ? [{ email: credentials.email }] : []),
              ...(credentials.phone ? [{ phone: credentials.phone }] : []),
            ],
            status: { not: 'BANNED' },
          },
          include: {
            profile: true,
            verificationRequests: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        })
        if (!user || !user.passwordHash) return null

        const isValid = await verifyPassword(credentials.password, user.passwordHash)
        if (!isValid) return null

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        const roles = user.roles as { host?: boolean; seeker?: boolean; admin?: boolean }
        const verificationStatus = user.verificationRequests[0]?.status || 'NOT_STARTED'

        return {
          id: user.id,
          email: user.email,
          name: user.profile?.displayName || user.email || user.phone || 'User',
          roles,
          status: user.status,
          verificationStatus,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.roles = (user as any).roles
        token.status = (user as any).status
        token.verificationStatus = (user as any).verificationStatus
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string
        ;(session.user as any).roles = token.roles
        ;(session.user as any).status = token.status
        ;(session.user as any).verificationStatus = token.verificationStatus
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// Helper to get authenticated user in API routes
import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'
import { verify } from 'jsonwebtoken'

export async function getAuthUser(request?: NextRequest) {
  // Try NextAuth session first
  const session = await getServerSession(authOptions)
  if (session?.user) {
    return session.user as {
      id: string
      email?: string | null
      roles: { host?: boolean; seeker?: boolean; admin?: boolean }
      status: string
      verificationStatus: string
    }
  }

  // Fallback: Bearer token (for API clients)
  if (request) {
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const decoded = verify(
          authHeader.substring(7),
          process.env.NEXTAUTH_SECRET || 'dev-secret'
        ) as any
        return {
          id: decoded.userId,
          email: decoded.email,
          roles: decoded.roles,
          status: 'ACTIVE',
          verificationStatus: decoded.verificationStatus || 'NOT_STARTED',
        }
      } catch {
        return null
      }
    }
  }

  return null
}
