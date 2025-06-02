import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current date info
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    // Fetch stats based on user role
    const stats: any = {}

    // Member stats (for roles that can access members)
    if (['FRONT_OFFICE', 'SUPERVISOR', 'OWNER'].includes(session.user.role)) {
      const [totalMembers, activeMembers] = await Promise.all([
        prisma.member.count(),
        prisma.member.count({ where: { isActive: true } })
      ])
      
      stats.totalMembers = totalMembers
      stats.activeMembers = activeMembers

      // Today's check-ins (based on absence records)
      const todayCheckIns = await prisma.memberAbsence.count({
        where: {
          date: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          },
          type: 'OTHER' // Assuming check-ins are marked as OTHER
        }
      })
      stats.todayCheckIns = todayCheckIns
    }

    // Financial stats (for roles that can access transactions)
    if (['ACCOUNTING', 'SUPERVISOR', 'OWNER'].includes(session.user.role)) {
      // Monthly revenue
      const monthlyRevenue = await prisma.companyTransaction.aggregate({
        where: {
          type: 'INCOME',
          transactionDate: {
            gte: firstDayOfMonth,
            lte: lastDayOfMonth
          },
          status: 'COMPLETED'
        },
        _sum: {
          amount: true
        }
      })
      stats.monthlyRevenue = monthlyRevenue._sum.amount?.toNumber() || 0

      // Pending payments
      const pendingPayments = await prisma.memberTransaction.count({
        where: {
          status: 'PENDING',
          dueDate: {
            lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) // Due within a week
          }
        }
      })
      stats.pendingPayments = pendingPayments
    }

    // Marketing stats (for roles that can access campaigns)
    if (['MARKETING', 'SUPERVISOR', 'OWNER'].includes(session.user.role)) {
      // Active campaigns
      const activeCampaigns = await prisma.campaign.count({
        where: {
          status: 'ACTIVE',
          startDate: { lte: today },
          OR: [
            { endDate: null },
            { endDate: { gte: today } }
          ]
        }
      })
      stats.activeCampaigns = activeCampaigns

      // Mock conversion rate (in real app, calculate from campaign logs)
      stats.conversionRate = 12.5
    }

    // Upcoming events (mock data for now)
    stats.upcomingEvents = 3

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}