# Vapi To ERP Financial Pipeline

Date: 2026-07-25
Status: implementation foundation

## Goal

Extend the current Vapi flow:

`VoiceWebhookEvent -> VoiceJob -> VoiceCallLog -> VoiceLead / VoiceReservationRequest / VoiceOrderRequest`

into a safe, tenant-scoped ERP outcome pipeline without enabling unsafe financial automation by default.

## Lifecycle

1. Vapi event received
2. tenant and branch resolved from trusted assistant, phone-number, or existing-call mapping
3. structured intent extracted into a voice request record
4. request stored with source call linkage
5. request validated against tenant rules and automation mode
6. customer resolved within tenant only
7. request either:
   - stays review-only
   - waits for staff approval
   - moves to processing for approved automation
8. ERP command executes through tenant-scoped service layer
9. customer / booking / order outcome created
10. invoice or receipt created only when enough confirmed data exists
11. payment recorded only after explicit confirmation
12. accounting posted only when automation is enabled and journal balancing succeeds
13. reports derive from the created ERP records
14. call, request, and ERP outcomes are linked by deterministic idempotency keys
15. failures retry safely or move to dead letter

## Core statuses

### Request lifecycle

- `captured`
- `needs_information`
- `needs_staff_review`
- `approved`
- `processing`
- `completed`
- `rejected`
- `failed`
- `dead_lettered`
- `reversed`

### Automatic transitions

- `captured -> needs_information`
  When required caller-confirmed fields are missing.

- `captured -> needs_staff_review`
  Default path for bookings, orders, invoice generation, payments, and accounting while automation is disabled or requires approval.

- `approved -> processing`
  Only after staff approval or explicit tenant automation mode allows it.

- `processing -> completed`
  Only after the ERP command, linked outcomes, and audit steps succeed.

- `processing -> failed`
  When the conversion fails but remains retryable.

- `failed -> dead_lettered`
  After retry exhaustion or a terminal safety violation.

- `completed -> reversed`
  Only through an explicit reversal flow that preserves history.

### Manual transitions

- `needs_staff_review -> approved`
- `needs_staff_review -> rejected`
- `needs_information -> approved`
  Only after required information is added and validated.

## Automation modes

The tenant-level automation settings are interpreted as:

- `disabled`
- `review_only`
- `staff_approval_required`
- `after_caller_confirmation`

Financial automation remains blocked unless all of these are true:

- tenant setting explicitly enables the workflow
- request contains confirmed, tenant-owned catalog/service references
- payment state is explicit and permitted
- journal posting is balanced

## Idempotency

Every downstream ERP conversion must use an idempotency key built from:

- tenant
- branch where applicable
- originating call
- originating request
- conversion type

Example:

`voice-order:org_123:branch_1:call_abc:request_xyz`

## Safe boundaries

- Never trust tenant IDs from Vapi payloads.
- Never trust prices, taxes, products, or payment status from Vapi tool arguments.
- Use only tenant-owned ERP services and backend catalog pricing.
- Keep unfinished workflows review-only instead of silently guessing.
- Never call order confirmations a receipt.
- Never create financial documents from incomplete or unconfirmed voice data.
