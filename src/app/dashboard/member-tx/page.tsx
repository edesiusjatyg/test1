"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Calendar, DollarSign, Receipt, User } from "lucide-react"
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
}

interface MemberTransaction {
  id: string
  memberId: string
  member: Member
  type: "MEMBERSHIP_FEE" | "PERSONAL_TRAINING" | "SUPPLEMENTS" | "EQUIPMENT_RENTAL" | "OTHER"
  amount: number
  description?: string
  status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED"
  dueDate: Date
  paidAt?: Date
  createdAt: Date
  updatedAt: Date
  createdBy: {
    name: string
  }
}

// Form Schema
const transactionSchema = z.object({
  memberId: z.string().min(1, "Please select a member"),
  type: z.enum(["MEMBERSHIP_FEE", "PERSONAL_TRAINING", "SUPPLEMENTS", "EQUIPMENT_RENTAL", "OTHER"]),
  status: z.enum(["PENDING", "PAID", "OVERDUE", "CANCELLED"]),
  amount: z.number().min(1, "Amount is required"),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  description: z.string().optional(),
})

type TransactionFormData = z.infer<typeof transactionSchema>

const transactionTypes = {
  MEMBERSHIP_FEE: "Membership Fee",
  PERSONAL_TRAINING: "Personal Training",
  SUPPLEMENTS: "Supplements",
  EQUIPMENT_RENTAL: "Equipment Rental",
  OTHER: "Other"
}

const transactionStatuses = {
  PENDING: "Pending",
  PAID: "Paid",
  OVERDUE: "Overdue",
  CANCELLED: "Cancelled"
}

export default function MemberTransactionsPage() {
  const { canWrite } = useAuth()
  const { toast } = useToast()
  const [transactions, setTransactions] = React.useState<MemberTransaction[]>([])
  const [members, setMembers] = React.useState<Member[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingTransaction, setEditingTransaction] = React.useState<MemberTransaction | null>(null)

  const form = useForm<TransactionFormData>({ resolver: zodResolver(transactionSchema) })

  // Load transactions and members
  React.useEffect(() => {
    Promise.all([loadTransactions(), loadMembers()])
  }, [])

  const loadTransactions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/member-transactions")
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load transactions",
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

  const handleSubmit = async (data: TransactionFormData) => {
    try {
      const url = editingTransaction 
        ? `/api/member-transactions/${editingTransaction.id}` 
        : "/api/member-transactions"
      const method = editingTransaction ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const transaction = await response.json()
        
        if (editingTransaction) {
          setTransactions(prev => prev.map(t => t.id === transaction.id ? transaction : t))
          toast({
            title: "Success",
            description: "Transaction updated successfully",
          })
        } else {
          setTransactions(prev => [...prev, transaction])
          toast({
            title: "Success",
            description: "Transaction created successfully",
          })
        }

        closeModal()
      } else {
        throw new Error("Failed to save transaction")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save transaction",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (transaction: MemberTransaction) => {
    try {
      const response = await fetch(`/api/member-transactions/${transaction.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setTransactions(prev => prev.filter(t => t.id !== transaction.id))
        toast({
          title: "Success",
          description: "Transaction deleted successfully",
        })
      } else {
        throw new Error("Failed to delete transaction")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      })
    }
  }

  const handleMarkAsPaid = async (transaction: MemberTransaction) => {
    try {
      const response = await fetch(`/api/member-transactions/${transaction.id}/mark-paid`, {
        method: "PATCH",
      })

      if (response.ok) {
        const updated = await response.json()
        setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t))
        toast({
          title: "Success",
          description: "Transaction marked as paid",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive",
      })
    }
  }

  const openModal = (transaction?: MemberTransaction) => {
    if (transaction) {
      setEditingTransaction(transaction)
      form.reset({
        memberId: transaction.memberId,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description || "",
        dueDate: new Date(transaction.dueDate),
        status: transaction.status,
      })
    } else {
      setEditingTransaction(null)
      form.reset()
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingTransaction(null)
    form.reset()
  }

  // Table columns
  const columns: ColumnDef<MemberTransaction>[] = [
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
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <div className="font-medium">
          {transactionTypes[row.getValue("type") as keyof typeof transactionTypes]}
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center">
          <DollarSign className="mr-1 h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            ${row.getValue<number>("amount").toFixed(2)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "dueDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Due Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center">
          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
          {format(new Date(row.getValue("dueDate")), "MMM dd, yyyy")}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <div className="flex items-center gap-2">
            <StatusBadge status={status} />
            {status === "PENDING" && canWrite("member_transactions") && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMarkAsPaid(row.original)}
              >
                <Receipt className="mr-1 h-3 w-3" />
                Mark Paid
              </Button>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "paidAt",
      header: "Paid Date",
      cell: ({ row }) => {
        const paidAt = row.getValue("paidAt") as Date | null
        return paidAt ? (
          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
            {format(new Date(paidAt), "MMM dd, yyyy")}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
  ]

  return (
    <div className="container mx-auto py-6">
      <DataTable
        columns={columns}
        data={transactions}
        title="Member Transactions"
        description="Manage member payments and transactions"
        searchKey="member.name"
        canCreate={canWrite("member_transactions")}
        canEdit={canWrite("member_transactions")}
        canDelete={canWrite("member_transactions")}
        onAdd={() => openModal()}
        onEdit={(transaction) => openModal(transaction)}
        onDelete={handleDelete}
        isLoading={isLoading}
        emptyMessage="No transactions found."
      />

      {/* Transaction Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingTransaction ? "Edit Transaction" : "Add New Transaction"}
        description={editingTransaction ? "Update transaction details" : "Create a new member transaction"}
        size="lg"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="memberId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Member *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select transaction type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(transactionTypes).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
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
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date *</FormLabel>
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
                          disabled={(date) => date < new Date("1900-01-01")}
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(transactionStatuses).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      placeholder="Additional notes about this transaction"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description or notes
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
                  : editingTransaction
                  ? "Update Transaction"
                  : "Add Transaction"}
              </Button>
            </div>
          </form>
        </Form>
      </FormModal>
    </div>
  )
}