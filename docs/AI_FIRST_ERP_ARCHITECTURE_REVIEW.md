# WhatsQuery AI-First ERP Architecture Review

This document is the Phase 0 architecture packet for transforming WhatsQuery into an AI-first SMB and enterprise ERP without destabilizing production.

## Goals

- Preserve production stability, tenant isolation, and RBAC.
- Evolve the current product through sequential subphases, not rewrites.
- Use the existing ERP foundation first, then add deeper enterprise capabilities.
- Treat the Smart Assistant as a safe orchestration layer over existing ERP services, not as a privileged bypass.

## Current Foundation

### Platform stack

- `Next.js` App Router frontend and route handlers
- `Prisma` ORM
- `PostgreSQL`
- `Nginx` + `systemd` on VPS
- `Stripe` for paid billing
- `Resend` for transactional email
- `Cloudflare R2` for off-server backups
- deterministic Smart Assistant already deployed

### Tenant architecture

Source of truth:
- `lib/tenant.ts`
- `lib/db/client.ts`

Key facts:
- every primary ERP record is bound to `organizationId`
- tenant access resolves through `getCurrentTenantContext()`
- Prisma is wrapped by a tenant-scoped store that injects `organizationId` into supported reads and writes
- branch context is resolved through membership + cookie + fallback rules

Practical implication:
- all future APIs, assistant actions, imports, exports, approvals, and analytics must continue to start from tenant context resolution
- no roadmap phase may introduce alternate tenant resolution paths

### RBAC architecture

Source of truth:
- `Role`
- `Permission`
- `OrganizationUser`
- `requireRole()`
- `requirePermission()`

Key facts:
- permissions are string-based and already used consistently in server actions and pages
- owners bypass granular permission checks
- platform admin is resolved separately from tenant RBAC

Practical implication:
- roadmap features should add permission strings and page/action enforcement, not replace the RBAC model

### Billing and package architecture

Source of truth:
- `lib/billing/plans.ts`
- `lib/billing/enforcement.ts`
- `Subscription`
- `OrganizationPackage`
- `Package`

Key facts:
- there is a dual model: static plan defaults in code plus package overrides in the database
- feature access is enforced at runtime by `canUseFeature()` and `assertPlanLimit()`
- Stripe, manual, and demo/trial flows already coexist

Practical implication:
- future package-aware features must use the current runtime enforcement path first
- package normalization is needed later, but not as a prerequisite to early phases

### Audit architecture

Source of truth:
- `lib/audit.ts`
- `AuditLog`
- `modules/admin/audit-service.ts`

Key facts:
- audit logging is centralized
- successful business operations should not fail if audit logging fails
- security-blocked access attempts can also be logged

Practical implication:
- current audit design is good for business observability
- immutable or security-grade logging should be added beside it, not by changing its reliability contract globally

### Assistant architecture

Source of truth:
- `modules/assistant/parser.ts`
- `modules/assistant/service.ts`
- `modules/assistant/actions.ts`
- `app/(dashboard)/dashboard/assistant`

Key facts:
- natural language is converted into structured deterministic commands
- no destructive or financial action executes without confirmation
- tenant context and RBAC are enforced on parse/execute
- browser voice/history/quick actions already exist

Practical implication:
- future AI work should extend parser plugins, clarification flows, analytics, and preview UX
- no phase should bypass the deterministic parser and confirmation model

## Domain Map

### Shared ERP core

- customers
- suppliers
- products
- inventory
- stock movements
- sales invoices
- quotations
- purchase invoices
- payments
- expenses
- branches
- exports
- imports
- reports

### Existing finance foundation

- `FinancialAccount`
- `LedgerEntry`
- `Payment`
- `Expense`

Current state:
- useful for cash/account visibility
- not yet a complete accounting system
- amounts are mostly `Float`, which is not adequate for enterprise-grade finance

### Existing vertical-specific models

- textile:
  - `FabricLot`
  - `YarnInventory`
  - `TextileOrder`
  - `TextileJobCard`
  - `DyeingBatch`
  - `StitchingBatch`
- manufacturing:
  - `BOM`
  - `BOMItem`
  - `WorkOrder`
  - `WorkOrderMaterial`
  - `Machine`
  - `ProductionLog`
  - `QualityCheck`
- retail:
  - `POSRegister`
  - `POSSale`
  - `POSReturn`
  - `CustomerLoyalty`

Decision:
- keep these models stable in early phases
- prioritize shared ERP and enterprise platform features first

## Service Ownership Map

### Core cross-cutting

- tenant and RBAC:
  - `lib/tenant.ts`
  - `lib/db/client.ts`
- billing and package enforcement:
  - `lib/billing/*`
- audit:
  - `lib/audit.ts`
  - `modules/admin/audit-*`
- platform surfaces:
  - `app/(platform)`
  - `app/wq-command-center`

### Operational domains

- customers:
  - `modules/customers`
- suppliers:
  - `modules/suppliers`
- products:
  - `modules/products`
- inventory:
  - `modules/inventory`
- sales and quotations:
  - `modules/sales`
  - `modules/quotations`
- purchases:
  - `modules/purchases`
- reports:
  - `modules/reports`
- payments/finances:
  - `modules/payments`
  - `modules/finances`
  - shared finance models currently under Prisma domain
- assistant:
  - `modules/assistant`

## Dependency Map

### Phase dependencies

- Phase 1 unlocks trust and usability for exports, PDFs, and reporting.
- Phase 2 depends on stable export/template patterns from Phase 1.
- Phase 3 is the accounting foundation and must land before approvals, referrals, advanced analytics, and deep API work.
- Phase 4 depends on Phase 3 for financially safe inventory and transfer behavior.
- Phase 5 depends on Phase 3 and Phase 4 because approvals attach to financial and inventory events.
- Phase 6 can begin after Phase 1, but gets much stronger after Phase 3.
- Phase 7 depends on billing state, command center visibility, and an internal credit ledger.
- Phase 8 depends on consistent event sources from Phases 3 through 7.
- Phase 9 partially runs in parallel, but immutable security event design depends on the event model from Phase 8.
- Phase 10 depends on stable resource ownership, finance posting, and event contracts.
- Phase 11 is now an extension phase because voice/history/confidence already exist.
- Phases 12 through 14 depend on stable finance, eventing, and analytics foundations.

### Technical chokepoints

- reporting and export logic is duplicated across routes/services today
- package logic is split across static plan config and database package metadata
- finance models are insufficient for double-entry accounting
- branch scoping exists, but warehouse scoping does not
- audit logging is centralized but not immutable

## Migration Strategy

### Migration rule

Use:
- expand
- backfill
- dual-read or compatibility-read
- switch writes
- remove obsolete paths later

### Specific migration approach

#### Finance

- do not rewrite existing finance tables in place
- introduce new Decimal-safe accounting tables beside current operational models
- progressively map sales, purchases, payments, and expenses into the new posting layer

#### Warehouse

- add warehouses under branches
- assign one default warehouse to each existing branch
- keep current branch inventory readable while moving writes toward warehouse-aware services

#### Imports and exports

- extend current infrastructure instead of replacing it
- add shared validation and preview layers first

#### Referrals

- implement a separate internal credit ledger
- do not tie reward accounting directly to Stripe coupons as the foundational model

#### Security

- add hardened security event logging alongside current `AuditLog`
- do not alter current business audit semantics globally

## Risk Register

### High risk

#### Money precision

- current totals, balances, and tax fields use `Float`
- this is not acceptable for enterprise-grade finance and accounting

Mitigation:
- introduce Decimal-based accounting schema before full finance rollout

#### Cross-phase coupling

- finance, inventory, approvals, and notifications can easily become entangled

Mitigation:
- deliver as subphases with stable contracts between them

#### Reporting performance

- several reports aggregate directly from transactional tables

Mitigation:
- stabilize report queries first, then introduce reusable reporting services and later aggregated views/materialization

### Medium risk

#### Package drift

- static plan config and database package overrides can diverge

Mitigation:
- continue enforcing through `getSubscriptionContext()` until later normalization

#### Audit durability

- best-effort audit writes are correct for business logging but not enough for security or regulated operations

Mitigation:
- add immutable security logging in the security phase

#### Mixed-industry schema sprawl

- the schema already includes textile/manufacturing/POS models that could distract roadmap scope

Mitigation:
- keep early phases focused on shared ERP core

## Phase 0 Decisions Frozen

- implementation uses production-safe subphases
- roadmap priority is shared ERP core first
- referral rewards use an internal credit ledger
- no WhatsApp integration in this roadmap
- no external paid AI APIs
- no giant architecture rewrites before phased checkpoints prove safe

## Approved Starting Point for Coding

Once this architecture packet is accepted in-repo, implementation begins with:
- Phase 1A: reports hardening
- then Phase 1B: document/PDF standardization
- then Phase 1C: export standardization

That order gives the fastest trust lift with the lowest data-model risk.
