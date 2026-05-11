# WhatsQuery ERP: PostgreSQL Migration Guide

This document outlines the steps to migrate the WhatsQuery ERP platform from SQLite to PostgreSQL for production deployment (Hostinger VPS).

## 1. Prerequisites
- A PostgreSQL 15+ instance running on your VPS.
- `DATABASE_URL` formatted as: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public`

## 2. Configuration Changes
The following changes have already been applied to the codebase:
- `prisma/schema.prisma`: Provider changed to `postgresql`.
- `scripts/final-seed.ts`: Enhanced to seed both Demo data and Platform Packages/Admin.

## 3. Migration Flow

### Local Development (with Postgres)
If you want to run Postgres locally:
1. Update `.env` with your local Postgres URL.
2. Run:
```bash
npx prisma migrate dev --name init_postgres
npx prisma generate
npm run seed
```

### Production Deployment (Hostinger VPS)
On your VPS environment:
1. Set the environment variable `DATABASE_URL`.
2. Ensure `SUPER_ADMIN_EMAILS` includes `admin@whatsquery.com`.
3. Run:
```bash
npx prisma migrate deploy
npx prisma generate
npm run build
npm run seed
```

## 4. Schema Compatibility Status
| Feature | SQLite Status | Postgres Status | Notes |
|---------|---------------|-----------------|-------|
| IDs | `cuid()` String | `cuid()` String | Fully compatible. |
| Decimals | `Float` | `Float` | Kept as Float for logic consistency. |
| JSON | `String` | `Json` | Postgres supports native JSONB. |
| Enums | `String` | `String` | Using String + Zod is safer for migration. |
| Cascades | Supported | Supported | Verified in schema relations. |

## 5. Potential Risks
- **Data Loss**: Running `migrate dev` on an existing database will reset it. Always use `migrate deploy` in production.
- **Floating Point Errors**: For high-precision accounting, consider migrating `Float` to `Decimal` in a future iteration. Current logic uses `Float` which is sufficient for standard retail ERP but requires care in rounding.
- **Case Sensitivity**: PostgreSQL is more sensitive to case in search queries than SQLite. Ensure all search actions use `.toLowerCase()` (already implemented in many places).

## 6. Verification
After migration, run:
```bash
npx prisma validate
npm run build
```
If build passes, the schema relations are intact.
