const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findUnique({
    where: { email: 'testvoice@whatsquery.com' }
  });
  
  if (!user) {
    console.log("User testvoice@whatsquery.com NOT FOUND");
    
    // Create it?
    const newOrg = await prisma.organization.create({
      data: {
        name: "CoffeeFix Test",
        type: "restaurant",
        plan: "growth"
      }
    });
    
    const newUser = await prisma.user.create({
      data: {
        email: 'testvoice@whatsquery.com',
        name: 'Test Voice Admin',
        authStatus: 'verified'
      }
    });
    
    await prisma.organizationUser.create({
      data: {
        organizationId: newOrg.id,
        userId: newUser.id,
        role: "admin"
      }
    });
    
    console.log("Created user and org", newUser.id, newOrg.id);
    return;
  }
  
  console.log("User found:", user.id, user.email);
  const orgUsers = await prisma.organizationUser.findMany({
    where: { userId: user.id },
    include: { organization: true }
  });
  
  if (orgUsers.length === 0) {
    console.log("User has no orgs!");
  } else {
    for (const ou of orgUsers) {
      console.log("Org:", ou.organization.name, "Role:", ou.role);
    }
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
