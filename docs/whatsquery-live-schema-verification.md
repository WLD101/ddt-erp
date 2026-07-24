# WhatsQuery Live Schema Verification

Run after `prisma migrate deploy`:

```bash
cd /var/www/whatsquery
sudo -u whatsquery bash scripts/contabo-prisma-migrate.sh inspect
sudo -u whatsquery node --env-file=.env scripts/verify-live-database.mjs
```

The verifier uses `DIRECT_URL`, prints aggregate JSON only and checks:

- all required industry, integration, market, Vapi and privacy migrations are
  finished and not rolled back;
- all integration foundation tables exist;
- industry and market columns exist;
- runtime lease, retry, idempotency and rate-limit columns exist;
- Vapi call-tracking and privacy-control columns exist;
- tenant integration parents exist;
- sampled integration child rows agree with their parent tenant.
- recording/transcript artifacts comply with tenant policy and disclosure state.

Any missing migration, table, column, broken relation or cross-tenant mismatch
causes a non-zero exit.

`prisma db pull` must not be used to overwrite the source schema during
verification.

Set `WHATSQUERY_EXPECTED_DATABASE_NAME` and
`WHATSQUERY_EXPECTED_TENANT_COUNT` before deploy so an unexpected target or
tenant-count change fails closed.
