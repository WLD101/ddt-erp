# AI ERP Receptionist Final Acceptance Report

Date: 2026-07-25
Repository: `C:\Users\WLD10\.gemini\antigravity\scratch\ddt-erp`
Branch: `codex/integration-runtime-worker-slice`

## Final verdict

Can WhatsQuery currently fulfil the AI ERP Receptionist promise?

`PARTIALLY`

The current implementation is strong for:

- Vapi webhook authentication and bounded-body handling
- durable event persistence
- deduplication
- tenant-aware webhook mapping
- call ledger updates
- transcript and recording privacy controls
- missed-call follow-up capture
- review-only lead, reservation, order, and callback request queues
- call reconciliation against the Vapi Calls API

The current implementation is not sufficient to claim:

- automatic ERP customer creation/update from Vapi
- automatic booking confirmation through a real availability engine
- automatic ERP sales order creation from Vapi
- automatic invoice generation from Vapi
- automatic payment capture and payment-method handling from Vapi
- automatic balanced double-entry accounting from Vapi
- report correctness for Vapi-originated financial transactions

## Scorecard

| Area | Verdict | Notes |
|---|---|---|
| Vapi call tracking | `COMPLETE WITH CONFIGURATION` | Real webhook + call ledger + reconciliation flow exists |
| Tenant resolution | `PARTIAL` | Trusted mapping exists, but no full multi-tenant acceptance suite proves all replay/reconciliation paths |
| Structured extraction | `PARTIAL` | Tool arguments are normalized and stored, but no robust confidence/classification/confirmation pipeline for financial-grade extraction |
| Lead creation | `COMPLETE WITH CONFIGURATION` | `captureLead()` creates `VoiceLead` records |
| Booking/reservation | `PARTIAL` | Creates review-only `VoiceReservationRequest`, not confirmed operational bookings |
| Order creation | `PARTIAL` | Creates review-only `VoiceOrderRequest`, not ERP sales/orders |
| Receipt generation | `PARTIAL` | ERP payment receipts exist separately; voice order receipt is explicitly non-accounting |
| Invoice generation | `NOT IMPLEMENTED` | No Vapi path creates `SalesInvoice` |
| Payment handling | `NOT IMPLEMENTED` | No Vapi path creates `Payment` or records payment method/status |
| Ledger posting | `UNSAFE` | No Vapi ledger path; ERP sales posting is not proven double-entry |
| Reports | `PARTIAL` | Voice call metrics work, but Vapi-financial reporting is not real because upstream financial docs are missing |
| Reconciliation | `PARTIAL` | Reconciles provider calls to `VoiceCallLog`, not downstream ERP business docs |
| Worker reliability | `PARTIAL` | Queue, retry, lease, and replay exist, but deployment model is not proven for all persistent workers |
| Tenant isolation | `PARTIAL` | Query scoping is good; end-to-end multi-tenant acceptance proof is missing |
| Monitoring | `PARTIAL` | Dashboard visibility exists for calls; no full operator evidence for business-action dead-letter/reporting |
| Security | `PARTIAL` | Strong webhook/privacy/tenant scoping, but dependency vulnerabilities remain and full production promise is broader than the tested surface |

## Accepted evidence

### Verified by code and tests

- `app/api/voice/vapi/webhook/route.ts`
- `modules/voice/vapi/ingestion.ts`
- `modules/voice/jobs/service.ts`
- `modules/voice/vapi/call-ledger.ts`
- `modules/voice/vapi/reconciliation.ts`
- `tests/telecom/vapi-call-tracking.test.ts`
- `tests/telecom/worker.test.ts`
- `tests/security/tenant-scope.test.ts`
- `tests/security/voice-privacy.test.ts`
- `tests/security/webhook-security.test.ts`
- `app/(voice)/voice/dashboard/orders/page.tsx`
- `app/(voice)/voice/dashboard/orders/[id]/receipt/page.tsx`
- `modules/voice/training/prompt-builder.ts`

### Key negative evidence

- the voice order queue states request records never create ERP sales, invoices, or payment records
- the voice order receipt page states it is not a tax invoice, payment receipt, or final confirmation
- the prompt builder explicitly forbids taking payments, issuing refunds, creating invoices, or changing ERP financial data
- no Vapi path was found calling ERP document/payment services such as `createSalesInvoice()` or `createPayment()`

## Acceptance-test status

### Existing automated coverage

- migrations: passing
- typecheck: passing
- build: passing
- integration tests: passing
- telecom/Vapi tests: passing
- security tests: passing
- onboarding tests: passing

### Missing acceptance coverage

- no `tests/acceptance/ai-erp-receptionist.test.ts`
- no database-backed Vapi -> ERP -> receipt -> journal -> report acceptance suite
- no explicit accounting balance-to-zero test suite
- no explicit report-verification suite for Vapi-originated ERP events
- no explicit tenant-isolation replay/reconciliation acceptance suite with conflicting assistants and numbers

## Production blockers

1. Vapi does not currently create ERP financial transactions end to end.
2. Receipt and invoice promises are broader than the implemented voice workflow.
3. No verified double-entry accounting model exists for the marketed promise.
4. No end-to-end acceptance suite proves cross-tenant safety under replay, reconciliation, and retries.
5. Worker deployment is not proven as a persistent production service model for every required job type.
6. `npm ci` still reports `17` high-severity vulnerabilities overall and `9` high-severity vulnerabilities with `--omit=dev`.

## Safe marketing wording

Recommended current wording:

- “Captures calls, transcripts, missed calls, leads, order requests, and booking requests into tenant-scoped queues.”
- “Reconciles Vapi call records and preserves audit history.”
- “Supports staff-reviewed order and booking workflows.”
- “ERP document creation and accounting automation are currently pilot/beta workflows and require explicit backend confirmation.”
- “Payment, invoicing, and ledger posting should be described as ERP-assisted workflows, not fully automatic Vapi outcomes.”

Avoid claiming today:

- “automatically creates invoices from every call”
- “automatically posts balanced ledgers from phone calls”
- “never misses a lead” without operational reconciliation/report proof
- “automatic receipt generation” for Vapi order requests

## Release classification

- Voice call capture and reporting surface: `PILOT READY`
- AI ERP receptionist full promise: `BLOCKED`
- Financial automation claim: `UNSAFE`
- Cross-tenant full-promise release: `BLOCKED`

## Explicit non-production confirmation

Production was not accessed.

Production was not modified.
