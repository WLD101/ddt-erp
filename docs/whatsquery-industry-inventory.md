# WhatsQuery Industry Inventory

## Scope and method

This audit was produced from repository evidence in:

- `prisma/schema.prisma`
- `modules/onboarding/service.ts`
- `app/onboarding/steps/IndustryStep.tsx`
- `modules/command-center/actions.ts`
- `scripts/final-seed.ts`
- `scripts/setup-voice-demo.ts`
- `scripts/verify-voice-prompts.ts`
- `modules/production/service.ts`
- `app/(dashboard)/dashboard/production/page.tsx`
- `app/(marketing)/industries/*`
- `modules/voice/*`
- `app/(voice)/voice/dashboard/*`
- `docs/*`

Rules used in this inventory:

- "Explicit" means the industry appears directly in onboarding, schema, dedicated routes, dedicated models, or dedicated marketing pages.
- "Implicit" means the workflow could run on shared ERP or voice modules but there is no dedicated industry pack.
- "Production-ready" was intentionally avoided unless the full workflow could be demonstrated end to end from repository evidence.

## Coverage counts

- Verified explicit industries found: `6`
- Verified partial industries found: `3`
- Verified placeholder industries found: `0`
- Implicitly supportable industries found: `5`
- Verified operational models identified in the repo: `6`

## Explicit industries

| Industry | Code / label | Support type | Implementation status | Confidence | Evidence |
| --- | --- | --- | --- | --- | --- |
| Retail | `retail` | Explicit | Functional but incomplete | High | `modules/onboarding/service.ts`, `app/onboarding/steps/IndustryStep.tsx`, `app/(marketing)/industries/retail-erp/page.tsx`, POS models in `prisma/schema.prisma` |
| Wholesale / trading | `wholesale` | Explicit | Functional but incomplete | High | `modules/onboarding/service.ts`, `modules/command-center/actions.ts`, `app/(marketing)/industries/wholesale-erp/page.tsx`, `scripts/final-seed.ts` |
| Ecommerce | `ecommerce` | Explicit | Functional but incomplete | Medium | `modules/onboarding/service.ts`, `modules/integrations/service.ts`, Daraz / Shopify / WooCommerce settings routes, `scripts/final-seed.ts` |
| Distribution | `distribution` | Explicit | Early implementation | Medium | `modules/onboarding/service.ts`, `modules/command-center/actions.ts`, branches plus shared inventory/sales/purchases modules |
| Manufacturing | `manufacturing` | Explicit | Early implementation | Medium | `modules/onboarding/service.ts`, `modules/production/service.ts`, `app/(dashboard)/dashboard/production/page.tsx`, `app/(marketing)/industries/manufacturing-erp/page.tsx` |
| Basic service / professional services | `service_basic` | Explicit | Early implementation | Medium | `modules/onboarding/service.ts`, `app/onboarding/steps/IndustryStep.tsx`, shared customers/quotes/invoices/expenses modules |

## Partially implemented and voice-led industries

| Industry | Support type | Implementation status | Intended customer type | Operational model | Evidence |
| --- | --- | --- | --- | --- | --- |
| Textile | Partial via schema and domain modeling | Placeholder with backend/domain modeling | Textile manufacturing / export | Model D | textile entities in `prisma/schema.prisma`, `app/(marketing)/industries/textile-erp/page.tsx` |
| Restaurant | Partial via voice | Early implementation | Hospitality / dine-in | Models A and B | `scripts/setup-voice-demo.ts`, `modules/voice/service.ts`, `app/(voice)/voice/dashboard/reservations/page.tsx`, `docs/VOICE_CLIENT_DEMO_CHECKLIST.md` |
| Cafe | Partial via voice | Early implementation | Cafe / quick service | Models A and B | `scripts/setup-voice-demo.ts`, `scripts/verify-voice-prompts.ts`, `docs/WHATSQUERY_INFRASTRUCTURE_AND_SIP_TRUNKING_DEPLOYMENT_PROPOSAL.md` |
| Takeaway / delivery food | Inferred from restaurant voice rules | Inferred from reusable modules | Food ordering without table service | Model A | `scripts/setup-voice-demo.ts`, `modules/voice/service.ts`, `VoiceOrderRules` in `prisma/schema.prisma` |
| Clinic / dental clinic | Partial via voice | Backend only to early implementation | Appointment-led service | Model B | `scripts/verify-voice-prompts.ts`, `modules/voice/schema.ts`, generic `request_appointment` voice tool |

## Unsupported prior claim

| Industry | Support type | Implementation status | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| Real estate / property | Unsupported as implemented industry | Documentation/comment-only mention | Low | `AgentTemplate.industry` comment in `prisma/schema.prisma`, business examples in voice/template docs |

## Implicitly supportable industries

These can likely operate on the current shared modules, but there is no dedicated industry profile yet.

| Industry | Why it is supportable | Current limit |
| --- | --- | --- |
| Consultants / professional-service firms | `service_basic` plus customers, quotations, invoices, expenses | No dedicated booking, capacity, or project model |
| Service and repair businesses | Quotes, invoices, inventory, customers, supportable via shared CRM | No job, site, technician, work-order, or parts workflow |
| Logistics operators | Distribution-style branches, inventory, sales, purchases | No dispatch, route, vehicle, driver, or delivery state machine |
| Small B2B traders | Shared wholesale stack plus reports/imports/exports | No industry-specific pricing/territory templates |
| Simple appointment-based service teams | Generic voice appointment capture plus service invoicing | No dedicated calendar/resource booking engine |

## Industries searched but not evidenced as current support

No convincing implementation evidence was found for these as current product industries:

- taxi / private hire
- flooring
- plumbers / electricians / builders
- salons and spas
- vehicle / driver dispatch businesses

These may become future packs, but they should not be treated as current support.

## Per-industry record set

### 1. Retail

- Evidence location: `modules/onboarding/service.ts`, `app/(marketing)/industries/retail-erp/page.tsx`, POS entities in `prisma/schema.prisma`
- Relevant frontend routes: onboarding industry step, shared dashboard routes, retail marketing page
- Relevant backend modules: `modules/products`, `modules/inventory`, `modules/sales`, `modules/purchases`, `modules/reports`
- Relevant database entities: `Product`, `InventoryItem`, `SalesInvoice`, `POSRegister`, `POSSale`, `POSReturn`, `CustomerLoyalty`
- Available workflows: stock control, billing, purchases, customer management, branch segmentation, reporting
- Missing workflows: proven POS UI flow, exchange workflow UI, cashier session workflow, barcode-first retail execution flow
- Existing integrations: CSV, Shopify, WooCommerce, Daraz, export/report PDFs
- Operational model: mostly Model F, with some ecommerce crossover
- Fulfilment model: immediate sale or later fulfillment for linked online channels
- Scheduling model: minimal, not booking-centric
- Payment model: checkout and invoice payment
- Inventory requirements: high
- Staff roles: cashier, branch admin, inventory/admin roles via RBAC
- Voice-agent use cases: limited compared with hospitality

### 2. Wholesale / trading

- Evidence location: `scripts/final-seed.ts`, `app/(marketing)/industries/wholesale-erp/page.tsx`, onboarding module map
- Relevant frontend routes: shared ERP dashboard, reports, imports, quotes, sales, purchases, customers, suppliers
- Relevant backend modules: sales, quotations, purchases, inventory, reports, finances, payments
- Relevant database entities: `Customer`, `Supplier`, `Product`, `InventoryItem`, `SalesInvoice`, `PurchaseInvoice`, `Quotation`, `Payment`
- Available workflows: quotation to invoice, purchasing, receivables, payables, branch-level stock, imports/exports
- Missing workflows: route/territory distribution, delivery proof, stock allocation, returns claim workflow, warehouse-specific fulfillment
- Existing integrations: CSV, Shopify, WooCommerce, Daraz, PDFs, exports
- Operational model: Model E
- Fulfilment model: stock-based B2B fulfillment
- Scheduling model: low to medium
- Payment model: credit sales and invoice collection
- Inventory requirements: high
- Staff roles: sales, purchasing, branch, finance, owner/admin
- Voice-agent use cases: lead capture, callback, FAQ, payment follow-up later

### 3. Ecommerce

- Evidence location: onboarding config plus channel integrations and seeded sales channels
- Relevant frontend routes: `app/(dashboard)/settings/integrations/*`
- Relevant backend modules: `modules/integrations`, inventory, sales, reports
- Relevant database entities: `SalesChannel`, `ExternalProductMap`, `ExternalOrderMap`, product/inventory/sales entities
- Available workflows: channel sync setup, product/order mapping, inventory/reporting backbone
- Missing workflows: full omnichannel order orchestration proof, returns sync proof, fulfillment routing
- Existing integrations: Daraz, Shopify, WooCommerce, CSV
- Operational model: Model F with some Model E patterns

### 4. Distribution

- Evidence location: onboarding config only plus shared branch/inventory/purchase/sales architecture
- Relevant frontend routes: shared ERP routes only
- Relevant backend modules: inventory, purchases, sales, reports, branches
- Relevant database entities: `Branch`, `InventoryItem`, `StockMovement`, `SalesInvoice`, `PurchaseInvoice`
- Available workflows: branch-aware stock and sales/purchase management
- Missing workflows: route planning, van sales, driver assignment, dispatch, proof of delivery
- Existing integrations: same shared commerce integrations as wholesale/ecommerce
- Operational model: intended Model E, currently generic shared ERP

### 5. Manufacturing

- Evidence location: `modules/production/service.ts`, `app/(dashboard)/dashboard/production/page.tsx`, manufacturing marketing page
- Relevant frontend routes: `/dashboard/production`
- Relevant backend modules: `modules/production`, products, inventory
- Relevant database entities: `BOM`, `BOMItem`, `WorkOrder`, `WorkOrderMaterial`, `ProductionLog`, `Machine`, `QualityCheck`
- Available workflows: BOM creation, production order creation, material consumption, finished-goods output
- Missing workflows: sales order to production planning link, procurement planning, QC workflow UI depth, packing/dispatch/export
- Existing integrations: no production-planning integrations yet
- Operational model: Model D
- Important note: public marketing explicitly says manufacturing is not part of Phase 1; backend capability exists but public positioning says roadmap

### 6. Textile

- Evidence location: textile models in schema plus dedicated marketing page
- Relevant frontend routes: `app/(marketing)/industries/textile-erp/page.tsx`
- Relevant backend modules: no dedicated textile module folder found during this audit
- Relevant database entities: `FabricLot`, `YarnInventory`, `TextileOrder`, `TextileJobCard`, `DyeingBatch`, `StitchingBatch`
- Available workflows: domain entities only
- Missing workflows: UI, actions, state machines, buyer approvals, export docs, dispatch flow
- Existing integrations: none specific
- Operational model: intended Model D plus some Model E for exporter use cases

### 7. Basic service / professional services

- Evidence location: `service_basic` in onboarding config
- Relevant frontend routes: shared customers, quotations, sales, expenses, reports
- Relevant backend modules: customers, quotations, sales, expenses, reports
- Relevant database entities: generic commercial entities only
- Available workflows: customer setup, quote, invoice, payment, expense tracking
- Missing workflows: booking engine, job site, project, staff/resource assignment, recurring service
- Existing integrations: shared billing/report/export integrations
- Operational model: weak Model C and weak Model B support through generic modules

### 8. Restaurant / cafe voice

- Evidence location: voice demo script, reservation page, order/reservation queues, voice action policy
- Relevant frontend routes: `app/(voice)/voice/dashboard`, `app/(voice)/voice/dashboard/reservations`, voice integrations pages
- Relevant backend modules: `modules/voice/service.ts`, `modules/voice/actions.ts`, `modules/voice/vapi/tools.ts`
- Relevant database entities: `VoiceBusinessProfile`, `VoiceAgent`, `VoiceLead`, `VoiceReservationRequest`, `VoiceOrderRequest`, `VoiceBookingRules`, `VoiceOrderRules`, `VoiceAllowedActionPolicy`
- Available workflows: capture reservation request, capture takeaway/delivery order request, handoff to staff, FAQ answering
- Missing workflows: autonomous order confirmation, kitchen tickets, menu/inventory binding, payment capture, table management
- Existing integrations: Vapi, Twilio, WhatsApp, planned calendar hooks
- Operational model: Model A plus Model B

### 9. Clinic / dental clinic voice

- Evidence location: `scripts/verify-voice-prompts.ts`, generic appointment toolset
- Relevant frontend routes: shared voice dashboard only
- Relevant backend modules: same shared voice stack as restaurant/cafe
- Relevant database entities: generic voice leads/calls plus appointment request semantics
- Available workflows: appointment request capture, lead capture, callback/handoff, FAQs
- Missing workflows: provider calendars, doctor/resource assignment, appointment confirmation rules, patient intake model
- Existing integrations: voice integrations only; Google/Outlook calendar appear as needs, not proven tenant workflow
- Operational model: Model B

## Actual conclusion

The repository currently behaves like a shared SMB ERP with:

- strongest real support in wholesale, trading, retail, and ecommerce;
- partial branch-based support for distribution;
- early manufacturing capability behind a route and service;
- textile represented mostly through schema and roadmap positioning;
- voice-specific hospitality and clinic intake flows that capture requests but avoid high-risk autonomous execution.
