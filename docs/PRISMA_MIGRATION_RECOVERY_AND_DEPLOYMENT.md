# Prisma Migration Recovery and Deployment

Prepared: 2026-07-25

Target: WhatsQuery production on the Contabo VPS

Database: PostgreSQL on `127.0.0.1:5432`

Application directory: `/var/www/whatsquery`

## Safety rules

- Use the approved recovery-branch commit, not an unreviewed working tree.
- Confirm the verified PostgreSQL backup still exists before migration work.
- Never run `prisma migrate reset`.
- Never run `prisma db push`.
- Never edit `_prisma_migrations` manually.
- Never run `migrate resolve` for a successfully applied migration.
- Do not print `.env`, `DATABASE_URL`, `DIRECT_URL` or credentials.
- Stop if the failed Phase 3 migration has partially created any schema object.

## 1. Select the approved release

Run as an operator with access to `/var/www/whatsquery`:

```bash
set -euo pipefail

APP_DIR=/var/www/whatsquery
RECOVERY_BRANCH=fix/prisma-migration-encoding-recovery
APPROVED_COMMIT="<approved-full-commit-sha>"

cd "${APP_DIR}"
test -z "$(git status --porcelain)"
git fetch origin "${RECOVERY_BRANCH}"
git cat-file -e "${APPROVED_COMMIT}^{commit}"
git switch --detach "${APPROVED_COMMIT}"
test "$(git rev-parse HEAD)" = "${APPROVED_COMMIT}"
git status --short
```

`git status --short` must be empty. Do not continue from a dirty checkout.

## 2. Install and validate files

```bash
cd /var/www/whatsquery
npm ci
npm run migration:encoding-check
npm run test:migrations
npx prisma validate
npx prisma generate
npm run migration:audit
```

Expected encoding result:

```text
Prisma migration encoding check passed: 27 migration file(s).
```

Confirm the recovered migration:

```bash
test "$(git hash-object --no-filters \
  prisma/migrations/202607100003_telecom_phase3_launch_readiness/migration.sql)" \
  = "c4e838c9fb8bac66671b6b9f214cee51324b5e6c"
```

## 3. Load production configuration safely

```bash
cd /var/www/whatsquery
set -a
source .env
set +a
test -n "${DIRECT_URL:-}"
```

Do not echo any environment value.

## 4. Check Prisma status

```bash
npx prisma migrate status || true
```

P3009 is expected while the old Phase 3 attempt remains recorded as failed. Any
other failed migration is a stop condition.

## 5. Inspect the failed record and partial artifacts

The following read-only check prints migration timestamps, checksums and schema
object names, but no connection string or credentials:

```bash
node --input-type=module <<'NODE'
import { PrismaClient } from "@prisma/client";

const target = "202607100003_telecom_phase3_launch_readiness";
const db = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } },
});

try {
  const records = await db.$queryRawUnsafe(
    `SELECT migration_name, checksum, started_at, finished_at, rolled_back_at,
            applied_steps_count
       FROM "_prisma_migrations"
      WHERE migration_name = $1
      ORDER BY started_at`,
    target,
  );
  const columns = await db.$queryRawUnsafe(
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'VoiceJob'
        AND column_name IN (
          'idempotencyKey', 'correlationId', 'entityType', 'entityId',
          'lockedAt', 'lockedBy', 'deadLetteredAt', 'failureCode'
        )
      ORDER BY column_name`,
  );
  const tables = await db.$queryRawUnsafe(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = current_schema()
        AND table_name IN (
          'TelecomActivationControl', 'TelecomRateCard',
          'TelecomUsageLedger', 'TelecomBackfillCursor',
          'TelecomOperationalAlert'
        )
      ORDER BY table_name`,
  );

  console.dir({ records, columns, tables }, { depth: null });
} finally {
  await db.$disconnect();
}
NODE
```

Proceed only when all of the following are true:

- the only unresolved failure is
  `202607100003_telecom_phase3_launch_readiness`;
- its latest record has `finished_at = null` and `rolled_back_at = null`;
- `columns` is empty;
- `tables` is empty;
- the verified backup and checksum are available.

If any target column or table exists, stop. Do not mark the migration rolled
back and do not attempt manual cleanup without a separately reviewed plan.

## 6. Mark only the failed attempt rolled back

Run this command only after the checks in section 5 pass:

```bash
npx prisma migrate resolve \
  --rolled-back 202607100003_telecom_phase3_launch_readiness
```

Re-run the read-only inspection and confirm the old failed record now has a
non-null `rolled_back_at`. Do not resolve any other migration.

## 7. Apply pending migrations

```bash
npm run migration:encoding-check
npm run migration:audit
npx prisma migrate deploy
npx prisma migrate status
node scripts/verify-live-database.mjs
```

`npx prisma migrate status` must report that the database schema is up to date.
The live verifier must pass without missing migration, table, column,
cross-tenant or recording-policy errors.

## 8. Build and restart

```bash
cd /var/www/whatsquery
npx prisma generate
npm run build
sudo systemctl restart whatsquery.service
sudo systemctl --no-pager --full status whatsquery.service
```

If `whatsquery-worker.service` exists:

```bash
if systemctl list-unit-files whatsquery-worker.service --no-legend \
  | grep -q whatsquery-worker; then
  sudo systemctl restart whatsquery-worker.service
  sudo systemctl --no-pager --full status whatsquery-worker.service
fi
```

## 9. Logs and health

```bash
sudo journalctl \
  -u whatsquery.service \
  --since "-10 minutes" \
  --no-pager \
  --output=short-iso

curl --fail --silent --show-error http://127.0.0.1:3000/health
curl --fail --silent --show-error https://voice.whatsquery.com/health
```

Verify sign-in and one tenant-safe read-only workflow. Do not enable live calls
or unfinished integration flags as part of this migration recovery.

## 10. Application rollback

If the application build or service fails but database integrity is intact,
deploy the previously approved application commit:

```bash
set -euo pipefail
cd /var/www/whatsquery
PREVIOUS_COMMIT="<previous-approved-full-commit-sha>"

git cat-file -e "${PREVIOUS_COMMIT}^{commit}"
git switch --detach "${PREVIOUS_COMMIT}"
test "$(git rev-parse HEAD)" = "${PREVIOUS_COMMIT}"
npm ci
npm run migration:encoding-check
npx prisma generate
npm run build
sudo systemctl restart whatsquery.service
sudo systemctl --no-pager --full status whatsquery.service
curl --fail --silent --show-error http://127.0.0.1:3000/health
```

Do not reverse Prisma migrations automatically. Prefer a reviewed forward fix
when the database is healthy.

## 11. Verified-backup recovery

Database restore is an incident-command action, not an automatic deployment
step. First stop application writes and verify the archive:

```bash
set -euo pipefail
VERIFIED_BACKUP="<absolute-path-to-verified-custom-format-backup>"

test -s "${VERIFIED_BACKUP}"
test -f "${VERIFIED_BACKUP}.sha256"
(
  cd "$(dirname "${VERIFIED_BACKUP}")"
  sha256sum --check "$(basename "${VERIFIED_BACKUP}").sha256"
)
sudo systemctl stop whatsquery.service
```

Restore side-by-side first, never over the production database:

```bash
RESTORE_DB="whatsquery_recovery_$(date -u +%Y%m%d%H%M%S)"
sudo -u postgres createdb "${RESTORE_DB}"
sudo -u postgres pg_restore \
  --exit-on-error \
  --no-owner \
  --no-acl \
  --dbname="${RESTORE_DB}" \
  "${VERIFIED_BACKUP}"
sudo -u postgres psql \
  --dbname="${RESTORE_DB}" \
  --command='SELECT count(*) AS migration_records FROM "_prisma_migrations";'
sudo -u postgres psql \
  --dbname="${RESTORE_DB}" \
  --command='SELECT count(*) AS tenant_records FROM "Organization";'
```

Compare expected tenant and migration aggregates. Switching application URLs to
the recovered database requires explicit incident approval and the normal
secret-management process. Do not paste connection strings into shell history
or this document.

If the side-by-side restore is rejected:

```bash
sudo -u postgres dropdb --if-exists "${RESTORE_DB}"
sudo systemctl start whatsquery.service
```

## Stop conditions

- migration encoding validation fails;
- the checked-out commit differs from the approved commit;
- the worktree is dirty;
- the backup checksum fails;
- another migration is failed;
- any Phase 3 target artifact exists before resolution;
- Prisma status reports an unexpected applied/pending set;
- live schema or tenant verification fails;
- the service or either health endpoint fails.
