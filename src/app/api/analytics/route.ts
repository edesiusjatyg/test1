import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/permissions"
import { getDateRange } from "@/lib/utils"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !hasPermission(session.user.role as any, 'analytics:read')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const range = searchParams.get('range') || 'last30days'
    const { startDate, endDate } = getDateRange(range)

    // Member Statistics
    const [totalMembers, activeMembers, newMembersCount] = await Promise.all([
      prisma.member.count(),
      prisma.member.count({ where: { isActive: true } }),
      prisma.member.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      })
    ])

    const previousPeriodStart = new Date(startDate)
    previousPeriodStart.setDate(previousPeriodStart.getDate() - (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    const previousNewMembers = await prisma.member.count({
      where: {
        createdAt: {
          gte: previousPeriodStart,
          lt: startDate
        }
      }
    })

    const growthPercentage = previousNewMembers > 0 
      ? ((newMembersCount - previousNewMembers) / previousNewMembers * 100).toFixed(1)
      : 0

    // Revenue Statistics
    const [totalRevenue, totalExpenses] = await Promise.all([
      prisma.companyTransaction.aggregate({
        where: {
          type: 'INCOME',
          status: 'COMPLETED',
          transactionDate: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: { amount: true }
      }),
      prisma.companyTransaction.aggregate({
        where: {
          type: 'EXPENSE',
          status: 'COMPLETED',
          transactionDate: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: { amount: true }
      })
    ])

    const revenue = totalRevenue._sum.amount?.toNumber() || 0
    const expenses = totalExpenses._sum.amount?.toNumber() || 0
    const netProfit = revenue - expenses

    // Revenue by category
    const revenueByCategory = await prisma.companyTransaction.groupBy({
      by: ['category'],
      where: {
        type: 'INCOME',
        status: 'COMPLETED',
        transactionDate: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: { amount: true },
      orderBy: {
        _sum: {
          amount: 'desc'
        }
      },
      take: 5
    })

    const topCategories = revenueByCategory.map(cat => ({
      name: cat.category,
      value: cat._sum.amount?.toNumber() || 0
    }))

    // Membership Trends (monthly data)
    const membershipTrends = []
    const months = range === 'last12months' ? 12 : range === 'last90days' ? 3 : 1
    
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date()
      monthStart.setMonth(monthStart.getMonth() - i)
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)
      
      const monthEnd = new Date(monthStart)
      monthEnd.setMonth(monthEnd.getMonth() + 1)
      monthEnd.setDate(0)
      monthEnd.setHours(23, 59, 59, 999)

      const [newMembers, cancelledMembers, totalAtEnd] = await Promise.all([
        prisma.member.count({
          where: {
            createdAt: {
              gte: monthStart,
              lte: monthEnd
            }
          }
        }),
        prisma.member.count({
          where: {
            isActive: false,
            updatedAt: {
              gte: monthStart,
              lte: monthEnd
            }
          }
        }),
        prisma.member.count({
          where: {
            createdAt: {
              lte: monthEnd
            }
          }
        })
      ])

      membershipTrends.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        newMembers,
        cancelledMembers,
        totalMembers: totalAtEnd
      })
    }

    // Revenue Breakdown
    const revenueBreakdown = await prisma.companyTransaction.groupBy({
      by: ['category'],
      where: {
        type: 'INCOME',
        status: 'COMPLETED',
        transactionDate: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: { amount: true }
    })

    const totalRevenueAmount = revenueBreakdown.reduce((sum, cat) => sum + (cat._sum.amount?.toNumber() || 0), 0)
    const breakdownWithPercentage = revenueBreakdown.map(cat => ({
      category: cat.category,
      amount: cat._sum.amount?.toNumber() || 0,
      percentage: totalRevenueAmount > 0 
        ? Math.round(((cat._sum.amount?.toNumber() || 0) / totalRevenueAmount) * 100)
        : 0
    }))

    // Campaign Performance
    const campaigns = await prisma.campaign.findMany({
      where: {
        status: 'ACTIVE',
        startDate: { lte: endDate },
        OR: [
          { endDate: null },
          { endDate: { gte: startDate } }
        ]
      },
      include: {
        campaignLogs: {
          where: {
            logDate: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      }
    })

    const campaignPerformance = campaigns.map(campaign => {
      const metrics = campaign.campaignLogs.reduce((acc, log) => {
        if (log.metrics && typeof log.metrics === 'object') {
          const m = log.metrics as any
          acc.reach += m.reach || 0
          acc.engagement += m.engagement || 0
          acc.conversions += m.conversions || 0
        }
        return acc
      }, { reach: 0, engagement: 0, conversions: 0 })

      return {
        name: campaign.name,
        ...metrics
      }
    })

    // Previous period revenue for growth calculation
    const previousRevenue = await prisma.companyTransaction.aggregate({
      where: {
        type: 'INCOME',
        status: 'COMPLETED',
        transactionDate: {
          gte: previousPeriodStart,
          lt: startDate
        }
      },
      _sum: { amount: true }
    })

    const prevRev = previousRevenue._sum.amount?.toNumber() || 0
    const revenueGrowth = prevRev > 0 
      ? ((revenue - prevRev) / prevRev * 100).toFixed(1)
      : 0

    return NextResponse.json({
      memberStats: {
        total: totalMembers,
        active: activeMembers,
        inactive: totalMembers - activeMembers,
        newThisMonth: newMembersCount,
        growthPercentage: parseFloat(growthPercentage as string)
      },
      revenueStats: {
        totalRevenue: revenue,
        totalExpenses: expenses,
        netProfit,
        revenueGrowth: parseFloat(revenueGrowth as string),
        topCategories
      },
      membershipTrends,
      revenueBreakdown: breakdownWithPercentage,
      campaignPerformance
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}