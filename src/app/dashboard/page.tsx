"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/components/ui/use-toast"
import { 
  Users, DollarSign, TrendingUp, Calendar,
  Activity, Target, Award, AlertCircle
} from "lucide-react"

interface DashboardStats {
  totalMembers: number
  activeMembers: number
  monthlyRevenue: number
  pendingPayments: number
  todayCheckIns: number
  upcomingEvents: number
  activeCampaigns: number
  conversionRate: number
}

export default function DashboardPage() {
  const { user, role } = useAuth()
  const { toast } = useToast()
  const [stats, setStats] = React.useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/dashboard/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  const roleSpecificCards = {
    FRONT_OFFICE: [
      {
        title: "Total Members",
        value: stats?.totalMembers || 0,
        description: "Active gym members",
        icon: Users,
        trend: "+12%",
        trendUp: true
      },
      {
        title: "Today's Check-ins",
        value: stats?.todayCheckIns || 0,
        description: "Members checked in today",
        icon: Activity,
        trend: "+5%",
        trendUp: true
      },
      {
        title: "Pending Payments",
        value: stats?.pendingPayments || 0,
        description: "Payments due this week",
        icon: AlertCircle,
        trend: "-8%",
        trendUp: false
      }
    ],
    ACCOUNTING: [
      {
        title: "Monthly Revenue",
        value: `$${stats?.monthlyRevenue?.toLocaleString() || 0}`,
        description: "Total revenue this month",
        icon: DollarSign,
        trend: "+23%",
        trendUp: true
      },
      {
        title: "Pending Payments",
        value: stats?.pendingPayments || 0,
        description: "Outstanding payments",
        icon: AlertCircle,
        trend: "-8%",
        trendUp: false
      }
    ],
    MARKETING: [
      {
        title: "Active Campaigns",
        value: stats?.activeCampaigns || 0,
        description: "Running marketing campaigns",
        icon: Target,
        trend: "+2",
        trendUp: true
      },
      {
        title: "Conversion Rate",
        value: `${stats?.conversionRate || 0}%`,
        description: "Campaign conversion rate",
        icon: Award,
        trend: "+5%",
        trendUp: true
      }
    ],
    SUPERVISOR: [
      {
        title: "Total Members",
        value: stats?.totalMembers || 0,
        description: "Active gym members",
        icon: Users,
        trend: "+12%",
        trendUp: true
      },
      {
        title: "Monthly Revenue",
        value: `$${stats?.monthlyRevenue?.toLocaleString() || 0}`,
        description: "Total revenue this month",
        icon: DollarSign,
        trend: "+23%",
        trendUp: true
      },
      {
        title: "Active Campaigns",
        value: stats?.activeCampaigns || 0,
        description: "Running marketing campaigns",
        icon: Target,
        trend: "+2",
        trendUp: true
      }
    ],
    OWNER: [
      {
        title: "Total Members",
        value: stats?.totalMembers || 0,
        description: "Active gym members",
        icon: Users,
        trend: "+12%",
        trendUp: true
      },
      {
        title: "Monthly Revenue",
        value: `$${stats?.monthlyRevenue?.toLocaleString() || 0}`,
        description: "Total revenue this month",
        icon: DollarSign,
        trend: "+23%",
        trendUp: true
      },
      {
        title: "Active Members",
        value: stats?.activeMembers || 0,
        description: "Members this month",
        icon: Activity,
        trend: "+18%",
        trendUp: true
      },
      {
        title: "Conversion Rate",
        value: `${stats?.conversionRate || 0}%`,
        description: "Campaign conversion rate",
        icon: Award,
        trend: "+5%",
        trendUp: true
      }
    ]
  }

  const cards = roleSpecificCards[role as keyof typeof roleSpecificCards] || []

  const quickActions = {
    FRONT_OFFICE: [
      { title: "Add New Member", href: "/dashboard/members", icon: Users },
      { title: "Record Payment", href: "/dashboard/member-tx", icon: DollarSign },
      { title: "Mark Attendance", href: "/dashboard/absences", icon: Calendar }
    ],
    ACCOUNTING: [
      { title: "Add Transaction", href: "/dashboard/company-tx", icon: DollarSign },
      { title: "View Reports", href: "/dashboard/company-tx", icon: TrendingUp }
    ],
    MARKETING: [
      { title: "Create Campaign", href: "/dashboard/campaigns", icon: Target },
      { title: "Log Activity", href: "/dashboard/campaign-logs", icon: Activity }
    ],
    SUPERVISOR: [
      { title: "View Members", href: "/dashboard/members", icon: Users },
      { title: "View Transactions", href: "/dashboard/company-tx", icon: DollarSign },
      { title: "View Campaigns", href: "/dashboard/campaigns", icon: Target }
    ],
    OWNER: [
      { title: "View Analytics", href: "/dashboard/analytics", icon: TrendingUp },
      { title: "Staff Activity", href: "/dashboard/staff-logs", icon: Activity },
      { title: "Add Member", href: "/dashboard/members", icon: Users },
      { title: "Financial Report", href: "/dashboard/company-tx", icon: DollarSign }
    ]
  }

  const actions = quickActions[role as keyof typeof quickActions] || []

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          {getGreeting()}, {user?.name}!
        </h2>
        <p className="text-muted-foreground">
          Here's what's happening at your gym today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
              <div className="mt-2 flex items-center text-xs">
                <TrendingUp className={cn(
                  "mr-1 h-3 w-3",
                  card.trendUp ? "text-green-600" : "text-red-600"
                )} />
                <span className={cn(
                  "font-medium",
                  card.trendUp ? "text-green-600" : "text-red-600"
                )}>
                  {card.trend}
                </span>
                <span className="ml-1 text-muted-foreground">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Quick Actions</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {actions.map((action, index) => (
            <a
              key={index}
              href={action.href}
              className="group relative overflow-hidden rounded-lg border bg-white p-6 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                  <action.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{action.title}</p>
                  <p className="text-sm text-muted-foreground">Click to proceed</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest actions in your accessible modules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">
                  New member registration
                </p>
                <p className="text-sm text-muted-foreground">
                  John Doe joined as a premium member
                </p>
              </div>
              <div className="ml-auto text-sm text-muted-foreground">
                2 hours ago
              </div>
            </div>
            <div className="flex items-center">
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">
                  Payment received
                </p>
                <p className="text-sm text-muted-foreground">
                  Monthly subscription from Sarah Johnson
                </p>
              </div>
              <div className="ml-auto text-sm text-muted-foreground">
                5 hours ago
              </div>
            </div>
            <div className="flex items-center">
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">
                  Campaign launched
                </p>
                <p className="text-sm text-muted-foreground">
                  Summer fitness challenge started
                </p>
              </div>
              <div className="ml-auto text-sm text-muted-foreground">
                1 day ago
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}