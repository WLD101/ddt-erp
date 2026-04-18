import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@preview.com'
  const password = await bcrypt.hash('14789Wagus.', 12)
  
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
