# WhatsQuery Industry Workflow Maps

## Reading note

These workflow maps reflect what the repository currently demonstrates, not an ideal future state.

## 1. Retail

```text
Product setup
-> stock intake
-> customer billing / sale
-> payment
-> stock reduction
-> reporting
-> optional return
```

Current evidence:

- products, inventory, sales, purchases, reports modules
- retail-specific schema models for registers, POS sales, returns, loyalty

Current gaps:

- no clearly proven first-class POS dashboard route
- no cashier-session execution workflow confirmed from app routing

## 2. Wholesale / trading

```text
Customer enquiry
-> quotation or direct invoice
-> stock check
-> customer pricing / discount
-> invoice creation
-> payment collection or receivable
-> reporting and follow-up
```

Current evidence:

- `scripts/final-seed.ts` strongly models a traders workspace
- quotations, sales, purchases, inventory, payments, finances, reports are all present

Current gaps:

- route/territory distribution
- warehouse-level allocation
- delivery confirmation workflow

## 3. Ecommerce

```text
Channel connection
-> product mapping
-> inbound external orders
-> inventory sync
-> sales reporting
-> reconciliation
```

Current evidence:

- Daraz, Shopify, WooCommerce, CSV integration surfaces
- external product/order map entities

Current gaps:

- no fully demonstrated omnichannel fulfilment lifecycle
- limited proof of returns sync and shipment orchestration

## 4. Distribution

```text
Order capture
-> branch-aware stock review
-> sales / purchase processing
-> dispatch planning outside current system depth
-> invoicing
-> collection
```

Current evidence:

- onboarding module map
- branch, stock, sales, purchases, reports architecture

Current gaps:

- dispatch
- routing
- vehicles/drivers
- proof of delivery

## 5. Manufacturing

```text
Product definition
-> BOM setup
-> production order creation
-> material consumption
-> work in progress
-> finished goods output
-> inventory update
```

Current evidence:

- `modules/production/service.ts`
- `/dashboard/production`

Current gaps:

- customer order to production order linkage
- procurement planning
- quality hold / release flow
- packing / dispatch / export
- richer production states

## 6. Textile

```text
Buyer requirement
-> textile specification
-> yarn / fabric planning
-> dyeing / stitching batch flow
-> quality control
-> packing
-> dispatch
```

Current evidence:

- textile-specific schema entities only
- dedicated marketing page explicitly says not Phase 1

Current gaps:

- no dedicated textile UI
- no textile service/action layer
- no workflow state machine proven from routes/modules

## 7. Basic service / professional services

```text
Enquiry
-> customer creation
-> quotation
-> approval outside dedicated workflow
-> invoice
-> payment
-> reporting
```

Current evidence:

- `service_basic` onboarding profile
- shared quotes, customers, invoices, expenses, reports

Current gaps:

- booking
- resource scheduling
- jobs/projects
- service site/location model

## 8. Restaurant / cafe voice

```text
Inbound call
-> FAQ/menu/service response
-> reservation request or order request
-> capture caller details
-> save queue item
-> human confirmation / staff handoff
```

Current evidence:

- `VoiceBookingRules`
- `VoiceOrderRules`
- `VoiceAllowedActionPolicy`
- voice reservation dashboard
- voice order and callback request queues

Current rules already visible in repo:

- requests are captured
- auto-confirmation is intentionally restricted
- payment/refund/invoice creation is blocked from autonomous voice flow

Current gaps:

- menu management
- modifiers/substitutions model
- kitchen queue
- table map
- direct payment capture

## 9. Clinic / dental clinic voice

```text
Inbound call
-> identify purpose
-> collect appointment request details
-> save lead / request
-> route to staff or callback
-> human scheduling and confirmation
```

Current evidence:

- clinic prompt verification in `scripts/verify-voice-prompts.ts`
- generic voice appointment tooling

Current gaps:

- provider resource model
- calendar occupancy model
- appointment confirmation engine
- patient-specific workflow

## 10. Support / request management

```text
Request
-> categorisation
-> assignment / response
-> update
-> closure
```

Current evidence:

- `SupportRequest` schema model
- support module
- voice callback queues

Current gaps:

- no single cross-product case-management framework
- no shared SLA/state model across all industries

## Workflows not currently demonstrated

The following requested industry workflows were not demonstrated as current product capability:

### Taxi / private hire

Missing from current repo evidence:

- journey entity
- pickup/dropoff model
- driver/vehicle assignment
- dispatch state machine
- fare estimate workflow

### Flooring / trades / field service

Missing from current repo evidence:

- site entity
- survey scheduling
- measurement capture
- installer assignment
- job/work-order completion workflow

### Salon / spa

Missing from current repo evidence:

- stylist/resource calendars
- service-duration booking
- chair/room/resource allocation

## Cross-industry workflow conclusion

The repository already proves that "transaction" means different things in different verticals:

- retail: immediate sale
- wholesale: quote/invoice/collection
- manufacturing: work order and material flow
- restaurant voice: order or reservation request
- clinic voice: appointment request

Those should not be collapsed into one generic workflow without capability-based routing.
