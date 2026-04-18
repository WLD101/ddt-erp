import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * Robust demo data seeder. Generates a realistic set of data for a new demo tenant.
 * Includes multiple branches, products, customers, suppliers, and historical transactions.
 */
export async function seedDemoWorkspace(organizationId: string, authorUserId: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Setup Base Settings (Onboarding State)
    await tx.onboardingState.create({
      data: {
        organizationId,
        currentStep: 7, // Skip onboarding
        isCompleted: true,
        completedAt: new Date(),
        completedSteps: ["welcome", "profile", "branch", "product", "customer", "invite", "transaction"],
        skippedSteps: [],
        demoDataInserted: true,
      },
    });

    // 2. Create Branches
    const hq = await tx.branch.create({
      data: {
        organizationId,
        name: "Main HQ",
        code: "HQ-01",
        address: "100 Innovation Drive, Tech City",
        isActive: true,
      },
    });

    const store = await tx.branch.create({
      data: {
        organizationId,
        name: "Downtown Store",
        code: "ST-02",
        address: "45 Market Street, Retail Hub",
        isActive: true,
      },
    });

    // Assign author to branches
    await tx.organizationUser.updateMany({
      where: { organizationId, userId: authorUserId },
      data: { branchIds: [hq.id, store.id] }
    });

    // 3. Finance setup
    const bankAccount = await tx.financialAccount.create({
      data: { organizationId, name: "Main Business Checkings", type: "BANK", currency: "USD", accountNumber: "XXXX-XXXX-9912", currentBalance: 25000 }
    });
    const cashAccount = await tx.financialAccount.create({
      data: { organizationId, name: "Petty Cash", type: "CASH", currency: "USD", currentBalance: 500 }
    });

    // 4. Products & Categories
    const electronics = await tx.category.create({ data: { organizationId, name: "Electronics", slug: "electronics" } });
    const components = await tx.category.create({ data: { organizationId, name: "Components", slug: "components" } });

    const prodLaptop = await tx.product.create({
      data: { organizationId, categoryId: electronics.id, name: "ProBook X15", sku: "PRO-X15", description: "15-inch professional laptop", unitPrice: 1299.00, costPrice: 850.00, lowStockThreshold: 5 }
    });
    const prodMouse = await tx.product.create({
      data: { organizationId, categoryId: electronics.id, name: "Ergo Wireless Mouse", sku: "ACC-M01", description: "Ergonomic wireless mouse", unitPrice: 49.99, costPrice: 15.50, lowStockThreshold: 20 }
    });
    const prodCable = await tx.product.create({
      data: { organizationId, categoryId: components.id, name: "USB-C to HDMI 2m", sku: "CBL-U2H", description: "Braided display cable", unitPrice: 24.00, costPrice: 6.00, lowStockThreshold: 50 }
    });

    // 5. Inventory Setup
    await tx.inventoryItem.createMany({
      data: [
        { organizationId, branchId: hq.id, productId: prodLaptop.id, quantity: 12 },
        { organizationId, branchId: hq.id, productId: prodMouse.id, quantity: 45 },
        { organizationId, branchId: hq.id, productId: prodCable.id, quantity: 120 },
        { organizationId, branchId: store.id, productId: prodLaptop.id, quantity: 4 },
        { organizationId, branchId: store.id, productId: prodMouse.id, quantity: 15 },
        { organizationId, branchId: store.id, productId: prodCable.id, quantity: 30 },
      ]
    });

    // 6. Customers & Suppliers
    const cust1 = await tx.customer.create({ data: { organizationId, name: "Global Tech Solutions", email: "procurement@globaltech.demo", phone: "+1 555-0101", address: "1 Corporate Way", outstandingBalance: 0 }});
    const cust2 = await tx.customer.create({ data: { organizationId, name: "Creative Studios", email: "hello@creativestudios.demo", phone: "+1 555-0202", address: "99 Art Ave", outstandingBalance: 1299.00 }}); // We will create an unpaid invoice for this
    
    const sup1 = await tx.supplier.create({ data: { organizationId, name: "Apex Electronics Mfg", email: "orders@apex.demo", phone: "+886 555-0010", outstandingBalance: 0 }});

    // 7. Transactions (Sales & Purchases)
    // Old Sale (Paid)
    const oldDate = new Date(); oldDate.setDate(oldDate.getDate() - 15);
    const sale1 = await tx.salesInvoice.create({
      data: {
        organizationId, branchId: hq.id, customerId: cust1.id, invoiceNumber: "INV-DEMO-1001",
        status: "PAID", paymentStatus: "PAID", issueDate: oldDate, dueDate: oldDate,
        subtotal: 2598.00, discount: 0, taxAmount: 0, totalAmount: 2598.00, amountPaid: 2598.00, createdBy: authorUserId,
        items: { create: [ { productId: prodLaptop.id, quantity: 2, unitPrice: 1299.00, total: 2598.00 } ] }
      }
    });

    // Payment for sale 1
    await tx.payment.create({
      data: {
        organizationId, type: "INBOUND", amount: 2598.00, date: oldDate, reference: "WIRE-773",
        financialAccountId: bankAccount.id, salesInvoiceId: sale1.id, customerId: cust1.id,
      }
    });

    // Recent Sale (Unpaid)
    const recentDate = new Date(); recentDate.setDate(recentDate.getDate() - 2);
    const due = new Date(); due.setDate(due.getDate() + 12);
    await tx.salesInvoice.create({
      data: {
        organizationId, branchId: store.id, customerId: cust2.id, invoiceNumber: "INV-DEMO-1002",
        status: "FINALIZED", paymentStatus: "UNPAID", issueDate: recentDate, dueDate: due,
        subtotal: 1299.00, discount: 0, taxAmount: 0, totalAmount: 1299.00, amountPaid: 0, createdBy: authorUserId,
        items: { create: [ { productId: prodLaptop.id, quantity: 1, unitPrice: 1299.00, total: 1299.00 } ] }
      }
    });

    // Purchase Invoice
    const purchDate = new Date(); purchDate.setDate(purchDate.getDate() - 20);
    const purch1 = await tx.purchaseInvoice.create({
      data: {
        organizationId, branchId: hq.id, supplierId: sup1.id, invoiceNumber: "PI-DEMO-500",
        status: "RECEIVED", paymentStatus: "PAID", issueDate: purchDate, dueDate: purchDate,
        subtotal: 8500.00, taxAmount: 0, totalAmount: 8500.00, amountPaid: 8500.00, createdBy: authorUserId,
        items: { create: [ { productId: prodLaptop.id, quantity: 10, unitPrice: 850.00, total: 8500.00 } ] }
      }
    });

    // Payment for purchase 1
    await tx.payment.create({
      data: {
        organizationId, type: "OUTBOUND", amount: 8500.00, date: purchDate, reference: "ACH-411",
        financialAccountId: bankAccount.id, purchaseInvoiceId: purch1.id, supplierId: sup1.id,
      }
    });

    // 8. Add a quotation
    const quoteExp = new Date(); quoteExp.setDate(quoteExp.getDate() + 5);
    await tx.quotation.create({
      data: {
        organizationId, branchId: hq.id, customerId: cust1.id, quotationNumber: "QT-DEMO-001",
        status: "SENT", expiryDate: quoteExp, subtotal: 366.95, discount: 0, totalAmount: 366.95,
        items: { create: [
          { productId: prodMouse.id, quantity: 5, unitPrice: 49.99, total: 249.95 },
          { productId: prodCable.id, quantity: 5, unitPrice: 23.40, total: 117.00 } // Slight discount quoted
        ]}
      }
    });

    // 9. Send some notifications
    await tx.notification.createMany({
      data: [
        { organizationId, userId: authorUserId, title: "Welcome to NexusERP", message: "Your demo workspace is ready. Explore the dashboard to see sample data in action.", type: "SYSTEM", isRead: false },
        { organizationId, userId: authorUserId, type: "LOW_STOCK", title: "Low Stock Alert", message: "ProBook X15 is running low in Downtown Store (4 remaining).", isRead: false },
        { organizationId, userId: authorUserId, type: "SYSTEM", title: "Quotation Viewed", message: "Global Tech Solutions has viewed Quotation QT-DEMO-001.", isRead: false },
      ]
    });

    return true;
  });
}
