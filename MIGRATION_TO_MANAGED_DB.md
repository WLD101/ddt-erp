# MIGRATION TO MANAGED DB

## Goal
Move WhatsQuery from the current VPS-hosted PostgreSQL instance to a managed PostgreSQL provider without breaking tenant isolation or billing/usage enforcement.

## Triggers To Migrate
- connection usage regularly exceeds 60 to 70 percent
- slow-query volume remains elevated after indexing and query cleanup
- backup confidence is weak
- restore testing becomes operationally heavy
- storage growth or write throughput starts affecting application latency

## Recommended Migration Phases

### Phase 1: Readiness
- inventory all Prisma migrations
- document all DB-side extensions and settings
- verify application can run with managed DB SSL requirements
- measure current DB size and largest tables
- identify write-heavy workloads:
  - invoices
  - purchases
  - analytics events
  - export requests

### Phase 2: Provider Setup
- provision managed PostgreSQL
- enable PITR if available
- configure private networking or IP allowlisting
- create application credentials with least privilege
- enable automated backups and retention

### Phase 3: Compatibility Validation
- restore latest backup into managed DB staging
- run:
  - `prisma generate`
  - `prisma migrate deploy`
  - `npm run build`
- smoke test:
  - auth
  - tenant context
  - exports
  - reports
  - assistant
  - billing

### Phase 4: Data Cutover
- freeze writes briefly
- take final VPS DB snapshot
- restore/import into managed DB
- update `DATABASE_URL`
- restart application
- verify tenant counts, invoices, purchases, and recent activity totals

### Phase 5: Stabilization
- compare:
  - response times
  - DB connections
  - slow query counts
  - export/report generation times
- keep old DB instance read-only until confidence window ends

## Data Validation Checklist
- total organizations match
- total users match
- total customers/suppliers/products match
- current month invoices and purchases match
- latest subscriptions and package assignments match
- recent audit and analytics events match

## Rollback Plan
- keep VPS DB intact during cutover
- if managed DB fails validation:
  - restore old `DATABASE_URL`
  - restart app
  - re-enable writes on VPS DB

## Special WhatsQuery Notes
- usage counters are derived from live data, so record totals must validate cleanly
- assistant and reporting analytics events should migrate fully or monthly usage visibility becomes inaccurate
- do not switch during heavy billing or export windows

