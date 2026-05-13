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
  { name: "customers.view", category: "Customers", description: "Can view customer lists, profiles, and contact details." },
  { name: "customers.create", category: "Customers", description: "Can add new customers to the ERP." },
  { name: "customers.edit", category: "Customers", description: "Can update customer names, contact details, and other profile information." },
  { name: "customers.delete", category: "Customers", description: "Can permanently delete customer records." },
  { name: "customers.export", category: "Customers", description: "Can export customer records to CSV or similar files." },

  // SUPPLIERS
  { name: "suppliers.view", category: "Suppliers", description: "Can view supplier lists, profiles, and contact details." },
  { name: "suppliers.create", category: "Suppliers", description: "Can add new suppliers to the ERP." },
  { name: "suppliers.edit", category: "Suppliers", description: "Can update supplier information and business details." },
  { name: "suppliers.delete", category: "Suppliers", description: "Can permanently delete supplier records." },
  { name: "suppliers.export", category: "Suppliers", description: "Can export supplier records to CSV or similar files." },

  // PRODUCTS & INVENTORY
  { name: "products.view", category: "Inventory", description: "Can view the product catalog, stock levels, and inventory details." },
  { name: "products.create", category: "Inventory", description: "Can add new products and stock items." },
  { name: "products.edit", category: "Inventory", description: "Can update product details, prices, and inventory-related settings." },
  { name: "products.delete", category: "Inventory", description: "Can permanently remove products from the catalog." },
  { name: "inventory.export", category: "Inventory", description: "Can export inventory snapshots and stock reports." },

  // SALES
  { name: "sales.view", category: "Sales", description: "Can view quotations, sales invoices, and sales history." },
  { name: "sales.create", category: "Sales", description: "Can create new quotations, orders, or sales invoices." },
  { name: "sales.edit", category: "Sales", description: "Can edit existing sales documents before they are finalized." },
  { name: "sales.delete", category: "Sales", description: "Can void or permanently delete sales invoices and related sales documents." },
  { name: "sales.return", category: "Sales", description: "Can process customer returns and sales return adjustments." },
  { name: "sales.export", category: "Sales", description: "Can export sales reports and transaction history." },

  // PURCHASES
  { name: "purchases.view", category: "Purchases", description: "Can view purchase history, supplier bills, and purchase records." },
  { name: "purchases.create", category: "Purchases", description: "Can create new purchase orders, bills, or purchase invoices." },
  { name: "purchases.edit", category: "Purchases", description: "Can update purchase records and supplier billing details." },
  { name: "purchases.delete", category: "Purchases", description: "Can void or permanently delete purchase invoices." },
  { name: "purchases.return", category: "Purchases", description: "Can process returns back to suppliers." },
  { name: "purchases.export", category: "Purchases", description: "Can export purchase history and purchasing reports." },

  // FINANCES & PAYMENTS
  { name: "finances.view", category: "Finances", description: "Can view cash flow, balances, and financial activity." },
  { name: "payments.manage", category: "Finances", description: "Can record, adjust, or void incoming and outgoing payments." },

  // ANALYTICS & ADMIN
  { name: "reports.view", category: "Admin", description: "Can view business reports, dashboards, and analytics." },
  { name: "audit.view", category: "Admin", description: "Can view system activity history and security-related audit logs." },
  { name: "settings.manage", category: "Admin", description: "Can change company settings and workspace configuration." },
  { name: "billing.manage", category: "Admin", description: "Can view and manage billing plans, invoices, and subscription settings." },
  { name: "rbac.manage", category: "Admin", description: "Can manage user roles, permissions, and access levels." },
  { name: "branches.manage", category: "Admin", description: "Can create and manage company branches, locations, or warehouses." },
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
