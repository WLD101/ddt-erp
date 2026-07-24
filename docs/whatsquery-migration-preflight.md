# WhatsQuery Migration Preflight

## Scope

Date: Friday, July 24, 2026

Target: self-hosted Supabase PostgreSQL on the Contabo VPS.

Migrations in scope:

- `202607220001_industry_profile_onboarding`
- `202607220002_shared_integration_foundation`
- `202607220003_market_profile_foundation`
- `202607220004_integration_runtime_hardening`
- `202607230001_vapi_call_tracking`
- `202607240001_voice_privacy_controls`

## Required evidence before deployment

- The actual PostgreSQL container and Compose service are identified.
- The application and database network relationship is identified.
- The internal PostgreSQL port and any host-published port are identified.
- PgBouncer or Supavisor presence is identified.
- `DIRECT_URL` is correct for the environment running Prisma.
- PostgreSQL is not publicly exposed solely for migration access.
- A new backup archive passes checksum, archive listing and temporary restore.
- `npx prisma validate` passes.
- `npx prisma generate` passes.
- Migration status has no failed historical migration.
- Expected database name and expected tenant count match before and after.

## Environment decision

Preferred execution location: Contabo VPS host under the `whatsquery` user.

Use VPS loopback and the actual published port when PostgreSQL is bound locally.
If PostgreSQL is not published to the host, run Prisma in a purpose-built migration
container attached to the same Docker network and use the actual database service
name. Do not guess that the service is `db`.

## Safety checks implemented

- `scripts/contabo-db-topology.sh` performs redacted, read-only discovery.
- `scripts/contabo-postgres-backup.sh` creates and temporary-restore-tests a dump.
- `scripts/contabo-prisma-migrate.sh` blocks deployment without a verified archive.
- `scripts/audit-prisma-migrations.mjs` scans every migration for destructive
  statements, required columns without defaults, data rewrites and uniqueness
  constraints.
- `scripts/verify-pre-migration-database.mjs` records safe target aggregates and
  migration/backfill candidates before deployment.
- The deployment scripts use `prisma migrate deploy`, never `prisma db push`.
- Server Git updates require a clean checkout and fast-forward merge.
- Global Redis flushes were removed from the emergency deployment path.

## Stop conditions

Stop before deployment when any of these occur:

- backup restore verification fails;
- `DIRECT_URL` is missing or points to an invalid execution context;
- TCP reachability fails;
- Prisma reports a failed historical migration;
- migration SQL contains a destructive statement;
- the target database identity is unexpected;
- tenant aggregate checks reveal broken or cross-tenant relations.
- any recording/transcript artifact conflicts with the tenant privacy policy.

## Local audit result

`npm run migration:audit` scanned 27 migrations and found no destructive
blocker. Migrations containing data rewrites or unique indexes remain marked for
manual production review. This static result does not prove live applicability.
