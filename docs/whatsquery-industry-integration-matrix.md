# WhatsQuery Industry Integration Matrix

## Principle

The future Integrations tab should not show the same recommendations to every tenant.

The repository already implies different needs for:

- commerce-heavy ERP tenants;
- voice-led booking tenants;
- manufacturing tenants;
- future dispatch or field-service tenants.

## Priority legend

- `Critical`: the industry is materially incomplete without it
- `High`: strongly recommended for normal operation
- `Medium`: useful but not always necessary
- `Low`: optional
- `Irrelevant`: should usually be hidden

## Matrix

| Integration type | Retail | Wholesale | Ecommerce | Distribution | Manufacturing | Textile | Service basic | Restaurant / cafe voice | Clinic voice |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| WhatsApp | High | High | High | High | Medium | Medium | Medium | Critical | High |
| Voice engine (Vapi/Twilio) | Low | Low | Low | Low | Low | Low | Medium | Critical | Critical |
| Google Calendar | Low | Low | Low | Low | Low | Low | Medium | Medium | High |
| Outlook Calendar | Low | Low | Low | Low | Low | Low | Medium | Medium | High |
| CRM / lead follow-up | Medium | High | Medium | Medium | High | High | High | High | High |
| Shopify | Medium | Low | Critical | Low | Low | Low | Low | Irrelevant | Irrelevant |
| WooCommerce | Medium | Low | Critical | Low | Low | Low | Low | Irrelevant | Irrelevant |
| Daraz / marketplace sync | Medium | Low | High | Low | Low | Low | Low | Irrelevant | Irrelevant |
| CSV / spreadsheet import | High | High | High | High | Medium | Medium | Medium | Medium | Medium |
| Accounting / finance sync | High | Critical | High | High | Critical | Critical | High | Medium | Medium |
| Inventory sync | Critical | Critical | Critical | Critical | Critical | Critical | Low | Low | Irrelevant |
| POS | Critical | Low | Medium | Low | Irrelevant | Irrelevant | Irrelevant | Irrelevant | Irrelevant |
| Dispatch / route software | Low | Medium | Medium | High | Low | Medium | Low | Delivery only | Irrelevant |
| Maps / geolocation | Low | Low | Medium | Medium | Low | Low | Medium | Delivery only | Medium |
| Production planning | Irrelevant | Low | Irrelevant | Low | Critical | Critical | Irrelevant | Irrelevant | Irrelevant |
| Buyer / approval portal | Low | Medium | Low | Low | Medium | High | Low | Irrelevant | Irrelevant |
| SMS / notifications | Medium | High | High | High | Medium | Medium | Medium | High | High |
| Email / docs / PDF | Medium | High | High | High | High | High | High | Medium | Medium |

## Existing integration evidence in repo

Directly evidenced in code/routes/docs:

- WhatsApp channel
- Twilio
- Vapi
- Daraz
- Shopify
- WooCommerce
- CSV import/export
- Stripe for platform billing
- PDF/report export

Visible evidence locations include:

- `modules/integrations/service.ts`
- `app/(dashboard)/settings/integrations/*`
- `app/(voice)/voice/dashboard/integrations/*`
- `modules/voice/vapi/*`
- `docs/VOICE_WHATSAPP_CHANNEL.md`

## Per-industry recommended defaults

### Retail

- Default recommended:
  - POS
  - CSV import
  - accounting sync
  - optional ecommerce channels
- Hide by default:
  - production planning
  - clinic calendars
  - dispatch-only tools unless delivery is enabled

### Wholesale / trading

- Default recommended:
  - accounting sync
  - CSV / Excel import
  - CRM / collections follow-up
  - WhatsApp
- Hide by default:
  - restaurant booking tools
  - table reservations

### Ecommerce

- Default recommended:
  - Shopify / WooCommerce / Daraz
  - inventory sync
  - accounting sync
  - WhatsApp
- Hide by default:
  - production planning
  - appointment calendars

### Distribution

- Default recommended:
  - accounting
  - inventory
  - CSV / Excel
  - WhatsApp
- Future recommendations:
  - dispatch and route tools once that pack exists

### Manufacturing / textile

- Default recommended:
  - accounting
  - inventory
  - spreadsheet import
  - future production-planning integrations
- Future recommendations:
  - QC, planning, buyer approvals, export docs

### Restaurant / cafe voice

- Default recommended:
  - voice engine
  - WhatsApp
  - SMS/notifications
  - optional calendar
- Explicitly restricted:
  - direct ERP invoice creation
  - refund tools
  - autonomous payment/refund unless business rules allow it

### Clinic voice

- Default recommended:
  - voice engine
  - Google/Outlook calendar
  - WhatsApp/SMS reminders
  - CRM / follow-up
- Explicitly restricted:
  - autonomous appointment confirmation without validated calendar capacity

## Voice-agent action implications by industry

| Voice action | Retail | Wholesale | Manufacturing | Restaurant / cafe voice | Clinic voice | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Read FAQs | Medium | Medium | Medium | Critical | Critical | Already supported |
| Capture lead | Medium | High | High | High | High | Already supported |
| Create order request | Low | Low | Low | Critical | Irrelevant | Present in voice tools |
| Request appointment / reservation | Low | Low | Low | High | Critical | Present generically |
| Confirm booking autonomously | Low | Low | Low | Low | Low | Should remain approval-gated |
| Create invoice directly | Medium | Medium | Medium | Not suitable | Not suitable | Unsafe for current voice stack |
| Take payment | Low | Low | Low | Not suitable | Not suitable | Not proven in current repo |
| Handoff / callback | Medium | High | High | Critical | Critical | Already intended |
| Dispatch | Irrelevant | Low | Irrelevant | Delivery only | Irrelevant | Future pack |

## Integration architecture recommendation

The Integrations tab should be filtered by:

1. industry profile
2. operational model
3. enabled capabilities
4. current module entitlements
5. voice-risk level

Recommended UI behavior:

- show shared integrations to all tenants:
  - exports
  - CSV
  - email
  - basic messaging
- show recommended integrations by pack:
  - commerce
  - voice hospitality
  - voice appointments
  - manufacturing
- suppress irrelevant integrations instead of showing everything disabled
- require field mapping per industry terminology:
  - `order`
  - `booking`
  - `job`
  - `work order`
  - `production order`
