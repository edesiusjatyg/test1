// src/app/api/company-transactions/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/permissions"
import { generateTransactionCode } from "@/lib/utils"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
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
    const session = await getServerSession(authOptions)
    
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

// src/app/api/company-transactions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/permissions"

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !hasPermission(session.user.role as any, 'company_transactions:write')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    const transaction = await prisma.companyTransaction.update({
      where: { id: params.id },
      data: {
        type: body.type,
        category: body.category,
        amount: body.amount,
        description: body.description,
        paymentMethod: body.paymentMethod,
        transactionDate: new Date(body.transactionDate)
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
        action: 'UPDATE_TRANSACTION',
        entity: 'CompanyTransaction',
        entityId: transaction.id,
        details: { changes: body }
      }
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error("Error updating company transaction:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !hasPermission(session.user.role as any, 'company_transactions:write')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const transaction = await prisma.companyTransaction.delete({
      where: { id: params.id }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        role: session.user.role as any,
        action: 'DELETE_TRANSACTION',
        entity: 'CompanyTransaction',
        entityId: params.id,
        details: { 
          transactionCode: transaction.transactionCode,
          type: transaction.type,
          amount: transaction.amount
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting company transaction:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}