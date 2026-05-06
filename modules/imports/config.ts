export const IMPORT_TYPES = [
  "PRODUCTS",
  "CUSTOMERS",
  "SUPPLIERS",
  "ORDERS",
  "INVENTORY",
] as const;

export type ImportType = (typeof IMPORT_TYPES)[number];

export type ImportFieldDefinition = {
  key: string;
  label: string;
  required?: boolean;
  persisted?: boolean;
  help?: string;
};

export const IMPORT_FIELD_DEFINITIONS: Record<ImportType, ImportFieldDefinition[]> = {
  PRODUCTS: [
    { key: "productName", label: "Product Name", required: true, persisted: true },
    { key: "sku", label: "SKU", persisted: true },
    { key: "category", label: "Category", persisted: true },
    { key: "costPrice", label: "Cost Price", persisted: true },
    { key: "sellingPrice", label: "Selling Price", persisted: true },
    { key: "stockQuantity", label: "Stock Quantity", persisted: true },
    { key: "supplier", label: "Supplier", persisted: true, help: "Used to create supplier records if missing, but not linked to Product." },
    { key: "barcode", label: "Barcode", persisted: false, help: "Current ERP schema does not persist product barcode yet." },
    { key: "description", label: "Description", persisted: false, help: "Current ERP schema does not persist product description yet." },
  ],
  CUSTOMERS: [
    { key: "customerName", label: "Customer Name", required: true, persisted: true },
    { key: "email", label: "Email", persisted: true },
    { key: "phone", label: "Phone", persisted: true },
    { key: "address", label: "Address", persisted: true },
  ],
  SUPPLIERS: [
    { key: "supplierName", label: "Supplier Name", required: true, persisted: true },
    { key: "email", label: "Email", persisted: true },
    { key: "phone", label: "Phone", persisted: true },
    { key: "address", label: "Address", persisted: true },
  ],
  ORDERS: [
    { key: "orderNumber", label: "Order Number", required: true, persisted: true },
    { key: "customerName", label: "Customer Name", required: true, persisted: true },
    { key: "phone", label: "Phone", persisted: true },
    { key: "email", label: "Email", persisted: true },
    { key: "productSku", label: "Product SKU", required: true, persisted: true },
    { key: "quantity", label: "Quantity", required: true, persisted: true },
    { key: "price", label: "Price", required: true, persisted: true },
    { key: "discount", label: "Discount", persisted: true },
    { key: "shipping", label: "Shipping", persisted: true },
    { key: "paymentMethod", label: "Payment Method", persisted: true },
    { key: "orderStatus", label: "Order Status", persisted: true },
    { key: "orderDate", label: "Order Date", persisted: true },
  ],
  INVENTORY: [
    { key: "productSku", label: "Product SKU", required: true, persisted: true },
    { key: "stockQuantity", label: "Stock Quantity", required: true, persisted: true },
    { key: "location", label: "Location", persisted: true },
  ],
};

export const IMPORT_TEMPLATES: Record<ImportType, Array<Record<string, string>>> = {
  PRODUCTS: [
    {
      "Product Name": "Office Chair Pro",
      SKU: "CHR-001",
      Category: "Furniture",
      "Cost Price": "85",
      "Selling Price": "125",
      "Stock Quantity": "24",
      Supplier: "Karachi Furnishers",
      Barcode: "1234567890123",
      Description: "Mesh ergonomic office chair",
    },
  ],
  CUSTOMERS: [
    {
      "Customer Name": "Al Noor Traders",
      Email: "orders@alnoor.pk",
      Phone: "+92-300-1112233",
      Address: "PECHS Block 2, Karachi",
    },
  ],
  SUPPLIERS: [
    {
      "Supplier Name": "Pak Industrial Supply",
      Email: "sales@pakindustrial.pk",
      Phone: "+92-321-8887766",
      Address: "Saddar, Lahore",
    },
  ],
  ORDERS: [
    {
      "Order Number": "WEB-1001",
      "Customer Name": "Ali Raza",
      Phone: "+92-300-4445566",
      Email: "ali.raza@example.pk",
      "Product SKU": "CHR-001",
      Quantity: "2",
      Price: "125",
      Discount: "10",
      Shipping: "250",
      "Payment Method": "COD",
      "Order Status": "PAID",
      "Order Date": "2026-04-30",
    },
  ],
  INVENTORY: [
    {
      "Product SKU": "CHR-001",
      "Stock Quantity": "40",
      Location: "Warehouse A",
    },
  ],
};
