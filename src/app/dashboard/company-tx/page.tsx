"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Calendar, DollarSign, TrendingDown, TrendingUp } from "lucide-react"
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
interface CompanyTransaction {
  id: string
  transactionCode: string
  type: "INCOME" | "EXPENSE"
  category: string
  amount: number
  description: string
  paymentMethod?: string
  status: "PENDING" | "COMPLETED" | "CANCELLED"
  transactionDate: Date
  createdAt: Date
  createdBy: {
    name: string
  }
}

// Form Schema
const companyTransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string().min(1, "Category is required"),
  amount: z.string().min(1, "Amount is required").transform((val) => parseFloat(val)),
  description: z.string().min(1, "Description is required"),
  paymentMethod: z.string().optional(),
  transactionDate: z.date({
    required_error: "Transaction date is required",
  }),
})

type CompanyTransactionFormData = z.infer<typeof companyTransactionSchema>

const categories = {
  INCOME: ["Membership Fees", "Personal Training", "Merchandise", "Equipment Rental", "Other Income"],
  EXPENSE: ["Rent", "Utilities", "Equipment", "Salaries", "Marketing", "Maintenance", "Other Expense"]
}

export default function CompanyTransactionsPage() {
  const { canWrite } = useAuth()
  const { toast } = useToast()
  const [transactions, setTransactions] = React.useState<CompanyTransaction[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingTransaction, setEditingTransaction] = React.useState<CompanyTransaction | null>(null)
  const [selectedType, setSelectedType] = React.useState<"INCOME" | "EXPENSE">("INCOME")

  const form = useForm<CompanyTransactionFormData>({
    resolver: zodResolver(companyTransactionSchema),
    defaultValues: {
      type: "INCOME",
      category: "",
      amount: "",
      description: "",
      paymentMethod: "",
      transactionDate: new Date(),
    },
  })

  React.useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/company-transactions")
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

  const handleSubmit = async (data: CompanyTransactionFormData) => {
    try {
      const url = editingTransaction 
        ? `/api/company-transactions/${editingTransaction.id}` 
        : "/api/company-transactions"
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

  const handleDelete = async (transaction: CompanyTransaction) => {
    try {
      const response = await fetch(`/api/company-transactions/${transaction.id}`, {
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

  const openModal = (transaction?: CompanyTransaction) => {
    if (transaction) {
      setEditingTransaction(transaction)
      setSelectedType(transaction.type)
      form.reset({
        type: transaction.type,
        category: transaction.category,
        amount: transaction.amount.toString(),
        description: transaction.description,
        paymentMethod: transaction.paymentMethod || "",
        transactionDate: new Date(transaction.transactionDate),
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
  const columns: ColumnDef<CompanyTransaction>[] = [
    {
      accessorKey: "transactionCode",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Transaction Code
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("transactionCode")}</div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as string
        return (
          <div className="flex items-center">
            {type === "INCOME" ? (
              <TrendingUp className="mr-2 h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="mr-2 h-4 w-4 text-red-600" />
            )}
            <span className={cn(
              "font-medium",
              type === "INCOME" ? "text-green-600" : "text-red-600"
            )}>
              {type}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => <div>{row.getValue("category")}</div>,
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
      cell: ({ row }) => {
        const type = row.original.type
        const amount = row.getValue<number>("amount")
        return (
          <div className={cn(
            "flex items-center font-medium",
            type === "INCOME" ? "text-green-600" : "text-red-600"
          )}>
            <DollarSign className="mr-1 h-4 w-4" />
            {type === "EXPENSE" && "-"}
            {amount.toFixed(2)}
          </div>
        )
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate">{row.getValue("description")}</div>
      ),
    },
    {
      accessorKey: "transactionDate",
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
          {format(new Date(row.getValue("transactionDate")), "MMM dd, yyyy")}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return <StatusBadge status={status} />
      },
    },
  ]

  return (
    <div className="container mx-auto py-6">
      <DataTable
        columns={columns}
        data={transactions}
        title="Company Transactions"
        description="Manage company income and expenses"
        searchKey="description"
        canCreate={canWrite("company_transactions")}
        canEdit={canWrite("company_transactions")}
        canDelete={canWrite("company_transactions")}
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
        description={editingTransaction ? "Update transaction details" : "Record a new company transaction"}
        size="lg"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Type *</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value)
                        setSelectedType(value as "INCOME" | "EXPENSE")
                        form.setValue("category", "")
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="INCOME">Income</SelectItem>
                        <SelectItem value="EXPENSE">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories[selectedType].map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
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
                name="transactionDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Transaction Date *</FormLabel>
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

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                        <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                        <SelectItem value="DIGITAL_WALLET">Digital Wallet</SelectItem>
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
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the transaction"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
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