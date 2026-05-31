import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const res = await prisma.customer.findUnique({
      where: {
        id: "test",
        unknownArg: "test"
      } as any
    });
    console.log("SUCCESS:", res);
  } catch (err: any) {
    console.log("ERROR 1:", err.message);
  }
}
main();
