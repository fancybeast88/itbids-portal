import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token as any
    const path  = req.nextUrl.pathname

    if (path.startsWith('/admin') && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/login?error=Unauthorized', req.url))
    }
    if (path.startsWith('/vendor') && token?.role !== 'vendor') {
      return NextResponse.redirect(new URL('/login?error=Unauthorized', req.url))
    }
    if (path.startsWith('/business') && token?.role !== 'business') {
      return NextResponse.redirect(new URL('/login?error=Unauthorized', req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/vendor/:path*',
    '/business/:path*',
  ],
}
