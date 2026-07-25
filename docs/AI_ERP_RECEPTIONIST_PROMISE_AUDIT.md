# AI ERP Receptionist Promise Audit

Date: 2026-07-25
Repository: `C:\Users\WLD10\.gemini\antigravity\scratch\ddt-erp`
Branch: `codex/integration-runtime-worker-slice`

## Scope

This audit measures the real end-to-end product promise against code, routes, models, worker flow, UI copy, and automated tests. It does not treat database models or dashboard cards as proof of completed business workflows.

## Executive verdict

WhatsQuery currently fulfils the voice capture, call logging, deduplication, queueing, privacy, and tenant-scoped request-intake portions of the AI ERP Receptionist promise.

WhatsQuery does **not** currently fulfil the full promise that Vapi calls automatically create ERP financial transactions, invoices, receipts, payments, balanced ledger entries, and verified report updates end to end.

## Promise matrix

| Customer promise | Required workflow | Existing implementation | API/route | Service/module | Database models | Worker/background job | UI visibility | Tests | Real integration or mock | Tenant isolation status | Accounting impact | Current status | Blocker | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Inbound answered call | Receive webhook, authenticate, persist, map tenant, update call state | Implemented for event capture and call ledger | `app/api/voice/vapi/webhook/route.ts` | `modules/voice/vapi/ingestion.ts`, `modules/voice/jobs/service.ts`, `modules/voice/vapi/call-ledger.ts` | `VoiceWebhookEvent`, `VoiceJob`, `VoiceCallLog` | `process_webhook_event` | Voice dashboard metrics | `tests/telecom/vapi-call-tracking.test.ts` | Real Vapi webhook shape, live API optional | Scoped by `organizationId` and mapping resolution | Wallet/cost only, not ERP ledgers | `PARTIAL` | Stops at voice call ledger, not ERP action completion | `upsertVapiCallLedger()` updates `VoiceCallLog`; no ERP sales/invoice call in this path |
| Missed call | Detect missed state, preserve tenant scope, create follow-up | Implemented | webhook + worker | `modules/voice/vapi/call-ledger.ts` | `VoiceCallLog`, `VoiceLead` | same worker path | Voice dashboard/callback queues | `tests/telecom/vapi-call-tracking.test.ts` | Real workflow | Tenant-scoped | No ERP posting | `COMPLETE WITH CONFIGURATION` | No outbound callback automation | `ensureMissedCallFollowUp()` creates `VoiceLead` with source `VAPI_MISSED_CALL` |
| Abandoned call | Track hang/abandonment in call ledger | Implemented at call-state level | webhook + worker | `modules/voice/vapi/call-lifecycle`, `call-ledger.ts` | `VoiceCallLog` | same | Voice metrics | telecom tests cover state machine | Real workflow | Tenant-scoped | No ERP posting | `PARTIAL` | No downstream business recovery flow | State flags exist in `VoiceCallLog`; no ERP workflow tied to abandonment |
| Failed call | Persist failed status and keep audit trail | Implemented at call-state level | webhook + worker | `call-ledger.ts` | `VoiceCallLog`, `VoiceWebhookEvent` | same | Voice metrics | telecom tests | Real workflow | Tenant-scoped | No ERP posting | `PARTIAL` | No linked business remediation | `isFailed` and status mismatch/reconciliation checks exist |
| Callback request | Capture caller and handoff request | Implemented as lead capture for staff review | Vapi tool-call reply | `modules/voice/vapi/tools.ts` | `VoiceLead`, `VoiceCallLog` | webhook event worker | Voice callback queue | indirect via existing worker/tool code, no dedicated acceptance test | Real internal workflow | Tenant-scoped by passed `organizationId` | No ERP posting | `PARTIAL` | No actual outbound callback or task assignment automation | `handoff_to_staff` saves `VoiceLead`; prompt says no automatic outbound message |
| New lead | Save lead from Vapi call | Implemented | Vapi tool-calls | `modules/voice/vapi/tools.ts` | `VoiceLead` | webhook event worker | Voice leads queue/dashboard | no dedicated lead acceptance test | Real internal workflow | Tenant-scoped | No ERP financial effect | `COMPLETE WITH CONFIGURATION` | No follow-up task assignment automation found | `captureLead()` upserts `VoiceLead` |
| Existing customer handling | Resolve/update actual ERP customer from call | Not found in Vapi flow | none in Vapi path | assistant service exists separately | `Customer` exists | none | ERP customer UI exists | no Vapi-to-customer tests | Separate ERP assistant, not Vapi call flow | ERP side scoped, Vapi side disconnected | Potential ERP impact but not wired | `NOT IMPLEMENTED` | Vapi tools do not call customer service layer | No Vapi path calls `modules/customers/service.ts` |
| Appointment/booking | Collect required fields and create request | Implemented as review-only request | Vapi tool-calls | `modules/voice/vapi/tools.ts` | `VoiceReservationRequest` | webhook event worker | Voice reservations queue | no end-to-end acceptance test | Real internal workflow | Tenant-scoped | No ERP booking/accounting posting | `PARTIAL` | Staff review only, not confirmed booking system | `requestAppointment()` stores `status: "needs_staff_review"` |
| Restaurant reservation | Same as above with restaurant semantics | Implemented as request capture only | Vapi tool-calls | same | `VoiceReservationRequest` | same | queue | same | Real internal workflow | Tenant-scoped | None | `PARTIAL` | No availability engine or confirmed booking write | Prompt and tool both enforce staff confirmation |
| Restaurant order | Collect order details and create real order | Implemented only as order request capture | Vapi tool-calls | `modules/voice/vapi/tools.ts` | `VoiceOrderRequest` | webhook event worker | `app/(voice)/voice/dashboard/orders/page.tsx` | no acceptance test | Real internal workflow | Tenant-scoped | None | `PARTIAL` | Explicitly never creates ERP sales/invoices/payments | Orders page copy states captured requests “never create ERP sales, invoices, or payment records” |
| Service order/service request | Create ERP work/service order from call | Not found | none in Vapi path | no Vapi service-order module found | service/work models exist elsewhere | none | no voice service-order queue found | none | Missing | Unknown because missing | None | `NOT IMPLEMENTED` | No Vapi path to `WorkOrder` or similar | Search found no Vapi path calling service-order creation |
| Invoice | Generate ERP invoice from Vapi outcome | Not found in Vapi flow | ERP assistant only | `modules/assistant/service.ts` separate from Vapi | `SalesInvoice` | none from Vapi | ERP sales UI exists | no Vapi invoice tests | Separate ERP assistant, not call workflow | ERP side scoped | Single-entry style cash ledger, not Vapi | `NOT IMPLEMENTED` | Vapi prompt explicitly forbids invoice creation | Prompt rule 4: “Never... create invoices” |
| Receipt | Generate actual payment receipt from Vapi-created transaction | Not found in Vapi flow | ERP payment receipt route exists separately | `lib/pdf/payment-receipt-generator.ts`, `/api/payments/[id]/receipt` | `Payment` | none from Vapi | ERP payment receipt UI, plus voice order pseudo-receipt | no Vapi receipt tests | ERP feature exists, Vapi path disconnected | ERP side scoped | Depends on payment workflow only | `PARTIAL` | Voice receipt is only a non-accounting request printout | Voice order receipt page says “It is not a tax invoice, payment receipt, or final order confirmation.” |
| Payment pending/completed | Track payment state from call-created docs | Not found in Vapi flow | none | separate ERP payment services | `Payment`, `SalesInvoice` | none from Vapi | ERP billing/payment pages | security tests cover assistant invoice payment flow, not Vapi | Separate ERP feature | ERP side scoped | Real ledger mutation when ERP payment runs | `NOT IMPLEMENTED` | No Vapi path to `createPayment()` | Search shows `createPayment()` only in assistant/ERP workflow |
| Refund/cancellation | Reverse documents and ledgers from Vapi-created flow | Not found | none | ERP return models exist | `SalesReturn`, `PurchaseReturn` | none from Vapi | ERP return pages | no Vapi refund tests | Separate ERP feature | ERP side scoped | Would require reversal logic | `NOT IMPLEMENTED` | No Vapi financial doc creation to reverse | No Vapi refund code path found |
| Accounts receivable | Unpaid invoice from call plus later payment | Not found in Vapi flow | none | separate ERP assistant and services | `SalesInvoice`, `Payment` | none from Vapi | ERP reports/AR UI | no Vapi AR tests | Separate ERP feature | ERP side scoped | Real ERP concept exists | `NOT IMPLEMENTED` | Vapi does not create unpaid invoices | No Vapi path to `SalesInvoice.status = DRAFT/SENT/ISSUED` |
| Cash/bank/card payment | Store method and ledger effects | Not found in Vapi flow | none | `modules/payments/service.ts` separate | `Payment`, `FinancialAccount`, `LedgerEntry` | none from Vapi | ERP payments UI | no Vapi payment-method tests | Separate ERP feature | ERP side scoped | Real ERP postings exist | `NOT IMPLEMENTED` | Disconnected from Vapi | No Vapi path uses `createPayment()` |
| Revenue posting | Balanced accounting entry from Vapi-created sale | Not found and ERP service is not double-entry | none | `modules/sales/service.ts` | `LedgerEntry`, `FinancialAccount` | none from Vapi | ERP ledger pages | no balance-to-zero tests | ERP-only and incomplete | ERP scope exists | Single ledger record only | `UNSAFE` | No double-entry journal model or balancing assertions | `createSalesInvoice()` writes one `LedgerEntry` and increments one account balance |
| Daily sales report | Report updates after Vapi-created sale | ERP reports exist, Vapi sale does not | ERP report routes | `modules/reports/service.ts` | report data from invoices/payments | none from Vapi | ERP dashboard/report pages | no Vapi report acceptance test | Separate ERP feature | ERP side scoped | depends on ERP postings | `PARTIAL` | Upstream Vapi transactions absent | Reports can only reflect ERP records that Vapi does not create |
| Customer statement | Statement reflects Vapi-created receivable/payment | Not found end-to-end | ERP only | separate report logic | invoice/payment models | none from Vapi | ERP UI | none | Separate ERP feature | ERP side scoped | depends on AR workflow | `NOT IMPLEMENTED` | No Vapi receivable creation | No Vapi AR path |
| Call report | Call counts, costs, status, reconciliation state | Implemented | voice dashboard APIs/pages | `modules/voice/vapi/metrics.ts`, `call-ledger.ts` | `VoiceCallLog` | voice worker, reconciliation job | Voice dashboard | telecom tests | Real internal workflow | Tenant-scoped | Voice wallet only | `COMPLETE WITH CONFIGURATION` | Needs production worker deployment | Dashboard summary reads call metrics from `VoiceCallLog` |
| Transcript | Store transcript with privacy controls | Implemented | webhook and transcript route | `call-ledger.ts`, transcript API route | `VoiceCallLog`, `VoiceWebhookEvent` | worker | Voice call log APIs | telecom/security tests | Real internal workflow | Tenant-scoped | None | `COMPLETE WITH CONFIGURATION` | Requires transcription enabled and proper env | transcript route enforces privacy policy |
| Recording | Store/playback with disclosure and allowlist | Implemented | recording route | `call-ledger.ts`, recording API route | `VoiceCallLog` | worker | Voice call log APIs | `tests/security/voice-privacy.test.ts` | Real internal workflow | Tenant-scoped | None | `COMPLETE WITH CONFIGURATION` | Requires approved recording hosts and disclosure setup | recording route enforces host allowlist and disclosure status |
| Agent handoff | Escalate to human | Implemented only as saved request | Vapi tool-calls | `handoffToStaff()` | `VoiceLead` | worker | callback queue | no end-to-end test | Real internal workflow | Tenant-scoped | None | `PARTIAL` | No automatic staff dispatch/inbox integration | Prompt says no automatic outbound trigger |
| Duplicate webhook | Deduplicate and keep count | Implemented | Vapi webhook | `ingestion.ts` | `VoiceWebhookEvent` | worker | admin/ops via event records | telecom tests cover dedupe identity | Real internal workflow | Tenant-scoped once mapped | None | `COMPLETE WITH CONFIGURATION` | Needs operator visibility tooling for replay | `deduplicationKey` unique plus `duplicateCount` increment |
| Out-of-order event | Merge later transcript/end report into same call | Implemented at call-ledger level | webhook + reconciliation | `call-ledger.ts`, `reconciliation.ts` | `VoiceCallLog` | worker + reconciliation | voice metrics/call logs | telecom tests | Real internal workflow | Tenant-scoped | Voice wallet only | `COMPLETE WITH CONFIGURATION` | No ERP downstream actions to replay safely | `normalizeVapiCall(existing)` merges statuses and late analysis |
| Missing webhook reconciliation | Discover missing provider calls and repair local ledger | Implemented for call ledger only | recurring voice job | `modules/voice/vapi/reconciliation.ts` | `VoiceCallLog` | `reconcile_vapi_calls` | not clearly exposed as operator report | telecom tests cover comparison helpers, not full API replay | Real Vapi API if configured | Tenant mapping preserved | Voice wallet only | `PARTIAL` | Repairs call ledger, not ERP business docs | reconciliation only calls `upsertVapiCallLedger()` |
| Dead-letter replay | Replay failed webhook processing | Implemented for voice event/job pair | internal service | `replayVapiWebhookEvent()` | `VoiceWebhookEvent`, `VoiceJob` | voice job runner | no clear tenant UI found | no dedicated replay acceptance test | Real internal workflow | Uses stored event org scope | None | `PARTIAL` | No operator workflow and no end-to-end tests | `replayVapiWebhookEvent()` resets event and queues job |

## Critical findings

### 1. Vapi-to-ERP transaction promise is not implemented

The real Vapi worker path ends in:

- `VoiceCallLog` updates
- `VoiceLead` creation
- `VoiceReservationRequest` creation
- `VoiceOrderRequest` creation
- optional conversation insight extraction

It does **not** call ERP transaction services such as:

- `createSalesInvoice()`
- `createPayment()`
- customer update/create service layer for Vapi outcomes
- receipt generation
- report aggregation tied to Vapi-created sales

### 2. Product prompts explicitly block invoice/payment automation

The live receptionist prompt builder contains explicit operating rules:

- never take payments
- never issue refunds
- never create invoices
- never change ERP financial data

That makes the marketing promise materially broader than the implemented runtime behavior.

### 3. Voice “receipt” is not an accounting receipt

The voice order receipt page is only a request printout. It states:

- it confirms order request capture
- it is not a tax invoice
- it is not a payment receipt
- it is not a final order confirmation

### 4. ERP accounting implementation is not double-entry

The ERP sales service does create a financial side effect, but it is not sufficient to prove accounting correctness for the product promise:

- `createSalesInvoice()` auto-marks invoices as `PAID`
- increments one financial account balance
- creates a single `LedgerEntry`

There is no visible double-entry journal model with balanced debit/credit lines, and no automated assertion that every financial transaction balances to zero.

### 5. Tenant isolation is stronger in query scoping than in end-to-end acceptance coverage

There is meaningful tenant-scoping infrastructure:

- `lib/security/tenant-scope.ts`
- `tests/security/tenant-scope.test.ts`
- trusted tenant mapping in Vapi ingestion

But there is not yet an end-to-end acceptance suite proving:

- Tenant A Vapi event cannot create Tenant B ERP artifacts
- unknown assistant/number is quarantined end to end
- replay and reconciliation preserve tenant scope through every background path

## Trace summary: Vapi to ERP

### What is real today

1. Webhook enters at `app/api/voice/vapi/webhook/route.ts`
2. request body size, source IP, secret/HMAC, and timestamp checks run
3. `ingestVapiWebhook()` parses the envelope and resolves trusted tenant mapping
4. sanitized event is stored in `VoiceWebhookEvent`
5. duplicate events are deduplicated by `deduplicationKey`
6. `process_webhook_event` is queued in `VoiceJob`
7. worker decrypts payload and resolves tenant mapping again if needed
8. `upsertVapiCallLedger()` writes/merges `VoiceCallLog`
9. final transcript or tool calls may create:
   - `VoiceLead`
   - `VoiceReservationRequest`
   - `VoiceOrderRequest`
10. reconciliation may later repair `VoiceCallLog`

### Where the flow stops

The flow does not continue into:

- `Customer`
- `SalesInvoice`
- `Payment`
- true accounting journals
- tax posting
- customer statement generation
- ERP sales reports based on Vapi-created transactions

## Tenant isolation verdict

### Evidence in favor

- Vapi mapping uses assistant ID, phone number ID, inbound number, and provider call ID
- unresolved mappings are marked `mapping_failed`
- tenant-scoped model enforcement exists in `lib/security/tenant-scope.ts`
- security tests cover tenant scoping for many models including `VoiceJob` and `VoiceWebhookEvent`

### Remaining gap

The repository still lacks a database-backed multi-tenant acceptance suite that proves the full webhook, worker, replay, and reconciliation flows never cross tenant boundaries under conflicting mappings and retries.

Verdict: `PARTIAL RELEASE GATE PASS`, but **not enough to claim complete tenant safety for the full AI ERP Receptionist promise**

## Receipt and invoice verdict

- ERP invoice PDFs and payment receipt PDFs exist for regular ERP data
- Voice order “receipt” is explicitly non-accounting
- Vapi workflow does not create actual invoices or payment receipts

Verdict: `PARTIAL`

## Ledger/accounting verdict

- ERP financial posting exists for ERP sales and payments
- no evidence of double-entry balancing for the Vapi promise
- no Vapi financial posting path exists

Verdict: `UNSAFE` for the marketed AI ERP receptionist financial promise

## Reporting verdict

- Voice call reports and metrics are real
- ERP sales/payment/AR reports are real for ERP-originated transactions
- Vapi-originated ERP reports are not proven because the financial transactions are not created

Verdict: `PARTIAL`

## Reconciliation verdict

- Call-level reconciliation against the Vapi Calls API exists
- missing webhook repair is limited to `VoiceCallLog`
- no reconciliation of downstream ERP documents or ledger side effects

Verdict: `PARTIAL`

## Worker deployment verdict

- Voice worker currently runs through `/api/voice/jobs/process`
- recurring scheduling and processing are invoked from an authenticated route
- integration runtime worker has a one-shot script entry
- there is no proof in this repository that all required persistent workers are deployed as durable services

Verdict: `BLOCKED FOR FULL PROMISE`

## Tests currently providing real evidence

- `tests/telecom/vapi-call-tracking.test.ts`
- `tests/telecom/worker.test.ts`
- `tests/security/tenant-scope.test.ts`
- `tests/security/voice-privacy.test.ts`
- `tests/security/webhook-security.test.ts`

## Missing evidence that blocks a full production-readiness claim

- no acceptance suite proving Vapi call -> ERP customer/order/invoice/payment/journal/report flow
- no automated multi-tenant end-to-end replay/reconciliation isolation suite
- no proof of real booking availability checks
- no proof of real order pricing/tax/stock reservation from Vapi
- no proof of actual invoice numbering from Vapi workflow
- no proof of payment method capture from Vapi workflow
- no proof of balanced double-entry accounting
- no proof that dead-letter replay is operator-safe across all business actions
