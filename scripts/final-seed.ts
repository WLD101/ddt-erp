import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@preview.com'
  const password = await bcrypt.hash('14789Wagus.', 12)
  const orgName = 'Nexus Tech Preview'
  const orgSlug = 'nexus-tech-preview'

  console.log('🌱 Starting bootstrap seed...')

  // 1. Create User
  const user = await prisma.user.upsert({
    where: { email },
    update: { password },
    create: {
      email,
      password,
      name: 'System Preview Admin',
    }
  })

  // 2. Create Organization
  const org = await prisma.organization.upsert({
    where: { slug: orgSlug },
    update: { name: orgName },
    create: {
      name: orgName,
      slug: orgSlug,
      subscription: {
        create: {
          planId: 'pro',
          status: 'trialing',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        }
      }
    }
  })

  // 3. Setup Infrastructure (Roles, Branches, Finances)
  // Note: We are mimicking the logic from lib/security/seed.ts here
  
  // Create Permissions (Partial list to get started)
  const permissions = [
    { name: 'reports.view', category: 'Reports' },
    { name: 'products.view', category: 'Products' },
    { name: 'products.create', category: 'Products' },
    { name: 'products.edit', category: 'Products' },
    { name: 'branches.manage', category: 'Admin' },
    { name: 'settings.manage', category: 'Admin' },
  ]

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { name: p.name },
      update: { category: p.category },
      create: p
    })
  }

  // Create Owner Role for Org
  const ownerRole = await prisma.role.upsert({
    where: {
      name_organizationId: {
        name: 'owner',
        organizationId: org.id
      }
    },
    update: {},
    create: {
      name: 'owner',
      organizationId: org.id,
      permissions: {
        connect: permissions.map(p => ({ name: p.name }))
      }
    }
  })

  // 4. Link User to Org
  await prisma.organizationUser.upsert({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: org.id
      }
    },
    update: { roleId: ownerRole.id },
    create: {
      userId: user.id,
      organizationId: org.id,
      roleId: ownerRole.id
    }
  })

  // 5. Create Main Branch
  const branch = await prisma.branch.upsert({
    where: { id_organizationId: { id: 'main-branch-' + org.id, organizationId: org.id } },
    update: {},
    create: {
      id: 'main-branch-' + org.id,
      organizationId: org.id,
      name: 'Main HQ',
      code: 'HQ-01',
      isMain: true
    }
  })

  // 6. Create Main Financial Account
  await prisma.financialAccount.upsert({
    where: { id_organizationId: { id: 'main-cash-' + org.id, organizationId: org.id } },
    update: {},
    create: {
      id: 'main-cash-' + org.id,
      organizationId: org.id,
      name: 'Main Cash',
      type: 'CASH',
      isDefault: true,
      currentBalance: 1500.50
    }
  })

  console.log('✅ SEED COMPLETED')
  console.log('User: admin@preview.com / 14789Wagus.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
