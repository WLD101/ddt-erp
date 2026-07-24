# WhatsQuery Database Security

Last reviewed: 2026-07-23

## Deployment model

Supabase deployment type: **Self-hosted on Contabo VPS**

The local Compose files are examples and are not proof of the live topology.
The Windows `.env` currently points to an unreachable Supabase Cloud pooler and
must not be used to diagnose or migrate production.

## Intended connection methods

| Prisma execution location | Correct host |
| --- | --- |
| App/migration container on the database Docker network | Actual PostgreSQL Compose service and internal port 5432 |
| Contabo VPS host | `127.0.0.1` and actual loopback-published port |
| Windows workstation | SSH local forwarding only; never publicly expose PostgreSQL |

`scripts/contabo-db-topology.sh` reports service/network/port/pooler metadata
without printing passwords or full connection strings.

## Application access

- No browser Supabase client or service-role key use was found.
- Prisma/backend authorization is the primary tenant control.
- No unsafe Prisma raw-query methods were found in the reviewed application paths.
- The tenant extension covers tenant reads/writes; service role and branch checks
  remain mandatory.
- Slow query logs use a query fingerprint and duration, not SQL parameters.

## RLS

No RLS enablement/policy migrations were found. This does not create a browser
bypass if all tenant schemas are reachable only by the trusted Prisma role, but
it becomes a High/Critical exposure if PostgREST anonymous/authenticated roles or
Studio expose those tables. Verify live grants and exposed schemas before pilot.

## Required live checks

- PostgreSQL service name, version, internal and published ports.
- App and migration execution network.
- Database/app/migration roles and whether the app role is non-superuser.
- PgBouncer/Supavisor presence and whether Prisma `DIRECT_URL` bypasses it.
- TLS/private-network behavior and connection/time/statement limits.
- Firewall and Docker publish bindings.
- Supabase Studio and admin API exposure/authentication.
- Extensions, default credentials, database logging, disk capacity.
- Applied/pending migrations and committed schema parity.

## Migration safety

`scripts/contabo-prisma-migrate.sh`:

1. validates execution/connection placement;
2. audits every committed migration for destructive patterns;
3. validates/generates Prisma;
4. reports migration status;
5. requires a checksum-verified backup for deploy mode;
6. runs `migrate deploy`, status, and live aggregate verification.

Never run `prisma migrate reset` or substitute `prisma db push` in production.

## Evidence status

```text
Supabase deployment type: Self-hosted on Contabo VPS
Prisma execution location: Not production-verified
PostgreSQL connection method: Not production-verified
Docker database service: Not production-verified
Internal database port: Expected 5432; not production-verified
Published host port: Not production-verified
Pooler present: Not production-verified
Migration command environment: Intended Contabo VPS/app network
Pending migrations: Unknown
Applied migrations: Unknown
Live schema verified: No
Existing tenants verified: No
```

