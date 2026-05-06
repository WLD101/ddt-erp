import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

// Check the user admin@alsadiq.local
const user = await p.user.findFirst({
  where: { email: 'admin@alsadiq.local' },
  select: { id: true, email: true }
});
console.log("User:", JSON.stringify(user, null, 2));

// Check membership
if (user) {
  const membership = await p.organizationUser.findFirst({
    where: { userId: user.id },
    include: {
      role: { include: { permissions: true } },
      organization: { include: { branches: { where: { isMain: true }, take: 1 } } }
    }
  });
  console.log("Membership:", JSON.stringify({
    id: membership?.id,
    organizationId: membership?.organizationId,
    roleId: membership?.roleId,
    roleName: membership?.role?.name,
    assignedBranchId: membership?.assignedBranchId,
    branchCount: membership?.organization?.branches?.length,
    firstBranchId: membership?.organization?.branches?.[0]?.id,
  }, null, 2));
}

await p.$disconnect();
