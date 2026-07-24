# WhatsQuery Backup and Recovery

Last reviewed: 2026-07-24

Release status: **Not verified**

## Required protection

- Daily PostgreSQL logical backup with failure alerting.
- Checksum and encryption at rest/in transit.
- Off-server copy in a separately controlled account/bucket.
- Local and off-server retention.
- Backups for Nginx/systemd/Compose configuration and a recoverable secret inventory.
- Provider-side recording/data recovery documented separately.

The repository provides `scripts/contabo-postgres-backup.sh` and
`scripts/backup-db.sh` for backup/checksum/off-server workflows. The Contabo
script creates a custom-format dump, writes and verifies a SHA-256 checksum,
checks archive readability, restores into a temporary database, compares safe
table aggregates and confirms Prisma connectivity before cleanup. Presence of
the scripts is not proof that schedules or restores work.

## Migration prerequisite

Before any production migration:

```bash
export WHATSQUERY_BACKUP_REFERENCE=/secure/path/to/verified-backup.sql.gz
bash scripts/contabo-prisma-migrate.sh deploy
```

Deploy mode checks that the archive and `.sha256` file exist and verifies the
checksum. `deploy.sh` refuses to proceed without this reference.

## Controlled restore test

1. Run `scripts/contabo-postgres-backup.sh` from the approved VPS execution context.
2. Verify custom archive and checksum evidence.
3. Confirm the script's temporary restore and Prisma connectivity pass.
4. Copy the archive off-server into the approved separately controlled storage.
5. Record RPO, RTO, backup age, aggregate counts and operator names.
6. Perform a scheduled full isolated recovery exercise before general production.

## Rollback

Prisma migration deployment is forward-only by default. Every migration requires:

- reviewed SQL and data-impact notes;
- verified backup;
- application rollback version;
- a tested forward-fix or manually reviewed rollback SQL;
- tenant-data verification after deploy.

Do not use `prisma migrate reset` or `prisma db push` in production.

## Missing evidence

- Active schedule and last successful backup.
- Off-server object existence and access controls.
- Encryption/key recovery.
- Restore completion and measured RTO/RPO.
- Config/secrets recovery.
- Backup-failure alert delivery.
- A successful 2026-07-24-or-later temporary restore from the production source.
