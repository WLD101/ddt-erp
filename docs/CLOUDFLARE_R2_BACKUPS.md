# WhatsQuery Cloudflare R2 Backup Runbook

This extends the existing PostgreSQL backup flow in `scripts/backup-db.sh` so the same verified local backup is also copied to Cloudflare R2.

## What the script now does

Each scheduled backup run will:

1. Read `DATABASE_URL` from `/var/www/whatsquery/.env`
2. Create a compressed PostgreSQL dump
3. Write a SHA-256 checksum
4. Verify the gzip archive
5. Restore the dump into a temporary verification database
6. Prune old local backups
7. Upload the backup and checksum to Cloudflare R2 if R2 is configured
8. Verify the uploaded object size in R2
9. Prune old R2 backup objects
10. Send a failure alert through Resend or a webhook if configured

## Required production environment variables

Add these to `/var/www/whatsquery/.env`:

```env
WHATSQUERY_BACKUP_RETENTION_DAYS="14"
WHATSQUERY_BACKUP_ALERT_EMAIL="ops@whatsquery.com"
# Optional alert webhook for Slack / Discord / Teams
# WHATSQUERY_BACKUP_ALERT_WEBHOOK_URL="https://hooks.example.com/services/..."

WHATSQUERY_BACKUP_R2_ENABLED="true"
WHATSQUERY_BACKUP_R2_ACCOUNT_ID="e1678ab2f74805919305d5dace34d22d"
WHATSQUERY_BACKUP_R2_ENDPOINT="https://e1678ab2f74805919305d5dace34d22d.r2.cloudflarestorage.com"
WHATSQUERY_BACKUP_R2_BUCKET="whatsquery-backups"
WHATSQUERY_BACKUP_R2_PREFIX="postgres"
WHATSQUERY_BACKUP_R2_REGION="auto"
WHATSQUERY_BACKUP_R2_RETENTION_DAYS="30"
WHATSQUERY_BACKUP_R2_ACCESS_KEY_ID="REPLACE_WITH_R2_ACCESS_KEY_ID"
WHATSQUERY_BACKUP_R2_SECRET_ACCESS_KEY="REPLACE_WITH_R2_SECRET_ACCESS_KEY"
```

Important:

- The value `https://e1678ab2f74805919305d5dace34d22d.r2.cloudflarestorage.com/whatsquery-backups` is the endpoint + bucket path, not the access key.
- You still need a real Cloudflare R2 Access Key ID and Secret Access Key.

## Cloudflare R2 setup

1. Open Cloudflare Dashboard.
2. Go to `R2` -> `Manage R2 API Tokens`.
3. Create an API token with read/write access to bucket `whatsquery-backups`.
4. Copy:
   - Access Key ID
   - Secret Access Key
5. Put them into:
   - `WHATSQUERY_BACKUP_R2_ACCESS_KEY_ID`
   - `WHATSQUERY_BACKUP_R2_SECRET_ACCESS_KEY`

## VPS prerequisites

Install AWS CLI v2 on the VPS because the backup script uses S3-compatible upload commands:

```bash
sudo apt update
sudo apt install -y unzip curl
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip"
unzip -o /tmp/awscliv2.zip -d /tmp
sudo /tmp/aws/install --update
aws --version
```

## Run a manual backup

```bash
sudo systemctl start whatsquery-postgres-backup.service
sudo journalctl -u whatsquery-postgres-backup.service -n 100 --no-pager
tail -n 100 /var/log/whatsquery/postgres-backup.log
```

## Verify local backup output

Local path:

```bash
ls -lah /var/backups/whatsquery/postgres
```

Expected artifacts:

- `whatsquery_YYYY-MM-DD_HH-MM-SS.sql.gz`
- `whatsquery_YYYY-MM-DD_HH-MM-SS.sql.gz.sha256`
- `latest.sql.gz`
- `latest.sql.gz.sha256`

## Verify R2 upload

```bash
aws \
  --endpoint-url "https://e1678ab2f74805919305d5dace34d22d.r2.cloudflarestorage.com" \
  s3 ls s3://whatsquery-backups/postgres/ \
  --recursive
```

## Restore verification procedure

Restore a backup into a scratch database:

```bash
BACKUP_FILE="/var/backups/whatsquery/postgres/latest.sql.gz"
RESTORE_DB="whatsquery_restore_manual_$(date +%s)"

sudo -u postgres createdb "${RESTORE_DB}"
gunzip -c "${BACKUP_FILE}" | sudo -u postgres psql --single-transaction --set ON_ERROR_STOP=1 "${RESTORE_DB}"
sudo -u postgres psql -d "${RESTORE_DB}" -c "SELECT count(*) FROM pg_tables WHERE schemaname = 'public';"
sudo -u postgres dropdb "${RESTORE_DB}"
```

## Retention behavior

- Local retention: `WHATSQUERY_BACKUP_RETENTION_DAYS`
- R2 retention: `WHATSQUERY_BACKUP_R2_RETENTION_DAYS`

Both prune old backup archives and checksum files automatically.

## Failure alerts

If `WHATSQUERY_BACKUP_ALERT_EMAIL` is set and the app already has:

- `RESEND_API_KEY`
- `EMAIL_FROM`

then backup failures trigger a Resend email alert.

If `WHATSQUERY_BACKUP_ALERT_WEBHOOK_URL` is also set, failures also send a JSON webhook payload.

## Operational recommendation

For production-grade disaster recovery:

1. Keep the existing local verified backups.
2. Enable R2 upload with its own longer retention window.
3. Run a manual restore drill once after enabling R2.
4. Repeat restore drills monthly.
