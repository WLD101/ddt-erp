const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL || 'waleed@whatsquery.com';
  const password = process.env.SUPER_ADMIN_BOOTSTRAP_PASSWORD;
  if (!password) {
    throw new Error('Missing SUPER_ADMIN_BOOTSTRAP_PASSWORD');
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
    },
    create: {
      email,
      name: 'Waleed',
      password: hashedPassword,
    },
  });

  console.log('Super Admin user upserted:', user.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
