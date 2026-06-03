import { prisma } from "../lib/prisma";

async function main() {
  try {
    const data = await prisma.voiceActionAuditLog.findMany({
      where: { status: { not: "SUCCESS" } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { organization: { select: { name: true } } },
    });
    console.log(data);
  } catch (e) {
    console.error(e);
  }
}

main();
