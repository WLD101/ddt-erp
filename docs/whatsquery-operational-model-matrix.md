# WhatsQuery Operational Model Matrix

## Actual operational models identified

| Model | Present in repo | Industries tied to evidence | Notes |
| --- | --- | --- | --- |
| Model A - Immediate order fulfilment | Yes, partial | Restaurant/cafe voice, takeaway/delivery food, retail checkout patterns | Stronger on voice request capture than on kitchen/POS execution |
| Model B - Future scheduled booking | Yes, partial | Restaurant reservations, clinic appointments, simple service inquiries | Request capture exists; full scheduling/capacity engine does not |
| Model C - Job / project / service fulfilment | Weak / generic | `service_basic`, supportable repair/service businesses | Quotes and invoices exist, but no site/survey/job engine |
| Model D - Manufacturing / production order | Yes, early | Manufacturing, textile | Manufacturing has actual service code; textile mostly schema-only |
| Model E - Wholesale / distribution order | Yes | Wholesale, trading, distribution | Most mature commercial workflow in the repo |
| Model F - Retail transaction | Yes, partial | Retail, ecommerce-assisted retail | Retail back office exists; full proven POS flow is not demonstrated in app routes |
| Model G - Subscription / recurring service | Internal only | WhatsQuery platform billing | Subscription exists for platform billing, not as tenant-industry workflow |
| Model H - Case / ticket / request management | Yes, generic | Support / callback / request handling | Present as support and voice request queues, not as deep cross-industry case management |

## Industry comparison

| Industry | Main model(s) | Initial request | Main record today | Fulfilment timing | Scheduling need | Payment pattern | Resource requirement | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Retail | F | Product purchase | Sale / POS sale / invoice | Immediate | Low | Checkout or invoice | Stock, register, branch | High |
| Wholesale / trading | E | Customer order or quote request | Quotation / sales invoice | Same day to scheduled dispatch | Medium | Credit or invoice collection | Stock, branch, finance | High |
| Ecommerce | F + E | Online order | External order map + sales record | Immediate to same day | Medium | Marketplace/store payment + reconciliation | Stock, channel sync | Medium |
| Distribution | E | B2B stock order | Shared sales/inventory docs | Same day to scheduled | Medium | Credit or invoice | Branches, stock | Medium |
| Manufacturing | D | Enquiry / order | BOM + work order | Multi-day | High | Invoice after fulfillment / staged | Materials, machine, production logs | Medium |
| Textile | D + E | Buyer enquiry / spec | Textile entities | Multi-day to multi-week | High | Invoice / credit | Fabric, yarn, batch processes | Medium-low |
| Service basic | C / B | Enquiry | Quote / invoice / customer | Scheduled or later | Medium | Invoice or partial upfront | Staff only, no dedicated resource model | Medium |
| Restaurant / cafe voice | A + B | Order / reservation call | Voice order request / reservation request | Immediate or future booking | Medium | Usually at order time or later at venue | Staff handoff only today | Medium |
| Clinic voice | B | Appointment request | Voice lead / appointment request semantics | Future scheduled | High | Before or after visit | Human calendar/resource assignment | Low-medium |

## Fulfilment timing analysis

| Industry | Typical timing from repo evidence | Requires exact date? | Requires exact time? | Needs duration/capacity? | Notes |
| --- | --- | --- | --- | --- | --- |
| Retail | Real-time / immediate | Rarely | Rarely | Low | Back-office retail more mature than frontline POS |
| Wholesale / trading | Same day to multi-day | Sometimes | Rarely | Medium | Depends on stock and customer payment |
| Ecommerce | Same day to multi-day | Sometimes | Rarely | Medium | Fulfilment depends on external channel operations |
| Distribution | Same day / scheduled future date | Yes | Sometimes | Medium | Missing route and dispatch layer |
| Manufacturing | Multi-day | Yes | Rarely exact time, more lead time | High | Needs production lead time and raw materials |
| Textile | Multi-day / multi-week | Yes | Rarely | High | Should include sampling, QC, partial dispatch later |
| Service basic | Scheduled future date | Yes | Sometimes | Medium | No resource capacity model exists yet |
| Restaurant / cafe voice | Immediate and scheduled future | Sometimes | Sometimes | Medium | Reservation request queue exists; preparation queue does not |
| Clinic voice | Scheduled future date | Yes | Yes | High | Calendar/resource engine not fully built |

## Order and fulfilment differences

| Concept | Restaurant / cafe voice | Wholesale | Manufacturing | Service basic | Retail |
| --- | --- | --- | --- | --- | --- |
| Initial request | Food order or table booking request | Quote/order request | Customer order or production-triggering demand | Customer enquiry | Product purchase |
| Fulfilment timing | Immediate or future reservation | Same day to scheduled dispatch | Future | Future | Immediate |
| Availability basis | Menu/service knowledge and staff callback | Stock and credit | Materials and capacity | Staff time and generic availability | Stock |
| Main record today | `VoiceOrderRequest` / `VoiceReservationRequest` | `Quotation` / `SalesInvoice` | `BOM` / `WorkOrder` | Quote/invoice/customer | `POSSale` or invoice |
| Scheduling | Reservation / callback | Dispatch planning not modeled deeply | Production planning | No true job scheduler | Minimal |
| Resource assignment | Human staff only | Branch / stock | Machine / materials / work order | Not modeled | Register / branch |
| Pricing | Prompt-level guidance | Quote and invoice pricing | Quote/spec then invoice | Quote then invoice | Product price |
| Payment | Usually outside autonomous voice flow | Credit and collections | Invoice / later settlement | Invoice or deposit-like manual handling | Checkout |
| Progress states today | Request queue only | Draft/paid-style shared commercial states | Planned / in progress / completed | Generic commercial states | Sale/return/payment states |
| Completion meaning | Served, delivered, or confirmed later by humans | Delivered / collected / paid | Finished goods produced then dispatched | Service delivered and invoiced | Sale completed |

## Workflow entity audit

| Entity | Current repo state | Notes |
| --- | --- | --- |
| Lead | Present | Voice and CRM lead capture exists |
| Customer | Present | Shared across nearly all industries |
| Contact | Partial | Mostly embedded in customer/user structures |
| Site | Missing | Critical gap for trades/service businesses |
| Branch | Present | Core for retail/wholesale/distribution |
| Enquiry | Partial | Often implied through leads/quotes |
| Quote / estimate | Present | `Quotation` exists |
| Booking / appointment / reservation | Partial | Voice request capture exists; true booking engine incomplete |
| Order | Overloaded | Means different things across voice, retail, wholesale, and manufacturing |
| Sales order | Partial | Sales invoice/quotation exist, but formal sales-order layer is weak |
| Purchase order | Partial | Purchase invoice and purchasing flow exist; PO semantics are limited |
| Production order / work order | Present | Manufacturing has real work-order service logic |
| Job / project | Missing | Needed for trades and service delivery |
| Journey / ride / dispatch / delivery | Missing as dedicated domain | Important future pack for taxi/logistics |
| Table / kitchen ticket | Missing | Needed for restaurant operations beyond voice capture |
| Survey / measurement | Missing | Needed for flooring and field service |
| Invoice / payment | Present | Shared commercial foundation is strong |
| Deposit / refund / credit note | Partial | Refund-like concepts exist in returns; deposits are not first-class |
| Product / service | Present | Shared product basis; service semantics are generic |
| Material / raw material / finished good | Present | Manufacturing and textile modeling exists |
| Vehicle / driver | Missing | Needed for taxi/logistics |
| Machine / production line | Partial | `Machine` exists; line planning is not fully shown |
| Warehouse | Missing as first-class domain | Branch exists; warehouse-scoped operations are called out as architecture gap elsewhere |
| Supplier | Present | Shared across commerce/manufacturing |

## Status machine findings

### Existing strong status evidence

- Manufacturing:
  - `PLANNED`
  - `IN_PROGRESS`
  - `COMPLETED`
- Voice request queues:
  - reservation/order request rows persist with request statuses and are intended for human follow-up
- Calls:
  - telecom and voice call states are rich, but they are telecom states rather than industry fulfillment states

### Current status-machine problem

The repo has:

- strong document/payment style statuses;
- strong telecom/call statuses;
- weak industry-specific fulfillment states for retail POS, distribution, service jobs, reservations, and textile production.

### Recommended direction

- Keep shared reporting states at a high level:
  - `OPEN`
  - `IN_PROGRESS`
  - `COMPLETED`
  - `CANCELLED`
- Add industry-specific state machines per pack:
  - restaurant order states
  - booking/appointment states
  - manufacturing/textile states
  - future dispatch/job states

## Practical conclusion

The real operational center of the repo is not one universal "order" workflow.

It is a combination of:

- a shared ERP commerce core;
- an early manufacturing branch;
- a voice request-capture layer for hospitality and appointments;
- generic service invoicing;
- request/ticket style support flows.

That means the product should be configured by operational model and capabilities, not by a single global order table.
