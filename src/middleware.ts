// src/middleware.ts
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Protect dashboard routes
    if (pathname.startsWith('/dashboard')) {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
      }

      // Role-based route protection
      const role = token.role as string

      // Analytics route - only for OWNER
      if (pathname.startsWith('/dashboard/analytics') && role !== 'OWNER') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }

      // Staff logs route - only for OWNER
      if (pathname.startsWith('/dashboard/staff-logs') && role !== 'OWNER') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }

      // Role-specific dashboard access
      const roleRoutes = {
        FRONT_OFFICE: ['/dashboard/members', '/dashboard/member-tx', '/dashboard/absences'],
        ACCOUNTING: ['/dashboard/company-tx'],
        MARKETING: ['/dashboard/campaigns', '/dashboard/campaign-logs'],
        SUPERVISOR: ['/dashboard/members', '/dashboard/member-tx', '/dashboard/absences', 
                    '/dashboard/company-tx', '/dashboard/campaigns', '/dashboard/campaign-logs'],
        OWNER: [] // Can access all routes
      }

      if (role !== 'OWNER' && role !== 'SUPERVISOR') {
        const allowedRoutes = roleRoutes[role as keyof typeof roleRoutes] || []
        const isAllowedRoute = allowedRoutes.some(route => pathname.startsWith(route))
        
        if (!isAllowedRoute && pathname !== '/dashboard') {
          return NextResponse.redirect(new URL('/dashboard', req.url))
        }
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth pages without token
        if (req.nextUrl.pathname.startsWith('/auth')) {
          return true
        }
        
        // Require token for dashboard
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
          return !!token
        }
        
        return true
      }
    }
  }
)

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*']
}