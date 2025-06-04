"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
  Home,
  ChevronRight,
  Building2,
  Calculator,
  TrendingUp,
  Shield,
  Crown
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
}

interface NavCategory {
  title: string
  icon: React.ComponentType<{ className?: string }>
  items: NavItem[]
  roles: string[]
}

const navCategories: NavCategory[] = [
  {
    title: "Front Office",
    icon: Building2,
    roles: ["FRONT_OFFICE", "SUPERVISOR", "OWNER"],
    items: [
      {
        title: "Members",
        href: "/dashboard/members",
        icon: Users,
        roles: ["FRONT_OFFICE", "SUPERVISOR", "OWNER"]
      },
      {
        title: "Member Transactions",
        href: "/dashboard/member-tx",
        icon: CreditCard,
        roles: ["FRONT_OFFICE", "SUPERVISOR", "OWNER"]
      },
      {
        title: "Member Absences",
        href: "/dashboard/absences",
        icon: Calendar,
        roles: ["FRONT_OFFICE", "SUPERVISOR", "OWNER"]
      }
    ]
  },
  {
    title: "Accounting",
    icon: Calculator,
    roles: ["ACCOUNTING", "SUPERVISOR", "OWNER"],
    items: [
      {
        title: "Company Transactions",
        href: "/dashboard/company-tx",
        icon: DollarSign,
        roles: ["ACCOUNTING", "SUPERVISOR", "OWNER"]
      }
    ]
  },
  {
    title: "Marketing",
    icon: TrendingUp,
    roles: ["MARKETING", "SUPERVISOR", "OWNER"],
    items: [
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
      }
    ]
  },
  {
    title: "Management",
    icon: Crown,
    roles: ["OWNER"],
    items: [
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
  }
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, role, isLoading } = useAuth()
  // Add this right after the useAuth line for debugging
console.log("Debug - useAuth data:", { user, role, isLoading })
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [expandedCategories, setExpandedCategories] = React.useState<string[]>([])

  React.useEffect(() => {
    // Auto-expand category containing current page
    const activeCategory = navCategories.find(cat =>
      cat.items.some(item => pathname === item.href)
    )
    if (activeCategory) {
      setExpandedCategories([activeCategory.title])
    }
  }, [pathname])

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  const filteredCategories = navCategories.filter(category => 
    category.roles.includes(role || "")
  )

  const toggleCategory = (categoryTitle: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryTitle)
        ? prev.filter(t => t !== categoryTitle)
        : [...prev, categoryTitle]
    )
  }

  const roleInfo = {
    FRONT_OFFICE: { label: "Front Office", color: "bg-blue-500" },
    ACCOUNTING: { label: "Accounting", color: "bg-green-500" },
    MARKETING: { label: "Marketing", color: "bg-purple-500" },
    SUPERVISOR: { label: "Supervisor", color: "bg-orange-500" },
    OWNER: { label: "Owner", color: "bg-red-500" }
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <aside
          className={cn(
            "relative flex h-full flex-col border-r bg-white transition-all duration-300",
            isCollapsed ? "w-16" : "w-64"
          )}
        >
          {/* Logo and Toggle */}
          <div className="flex h-14 items-center justify-between border-b px-3">
            {!isCollapsed && (
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Shield className="h-5 w-5" />
                </div>
                <span className="text-lg font-semibold">GymDash</span>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", isCollapsed && "mx-auto")}
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <div className="space-y-4">
              {/* Dashboard Home */}
              <div className="space-y-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href="/dashboard"
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        pathname === "/dashboard"
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                        isCollapsed && "justify-center px-2"
                      )}
                    >
                      <Home className="h-4 w-4 shrink-0" />
                      {!isCollapsed && <span>Dashboard</span>}
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">Dashboard</TooltipContent>
                  )}
                </Tooltip>
              </div>

              {/* Categories */}
              {filteredCategories.map((category) => {
                const isExpanded = expandedCategories.includes(category.title)
                const hasActiveItem = category.items.some(item => pathname === item.href)

                return (
                  <div key={category.title} className="space-y-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => !isCollapsed && toggleCategory(category.title)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            hasActiveItem
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                            isCollapsed && "justify-center px-2"
                          )}
                        >
                          <category.icon className="h-4 w-4 shrink-0" />
                          {!isCollapsed && (
                            <>
                              <span className="flex-1 text-left">{category.title}</span>
                              <ChevronRight
                                className={cn(
                                  "h-4 w-4 transition-transform",
                                  isExpanded && "rotate-90"
                                )}
                              />
                            </>
                          )}
                        </button>
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent side="right">{category.title}</TooltipContent>
                      )}
                    </Tooltip>

                    {/* Category Items */}
                    {!isCollapsed && isExpanded && (
                      <div className="ml-4 space-y-1 border-l pl-3">
                        {category.items
                          .filter(item => item.roles.includes(role || ""))
                          .map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                                pathname === item.href
                                  ? "bg-primary text-primary-foreground"
                                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                              )}
                            >
                              <item.icon className="h-4 w-4 shrink-0" />
                              <span>{item.title}</span>
                            </Link>
                          ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>

          {/* User Section */}
          <div className="border-t p-3">
            {!isCollapsed ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-2">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white",
                      roleInfo[role as keyof typeof roleInfo]?.color
                    )}
                  >
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium">{user?.name}</p>
                    <p className="truncate text-xs text-gray-500">
                      {roleInfo[role as keyof typeof roleInfo]?.label}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mx-auto h-8 w-8"
                    onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Sign out</TooltipContent>
              </Tooltip>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <header className="flex h-14 items-center border-b bg-white px-6">
            <h1 className="text-lg font-semibold">
              {navCategories
                .flatMap(cat => cat.items)
                .find(item => item.href === pathname)?.title || "Dashboard"}
            </h1>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  )
}