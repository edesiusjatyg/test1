"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Calendar, User, UserX, FileText } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
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
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/components/ui/use-toast"

// Types
interface Member {
  id: string
  memberCode: string
  name: string
  email?: string
}

interface MemberAbsence {
  id: string
  memberId: string
  member: Member
  date: Date
  reason?: string
  type: "SICK" | "VACATION" | "PERSONAL" | "OTHER"
  createdAt: Date
  updatedAt: Date
}

// Form Schema
const absenceSchema = z.object({
  memberId: z.string().min(1, "Please select a member"),
  date: z.date({
    required_error: "Please select a date",
  }),
  type: z.enum(["SICK", "VACATION", "PERSONAL", "OTHER"]),
  reason: z.string().optional(),
})

type AbsenceFormData = z.infer<typeof absenceSchema>

const absenceTypes = {
  SICK: { label: "Sick Leave", color: "destructive" },
  VACATION: { label: "Vacation", color: "secondary" },
  PERSONAL: { label: "Personal", color: "outline" },
  OTHER: { label: "Other", color: "default" }
}

export default function MemberAbsencesPage() {
  const { canWrite } = useAuth()
  const { toast } = useToast()
  const [absences, setAbsences] = React.useState<MemberAbsence[]>([])
  const [members, setMembers] = React.useState<Member[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingAbsence, setEditingAbsence] = React.useState<MemberAbsence | null>(null)

  const form = useForm<AbsenceFormData>({
    resolver: zodResolver(absenceSchema),
    defaultValues: {
      memberId: "",
      type: "OTHER",
      reason: "",
    },
  })

  React.useEffect(() => {
    Promise.all([loadAbsences(), loadMembers()])
  }, [])

  const loadAbsences = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/member-absences")
      if (response.ok) {
        const data = await response.json()
        setAbsences(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load absences",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadMembers = async () => {
    try {
      const response = await fetch("/api/members?active=true")
      if (response.ok) {
        const data = await response.json()
        setMembers(data)
      }
    } catch (error) {
      console.error("Failed to load members")
    }
  }

  const handleSubmit = async (data: AbsenceFormData) => {
    try {
      const url = editingAbsence 
        ? `/api/member-absences/${editingAbsence.id}` 
        : "/api/member-absences"
      const method = editingAbsence ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const absence = await response.json()
        
        if (editingAbsence) {
          setAbsences(prev => prev.map(a => a.id === absence.id ? absence : a))
          toast({
            title: "Success",
            description: "Absence updated successfully",
          })
        } else {
          setAbsences(prev => [...prev, absence])
          toast({
            title: "Success",
            description: "Absence recorded successfully",
          })
        }

        closeModal()
      } else {
        throw new Error("Failed to save absence")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save absence",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (absence: MemberAbsence) => {
    try {
      const response = await fetch(`/api/member-absences/${absence.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setAbsences(prev => prev.filter(a => a.id !== absence.id))
        toast({
          title: "Success",
          description: "Absence deleted successfully",
        })
      } else {
        throw new Error("Failed to delete absence")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete absence",
        variant: "destructive",
      })
    }
  }

  const openModal = (absence?: MemberAbsence) => {
    if (absence) {
      setEditingAbsence(absence)
      form.reset({
        memberId: absence.memberId,
        date: new Date(absence.date),
        type: absence.type,
        reason: absence.reason || "",
      })
    } else {
      setEditingAbsence(null)
      form.reset({
        memberId: "",
        date: new Date(),
        type: "OTHER",
        reason: "",
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingAbsence(null)
    form.reset()
  }

  // Table columns
  const columns: ColumnDef<MemberAbsence>[] = [
    {
      accessorKey: "member.memberCode",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Member Code
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.original.member.memberCode}</div>
      ),
    },
    {
      accessorKey: "member.name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Member Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center">
          <User className="mr-2 h-4 w-4 text-muted-foreground" />
          {row.original.member.name}
        </div>
      ),
    },
    {
      accessorKey: "date",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center">
          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
          {format(new Date(row.getValue("date")), "MMM dd, yyyy")}
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as keyof typeof absenceTypes
        const config = absenceTypes[type]
        return (
          <Badge variant={config.color as any}>
            {config.label}
          </Badge>
        )
      },
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => {
        const reason = row.getValue("reason") as string
        return reason ? (
          <div className="flex items-center max-w-[300px]">
            <FileText className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
            <span className="truncate">{reason}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Recorded At",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(row.getValue("createdAt")), "MMM dd, yyyy HH:mm")}
        </div>
      ),
    },
  ]

  return (
    <div className="container mx-auto py-6">
      <DataTable
        columns={columns}
        data={absences}
        title="Member Absences"
        description="Track and manage member attendance"
        searchKey="member.name"
        canCreate={canWrite("member_absences")}
        canEdit={canWrite("member_absences")}
        canDelete={canWrite("member_absences")}
        onAdd={() => openModal()}
        onEdit={(absence) => openModal(absence)}
        onDelete={handleDelete}
        isLoading={isLoading}
        emptyMessage="No absences recorded."
      />

      {/* Absence Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingAbsence ? "Edit Absence Record" : "Record Member Absence"}
        description={editingAbsence ? "Update absence details" : "Record a new member absence"}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="memberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Member *</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!!editingAbsence}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.memberCode} - {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date *</FormLabel>
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
                  <FormDescription>
                    Date when the member was absent
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Absence Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select absence type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(absenceTypes).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide additional details about the absence"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional notes about the absence
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? "Saving..."
                  : editingAbsence
                  ? "Update Record"
                  : "Record Absence"}
              </Button>
            </div>
          </form>
        </Form>
      </FormModal>
    </div>
  )
}