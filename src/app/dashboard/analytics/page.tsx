"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/components/ui/use-toast"
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts"
import { 
  Users, DollarSign, TrendingUp, TrendingDown, 
  Calendar, Activity, Target, Award 
} from "lucide-react"

interface AnalyticsData {
  memberStats: {
    total: number
    active: number
    inactive: number
    newThisMonth: number
    growthPercentage: number
  }
  revenueStats: {
    totalRevenue: number
    totalExpenses: number
    netProfit: number
    revenueGrowth: number
    topCategories: Array<{ name: string; value: number }>
  }
  membershipTrends: Array<{
    month: string
    newMembers: number
    cancelledMembers: number
    totalMembers: number
  }>
  revenueBreakdown: Array<{
    category: string
    amount: number
    percentage: number
  }>
  campaignPerformance: Array<{
    name: string
    reach: number
    engagement: number
    conversions: number
  }>
}

export default function AnalyticsPage() {
  const { role } = useAuth()
  const { toast } = useToast()
  const [timeRange, setTimeRange] = React.useState("last30days")
  const [isLoading, setIsLoading] = React.useState(true)
  const [analyticsData, setAnalyticsData] = React.useState<AnalyticsData | null>(null)

  React.useEffect(() => {
    if (role !== 'OWNER') {
      window.location.href = '/dashboard'
      return
    }
    loadAnalytics()
  }, [role, timeRange])

  const loadAnalytics = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/analytics?range=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load analytics",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || !analyticsData) {
    return <div className="flex h-screen items-center justify-center">Loading analytics...</div>
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive overview of your gym's performance
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last7days">Last 7 days</SelectItem>
            <SelectItem value="last30days">Last 30 days</SelectItem>
            <SelectItem value="last90days">Last 90 days</SelectItem>
            <SelectItem value="last12months">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.memberStats.total}</div>
            <p className="text-xs text-muted-foreground">
              <span className={analyticsData.memberStats.growthPercentage >= 0 ? "text-green-600" : "text-red-600"}>
                {analyticsData.memberStats.growthPercentage >= 0 ? "+" : ""}
                {analyticsData.memberStats.growthPercentage}%
              </span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analyticsData.revenueStats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className={analyticsData.revenueStats.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                {analyticsData.revenueStats.revenueGrowth >= 0 ? "+" : ""}
                {analyticsData.revenueStats.revenueGrowth}%
              </span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analyticsData.revenueStats.netProfit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              After ${analyticsData.revenueStats.totalExpenses.toLocaleString()} expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.memberStats.active}</div>
            <p className="text-xs text-muted-foreground">
              {((analyticsData.memberStats.active / analyticsData.memberStats.total) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="membership" className="space-y-4">
        <TabsList>
          <TabsTrigger value="membership">Membership</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="membership" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Membership Trends</CardTitle>
              <CardDescription>
                Monthly overview of member acquisition and retention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={analyticsData.membershipTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="totalMembers" 
                    stackId="1"
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    name="Total Members"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="newMembers" 
                    stackId="2"
                    stroke="#82ca9d" 
                    fill="#82ca9d"
                    name="New Members" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cancelledMembers" 
                    stackId="2"
                    stroke="#ff7c7c" 
                    fill="#ff7c7c"
                    name="Cancelled" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>Revenue distribution by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.revenueBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {analyticsData.revenueBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Revenue Categories</CardTitle>
                <CardDescription>Highest performing revenue streams</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.revenueStats.topCategories}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>Marketing campaign effectiveness metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={analyticsData.campaignPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="reach" fill="#8884d8" name="Reach" />
                  <Bar dataKey="engagement" fill="#82ca9d" name="Engagement" />
                  <Bar dataKey="conversions" fill="#ffc658" name="Conversions" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}