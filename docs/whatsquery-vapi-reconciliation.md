# WhatsQuery Vapi Reconciliation

## Purpose

Webhooks provide low-latency updates. The Vapi Calls API repairs missing or incomplete webhook state and confirms final duration, analysis, recording metadata, and cost.

The existing trusted voice worker schedules a six-hour recent window. The interval is controlled by:

```env
VAPI_RECONCILIATION_INTERVAL_MINUTES=60
```

The worker uses a time-bucket idempotency key, so multiple scheduler requests do not create duplicate reconciliation jobs.

## Safe manual usage

Dry run is the default:

```bash
npm run voice:reconcile-vapi -- --from=2026-07-22T00:00:00Z --to=2026-07-23T00:00:00Z
```

Apply only missing records:

```bash
npm run voice:reconcile-vapi -- --from=2026-07-22T00:00:00Z --to=2026-07-23T00:00:00Z --only-missing --apply
```

Repair mismatched provider fields:

```bash
npm run voice:reconcile-vapi -- --from=2026-07-22T00:00:00Z --to=2026-07-23T00:00:00Z --apply --repair --report=/tmp/vapi-reconciliation.json
```

Supported options:

- `--from`
- `--to`
- `--tenant`
- `--dry-run` (implicit default)
- `--apply`
- `--page-size`
- `--max-pages`
- `--only-missing`
- `--repair`
- `--report`

The script never deletes calls and refuses to overwrite an existing report file.

## Pagination

The service requests up to 1,000 calls per page and moves the exclusive `createdAtLt` cursor to the oldest record returned. Provider call IDs are deduplicated in memory. `completeProviderScan` is false when `maxPages` is reached, and local-only conclusions are suppressed for an incomplete scan.

## Field precedence

1. Trusted WhatsQuery tenant and ERP links are never replaced by provider metadata.
2. Vapi IDs, status, timestamps, final artifacts, durations, and actual cost are provider-authoritative.
3. Existing ready transcript/analysis state does not regress when a later payload is incomplete.
4. Customer billing uses the call-level rate snapshot and remains idempotent.
5. No local call is deleted when absent from the provider response.

## Discrepancies

The report can contain:

- `missing_local_record`;
- `missing_provider_record`;
- `status_mismatch`;
- `duration_mismatch`;
- `cost_mismatch`;
- `tenant_unresolved`;
- `analysis_missing`;
- `phone_mapping_missing`.

Vapi API responses are not printed. Reports contain provider call IDs and aggregate issues only, never phone numbers, transcripts, recordings, or credentials.
