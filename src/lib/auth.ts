import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.isActive) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub
        session.user.role = token.role
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/signin",
  }
}

// types/next-auth.d.ts
import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: string
    }
  }

  interface User {
    role: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
  }
}

// lib/permissions.ts
export type Role = 'FRONT_OFFICE' | 'ACCOUNTING' | 'MARKETING' | 'SUPERVISOR' | 'OWNER'

export type Permission = 
  | 'members:read' | 'members:write'
  | 'member_transactions:read' | 'member_transactions:write'
  | 'member_absences:read' | 'member_absences:write'
  | 'company_transactions:read' | 'company_transactions:write'
  | 'campaigns:read' | 'campaigns:write'
  | 'campaign_logs:read' | 'campaign_logs:write'
  | 'analytics:read'
  | 'activity_logs:read'

export const rolePermissions: Record<Role, Permission[]> = {
  FRONT_OFFICE: [
    'members:read', 'members:write',
    'member_transactions:read', 'member_transactions:write',
    'member_absences:read', 'member_absences:write'
  ],
  ACCOUNTING: [
    'company_transactions:read', 'company_transactions:write'
  ],
  MARKETING: [
    'campaigns:read', 'campaigns:write',
    'campaign_logs:read', 'campaign_logs:write'
  ],
  SUPERVISOR: [
    'members:read', 'member_transactions:read', 'member_absences:read',
    'company_transactions:read', 'campaigns:read', 'campaign_logs:read'
  ],
  OWNER: [
    'members:read', 'members:write',
    'member_transactions:read', 'member_transactions:write',
    'member_absences:read', 'member_absences:write',
    'company_transactions:read', 'company_transactions:write',
    'campaigns:read', 'campaigns:write',
    'campaign_logs:read', 'campaign_logs:write',
    'analytics:read', 'activity_logs:read'
  ]
}

export function hasPermission(userRole: Role, permission: Permission): boolean {
  return rolePermissions[userRole]?.includes(permission) || false
}

export function canWrite(userRole: Role, resource: string): boolean {
  return hasPermission(userRole, `${resource}:write` as Permission)
}

export function canRead(userRole: Role, resource: string): boolean {
  return hasPermission(userRole, `${resource}:read` as Permission)
}

// hooks/useAuth.ts
import { useSession } from "next-auth/react"
import { hasPermission, canWrite, canRead, type Role, type Permission } from "@/lib/permissions"

export function useAuth() {
  const { data: session, status } = useSession()

  return {
    user: session?.user,
    isLoading: status === "loading",
    isAuthenticated: !!session,
    role: session?.user?.role as Role,
    hasPermission: (permission: Permission) => 
      session?.user?.role ? hasPermission(session.user.role as Role, permission) : false,
    canWrite: (resource: string) => 
      session?.user?.role ? canWrite(session.user.role as Role, resource) : false,
    canRead: (resource: string) => 
      session?.user?.role ? canRead(session.user.role as Role, resource) : false,
  }
}

// middleware.ts
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
        FRONT_OFFICE: ['/dashboard/members', '/dashboard/transactions', '/dashboard/absences'],
        ACCOUNTING: ['/dashboard/company-transactions'],
        MARKETING: ['/dashboard/campaigns', '/dashboard/campaign-logs'],
        SUPERVISOR: ['/dashboard/members', '/dashboard/transactions', '/dashboard/absences', 
                    '/dashboard/company-transactions', '/dashboard/campaigns', '/dashboard/campaign-logs'],
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