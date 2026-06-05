const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'testvoice@whatsquery.com' }});
  if (user) {
    console.log("User testvoice@whatsquery.com found:", user.id);
  } else {
    console.log("User testvoice@whatsquery.com not found. Create via web.");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
