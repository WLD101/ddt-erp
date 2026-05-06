# WhatsQuery Project Report

## Executive Summary

This repository is a substantial multi-tenant WhatsQuery application built on Next.js 16 App Router, React 19, Prisma, and SQLite. It already contains meaningful implementation across marketing, authentication, onboarding, tenant operations, reporting, exports, and a platform-admin surface.

The project is promising as a foundation because it already has:

- a clear tenant model
- role and permission checks
- server actions and domain services
- onboarding and billing gates
- security-focused tests that currently pass

The main caution is readiness: the app builds, but only because TypeScript build errors are explicitly ignored. A raw `tsc --noEmit` currently reports 253 type errors, which means the codebase is not yet in a reliable state for fast feature expansion.

## What This Project Is

This is really three apps in one:

- Marketing site
  - pricing, feature pages, contact, demo booking, partner landing pages
- Tenant ERP
  - customers, suppliers, products, inventory, sales, purchases, returns, finances, reports, notifications, settings
- Platform operations console
  - tenants, packages, exports, leads, analytics, emails, changelog

That split is visible in the route groups under `app/`:

- `app/(marketing)`
- `app/(dashboard)`
- `app/(platform)`
- `app/auth`
- `app/onboarding`
- `app/api`

## Tech Stack

- Framework: Next.js `16.2.3`
- UI: React `19.2.4`
- Language: TypeScript
- Styling: Tailwind CSS v4
- Auth: NextAuth v5 beta with credentials provider
- Database: Prisma `6.0.0` with SQLite datasource
- Forms and validation: React Hook Form + Zod
- Charts: Recharts
- PDF and exports: `jspdf`, `exceljs`

Key config files:

- [package.json](C:/Users/WLD10/.gemini/antigravity/scratch/whatsquery/package.json)
- [next.config.ts](C:/Users/WLD10/.gemini/antigravity/scratch/whatsquery/next.config.ts)
- [prisma/schema.prisma](C:/Users/WLD10/.gemini/antigravity/scratch/whatsquery/prisma/schema.prisma)

## Architecture Overview

### 1. Routing and app structure

The App Router structure is sensible and fairly mature:

- marketing pages are mostly static
- ERP pages are dynamic and tenant-scoped
- platform pages are admin-only
- APIs handle auth, exports, PDF generation, and environment/debug checks

### 2. Multi-tenancy model

Multi-tenancy is one of the strongest parts of the project.

- auth embeds `organizationId` into the session token:
  - [lib/auth.ts](C:/Users/WLD10/.gemini/antigravity/scratch/whatsquery/lib/auth.ts)
- tenant resolution centralizes branch, role, and permission lookup:
  - [lib/tenant.ts](C:/Users/WLD10/.gemini/antigravity/scratch/whatsquery/lib/tenant.ts)
- scoped Prisma access attempts to inject `organizationId` automatically:
  - [lib/db/client.ts](C:/Users/WLD10/.gemini/antigravity/scratch/whatsquery/lib/db/client.ts)

This is a good foundation for avoiding cross-tenant leakage.

### 3. Domain layering

The project has a useful separation of concerns:

- `modules/*/service.ts` for business logic
- `modules/*/actions.ts` for server actions
- `components/*` and route-level clients/pages for UI
- `lib/*` for auth, tenant, security, billing, audit, export helpers

There is also a reusable server action builder:

- [lib/actions/builder.ts](C:/Users/WLD10/.gemini/antigravity/scratch/whatsquery/lib/actions/builder.ts)

That builder standardizes:

- auth and context resolution
- billing enforcement
- permission checks
- validation
- analytics
- audit logging
- path revalidation

This is a solid pattern worth keeping.

## Product Surface Area

The current product scope is broad:

- Auth and access
  - sign up, sign in, invite join, OTP verification, password reset
- Onboarding
  - business profile, branch, product, customer, invites, demo seeding
- Core ERP
  - customers, suppliers, categories, products, inventory, stock movements
- Commercial flow
  - quotations, sales invoices, purchase invoices, returns
- Finance
  - accounts, ledger, payments, expenses, transfers
- Reporting
  - KPIs, trends, top products, outstanding balances
- Operations
  - notifications, audit logs, exports
- Platform
  - tenants, plans/packages, leads, platform analytics, global exports

For a first-phase codebase, this is ambitious and already fairly comprehensive.

## Data Model Summary

The Prisma schema is extensive and aligns with the business scope:

- auth entities: `User`, `Account`, `Session`, `VerificationToken`
- tenancy: `Organization`, `OrganizationUser`, `Role`, `Permission`, `Branch`
- billing and access: `Subscription`, `Package`, `OrganizationPackage`
- ERP: `Customer`, `Supplier`, `Category`, `Product`, `InventoryItem`, `StockMovement`
- transactions: `SalesInvoice`, `PurchaseInvoice`, `Quotation`, `Payment`, `Expense`
- accounting: `FinancialAccount`, `LedgerEntry`, `AccountTransfer`
- governance: `AuditLog`, `PlatformAuditLog`, `Notification`, `ExportRequest`
- growth and admin: `Lead`, `Partner`, `Referral`, `Changelog`, `AnalyticsEvent`

The schema suggests the intended business model clearly: a tenant-isolated ERP with branch-aware operations, platform oversight, and plan-based gating.

## Security Posture

Security is another relative strength.

Observed safeguards include:

- auth-gated middleware/proxy
- tenant resolution that blocks platform admins from tenant context
- branch scoping rules
- rate limiting for login, signup, and password reset
- opaque token hashing for password reset and export approvals
- export approval flow with tokenized downloads
- security-oriented tests

Important files:

- [proxy.ts](C:/Users/WLD10/.gemini/antigravity/scratch/whatsquery/proxy.ts)
- [lib/security/access.ts](C:/Users/WLD10/.gemini/antigravity/scratch/whatsquery/lib/security/access.ts)
- [lib/security/rate-limit.ts](C:/Users/WLD10/.gemini/antigravity/scratch/whatsquery/lib/security/rate-limit.ts)
- [lib/security/tokens.ts](C:/Users/WLD10/.gemini/antigravity/scratch/whatsquery/lib/security/tokens.ts)
- [tests/security/access.test.ts](C:/Users/WLD10/.gemini/antigravity/scratch/whatsquery/tests/security/access.test.ts)

## Verification Results

### Passed

- `npm run build`
- `npm run test:security`
- `npm run lint` with warnings only

### Failed

- `npx tsc --noEmit`
  - current result: 253 TypeScript errors

This is the single biggest readiness signal for the project.

## Key Risks and Gaps

### 1. Type safety is currently disabled in production builds

In [next.config.ts](C:/Users/WLD10/.gemini/antigravity/scratch/whatsquery/next.config.ts), TypeScript build errors are ignored:

- `typescript.ignoreBuildErrors: true`

That means green builds are currently masking real integration problems.

### 2. UI and domain model drift is already visible

A clear example:

- [app/(dashboard)/sales/page.tsx](C:/Users/WLD10/.gemini/antigravity/scratch/whatsquery/app/(dashboard)/sales/page.tsx) references `inv.issueDate`
- but `SalesInvoice` in [prisma/schema.prisma](C:/Users/WLD10/.gemini/antigravity/scratch/whatsquery/prisma/schema.prisma) uses `date`, not `issueDate`

This is a sign that parts of the UI were adapted from purchase flows or older schema versions and were not fully reconciled.

### 3. Shared UI primitives and callers are out of sync

The custom button component:

- [components/ui/button.tsx](C:/Users/WLD10/.gemini/antigravity/scratch/whatsquery/components/ui/button.tsx)

does not expose `asChild`, but multiple pages use `<Button asChild>`, producing repeated type errors. That suggests either:

- the button wrapper was migrated to Base UI without updating callers
- or the wrapper is incomplete

### 4. Form typing is unstable across onboarding and sales flows

Many TypeScript errors come from React Hook Form generic mismatches in:

- onboarding product step
- sales form
- supplier form

This usually means the UI layer has been iterated quickly without a stable typed form abstraction yet.

### 5. Prisma and tooling config is incomplete

- [prisma.config.ts](C:/Users/WLD10/.gemini/antigravity/scratch/whatsquery/prisma.config.ts) imports `@prisma/config`
- `tsc` reports that module cannot be found

That points to incomplete Prisma tooling setup or stale config.

### 6. Build warnings indicate deployment hardening is not finished

Build warnings showed:

- Next inferred the wrong workspace root because of multiple lockfiles outside this repo
- `metadataBase` is not set, so metadata URLs fall back to `http://localhost:3000`

These are not fatal, but they are deployment-readiness issues.

### 7. Some APIs are operational or debug oriented

These routes are protected, but they should still be reviewed before production launch:

- [app/api/debug-env/route.ts](C:/Users/WLD10/.gemini/antigravity/scratch/whatsquery/app/api/debug-env/route.ts)
- [app/api/test-db/route.ts](C:/Users/WLD10/.gemini/antigravity/scratch/whatsquery/app/api/test-db/route.ts)

They look intentionally admin-only, which is good, but they are the kind of endpoints that often get forgotten.

## Maturity Assessment

### Stronger areas

- overall product vision and module coverage
- multi-tenant architecture
- access-control intent
- schema breadth
- security testing discipline
- server-side organization of business logic

### Weaker areas

- type correctness
- UI primitive consistency
- form abstraction stability
- some domain naming consistency
- deployment hardening

## Recommended Build Strategy

Before adding major new features, I would treat this as a stabilization-first project.

### Phase 1: Make the codebase trustworthy

1. Remove the need for `ignoreBuildErrors`
2. Fix the highest-volume TypeScript categories first:
   - `asChild` button usage
   - `issueDate` vs `date` mismatches
   - React Hook Form generic mismatches
   - nullability mismatches from Prisma models
3. Decide whether Base UI wrappers should mimic shadcn-style APIs or not, then standardize
4. Fix Prisma config and package mismatch

### Phase 2: Lock down the platform contract

1. Define canonical domain terminology:
   - `date` vs `issueDate`
   - `status` enums
   - account and payment shapes
2. Introduce stronger shared DTOs and types between services and pages
3. Decide which routes are production-grade vs placeholders

### Phase 3: Build with confidence

After stabilization, the best expansion areas are:

- billing and package management
- richer reporting and analytics
- better exports and imports
- tenant admin workflows
- notification delivery channels

## Suggested First Work Items

If we want to start building immediately, this is the order I would choose:

1. TypeScript recovery sprint
   - get `npx tsc --noEmit` to zero
2. UI primitive contract cleanup
   - especially `Button`, `Progress`, and accordion usage
3. Domain naming cleanup
   - align sales, purchases, invoices, and reports
4. Production hardening
   - `metadataBase`, Turbopack root, and review of debug routes
5. Feature roadmap selection
   - choose one vertical to deepen instead of widening scope further

## Bottom Line

This is a real product foundation, not a toy scaffold. The architecture and scope are strong enough to build on.

The main issue is not missing features. It is internal consistency. Right now the project is broad, but not yet stable enough to safely accelerate without first fixing the type and system drift.

If we do a short stabilization pass first, this can become a very workable base for continued WhatsQuery development.
