# WhatsQuery AI-First ERP Delivery Playbook

Use this playbook for every roadmap subphase. It is intentionally repetitive so each release packet is production-safe and decision-complete.

## Subphase Template

Every subphase must include these sections in its implementation packet:

1. architecture note
2. schema changes
3. migrations and backfill
4. backend services and actions
5. APIs and routes
6. frontend UI
7. RBAC integration
8. audit and event coverage
9. testing
10. deploy checklist
11. post-deploy verification
12. rollback note

## Required Output for Every Subphase

- architecture summary
- files changed
- migrations
- APIs added or changed
- UI added or changed
- security implications
- tests performed
- deployment result
- remaining risks

## Mandatory Engineering Rules

- no giant rewrites
- no cross-tenant bypasses
- no new feature path may skip tenant context resolution
- no destructive or financial automation without explicit controls
- no phase may weaken current RBAC
- all changes must build before deploy
- all migrations must be backward-compatible until the switch step is complete

## Schema and Migration Rules

- prefer additive schema changes first
- backfill before switching reads or writes
- when replacing old semantics:
  - read old + new
  - write old + new only if required briefly
  - switch reads
  - switch writes
  - clean up later
- for finance and credits:
  - prefer `Decimal`-safe schema
  - never add enterprise-grade money flows on raw `Float` alone

## RBAC and Tenant Safety Checklist

For every new feature:
- resolve tenant via `getCurrentTenantContext()`
- use tenant-scoped Prisma store for domain reads and writes
- enforce permission or role checks server-side
- verify platform admin paths stay separate from tenant paths
- verify exports, PDFs, imports, assistant actions, API keys, and notifications remain tenant-scoped

## Audit and Event Rules

- log business actions using current audit helpers unless the feature is security-specific
- for security-sensitive features, design a hardened event trail explicitly
- do not make ordinary business operations fail purely because a non-security audit write failed
- if a feature will later emit notifications or webhooks, define a reusable event contract at the service layer

## Test Matrix

Every subphase must test:
- super admin
- owner
- admin or manager
- staff
- restricted user

Every subphase must also test:
- tenant isolation
- invalid input
- concurrency or duplicate submission behavior
- error states
- rollback or retry behavior when relevant

## Deploy Gate

Before every production release:

```bash
npx prisma generate
npx prisma migrate deploy
npm run build
```

Then run:
- targeted route smoke tests
- permission checks for changed surfaces
- log review after restart
- post-deploy functional verification for the exact changed flow

## Rollback Rule

Every subphase packet must answer:
- can code be rolled back without schema damage?
- if not, what compatibility window is required?
- what user-visible risk exists during rollback?

Finance, approvals, warehouse, referrals, and API phases must include an explicit rollback note before release.

## Recommended First Execution Track

Use this order unless a blocker changes it:
- Phase 1A reports hardening
- Phase 1B PDF/document standardization
- Phase 1C export standardization
- Phase 2A shared import framework
- Phase 2B entity imports
- Phase 3A Decimal-safe accounting foundation

This keeps early releases high-value and low-regret while preparing the system for enterprise finance later.
