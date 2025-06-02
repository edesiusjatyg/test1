import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  variant?: "default" | "secondary" | "destructive" | "outline"
}

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  const getVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case "active":
      case "completed":
      case "paid":
        return "default"
      case "inactive":
      case "cancelled":
      case "overdue":
        return "destructive"
      case "pending":
      case "draft":
        return "secondary"
      case "paused":
        return "outline"
      default:
        return variant || "default"
    }
  }

  return (
    <Badge variant={getVariant(status)} className="capitalize">
      {status.toLowerCase().replace('_', ' ')}
    </Badge>
  )
}