# WhatsQuery Voice Naming and Cost Tracking

## Principle

WhatsQuery Voice is the product. Vapi is an implementation provider behind it.

Tenants and admins configure receptionists from `voice.whatsquery.com`. They do not manually build or manage Vapi assistants in the Vapi dashboard.

Caller-facing business identity and internal tracking identity are intentionally different.

## Naming Convention

### Caller-facing name

This is what the receptionist says to a customer.

Examples:

- `Assalam-o-Alaikum, thanks for calling CoffeeFix...`
- `Assalam-o-Alaikum, thanks for calling Elegenza...`
- `Assalam-o-Alaikum, thanks for calling Dr. Ali Dental Clinic...`

### Internal Vapi assistant name

Format:

`WQ | {{BusinessSlug}} | {{AgentSlug}} | {{Environment}}`

Examples:

- `WQ | CoffeeFix | MainReceptionist | PROD`
- `WQ | Elegenza | RestaurantReceptionist | PROD`
- `WQ | DrAliDental | AppointmentAgent | PROD`

### Internal Vapi phone label

Format:

`WQ | {{BusinessSlug}} | {{PhonePurpose}} | {{Environment}}`

Examples:

- `WQ | CoffeeFix | MainLine | PROD`
- `WQ | Elegenza | BookingLine | PROD`
- `WQ | DrAliDental | AppointmentLine | PROD`

### WhatsQuery VoiceAgent display name

Human-friendly examples:

- `CoffeeFix Main Receptionist`
- `Elegenza Restaurant Receptionist`
- `Dr. Ali Dental Appointment Agent`

### WhatsQuery internal key

Examples:

- `coffeefix-main-receptionist-prod`
- `elegenza-restaurant-receptionist-prod`
- `dr-ali-dental-appointment-agent-prod`

## VoiceAgent Fields

Each VoiceAgent should carry the naming and provider mapping needed for cost attribution:

- `internalName`
- `displayName`
- `businessSlug`
- `agentSlug`
- `environment`
- `vapiAssistantName`
- `vapiAssistantId`
- `vapiPhoneNumberName`
- `vapiPhoneNumberId`
- `vapiVoiceId`
- `organizationId`
- `voiceBusinessProfileId`

## Sync Rules

When WhatsQuery Voice syncs an agent to Vapi:

- assistant `name` must use the internal tracking format
- first message must use the caller-facing business name
- system prompt must use the caller-facing business name
- sync must be blocked if:
  - `businessSlug` is missing
  - `agentSlug` is missing
  - `businessName` is missing
  - `organizationId` is missing
  - the VoiceAgent is not tenant-scoped
  - the generated assistant name is generic, such as `Alex`, `TechSolutions`, `Demo`, or `Untitled`
  - the assistant ID is already mapped to another tenant

## Cost Tracking

Every `VoiceCallLog` should retain:

- `organizationId`
- `voiceBusinessProfileId`
- `voiceAgentId`
- `provider`
- `providerCallId`
- `providerAssistantId`
- `providerPhoneNumberId`
- `callerNumber`
- `callDirection`
- `startedAt`
- `endedAt`
- `durationSeconds`
- `costUsd`
- `costBreakdownJson`
- `transcript`
- `summary`
- `status`

If Vapi sends cost data in webhook events, WhatsQuery Voice stores it directly on the `VoiceCallLog`.

If Vapi does not send cost data in the webhook, a later reconciliation path should fetch the provider call by `providerCallId` and backfill:

- `costUsd`
- `costBreakdownJson`

## Admin Reporting

Voice Admin Command Center should show:

- total Vapi cost today
- total Vapi cost this month
- cost by business
- cost by VoiceAgent
- cost by phone number
- call minutes by business
- call minutes by agent
- top 10 highest-cost tenants
- calls without cost data
- calls without mapped tenant or agent

Admins can see both:

- caller-facing business name
- internal Vapi tracking name

## Tenant Reporting

Each tenant should only see its own:

- calls this month
- minutes this month
- estimated cost, if allowed by package or tenant policy
- package usage
- remaining monthly limit

Tenant cost isolation must be preserved. One tenant must never see another tenant’s call cost or usage.

## Examples

### CoffeeFix

- caller-facing business name: `CoffeeFix`
- assistant display name: `CoffeeFix Main Receptionist`
- internal key: `coffeefix-main-receptionist-prod`
- Vapi assistant name: `WQ | CoffeeFix | MainReceptionist | PROD`
- Vapi phone label: `WQ | CoffeeFix | MainLine | PROD`

### Elegenza

- caller-facing business name: `Elegenza`
- assistant display name: `Elegenza Restaurant Receptionist`
- internal key: `elegenza-restaurant-receptionist-prod`
- Vapi assistant name: `WQ | Elegenza | RestaurantReceptionist | PROD`
- Vapi phone label: `WQ | Elegenza | BookingLine | PROD`

### Dr. Ali Dental Clinic

- caller-facing business name: `Dr. Ali Dental Clinic`
- assistant display name: `Dr. Ali Dental Appointment Agent`
- internal key: `dr-ali-dental-appointment-agent-prod`
- Vapi assistant name: `WQ | DrAliDental | AppointmentAgent | PROD`
- Vapi phone label: `WQ | DrAliDental | AppointmentLine | PROD`
