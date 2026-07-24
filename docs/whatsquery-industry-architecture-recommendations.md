# WhatsQuery Industry Architecture Recommendations

## Executive recommendation

The platform should evolve as:

- one shared core platform
- plus industry packs
- plus configurable capability profiles

It should **not** evolve as:

- one generic workflow for all industries
- or a fully separate application per industry

Repository evidence already shows multiple incompatible operational models:

- wholesale/retail commerce
- manufacturing work orders
- hospitality voice order and reservation capture
- clinic appointment capture
- generic service invoicing

## Shared platform capabilities that should remain core

- tenants and organizations
- branches
- users, roles, permissions
- customers and suppliers
- products and inventory foundations
- quotations, invoices, payments
- audit logs
- imports / exports
- billing / package enforcement
- assistant framework
- voice engine foundation
- notifications
- integration registry and secrets

## Capabilities that should become industry-pack controlled

- immediate orders
- future bookings
- jobs / projects
- production
- dispatch
- delivery
- table reservations
- kitchen operations
- raw-material planning
- quality control
- site / survey / measurement workflows
- vehicles / drivers
- partial fulfillment
- deposits
- recurring service schedules

## Recommended capability model

The current repo already has a light capability precursor in `INDUSTRY_MODULES`, but it is too shallow.  
It enables modules, not operational behavior.

Recommended next shape:

```ts
interface CapabilityProfile {
  supportsImmediateOrders: boolean;
  supportsFutureBookings: boolean;
  supportsQuotes: boolean;
  supportsJobs: boolean;
  supportsProjects: boolean;
  supportsProduction: boolean;
  supportsDispatch: boolean;
  supportsDelivery: boolean;
  supportsTableReservations: boolean;
  supportsInventory: boolean;
  supportsRawMaterials: boolean;
  supportsVehicles: boolean;
  supportsSites: boolean;
  supportsSurveys: boolean;
  supportsMeasurements: boolean;
  supportsKitchen: boolean;
  supportsQualityControl: boolean;
  supportsPartialFulfilment: boolean;
  supportsRecurringServices: boolean;
  supportsDeposits: boolean;
  supportsCreditSales: boolean;
}
```

## Recommended industry profile model

```ts
interface IndustryProfile {
  key: string;
  name: string;
  operationalModels: string[];
  enabledModules: string[];
  capabilities: string[];
  primaryEntities: string[];
  workflowTemplates: string[];
  statusMachines: string[];
  recommendedIntegrations: string[];
  voiceTools: string[];
  requiredPermissions: string[];
  defaultTerminology: Record<string, string>;
}
```

## Recommended first industry profiles

### Retail

- Operational models: `F`
- Modules: products, inventory, sales, purchases, reports
- Capabilities: inventory, checkout, returns, branch stock
- Terminology:
  - transaction -> sale
  - resource -> register
  - fulfillment -> checkout

### Wholesale / trading

- Operational models: `E`
- Modules: customers, quotations, sales, purchases, inventory, payments, reports
- Capabilities: quotes, credit sales, stock fulfillment, collections
- Terminology:
  - transaction -> invoice/order
  - resource -> branch/stock
  - fulfillment -> dispatch

### Ecommerce

- Operational models: `F`, `E`
- Modules: products, inventory, integrations, sales, reports
- Capabilities: channel sync, stock sync, order reconciliation

### Manufacturing

- Operational models: `D`
- Modules: products, inventory, production
- Capabilities: BOM, work orders, materials, QC
- Terminology:
  - transaction -> production order
  - item -> raw material / finished good
  - fulfillment -> production output

### Restaurant / cafe voice

- Operational models: `A`, `B`
- Modules: voice, request queues, integrations
- Capabilities: reservation request, order request, handoff, FAQ
- Terminology:
  - transaction -> order / reservation
  - resource -> staff
  - fulfillment -> preparation / service

### Clinic voice

- Operational models: `B`
- Modules: voice, request queues, integrations
- Capabilities: appointment request, callback, FAQ
- Terminology:
  - transaction -> appointment
  - resource -> clinician / slot
  - fulfillment -> visit

## Onboarding review

Current onboarding does ask for:

- industry
- business type
- branches
- products
- customers

Current onboarding does **not** adequately ask for:

- immediate orders vs future bookings
- products vs services vs manufactured goods
- staff/resource requirements
- scheduling complexity
- deposits
- inventory depth
- quotations before confirmation
- communication channels
- existing software stack

## Recommended onboarding sequence

1. What type of business do you run?
2. Do customers place immediate orders, future bookings, or both?
3. Do you sell products, services, or manufactured goods?
4. Do you need inventory, raw materials, or no stock at all?
5. Do you need staff, machines, vehicles, rooms, or tables assigned?
6. Do you issue quotations before work starts?
7. Do you collect deposits or run customer credit?
8. Do you operate from one branch or multiple branches?
9. Which channels matter most: phone, WhatsApp, storefront, marketplace, website?
10. Which existing software must be connected?

## Architectural risks

| Risk | Severity | Evidence | Impact | Recommendation |
| --- | --- | --- | --- | --- |
| Industry is mostly stored as a label plus module list, not as behavioral capability | High | `INDUSTRY_MODULES` in onboarding config is shallow | Integrations and workflows will be mis-scoped | Introduce capability profiles on top of existing module map |
| Manufacturing is simultaneously implemented in backend and publicly positioned as non-Phase-1 | High | `modules/production/service.ts` vs manufacturing marketing page | Sales, support, and roadmap confusion | Decide one truth: gated beta or roadmap-only |
| Textile has dedicated schema but no proven operational surface | High | textile models exist, no textile module surfaced, page says future | Schema sprawl and false assumptions | Keep textile behind explicit future pack until workflows exist |
| "Order" means different things across commerce, restaurant voice, and production | Critical | sales/order/request/work-order concepts already diverge | Unsafe integrations and reporting confusion | Use separate entity families with terminology mapping |
| Voice request capture is more mature than autonomous execution | Medium | reservation queue copy explicitly says human confirmation required | Unsafe if integrations assume auto-confirmation | Keep action-policy gating per industry |
| Distribution lacks dispatch primitives | High | branch/inventory exists but no driver/vehicle/route model | Integrations may recommend irrelevant tools | Add dispatch pack later; do not overload branch/sales models |
| Service_basic lacks site/job/resource models | High | onboarding exists, but no job/project/site engine | Trades/service businesses will be forced into invoices only | Add service-job pack rather than stretching generic invoices |
| POS entities exist without clearly proven first-class app workflow | Medium | schema and docs mention POS, app routes do not strongly prove it | Retail claims may exceed UI reality | Audit POS implementation before calling it production-ready |
| Calendar need is industry-specific, not global | Medium | clinics and bookings need it; wholesale does not | Noise in integrations UI | Filter integrations by operational model |
| Warehouse is not a first-class operational model yet | Medium | architecture review itself flags warehouse scoping gap | Wholesale/manufacturing scale risk | Add warehouse layer before deeper fulfillment automation |

## Migration guidance

- Do not replace current onboarding module maps immediately.
- Add capability profiles beside `INDUSTRY_MODULES`.
- Add terminology maps before changing entity names.
- Add per-pack state machines instead of one universal enum.
- Gate voice tools by profile:
  - hospitality
  - appointment-led
  - commerce follow-up
  - manufacturing support only
- Keep shared reporting states separate from industry workflow states.

## Recommended next architecture move before integrations work

Phase 0:

- freeze a source-of-truth industry inventory
- freeze a source-of-truth capability profile map

Phase 1:

- extend onboarding to capture operational model answers
- convert those answers into capability flags

Phase 2:

- update integrations registry so recommendations depend on capability flags

Phase 3:

- bind voice tools to those same capability flags and approval policies

Phase 4:

- introduce missing domain packs:
  - dispatch
  - service jobs
  - deeper booking/calendar
  - textile workflow
