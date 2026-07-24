# WhatsQuery Migration Recovery Plan

## Backup

Use the PostgreSQL container name reported by
`scripts/contabo-db-topology.sh`:

```bash
sudo env WHATSQUERY_DB_CONTAINER="<reported-container-name>" \
  bash scripts/contabo-postgres-backup.sh
```

The script:

- creates a custom-format `pg_dump`;
- creates a SHA-256 checksum;
- verifies the archive catalog;
- restores into a uniquely named temporary database;
- checks that public tables were restored;
- removes only the temporary verification database;
- keeps the verified archive under `/var/backups/whatsquery/postgres`.

Record the printed UTC timestamp and archive path in the deployment record.

## Recovery authority

Only a VPS administrator with Docker and PostgreSQL access may restore production.
Application operators must stop writes before a restore. Credentials and full
database URLs must not be copied into tickets or documentation.

## Recovery sequence

1. Stop the `whatsquery` application and workers.
2. Preserve current logs and create an additional failure-state backup when safe.
3. Confirm the intended restore archive and validate its checksum.
4. Restore into a separate recovery database first.
5. Verify schema, migration history and tenant aggregates.
6. Switch production only after explicit administrator approval.
7. Restart services and run application smoke tests.

Do not drop or overwrite the active database as an automatic rollback step.
Additive schema migrations normally remain in place while application code is
rolled back. A database restore is the last-resort recovery path.
