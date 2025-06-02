// src/hooks/useAuth.ts
"use client"

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