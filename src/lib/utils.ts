import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { prisma } from "@/lib/prisma"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function generateMemberCode(): Promise<string> {
  const prefix = "MEM"
  const year = new Date().getFullYear().toString().slice(-2)
  
  // Get the last member code
  const lastMember = await prisma.member.findFirst({
    where: {
      memberCode: {
        startsWith: `${prefix}${year}`
      }
    },
    orderBy: {
      memberCode: 'desc'
    }
  })

  let nextNumber = 1
  if (lastMember) {
    const lastNumber = parseInt(lastMember.memberCode.slice(-4))
    nextNumber = lastNumber + 1
  }

  return `${prefix}${year}${nextNumber.toString().padStart(4, '0')}`
}

export async function generateTransactionCode(): Promise<string> {
  const prefix = "TRX"
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  
  return `${prefix}${timestamp}${random}`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function getDateRange(range: string): { startDate: Date; endDate: Date } {
  const endDate = new Date()
  let startDate = new Date()

  switch (range) {
    case 'last7days':
      startDate.setDate(startDate.getDate() - 7)
      break
    case 'last30days':
      startDate.setDate(startDate.getDate() - 30)
      break
    case 'last90days':
      startDate.setDate(startDate.getDate() - 90)
      break
    case 'last12months':
      startDate.setMonth(startDate.getMonth() - 12)
      break
    default:
      startDate.setDate(startDate.getDate() - 30)
  }

  return { startDate, endDate }
}