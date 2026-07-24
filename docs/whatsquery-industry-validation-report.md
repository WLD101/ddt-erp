# WhatsQuery Industry Validation Report

Validation date: July 22, 2026

## Summary

```text
Verified explicit industries: 6
Verified partial industries: 3
Verified placeholders: 0
Verified implicit industries: 5
Unsupported previous claims: 1
Verified operational models: 6
```

## Validation table

| Industry | Previous status | Verified status | Evidence count | Confidence | Decision |
| --- | --- | --- | ---: | --- | --- |
| Retail | Explicit | Explicit | 4 | High | Keep explicit |
| Wholesale / trading | Explicit | Explicit | 4 | High | Keep explicit |
| Ecommerce | Explicit | Explicit | 4 | High | Keep explicit |
| Distribution | Explicit | Explicit | 3 | Medium | Keep explicit but beta-like |
| Manufacturing | Explicit | Explicit | 4 | Medium | Keep explicit with beta/phase-gap warning |
| Textile | Explicit | Partial / planned | 2 | Low | Downgrade from explicit |
| Service basic / professional services | Explicit | Explicit | 3 | Medium | Keep explicit |
| Restaurant / cafe voice | Partial | Partial | 4 | Medium | Keep partial |
| Clinic / dental clinic voice | Partial | Partial | 3 | Medium | Keep partial |
| Real estate / property | Mentioned | Unsupported | 1 | Low | Remove as supported industry |

## Evidence paths

- Retail:
  - `modules/onboarding/service.ts`
  - `app/onboarding/steps/IndustryStep.tsx`
  - `app/(marketing)/industries/retail-erp/page.tsx`
  - `prisma/schema.prisma`
- Wholesale / trading:
  - `modules/onboarding/service.ts`
  - `modules/command-center/actions.ts`
  - `scripts/final-seed.ts`
  - `app/(marketing)/industries/wholesale-erp/page.tsx`
- Ecommerce:
  - `modules/onboarding/service.ts`
  - `modules/integrations/service.ts`
  - `app/(dashboard)/settings/integrations/shopify/ShopifySettingsClient.tsx`
  - `app/(dashboard)/settings/integrations/woocommerce/WooCommerceSettingsClient.tsx`
- Distribution:
  - `modules/onboarding/service.ts`
  - `modules/command-center/actions.ts`
  - branch/inventory/sales/purchases models and routes in shared ERP
- Manufacturing:
  - `modules/onboarding/service.ts`
  - `modules/production/service.ts`
  - `app/(dashboard)/dashboard/production/page.tsx`
  - `prisma/schema.prisma`
- Textile:
  - textile entities in `prisma/schema.prisma`
  - `app/(marketing)/industries/textile-erp/page.tsx`
- Service basic:
  - `modules/onboarding/service.ts`
  - shared customers/quotes/invoices/expenses routes and services
  - `modules/auth/service.ts`
- Restaurant / cafe voice:
  - `scripts/setup-voice-demo.ts`
  - `modules/voice/service.ts`
  - `app/(voice)/voice/dashboard/reservations/page.tsx`
  - `prisma/schema.prisma`
- Clinic / dental clinic voice:
  - `scripts/verify-voice-prompts.ts`
  - `modules/voice/schema.ts`
  - `modules/voice/vapi/tools.ts`
- Real estate / property:
  - `prisma/schema.prisma` comment only

## Operational models revalidated

| Model | Verified | Evidence | Decision |
| --- | --- | --- | --- |
| Immediate order fulfilment | Yes | restaurant voice order requests; retail transactional pattern | Keep |
| Future scheduled booking | Yes | reservation requests; appointment requests | Keep |
| Job or service fulfilment | No strong workflow engine | service invoices and quotes exist, but no job/site engine | Remove from verified list |
| Manufacturing and production | Yes | production module service and route | Keep |
| Wholesale and distribution | Yes | shared ERP sales/purchases/inventory/quoting | Keep |
| Retail transaction | Yes | retail onboarding plus POS schema and retail marketing surface | Keep |
| Case or request management | Yes | `SupportRequest`, voice callback/request queues | Keep |
| Recurring service | No | only platform billing recurs | Not verified |
| Subscription fulfilment | Internal only | platform billing only | Not a tenant industry model |

## Corrections made

- Textile was downgraded from explicit to partial/planned because schema plus marketing page was not enough for explicit operational support.
- Real estate/property was removed as a supported industry because only comments and examples were found.
- Recurring service and subscription fulfilment were removed from verified tenant operational models.
- Service-basic remains explicit, but only as a light generic service profile rather than a true job-management industry.

## Implementation consequences

- Industry-aware integrations should target the six verified explicit profiles first.
- Textile should remain feature-flagged and clearly marked planned/beta until operational routes and services exist.
- Voice tooling must distinguish hospitality/appointment request capture from autonomous ERP execution.
- Future field-service, taxi, salon, and property packs should not reuse the current generic service profile without dedicated entities and status machines.
