# SCALING PLAYBOOK

## Purpose
Provide an operator-first decision tree for scaling WhatsQuery safely from the current shared VPS baseline.

## Stage 1: Stay On Current VPS
Use this stage while:
- CPU stays mostly below 60 percent
- RAM stays mostly below 70 percent
- disk stays below 70 percent
- DB connections stay below 60 percent
- slow queries remain rare and fixable

Actions:
- optimize indexes
- enforce pagination everywhere
- move large exports to async
- cache dashboard and report summaries
- rotate and prune logs

## Stage 2: Harden Shared VPS
Enter this stage when:
- CPU or RAM spikes regularly
- report/export jobs affect user-facing latency
- backup and restore confidence needs improvement

Actions:
- isolate heavy jobs from request path
- add remote backup storage
- add restore testing
- reduce synchronous export/report work
- tighten rate limits for assistant and exports

## Stage 3: Managed DB First
Enter this stage when:
- DB connections trend high
- DB size grows quickly
- query tuning alone is not enough
- backup maturity becomes critical

Actions:
- migrate PostgreSQL to managed service
- keep app on VPS temporarily
- validate tenant usage, billing, and reporting after migration

## Stage 4: Split Application Runtime
Enter this stage when:
- app response time remains elevated after DB migration
- background workloads compete with web traffic
- deployment/restart windows become risky

Actions:
- separate web runtime and job runtime
- containerize
- introduce dedicated queue workers

## Stage 5: Dedicated Enterprise Isolation
For large tenants:
- do not offer “unlimited” on shared infra
- move high-footprint enterprise tenants to dedicated resources after review
- isolate:
  - DB
  - storage
  - backup policy
  - support/SLA boundaries

## Shared-VPS Fair Use Rules
- no full-dataset loads
- no synchronous giant exports
- no unmetered assistant abuse
- no fake storage counters
- enforce tenant-scoped limits before heavy actions execute

## Operational Review Rhythm
- daily:
  - system health page
  - backup heartbeat
  - 5xx spikes
- weekly:
  - slow query review
  - top tenant footprint review
  - table size growth review
- monthly:
  - plan limit calibration
  - storage model review
  - migration readiness review
