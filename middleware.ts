import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Admin routes require admin role
    if (path.startsWith('/admin')) {
      const roles = token?.roles as any
      if (!roles?.admin) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/listings/create',
    '/listings/:id/edit',
    '/listings/:id/unlock',
    '/messages/:path*',
    '/profile/:path*',
    '/verification/:path*',
    '/viewings/:path*',
    '/reports/:path*',
    '/admin/:path*',
  ],
}
