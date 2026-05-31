import { PrismaClient } from "@prisma/client";
import { createSalesInvoice } from "./modules/sales/service";

const db = new PrismaClient();

async function test() {
  try {
    const org = await db.organization.findFirst();
    if (!org) return console.log("No org");
    
    const branch = await db.branch.findFirst({ where: { organizationId: org.id } });
    if (!branch) return console.log("No branch");

    const customer = await db.customer.findFirst({ where: { organizationId: org.id } });
    if (!customer) return console.log("No customer");

    const product = await db.product.findFirst({ where: { organizationId: org.id } });
    if (!product) return console.log("No product");

    // Extend prisma to mock the scoped client
    const scopedDb = db.$extends({
      query: {
        $allModels: {
          $allOperations({ args, query }) {
            return query(args);
          }
        }
      },
      client: {
        organizationId: org.id
      }
    }) as any;

    await createSalesInvoice(scopedDb, branch.id, {
      customerId: customer.id,
      invoiceNumber: "TEST-001",
      discount: 0,
      items: [
        {
          productId: product.id,
          quantity: 1,
          unitPrice: 100
        }
      ]
    });
    console.log("Success");
  } catch (err: any) {
    console.error("ERROR CAUGHT:");
    console.error("Name:", err.name);
    console.error("Message:", err.message);
  } finally {
    await db.$disconnect();
  }
}

test();
