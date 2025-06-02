"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Calendar, Activity, BarChart, FileText } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { DataTable } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/components/ui/use-toast"

// Types
interface Campaign {
  id: string
  name: string
  status: string
}

interface CampaignLog {
  id: string
  campaignId: string
  campaign: Campaign
  activity: string
  description?: string
  metrics?: {
    reach?: number
    engagement?: number
    clicks?: number
    conversions?: number
    signups?: number
  }
  logDate: Date
  createdAt: Date
  createdBy: {
    name: string
  }
}

// Form Schema
const campaignLogSchema = z.object({
  campaignId: z.string().min(1, "Please select a campaign"),
  activity: z.string().min(2, "Activity description is required"),
  description: z.string().optional(),
  logDate: z.date({
    required_error: "Log date is required",
  }),
  reach: z.string().optional(),
  engagement: z.string().optional(),
  clicks: z.string().optional(),
  conversions: z.string().optional(),
  signups: z.string().optional(),
})

type CampaignLogFormData = z.infer<typeof campaignLogSchema>

export default function CampaignLogsPage() {
  const { canWrite } = useAuth()
  const { toast } = useToast()
  const [logs, setLogs] = React.useState<CampaignLog[]>([])
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingLog, setEditingLog] = React.useState<CampaignLog | null>(null)

  const form = useForm<CampaignLogFormData>({
    resolver: zodResolver(campaignLogSchema),
    defaultValues: {
      campaignId: "",
      activity: "",
      description: "",
      logDate: new Date(),
      reach: "",
      engagement: "",
      clicks: "",
      conversions: "",
      signups: "",
    },
  })

  React.useEffect(() => {
    Promise.all([loadLogs(), loadCampaigns()])
  }, [])

  const loadLogs = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/campaign-logs")
      if (response.ok) {
        const data = await response.json()
        setLogs(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load campaign logs",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadCampaigns = async () => {
    try {
      const response = await fetch("/api/campaigns?status=ACTIVE")
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data)
      }
    } catch (error) {
      console.error("Failed to load campaigns")
    }
  }

  const handleSubmit = async (data: CampaignLogFormData) => {
    try {
      const metrics: any = {}
      if (data.reach) metrics.reach = parseInt(data.reach)
      if (data.engagement) metrics.engagement = parseInt(data.engagement)
      if (data.clicks) metrics.clicks = parseInt(data.clicks)
      if (data.conversions) metrics.conversions = parseInt(data.conversions)
      if (data.signups) metrics.signups = parseInt(data.signups)

      const payload = {
        campaignId: data.campaignId,
        activity: data.activity,
        description: data.description,
        logDate: data.logDate,
        metrics: Object.keys(metrics).length > 0 ? metrics : undefined
      }

      const url = editingLog 
        ? `/api/campaign-logs/${editingLog.id}` 
        : "/api/campaign-logs"
      const method = editingLog ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const log = await response.json()
        
        if (editingLog) {
          setLogs(prev => prev.map(l => l.id === log.id ? log : l))
          toast({
            title: "Success",
            description: "Campaign log updated successfully",
          })
        } else {
          setLogs(prev => [...prev, log])
          toast({
            title: "Success",
            description: "Campaign activity logged successfully",
          })
        }

        closeModal()
      } else {
        throw new Error("Failed to save log")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save campaign log",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (log: CampaignLog) => {
    try {
      const response = await fetch(`/api/campaign-logs/${log.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setLogs(prev => prev.filter(l => l.id !== log.id))
        toast({
          title: "Success",
          description: "Campaign log deleted successfully",
        })
      } else {
        throw new Error("Failed to delete log")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete campaign log",
        variant: "destructive",
      })
    }
  }

  const openModal = (log?: CampaignLog) => {
    if (log) {
      setEditingLog(log)
      form.reset({
        campaignId: log.campaignId,
        activity: log.activity,
        description: log.description || "",
        logDate: new Date(log.logDate),
        reach: log.metrics?.reach?.toString() || "",
        engagement: log.metrics?.engagement?.toString() || "",
        clicks: log.metrics?.clicks?.toString() || "",
        conversions: log.metrics?.conversions?.toString() || "",
        signups: log.metrics?.signups?.toString() || "",
      })
    } else {
      setEditingLog(null)
      form.reset()
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingLog(null)
    form.reset()
  }

  // Table columns
  const columns: ColumnDef<CampaignLog>[] = [
    {
      accessorKey: "campaign.name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Campaign
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.original.campaign.name}</div>
      ),
    },
    {
      accessorKey: "activity",
      header: "Activity",
      cell: ({ row }) => (
        <div className="flex items-center">
          <Activity className="mr-2 h-4 w-4 text-muted-foreground" />
          {row.getValue("activity")}
        </div>
      ),
    },
    {
      accessorKey: "logDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Log Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center">
          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
          {format(new Date(row.getValue("logDate")), "MMM dd, yyyy")}
        </div>
      ),
    },
    {
      id: "metrics",
      header: "Metrics",
      cell: ({ row }) => {
        const metrics = row.original.metrics
        if (!metrics || Object.keys(metrics).length === 0) {
          return <span className="text-muted-foreground">No metrics</span>
        }
        
        return (
          <div className="flex items-center gap-3 text-sm">
            {metrics.reach && (
              <div className="flex items-center">
                <BarChart className="mr-1 h-3 w-3 text-muted-foreground" />
                <span>{metrics.reach} reach</span>
              </div>
            )}
            {metrics.engagement && (
              <div className="flex items-center">
                <Activity className="mr-1 h-3 w-3 text-muted-foreground" />
                <span>{metrics.engagement} eng</span>
              </div>
            )}
            {metrics.conversions && (
              <div className="flex items-center">
                <Target className="mr-1 h-3 w-3 text-muted-foreground" />
                <span>{metrics.conversions} conv</span>
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.getValue("description") as string
        return description ? (
          <div className="flex items-center max-w-[300px]">
            <FileText className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
            <span className="truncate">{description}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: "createdBy.name",
      header: "Logged By",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.createdBy.name}
        </div>
      ),
    },
  ]

  return (
    <div className="container mx-auto py-6">
      <DataTable
        columns={columns}
        data={logs}
        title="Campaign Activity Logs"
        description="Track campaign performance and activities"
        searchKey="activity"
        canCreate={canWrite("campaign_logs")}
        canEdit={canWrite("campaign_logs")}
        canDelete={canWrite("campaign_logs")}
        onAdd={() => openModal()}
        onEdit={(log) => openModal(log)}
        onDelete={handleDelete}
        isLoading={isLoading}
        emptyMessage="No campaign logs found."
      />

      {/* Campaign Log Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingLog ? "Edit Campaign Log" : "Log Campaign Activity"}
        description={editingLog ? "Update activity details" : "Record campaign activity and metrics"}
        size="lg"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="campaignId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign *</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!!editingLog}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a campaign" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {campaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="activity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Email blast sent, Social media post"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Activity Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide additional details about this activity"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Metrics Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Performance Metrics</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="reach"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reach</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        People reached
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="engagement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Engagement</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Likes, comments, shares
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clicks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clicks</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Link clicks
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="conversions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conversions</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Goal completions
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="signups"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sign-ups</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        New registrations
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? "Saving..."
                  : editingLog
                  ? "Update Log"
                  : "Log Activity"}
              </Button>
            </div>
          </form>
        </Form>
      </FormModal>
    </div>
  )
}

// Import Target icon at the top
import { Target } from "lucide-react"