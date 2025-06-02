// src/app/api/campaign-logs/[id]/route.ts
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
    
    if (!session || !hasPermission(session.user.role as any, 'campaign_logs:write')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    const log = await prisma.campaignLog.update({
      where: { id: params.id },
      data: {
        activity: body.activity,
        description: body.description,
        metrics: body.metrics,
        logDate: new Date(body.logDate)
      },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
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
        action: 'UPDATE_MK_LOG',
        entity: 'CampaignLog',
        entityId: log.id,
        details: { changes: body }
      }
    })

    return NextResponse.json(log)
  } catch (error) {
    console.error("Error updating campaign log:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !hasPermission(session.user.role as any, 'campaign_logs:write')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const log = await prisma.campaignLog.delete({
      where: { id: params.id }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        role: session.user.role as any,
        action: 'DELETE_MK_LOG',
        entity: 'CampaignLog',
        entityId: params.id,
        details: { activity: log.activity }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting campaign log:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}