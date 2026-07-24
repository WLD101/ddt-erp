# WhatsQuery Database Environments

## Required variables

- `DATABASE_URL`
- `DIRECT_URL`
- `INTEGRATION_CREDENTIAL_SECRET`
- `INTEGRATION_WEBHOOK_SIGNING_KEY`

`DATABASE_URL` is the application runtime connection. It may use a locally hosted
pooler when the self-hosted Supabase topology provides one.

`DIRECT_URL` is the migration and schema-engine connection. It must resolve from
the environment running Prisma and must not use a transaction-only pooler.

## Host selection

| Prisma location | Correct host form | Port |
| --- | --- | --- |
| App or migration container on the database network | Actual Compose database service | Internal PostgreSQL port |
| Contabo VPS host | `127.0.0.1` | Actual locally published PostgreSQL port |
| Protected CI runner on the VPS | `127.0.0.1` | Actual locally published PostgreSQL port |
| Windows workstation | SSH tunnel loopback | Tunnel-local port |

Do not expose PostgreSQL publicly merely to run Prisma from Windows.

## Secret handling

- Production values belong in the VPS environment or protected CI environment.
- Preview deployments must not receive production database URLs.
- Connection strings must never be printed in logs.
- Docker Compose service discovery must print names, networks and ports only.
- The workstation `.env` is not authoritative for Contabo production.
