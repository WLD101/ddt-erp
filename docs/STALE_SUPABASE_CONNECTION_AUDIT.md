# Stale Supabase Connection Audit

Date: 2026-07-25
Branch: `codex/integration-runtime-worker-slice`
Scope: local build, tracked configuration, CI preflight, deployment preflight

## Summary

The stale Supabase Cloud database dependency was not coming from tracked production configuration. The active stale source was an ignored local `.env` file that still pointed Prisma at a legacy Supabase Cloud pooler and direct host.

The production database model for this repository is self-hosted PostgreSQL on the Contabo VPS. Production Prisma is expected to use server-provided `DATABASE_URL` and `DIRECT_URL` values and must not depend on Supabase Cloud hosts.

The production build issue was caused by authenticated application layouts and pages executing Prisma-backed logic during Next.js build analysis and prerender classification. That allowed the local stale `.env` values to be consulted even though those routes should only run at request time.

## Exact stale source found

### Source: ignored local `.env`

- Tracked: no
- Affected environments: local build and any command that loaded `.env`
- Status on discovery: stale
- Original sanitized findings:
  - `DATABASE_URL` host: `aws-0-us-east-1.pooler.supabase.com:6543`
  - `DIRECT_URL` host: `db.abtvavpyiluguncfcdod.supabase.co:5432`
- Remediation:
  - local values were replaced with loopback placeholders for validation
  - the new preflight blocks future stale Supabase host reuse

### Source: tracked `.env.example`

- Tracked: yes
- Affected environments: developer setup guidance, CI copy-paste risk
- Status on discovery: current but misleading
- Prior issue:
  - example values used loopback `127.0.0.1:6543`, which resembled a pooler pattern and did not match the documented Contabo direct PostgreSQL default
- Remediation:
  - updated to loopback `127.0.0.1:5432`
  - clarified that self-hosted Contabo deployments should use loopback or protected Docker-service hosts, not Supabase Cloud or public poolers

### Source: tracked workflow and deployment files

- `.github/workflows/ci.yml`
- `.github/workflows/prisma-migrate.yml`
- `scripts/vps-emergency-deploy.sh`

Tracked: yes

Status: current after remediation

Remediation:

- added `npm run db:env-check` preflight
- CI uses safe loopback placeholders
- production migration workflow and VPS deploy script now fail early if a forbidden stale Supabase host is configured

## Repository findings

The following tracked files intentionally reference database environment variables and remain valid:

- `prisma/schema.prisma`
- `prisma.config.ts`
- `docker-compose.yml`
- `docker-compose.local.yml`
- `docker-compose.prod.yml`
- migration and deployment runbooks in `docs/`

No tracked production configuration in this branch contained the stale Supabase Cloud host that triggered the build investigation.

## Build-time database call chain

### Before remediation

1. `npm run build` executed `prisma generate && next build`
2. Next.js loaded `.env`
3. private/authenticated app routes imported `@/lib/prisma`
4. Prisma datasource values came from `prisma/schema.prisma` via `env("DATABASE_URL")` and `env("DIRECT_URL")`
5. during build analysis, authenticated layouts/pages executed Prisma-backed logic
6. Prisma attempted to use the stale local `.env` host
7. some failures were swallowed or only surfaced as logs while the build continued, which made the problem easy to miss

### First concrete route/module chain confirmed during audit

- private route family: `app/(dashboard)/layout.tsx`
- private route family: `app/(platform)/layout.tsx`
- private route family: `app/(voice)/voice/admin/layout.tsx`
- private route family: `app/(voice)/voice/dashboard/layout.tsx`
- private route/page: `app/(voice)/voice/onboarding/page.tsx`
- private route/page: `app/(voice)/voice/pricing/page.tsx`

Those routes fan into request-time auth, tenant resolution, billing state, onboarding data, and organization lookups through modules such as:

- `@/lib/auth`
- `@/lib/tenant`
- `@/lib/billing/access`
- `@/modules/voice/service`
- `@/lib/prisma`

Public content such as `app/(voice)/voice/docs/page.tsx` was not the stale connection source.

## Fix applied

The smallest correct change was to mark only the authenticated database-backed route families/pages as dynamic so they are evaluated at request time instead of during static build analysis:

- `app/(dashboard)/layout.tsx`
- `app/(platform)/layout.tsx`
- `app/(voice)/voice/admin/layout.tsx`
- `app/(voice)/voice/dashboard/layout.tsx`
- `app/(voice)/voice/onboarding/page.tsx`
- `app/(voice)/voice/pricing/page.tsx`

This keeps public marketing and docs pages build-safe without globally forcing the entire app dynamic.

## Environment validation added

New script:

- `scripts/check-database-environment.mjs`

New npm command:

- `npm run db:env-check`

Behavior:

- scans runtime env sources and tracked examples
- reports sanitized protocol, host, port, database, tracked state, and host kind
- detects forbidden `*.supabase.com`, `*.supabase.co`, and `*.pooler.supabase.com` hosts
- fails deployment preflight when a stale Supabase host is configured in runtime or production contexts
- avoids printing credentials or full connection strings

Integrated into:

- `.github/workflows/ci.yml`
- `.github/workflows/prisma-migrate.yml`
- `scripts/vps-emergency-deploy.sh`

## Validation proof

### DB environment preflight

After sanitizing the ignored local `.env`, `npm run db:env-check` reported only loopback hosts and zero failures.

### Production build

`npm run build` completed successfully on 2026-07-25 with:

- environment load from `.env.local` and `.env`
- successful `prisma generate`
- successful Next.js production build
- successful static page generation
- no log lines containing:
  - `aws-0-us-east-1.pooler.supabase.com`
  - `pooler.supabase.com`
  - `supabase.co`
  - `:6543`

That is the proof point that the stale Supabase host was no longer contacted during build.

## Safe remediation guidance

- keep real production `DATABASE_URL` and `DIRECT_URL` only in server-managed environment variables
- keep local `.env` values loopback or Docker-network scoped
- do not expose PostgreSQL publicly just to run Prisma from a workstation
- run migration commands from the VPS host, application container, or protected CI path
- keep public marketing/docs pages build-safe and database-independent
- keep authenticated/private routes explicitly request-time when they depend on auth, tenant context, or Prisma
