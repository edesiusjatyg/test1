// src/hooks/useAuth.ts
"use client"

import { useSession } from "next-auth/react"
import { hasPermission, canWrite, canRead, type Role, type Permission } from "@/lib/permissions"

const skipAuth = process.env.NEXT_PUBLIC_SKIP_AUTH === 'true'

export function useAuth() {
  const { data: session, status } = useSession()

  // Mock session in development
  if (skipAuth) {
    console.log("Using mock auth data")
    const mockUser = {
      id: "1",
      name: "Demo Owner", 
      email: "owner@gym.com",
      role: "OWNER" as Role
    }

    return {
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      role: "OWNER" as Role,
      hasPermission: (permission: Permission) => hasPermission("OWNER", permission),
      canWrite: (resource: string) => canWrite("OWNER", resource),
      canRead: (resource: string) => canRead("OWNER", resource),
    }
  }

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