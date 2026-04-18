import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as connected`
    console.log('--- DB CONNECTION TEST ---')
    console.log(JSON.stringify(result, null, 2))
  } catch (err) {
    console.error('--- DB CONNECTION FAILED ---')
    console.error(err)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
