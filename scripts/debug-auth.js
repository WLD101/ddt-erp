const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'waleed@ddterp.com';
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log('User NOT found in database.');
    return;
  }

  console.log('User found:');
  console.log('Email:', user.email);
  console.log('Password hash:', user.password);

  const testPassword = '14789Wagus';
  const isValid = await bcrypt.compare(testPassword, user.password);
  console.log('Test with "14789Wagus":', isValid ? 'SUCCESS' : 'FAILURE');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
