"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Calendar, User, Activity, FileText, Monitor } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/components/ui/use-toast"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ActivityLog {
  id: string
  user: {
    name: string
    email: string
  }
  role: string
  action: string
  entity: string
  entityId?: string
  details?: any
  ipAddress?: string
  userAgent?: string
  timestamp: Date
}

const actionLabels: Record<string, string> = {
  CREATE_MEMBER: "Created Member",
  UPDATE_MEMBER: "Updated Member",
  DELETE_MEMBER: "Deleted Member",
  CREATE_TRANSACTION: "Created Transaction",
  UPDATE_TRANSACTION: "Updated Transaction",
  DELETE_TRANSACTION: "Deleted Transaction",
  CREATE_CAMPAIGN: "Created Campaign",
  UPDATE_CAMPAIGN: "Updated Campaign",
  DELETE_CAMPAIGN: "Deleted Campaign",
}

export default function StaffLogsPage() {
  const { role } = useAuth()
  const { toast } = useToast()
  const [logs, setLogs] = React.useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [selectedUser, setSelectedUser] = React.useState<string>("all")
  const [selectedAction, setSelectedAction] = React.useState<string>("all")
  const [users, setUsers] = React.useState<Array<{ id: string; name: string }>>([])

  React.useEffect(() => {
    if (role !== 'OWNER') {
      window.location.href = '/dashboard'
      return
    }
    loadLogs()
    loadUsers()
  }, [role])

  const loadLogs = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (selectedUser !== "all") params.append("userId", selectedUser)
      if (selectedAction !== "all") params.append("action", selectedAction)

      const response = await fetch(`/api/activity-logs?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load activity logs",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Failed to load users")
    }
  }

  React.useEffect(() => {
    loadLogs()
  }, [selectedUser, selectedAction])

  const columns: ColumnDef<ActivityLog>[] = [
    {
      accessorKey: "timestamp",
      header: "Time",
      cell: ({ row }) => (
        <div className="flex items-center">
          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
          <div className="space-y-1">
            <div className="text-sm font-medium">
              {format(new Date(row.getValue("timestamp")), "MMM dd, yyyy")}
            </div>
            <div className="text-xs text-muted-foreground">
              {format(new Date(row.getValue("timestamp")), "HH:mm:ss")}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "user.name",
      header: "Staff Member",
      cell: ({ row }) => (
        <div className="flex items-center">
          <User className="mr-2 h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{row.original.user.name}</div>
            <div className="text-xs text-muted-foreground">{row.original.user.email}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.getValue<string>("role").replace('_', ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => {
        const action = row.getValue("action") as string
        return (
          <div className="flex items-center">
            <Activity className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {actionLabels[action] || action}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "entity",
      header: "Entity",
      cell: ({ row }) => (
        <div className="flex items-center">
          <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
          {row.getValue("entity")}
        </div>
      ),
    },
    {
      id: "details",
      header: "Details",
      cell: ({ row }) => {
        const details = row.original.details
        if (!details) return <span className="text-muted-foreground">-</span>
        
        return (
          <div className="max-w-[300px] truncate text-sm text-muted-foreground">
            {typeof details === 'object' 
              ? Object.entries(details).map(([key, value]) => `${key}: ${value}`).join(', ')
              : details
            }
          </div>
        )
      },
    },
    {
      accessorKey: "ipAddress",
      header: "IP Address",
      cell: ({ row }) => (
        <div className="flex items-center text-sm">
          <Monitor className="mr-2 h-4 w-4 text-muted-foreground" />
          {row.getValue("ipAddress") || "-"}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Actions Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter(log => 
                new Date(log.timestamp).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(logs.map(log => log.user.email)).size}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Common Action</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {logs.length > 0 
                ? actionLabels[
                    Object.entries(
                      logs.reduce((acc, log) => {
                        acc[log.action] = (acc[log.action] || 0) + 1
                        return acc
                      }, {} as Record<string, number>)
                    ).sort(([,a], [,b]) => b - a)[0]?.[0]
                  ] || "-"
                : "-"
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={selectedUser} onValueChange={setSelectedUser}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by user" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {users.map(user => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedAction} onValueChange={setSelectedAction}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {Object.entries(actionLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Activity Logs Table */}
      <DataTable
        columns={columns}
        data={logs}
        title="Staff Activity Logs"
        description="Monitor all staff actions and system activities"
        searchKey="user.name"
        isLoading={isLoading}
        emptyMessage="No activity logs found."
      />
    </div>
  )
}