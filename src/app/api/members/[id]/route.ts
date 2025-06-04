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
    const session = await getServerSession(authOptions)
    
    if (!session || !hasPermission(session.user.role as any, 'members:write')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    const member = await prisma.member.update({
      where: { id: (await params).id },
      data: {
        ...body,
        birthDate: body.birthDate ? new Date(body.birthDate) : undefined
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
        action: 'UPDATE_MEMBER',
        entity: 'Member',
        entityId: member.id,
        details: { changes: body }
      }
    })

    return NextResponse.json(member)
  } catch (error) {
    console.error("Error updating member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !hasPermission(session.user.role as any, 'members:write')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const member = await prisma.member.delete({
      where: { id: (await params).id }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        role: session.user.role as any,
        action: 'DELETE_MEMBER',
        entity: 'Member',
        entityId: (await params).id,
        details: { memberCode: member.memberCode, name: member.name }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}