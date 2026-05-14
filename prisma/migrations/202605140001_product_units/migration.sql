-- Product unit metadata for readable ERP catalog and branch-scoped opening stock setup

ALTER TABLE "Product"
ADD COLUMN     "unitType" TEXT,
ADD COLUMN     "unit" TEXT;
