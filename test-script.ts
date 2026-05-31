import { PrismaClient } from "@prisma/client";
import { createSalesInvoice } from "./modules/sales/service";

const basePrisma = new PrismaClient();

async function test() {
  const org = await basePrisma.organization.findFirst();
  const branch = await basePrisma.branch.findFirst({ where: { organizationId: org!.id } });
  const customer = await basePrisma.customer.findFirst({ where: { organizationId: org!.id } });
  const product = await basePrisma.product.findFirst({ where: { organizationId: org!.id } });

  // Add organizationId to the client itself to mock getTenantStore
  const db = basePrisma.$extends({
    client: {
      organizationId: org!.id
    }
  }) as any;

  try {
    const res = await createSalesInvoice(db, branch!.id, {
      customerId: customer!.id,
      invoiceNumber: "INV-TEST-" + Date.now(),
      items: [
        {
          productId: product!.id,
          quantity: 20,
          unitPrice: 20000,
        }
      ],
      discount: 10000,
      notes: "Please pay",
      quotationId: undefined
    });
    console.log("Success:", res);
  } catch (err: any) {
    console.error("Error:", err.message);
    console.error("Stack:", err.stack);
  } finally {
    await basePrisma.$disconnect();
  }
}

test();
