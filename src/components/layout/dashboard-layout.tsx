"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Users,
  CreditCard,
  Calendar,
  DollarSign,
  Megaphone,
  BookOpen,
  BarChart3,
  FileText,
  Menu,
  LogOut,
  Settings,
  User,
  Home
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
  badge?: string
}

const navigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    roles: ["FRONT_OFFICE", "ACCOUNTING", "MARKETING", "SUPERVISOR", "OWNER"]
  },
  {
    title: "Members",
    href: "/dashboard/members",
    icon: Users,
    roles: ["FRONT_OFFICE", "SUPERVISOR", "OWNER"]
  },
  {
    title: "Member Transactions",
    href: "/dashboard/member-transactions",
    icon: CreditCard,
    roles: ["FRONT_OFFICE", "SUPERVISOR", "OWNER"]
  },
  {
    title: "Member Absences",
    href: "/dashboard/member-absences",
    icon: Calendar,
    roles: ["FRONT_OFFICE", "SUPERVISOR", "OWNER"]
  },
  {
    title: "Company Transactions",
    href: "/dashboard/company-transactions",
    icon: DollarSign,
    roles: ["ACCOUNTING", "SUPERVISOR", "OWNER"]
  },
  {
    title: "Campaigns",
    href: "/dashboard/campaigns",
    icon: Megaphone,
    roles: ["MARKETING", "SUPERVISOR", "OWNER"]
  },
  {
    title: "Campaign Logs",
    href: "/dashboard/campaign-logs",
    icon: BookOpen,
    roles: ["MARKETING", "SUPERVISOR", "OWNER"]
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    roles: ["OWNER"]
  },
  {
    title: "Staff Logs",
    href: "/dashboard/staff-logs",
    icon: FileText,
    roles: ["OWNER"]
  }
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, role, isLoading } = useAuth()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(role || "")
  )

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" })
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <div className="hidden w-64 bg-white shadow-lg lg:block">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center px-6">
            <h1 className="text-2xl font-bold text-gray-900">GymDash</h1>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3">
            <nav className="space-y-1 py-4">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 h-5 w-5 flex-shrink-0",
                        isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-500"
                      )}
                    />
                    {item.title}
                    {item.badge && (
                      <span className="ml-auto rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-600">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </ScrollArea>

          {/* User menu */}
          <div className="border-t p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start p-2">
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarImage src="" alt={user?.name} />
                    <AvatarFallback>
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-gray-500">{role?.replace('_', ' ')}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center px-6">
              <h1 className="text-2xl font-bold text-gray-900">GymDash</h1>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 px-3">
              <nav className="space-y-1 py-4">
                {filteredNavigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "mr-3 h-5 w-5 flex-shrink-0",
                          isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-500"
                        )}
                      />
                      {item.title}
                    </Link>
                  )
                })}
              </nav>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
              </Sheet>
              
              <div className="ml-4 lg:ml-0">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {navigation.find(item => item.href === pathname)?.title || "Dashboard"}
                </h1>
              </div>
            </div>

            {/* Mobile User Menu */}
            <div className="lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={user?.name} />
                      <AvatarFallback>
                        {user?.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-gray-500">{role?.replace('_', ' ')}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}