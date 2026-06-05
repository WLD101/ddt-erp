# WhatsQuery Voice No-Interruption Scale Plan

This document outlines the strategic roadmap for ensuring zero dropped calls and low-interruption service as WhatsQuery Voice scales across increasing tenant volumes. The core principle is that **calls must never depend on slow dashboard rendering, slow WhatsApp notifications, or heavy webhook processing**.

## Current Architecture Highlights (Scale Stage 1)
- **Fast Webhook Acknowledgement**: All incoming Vapi webhooks immediately persist to `VoiceWebhookEvent` and return `HTTP 200`. Event mapping occurs via `VoiceAgent` indexing.
- **Database Queue System**: Heavy processing (lead saving, capacity checking, WhatsApp notification dispatching) is deferred to the `VoiceJob` queue.
- **Active Call Tracking**: `VoiceUsageMeter` tracks concurrent `activeCalls` to protect global system constraints.
- **WhatsApp Fallbacks**: WhatsApp messages are queued in `VoiceNotificationLog`. Failures are automatically retried via `VoiceJob` processor without impacting the customer call or lead capture.
- **ERP Isolation**: Bookings and Order requests are saved as `VoiceReservationRequest` and `VoiceOrderRequest` within the Voice module to prevent slow, destructive write-locks on the core ERP system.

## Concurrency Strategy (Handling Capacity)

### Modes of Operation (`capacityMode`)
1. **direct_ai** (Current Default): The Vapi AI assistant directly answers the call. If `activeCalls` exceeds the tenant limit, the system logs a `CAPACITY_FULL` warning but allows the call to complete (reliant on Vapi concurrency limits).
2. **queue_then_ai** (Future): If AI capacity is full, the call enters a Twilio holding queue with hold music. As soon as a slot is released, Twilio forwards the call to the Vapi Assistant endpoint.
3. **fallback_to_staff** (Future): If AI capacity is full, Twilio immediately dials the business's predefined fallback staff number (`VoiceHandoffRules.fallbackPhone`).
4. **take_message** (Future): Bypasses the active AI and immediately routes to a specialized low-latency voicemail endpoint to capture caller intent.
5. **voicemail_callback** (Future): Prompts the user to press 1 to request an automatic callback when an AI agent becomes available.

## Client Impact
- **When Capacity is Available**: Immediate AI receptionist pickup. Instant webhook logging. Jobs processed asynchronously within seconds.
- **When Capacity is Full**: Currently triggers a `CAPACITY_FULL` alert in the Admin command center. Call behavior defaults to Vapi's handling capacity until Twilio queuing is deployed.
- **When Webhook Fails**: Event is marked as `failed` or `mapping_failed` in `VoiceWebhookEvent`, preserving the raw payload for manual recovery.
- **When WhatsApp Fails**: The Voice job enters a `retrying` state utilizing exponential backoff. The `VoiceLead` and `VoiceReservationRequest` persist on the dashboard.
- **When Tenant Exceeds Limits**: The system blocks new active call slots (`MONTHLY_LIMIT_EXCEEDED`), triggering the fallback/callback request flow.

## Roadmap Triggers

### 1-10 Clients (Ready: Yes)
- Rely on single VPS Next.js instance + PostgreSQL queue. 
- Fast webhooks handle small concurrency efficiently.

### 10-50 Clients (Ready: Yes, Pending Worker Setup)
- **Action**: Move `VoiceJob` processing out of Next.js cron triggers into a dedicated systemd Node worker or Redis/BullMQ.
- **Reason**: Ensure long-running jobs (transcripts, WhatsApp polling) don't starve the Next.js process serving fast webhook `POST` requests.

### 50-100 Clients (Ready: No)
- **Action**: Deploy Twilio Holding Queue in front of Vapi. 
- **Reason**: Vapi provider accounts have strict concurrency limits. We need Twilio to park incoming calls and gracefully route them as `activeCalls` drop.
- **Database**: Move PostgreSQL to a Managed RDS/Supabase instance.

### 100+ High Volume Clients (Ready: No)
- **Action**: Separate webhook ingestion servers from dashboard UI servers.
- **Action**: Implement AWS S3 / Cloudflare R2 for all call audio storage if bypassing Vapi native storage.

## Safety & Security Constraints
- **ERP isolation**: Strictly enforced. `VOICE_ERP_WRITE_ENABLED=false` prevents accidental database locks or miswritten invoices.
- **Data-loss prevention**: Zero destructive Prisma migrations. `npx prisma db push --accept-data-loss` is banned.
- **Tenant Isolation**: Every `VoiceWebhookEvent`, `VoiceJob`, and `VoiceCallLog` enforces `organizationId` indexing to prevent cross-contamination.
