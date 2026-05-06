/**
 * SYSTEM-WIDE PERMISSION MANIFEST
 * Defines all granular access keys available in the WhatsQuery.
 */

export interface PermissionDefinition {
  name: string;
  category: string;
  description: string;
}

export const PERMISSIONS_CONFIG: PermissionDefinition[] = [
  // CUSTOMERS
  { name: "customers.view", category: "Customers", description: "View customer list and profiles" },
  { name: "customers.create", category: "Customers", description: "Register new customers" },
  { name: "customers.edit", category: "Customers", description: "Modify customer details" },
  { name: "customers.delete", category: "Customers", description: "Remove customer records" },
  { name: "customers.export", category: "Customers", description: "Export customer manifest to CSV" },

  // SUPPLIERS
  { name: "suppliers.view", category: "Suppliers", description: "View supplier list and profiles" },
  { name: "suppliers.create", category: "Suppliers", description: "Register new suppliers" },
  { name: "suppliers.edit", category: "Suppliers", description: "Modify supplier details" },
  { name: "suppliers.delete", category: "Suppliers", description: "Remove supplier records" },
  { name: "suppliers.export", category: "Suppliers", description: "Export supplier manifest to CSV" },

  // PRODUCTS & INVENTORY
  { name: "products.view", category: "Inventory", description: "View product catalog and stock levels" },
  { name: "products.create", category: "Inventory", description: "Add new products to catalog" },
  { name: "products.edit", category: "Inventory", description: "Modify product specifications" },
  { name: "products.delete", category: "Inventory", description: "Purge products from catalog" },
  { name: "inventory.export", category: "Inventory", description: "Export inventory snapshots" },

  // SALES
  { name: "sales.view", category: "Sales", description: "View sales history and invoices" },
  { name: "sales.create", category: "Sales", description: "Generate new sales invoices" },
  { name: "sales.edit", category: "Sales", description: "Adjust existing sales documents" },
  { name: "sales.delete", category: "Sales", description: "Void or delete sales invoices" },
  { name: "sales.return", category: "Sales", description: "Process customer returns" },
  { name: "sales.export", category: "Sales", description: "Export sales reports" },

  // PURCHASES
  { name: "purchases.view", category: "Purchases", description: "View purchase history and bills" },
  { name: "purchases.create", category: "Purchases", description: "Register new purchase orders/invoices" },
  { name: "purchases.edit", category: "Purchases", description: "Adjust purchase records" },
  { name: "purchases.delete", category: "Purchases", description: "Void or delete purchase invoices" },
  { name: "purchases.return", category: "Purchases", description: "Process returns to suppliers" },
  { name: "purchases.export", category: "Purchases", description: "Export purchase manifests" },

  // FINANCES & PAYMENTS
  { name: "finances.view", category: "Finances", description: "View cash flow and payment history" },
  { name: "payments.manage", category: "Finances", description: "Record and void payments" },

  // ANALYTICS & ADMIN
  { name: "reports.view", category: "Admin", description: "Access financial and operational reports" },
  { name: "audit.view", category: "Admin", description: "Monitor system activity and audit logs" },
  { name: "settings.manage", category: "Admin", description: "Configure organization settings and team memberships" },
  { name: "billing.manage", category: "Admin", description: "Manage subscription and billing details" },
  { name: "rbac.manage", category: "Admin", description: "Define roles and permission mappings" },
  { name: "branches.manage", category: "Admin", description: "Manage organizational branches and warehouses" },
];

/**
 * DEFAULT ROLE PERMISSIONS
 * Used during tenant onboarding to seed standard roles.
 */
export const DEFAULT_ROLE_MAPPINGS: Record<string, string[]> = {
  owner: PERMISSIONS_CONFIG.map(p => p.name), // Owner has EVERYTHING
  admin: [
    "customers.view", "customers.create", "customers.edit", "customers.export",
    "suppliers.view", "suppliers.create", "suppliers.edit", "suppliers.export",
    "products.view", "products.create", "products.edit", "inventory.export",
    "sales.view", "sales.create", "sales.edit", "sales.export",
    "purchases.view", "purchases.create", "purchases.edit", "purchases.export",
    "finances.view", "payments.manage",
    "reports.view", "audit.view", "settings.manage", "rbac.manage"
  ],
  staff: [
    "customers.view", "customers.create",
    "suppliers.view", "suppliers.create",
    "products.view",
    "sales.view", "sales.create",
    "purchases.view", "purchases.create",
    "finances.view"
  ],
};
