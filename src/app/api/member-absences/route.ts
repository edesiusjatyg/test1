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
    
    
    if (!session || !hasPermission(session.user.role as any, 'member_absences:read')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const absences = await prisma.memberAbsence.findMany({
      include: {
        member: {
          select: {
            id: true,
            memberCode: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json(absences)
  } catch (error) {
    console.error("Error fetching absences:", error)
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
    
    
    if (!session || !hasPermission(session.user.role as any, 'member_absences:write')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    const absence = await prisma.memberAbsence.create({
      data: {
        memberId: body.memberId,
        date: new Date(body.date),
        type: body.type,
        reason: body.reason
      },
      include: {
        member: {
          select: {
            id: true,
            memberCode: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        role: session.user.role as any,
        action: 'CREATE_MEMBER' as any, // Using CREATE_MEMBER as placeholder
        entity: 'MemberAbsence',
        entityId: absence.id,
        details: { 
          memberId: absence.memberId,
          date: absence.date,
          type: absence.type
        }
      }
    })

    return NextResponse.json(absence)
  } catch (error) {
    console.error("Error creating absence:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}