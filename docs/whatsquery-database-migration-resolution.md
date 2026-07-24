# WhatsQuery Database Migration Resolution

## Status

Date: Thursday, July 23, 2026

Supabase deployment type: **self-hosted on the Contabo VPS**.

The earlier diagnosis based on Supabase Cloud project hosts and regional poolers is
superseded. The workstation `.env` still contains a cloud-style direct host, but
that file is not evidence of the active Contabo production topology.

## Confirmed repository facts

- Prisma uses `DATABASE_URL` for application queries.
- Prisma uses `DIRECT_URL` for migration and schema-engine work.
- The deployed repository path used by the scripts is `/var/www/whatsquery`.
- The application is normally restarted through the `whatsquery` systemd service.
- Repository Compose examples use a service named `db`, but they are generic ERP
  examples and are not authoritative for the self-hosted Supabase deployment.
- The actual PostgreSQL Compose service, network, published port, pooler and
  database name must be read on the VPS.
- No migration has been claimed as applied without live evidence.

## Access result from this session

An SSH key-only connection to the VPS was attempted and rejected by the server.
No password was requested or stored. Live Docker and database inspection therefore
must be run from the existing VPS terminal.

## Safe execution path

From the Contabo VPS:

```bash
cd /var/www/whatsquery
sudo bash scripts/contabo-db-topology.sh
```

Use the reported PostgreSQL container name to create and restore-test a backup:

```bash
sudo env WHATSQUERY_DB_CONTAINER="<reported-container-name>" \
  bash scripts/contabo-postgres-backup.sh
```

Run the non-mutating migration preflight as the application user:

```bash
sudo -u whatsquery bash scripts/contabo-prisma-migrate.sh inspect
```

Then deploy with the exact verified archive path printed by the backup command:

```bash
sudo -u whatsquery env \
  WHATSQUERY_BACKUP_REFERENCE="/var/backups/whatsquery/postgres/<verified-file>.dump" \
  bash scripts/contabo-prisma-migrate.sh deploy
```

The deploy script validates the checksum, audits the four migration files for
destructive patterns, runs Prisma validation and generation, applies migrations,
checks final migration status and performs aggregate live schema and tenant checks.

## Connection rules

- Prisma inside a container on the Supabase Docker network must use the actual
  PostgreSQL Compose service name and internal port.
- Prisma on the VPS host should use `127.0.0.1` and the actual published PostgreSQL
  port.
- Prisma on Windows should not require public PostgreSQL exposure. Use the VPS
  path above or an SSH tunnel when a workstation connection is unavoidable.
- A pooler may be used for application traffic. `DIRECT_URL` must target the
  migration-compatible PostgreSQL path.

## Prohibited operations

- `prisma migrate reset`
- `prisma db push`
- `prisma db push --accept-data-loss`
- public PostgreSQL exposure solely for workstation migrations
- editing migration history manually
- printing complete connection strings
