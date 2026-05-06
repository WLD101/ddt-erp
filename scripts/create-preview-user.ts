import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.PREVIEW_ADMIN_EMAIL || 'admin@preview.com'
  const rawPassword = process.env.PREVIEW_ADMIN_PASSWORD
  if (!rawPassword) {
    throw new Error('Missing PREVIEW_ADMIN_PASSWORD')
  }
  const password = await bcrypt.hash(rawPassword, 12)
  
  const user = await prisma.user.upsert({
    where: { email },
    update: { password, role: 'super-admin' },
    create: {
      email,
      password,
      name: 'System Preview Admin',
      role: 'super-admin',
    }
  })
  
  console.log(`--- PREVIEW USER CREATED ---`)
  console.log(`Email: ${user.email}`)
  console.log(`Role: ${user.role}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
