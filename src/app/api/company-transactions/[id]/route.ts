// src/app/api/company-transactions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/permissions"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const transaction = await prisma.companyTransaction.update({
      where: { id: (await params).id },
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
  { params }: { params: Promise<{ id: string }> }
) {
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

    const transaction = await prisma.companyTransaction.delete({
      where: { id: (await params).id }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        role: session.user.role as any,
        action: 'DELETE_TRANSACTION',
        entity: 'CompanyTransaction',
        entityId: (await params).id,
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