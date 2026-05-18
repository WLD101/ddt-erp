# MIGRATION TO GCP

## Goal
Prepare WhatsQuery for a future move from a single VPS to GCP-based infrastructure without redesigning the product around assumptions that do not exist today.

## Suggested Target Stack
- App:
  - Cloud Run or GCE
- Database:
  - Cloud SQL for PostgreSQL
- Object storage:
  - Google Cloud Storage
- Secrets:
  - Secret Manager
- Observability:
  - Cloud Logging
  - Cloud Monitoring
- CDN / edge:
  - Cloudflare can remain in front

## Migration Drivers
- shared VPS CPU/RAM pressure
- storage growth
- need for safer backups and PITR
- need for better scale isolation
- requirement for multi-instance app rollout

## Migration Path

### Step 1: Externalize State
- keep application stateless where possible
- ensure uploads/storage are off-box
- ensure logs do not require local-only retention
- move backups to remote object storage

### Step 2: Database Migration
- migrate PostgreSQL first to Cloud SQL
- validate connection pooling
- validate SSL and IAM/network policies

### Step 3: App Runtime Migration
- containerize build/runtime cleanly
- validate environment variables
- verify background jobs and scheduled tasks still run
- ensure Nginx-only assumptions are isolated behind config

### Step 4: Monitoring Migration
- map current health signals to GCP metrics:
  - CPU
  - memory
  - disk
  - request latency
  - 4xx/5xx
  - DB connections
  - slow queries

## GCP Readiness Checklist
- no local-only file dependency for critical workflows
- backups tested
- DB migration tested from production-like snapshot
- tenant usage analytics verified after cutover
- command center system health can consume provider-level metrics later

## Risks
- Cloud SQL connection limits differ from VPS posture
- report/export jobs may need queue isolation
- billing and webhook endpoints need edge/network validation after migration

