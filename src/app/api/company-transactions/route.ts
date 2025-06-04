// src/app/api/company-transactions/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/permissions"
import { generateTransactionCode } from "@/lib/utils"

export async function GET(req: NextRequest) {
  try {
    // const session = await getServerSession(authOptions)
    const skipAuth = process.env.SKIP_AUTH === 'true'
    
    let session: any = null
    
    if (skipAuth) {
      // Mock session for prototype
      session = {
        user: {
          id: "demo-owner-id",
          name: "Demo Owner", 
          email: "demo@example.com",
          role: "OWNER"
        }
      }
    } else {
      session = await getServerSession(authOptions)
    }
    
    
    if (!session || !hasPermission(session.user.role as any, 'company_transactions:read')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const transactions = await prisma.companyTransaction.findMany({
      include: {
        createdBy: {
          select: { name: true }
        }
      },
      orderBy: { transactionDate: 'desc' }
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error("Error fetching company transactions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // const session = await getServerSession(authOptions)
    const skipAuth = process.env.SKIP_AUTH === 'true'
    
    let session: any = null
    
    if (skipAuth) {
      // Mock session for prototype
      session = {
        user: {
          id: "demo-owner-id",
          name: "Demo Owner", 
          email: "demo@example.com",
          role: "OWNER"
        }
      }
    } else {
      session = await getServerSession(authOptions)
    }
    
    
    if (!session || !hasPermission(session.user.role as any, 'company_transactions:write')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const transactionCode = await generateTransactionCode()

    const transaction = await prisma.companyTransaction.create({
      data: {
        transactionCode,
        type: body.type,
        category: body.category,
        amount: body.amount,
        description: body.description,
        paymentMethod: body.paymentMethod,
        status: 'COMPLETED',
        transactionDate: new Date(body.transactionDate),
        createdById: session.user.id
      },
      include: {
        createdBy: {
          select: { name: true }
        }
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        role: session.user.role as any,
        action: 'CREATE_TRANSACTION',
        entity: 'CompanyTransaction',
        entityId: transaction.id,
        details: { 
          transactionCode: transaction.transactionCode,
          type: transaction.type,
          amount: transaction.amount,
          category: transaction.category
        }
      }
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error("Error creating company transaction:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}