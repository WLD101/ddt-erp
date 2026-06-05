# WhatsQuery Voice Scaling Readiness

This document outlines the current architecture, scaling stages, and triggers for when to migrate infrastructure components to handle increasing traffic loads for the WhatsQuery Voice module.

## Current Architecture

The system is currently operating in **Stage 1 to 2** readiness:
- **Web Server**: Next.js running on a single VPS.
- **Database**: PostgreSQL running on the same VPS.
- **Webhook Processing**: Asynchronous. Incoming webhooks are immediately saved to `VoiceWebhookEvent` and HTTP 200 is returned. A background job is enqueued in the `VoiceJob` table.
- **Job Processing**: The `processVoiceJobs` endpoint can be triggered via cron or internally to process queued tasks without blocking web requests.
- **Usage Limits**: Tracked via `VoiceUsageMeter` with warnings built into the Admin Command Center.

## Scaling Stages and Triggers

### Stage 1: Initial Rollout (1-10 Businesses)
- **Infrastructure**: Single VPS (Current setup).
- **Processing**: Internal API endpoint triggered to process `VoiceJob` queue.
- **Action Needed**: Monitor `/wq-command-center/system-health` and `/voice/admin/command-center`. If Disk > 60% or RAM > 75%, prepare for Stage 2.

### Stage 2: Growth Phase (10-50 Businesses)
- **Triggers**: Increased webhook failures, database active queries consistently > 5, or job processing delays > 1 minute.
- **Action Needed**:
  - Implement a persistent worker process (e.g. standard Node script running via systemd) instead of cron-triggering the Next.js API.
  - Implement Redis and BullMQ for `VoiceJob` instead of the database-backed queue to relieve PostgreSQL connection pressure.

### Stage 3: High Volume (50-100+ Businesses)
- **Triggers**: PostgreSQL memory usage spikes, high disk IO from extensive logging and recording URLs.
- **Action Needed**:
  - **Separate Database**: Move PostgreSQL to a managed database provider (e.g., Supabase, RDS) to scale compute independently of the web server.
  - **Storage**: Move recordings and transcripts storage to AWS S3 / Cloudflare R2 if not already storing strictly via Vapi URLs.
  - **Concurrency**: Reserve Vapi concurrency limits directly with the provider to avoid dropped calls.

### Stage 4: Enterprise Scale (100+ High-Volume Businesses)
- **Triggers**: Persistent CPU load averages > 80% on the web server during peak hours.
- **Action Needed**:
  - Separate the web server, worker server, and database into completely distinct scaling groups.
  - Introduce usage-based billing infrastructure and SLA monitoring.

## Migration with Minimal Downtime
1. Setup the new managed database / Redis queue.
2. Put the application in maintenance mode (pause incoming webhooks at the Vapi dashboard if possible, or gracefully queue them).
3. Export and restore the database to the managed provider.
4. Update `.env` variables and restart the services.
