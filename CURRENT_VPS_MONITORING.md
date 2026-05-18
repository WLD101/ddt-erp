# CURRENT VPS MONITORING

## Purpose
This document describes the production-safe monitoring architecture currently implemented for the shared WhatsQuery ERP VPS.

## Scope
- Platform-only system health for Super Admins
- Tenant-only usage analytics for tenant owners/admins
- Slow query capture
- Process-level error capture
- Backup heartbeat monitoring
- Shared-VPS threshold alerts

## Super Admin Surface
- Route: `/wq-command-center/system-health`
- Access: Super Admin only
- Data shown:
  - CPU
  - RAM
  - disk usage
  - disk I/O totals
  - network totals
  - Nginx 4xx/5xx counts
  - app probe response time
  - PostgreSQL connection usage
  - database size
  - top table sizes
  - recent slow queries
  - recent app errors
  - backup heartbeat status
  - top tenant footprints

## Tenant Surface
- Route: `/settings/billing`
- Access: tenant `owner` or `admin`
- Data shown:
  - products
  - customers
  - users
  - branches
  - invoices this month
  - purchases this month
  - exports this month
  - report actions this month
  - assistant actions this month
- No VPS, Nginx, DB, Redis, or backup internals are exposed to tenants.

## Logs and Heartbeats
- Slow query log:
  - `runtime-logs/slow-queries.jsonl`
- Process error log:
  - `runtime-logs/app-errors.jsonl`
- Backup heartbeat file:
  - `runtime-logs/backup-health.json`

## Alert Thresholds
- CPU: `> 80%`
- RAM: `> 85%`
- disk usage: `> 75%`
- DB connections: `> 80%`
- slow queries: `> 1s`
- app response time: `> 2s`
- Nginx 5xx spike: `> 10` in the last hour
- backup heartbeat age: `> 36h`

## Backup Heartbeat Contract
The backup system should write a JSON heartbeat file after every successful backup:

```json
{
  "status": "ok",
  "lastSuccessAt": "2026-05-18T07:30:00.000Z",
  "message": "Nightly DB dump uploaded successfully"
}
```

Failure example:

```json
{
  "status": "failed",
  "lastSuccessAt": "2026-05-17T07:30:00.000Z",
  "message": "Upload to remote storage failed"
}
```

## Recommended Production Jobs
1. Nightly PostgreSQL dump job
2. Weekly restore test in a separate environment
3. Backup heartbeat writer after every successful backup
4. Log rotation for `runtime-logs/*.jsonl`

## Security Notes
- Public `/health` is intentionally minimal and does not expose internals.
- Detailed infrastructure health is only visible in the command center.
- Tenant analytics remain tenant-scoped.

