// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create initial users
  const password = await bcrypt.hash('password123', 10)
  
  const users = await prisma.user.createMany({
    data: [
      {
        email: 'owner@gym.com',
        password,
        name: 'Gym Owner',
        role: 'OWNER'
      },
      {
        email: 'frontoffice@gym.com',
        password,
        name: 'Front Office Staff',
        role: 'FRONT_OFFICE'
      },
      {
        email: 'accounting@gym.com',
        password,
        name: 'Accounting Staff',
        role: 'ACCOUNTING'
      },
      {
        email: 'marketing@gym.com',
        password,
        name: 'Marketing Staff',
        role: 'MARKETING'
      },
      {
        email: 'supervisor@gym.com',
        password,
        name: 'Supervisor',
        role: 'SUPERVISOR'
      }
    ],
    skipDuplicates: true
  })

  console.log(`✅ Created ${users.count} users`)

  // Get the created users
  const owner = await prisma.user.findUnique({ where: { email: 'owner@gym.com' } })
  const frontOffice = await prisma.user.findUnique({ where: { email: 'frontoffice@gym.com' } })
  const accounting = await prisma.user.findUnique({ where: { email: 'accounting@gym.com' } })
  const marketing = await prisma.user.findUnique({ where: { email: 'marketing@gym.com' } })

  if (owner && frontOffice && accounting && marketing) {
    // Create sample members
    const members = await prisma.member.createMany({
      data: [
        {
          memberCode: 'MEM240001',
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          address: '123 Main St, City',
          gender: 'MALE',
          createdById: frontOffice.id
        },
        {
          memberCode: 'MEM240002',
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          phone: '+1234567891',
          address: '456 Oak Ave, City',
          gender: 'FEMALE',
          createdById: frontOffice.id
        },
        {
          memberCode: 'MEM240003',
          name: 'Mike Johnson',
          email: 'mike.j@example.com',
          phone: '+1234567892',
          address: '789 Pine Rd, City',
          gender: 'MALE',
          createdById: frontOffice.id
        }
      ]
    })
    console.log(`✅ Created ${members.count} members`)

    // Create sample member transactions
    const member1 = await prisma.member.findUnique({ where: { memberCode: 'MEM240001' } })
    const member2 = await prisma.member.findUnique({ where: { memberCode: 'MEM240002' } })

    if (member1 && member2) {
      await prisma.memberTransaction.createMany({
        data: [
          {
            transactionCode: 'TRX00000001',
            memberId: member1.id,
            type: 'MEMBERSHIP_FEE',
            amount: 50,
            description: 'Monthly membership fee',
            paymentMethod: 'CREDIT_CARD',
            status: 'COMPLETED',
            dueDate: new Date(),
            paidDate: new Date(),
            createdById: frontOffice.id
          },
          {
            transactionCode: 'TRX00000002',
            memberId: member2.id,
            type: 'PERSONAL_TRAINING',
            amount: 100,
            description: 'Personal training session package',
            paymentMethod: 'CASH',
            status: 'PENDING',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdById: frontOffice.id
          }
        ]
      })
      console.log('✅ Created sample member transactions')
    }

    // Create sample company transactions
    await prisma.companyTransaction.createMany({
      data: [
        {
          transactionCode: 'CTRX00000001',
          type: 'INCOME',
          category: 'Membership Fees',
          amount: 5000,
          description: 'Monthly membership fees collection',
          paymentMethod: 'BANK_TRANSFER',
          status: 'COMPLETED',
          createdById: accounting.id
        },
        {
          transactionCode: 'CTRX00000002',
          type: 'EXPENSE',
          category: 'Rent',
          amount: 2000,
          description: 'Monthly gym rent',
          paymentMethod: 'BANK_TRANSFER',
          status: 'COMPLETED',
          createdById: accounting.id
        },
        {
          transactionCode: 'CTRX00000003',
          type: 'EXPENSE',
          category: 'Equipment',
          amount: 500,
          description: 'New dumbbells purchase',
          paymentMethod: 'CREDIT_CARD',
          status: 'COMPLETED',
          createdById: accounting.id
        }
      ]
    })
    console.log('✅ Created sample company transactions')

    // Create sample campaigns
    const campaign = await prisma.campaign.create({
      data: {
        name: 'Summer Fitness Challenge',
        description: 'Get fit this summer with our special program',
        type: 'EVENT',
        status: 'ACTIVE',
        budget: 1000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        targetAudience: 'All members',
        goals: 'Increase member engagement and retention',
        createdById: marketing.id
      }
    })

    // Create campaign logs
    await prisma.campaignLog.create({
      data: {
        campaignId: campaign.id,
        activity: 'Campaign Launch',
        description: 'Launched summer fitness challenge campaign',
        metrics: {
          reach: 500,
          engagement: 50,
          signups: 10
        },
        createdById: marketing.id
      }
    })
    console.log('✅ Created sample campaigns and logs')
  }

  console.log('🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })