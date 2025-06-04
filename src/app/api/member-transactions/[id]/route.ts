// src/app/api/member-transactions/[id]/route.ts
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
    
    if (!session || !hasPermission(session.user.role as any, 'member_transactions:write')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    const transaction = await prisma.memberTransaction.update({
      where: { id: params.id },
      data: {
        memberId: body.memberId,
        type: body.type,
        amount: body.amount,
        description: body.description,
        paymentMethod: body.paymentMethod,
        status: body.status,
        dueDate: new Date(body.dueDate),
        paidDate: body.paidDate ? new Date(body.paidDate) : null
      },
      include: {
        member: true,
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
        entity: 'MemberTransaction',
        entityId: transaction.id,
        details: { changes: body }
      }
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error("Error updating transaction:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !hasPermission(session.user.role as any, 'member_transactions:write')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const transaction = await prisma.memberTransaction.delete({
      where: { id: params.id }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        role: session.user.role as any,
        action: 'DELETE_TRANSACTION',
        entity: 'MemberTransaction',
        entityId: params.id,
        details: { 
          transactionCode: transaction.transactionCode,
          amount: transaction.amount
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting transaction:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// src/app/api/member-transactions/[id]/mark-paid/route.ts
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !hasPermission(session.user.role as any, 'member_transactions:write')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const transaction = await prisma.memberTransaction.update({
      where: { id: params.id },
      data: {
        status: "COMPLETED",
        paidDate: new Date()
      },
      include: {
        member: true,
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
        entity: 'MemberTransaction',
        entityId: transaction.id,
        details: { 
          action: 'marked_as_paid',
          transactionCode: transaction.transactionCode
        }
      }
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error("Error marking transaction as paid:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}