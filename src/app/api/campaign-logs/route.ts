// src/app/api/campaign-logs/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/permissions"

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
    
    
    if (!session || !hasPermission(session.user.role as any, 'campaign_logs:read')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const logs = await prisma.campaignLog.findMany({
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
      },
      orderBy: { logDate: 'desc' }
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error("Error fetching campaign logs:", error)
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
    
    
    if (!session || !hasPermission(session.user.role as any, 'campaign_logs:write')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    const log = await prisma.campaignLog.create({
      data: {
        campaignId: body.campaignId,
        activity: body.activity,
        description: body.description,
        metrics: body.metrics,
        logDate: new Date(body.logDate),
        createdById: session.user.id
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
        action: 'CREATE_MK_LOG',
        entity: 'CampaignLog',
        entityId: log.id,
        details: { 
          campaignId: log.campaignId,
          activity: log.activity
        }
      }
    })

    return NextResponse.json(log)
  } catch (error) {
    console.error("Error creating campaign log:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

