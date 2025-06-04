import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/permissions"
import { generateMemberCode } from "@/lib/utils"

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
    
    
    if (!session || !hasPermission(session.user.role as any, 'members:read')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const active = searchParams.get('active')

    const members = await prisma.member.findMany({
      where: active === 'true' ? { isActive: true } : undefined,
      include: {
        createdBy: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error("Error fetching members:", error)
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
    
    
    if (!session || !hasPermission(session.user.role as any, 'members:write')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const memberCode = await generateMemberCode()

    const member = await prisma.member.create({
      data: {
        ...body,
        memberCode,
        birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
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
        action: 'CREATE_MEMBER',
        entity: 'Member',
        entityId: member.id,
        details: { memberCode: member.memberCode, name: member.name }
      }
    })

    return NextResponse.json(member)
  } catch (error) {
    console.error("Error creating member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}