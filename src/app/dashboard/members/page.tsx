"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Calendar, Mail, Phone, User, X } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { StatusBadge } from "@/components/ui/status-badge"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/components/ui/use-toast"

// Types
interface Member {
  id: string
  memberCode: string
  name: string
  email?: string
  phone?: string
  address?: string
  birthDate?: Date
  gender?: "MALE" | "FEMALE" | "OTHER"
  joinDate: Date
  isActive: boolean
  emergencyContact?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// Form Schema
const memberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone number must be at least 10 digits").optional().or(z.literal("")),
  address: z.string().optional(),
  birthDate: z.date().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  emergencyContact: z.string().optional(),
  notes: z.string().optional(),
})

type MemberFormData = z.infer<typeof memberSchema>

export default function MembersPage() {
  const { canWrite } = useAuth()
  const { toast } = useToast()
  const [members, setMembers] = React.useState<Member[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingMember, setEditingMember] = React.useState<Member | null>(null)

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      emergencyContact: "",
      notes: "",
    },
  })

  // Load members
  React.useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/members")
      if (response.ok) {
        const data = await response.json()
        setMembers(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load members",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (data: MemberFormData) => {
    try {
      const url = editingMember ? `/api/members/${editingMember.id}` : "/api/members"
      const method = editingMember ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const member = await response.json()
        
        if (editingMember) {
          setMembers(prev => prev.map(m => m.id === member.id ? member : m))
          toast({
            title: "Success",
            description: "Member updated successfully",
          })
        } else {
          setMembers(prev => [...prev, member])
          toast({
            title: "Success",
            description: "Member created successfully",
          })
        }

        closeModal()
      } else {
        throw new Error("Failed to save member")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save member",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (member: Member) => {
    try {
      const response = await fetch(`/api/members/${member.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setMembers(prev => prev.filter(m => m.id !== member.id))
        toast({
          title: "Success",
          description: "Member deleted successfully",
        })
      } else {
        throw new Error("Failed to delete member")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete member",
        variant: "destructive",
      })
    }
  }

  const openModal = (member?: Member) => {
    if (member) {
      setEditingMember(member)
      form.reset({
        name: member.name,
        email: member.email || "",
        phone: member.phone || "",
        address: member.address || "",
        birthDate: member.birthDate,
        gender: member.gender,
        emergencyContact: member.emergencyContact || "",
        notes: member.notes || "",
      })
    } else {
      setEditingMember(null)
      form.reset()
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingMember(null)
    form.reset()
  }

  // Table columns
  const columns: ColumnDef<Member>[] = [
    {
      accessorKey: "memberCode",
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
        <div className="font-medium">{row.getValue("memberCode")}</div>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center">
          <User className="mr-2 h-4 w-4 text-muted-foreground" />
          {row.getValue("name")}
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => {
        const email = row.getValue("email") as string
        return email ? (
          <div className="flex items-center">
            <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
            {email}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => {
        const phone = row.getValue("phone") as string
        return phone ? (
          <div className="flex items-center">
            <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
            {phone}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: "joinDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Join Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center">
          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
          {format(new Date(row.getValue("joinDate")), "MMM dd, yyyy")}
        </div>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean
        return <StatusBadge status={isActive ? "active" : "inactive"} />
      },
    },
  ]

  return (
    <div className="container mx-auto py-6">
      <DataTable
        columns={columns}
        data={members}
        title="Gym Members"
        description="Manage your gym members and their information"
        searchKey="name"
        canCreate={canWrite("members")}
        canEdit={canWrite("members")}
        canDelete={canWrite("members")}
        onAdd={() => openModal()}
        onEdit={(member) => openModal(member)}
        onDelete={handleDelete}
        isLoading={isLoading}
        emptyMessage="No members found."
      />

      {/* Member Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingMember ? "Edit Member" : "Add New Member"}
        description={editingMember ? "Update member information" : "Add a new member to your gym"}
        size="lg"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Birth Date</FormLabel>
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
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emergencyContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter emergency contact" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter full address"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional notes about the member
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
                  : editingMember
                  ? "Update Member"
                  : "Add Member"}
              </Button>
            </div>
          </form>
        </Form>
      </FormModal>
    </div>
  )
}