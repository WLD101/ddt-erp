# WhatsQuery Voice WhatsApp Channel

WhatsQuery Voice supports WhatsApp as a separate AI receptionist channel beside the phone receptionist.

## Product Boundary

- Product: WhatsQuery Voice.
- Channel: WhatsApp Business Platform / Cloud API.
- Phone AI receptionist remains separate.
- ERP writes remain disabled unless explicitly enabled by guarded Voice policy.

## Tenant Mapping

Every inbound WhatsApp webhook must map by `phoneNumberId`.

Required mapping:

- `VoiceWhatsappIntegration.phoneNumberId`
- `VoiceWhatsappIntegration.organizationId`
- optional `VoiceWhatsappIntegration.voiceAgentId`

The webhook must never fallback to the first tenant, first business, or first agent. If no mapping exists, the event is treated as `mapping_failed`.

## Tenant Configuration

Tenant admins configure WhatsApp from:

- `/voice/dashboard/integrations/whatsapp`
- `/voice/dashboard/whatsapp/inbox`
- `/voice/dashboard/whatsapp/conversations`

Stored values:

- WhatsApp Business Account ID
- phone number ID
- encrypted access token
- webhook verify token hash
- enabled/disabled status
- assigned VoiceAgent
- staff WhatsApp notification number
- template draft settings

## Webhook

Endpoint:

```txt
GET/POST /api/voice/whatsapp/webhook
```

GET verifies the Meta challenge using:

- tenant stored verify token hash, or
- `VOICE_WHATSAPP_WEBHOOK_VERIFY_TOKEN`

POST receives inbound messages, maps by `phone_number_id`, stores the message, drafts or sends an AI reply, and creates tenant-scoped lead/request records when needed.

## AI Behavior

The WhatsApp AI receptionist uses the tenant's own:

- business profile
- opening hours
- receptionist settings
- FAQs
- services/menu
- booking rules
- order rules

It must not invent:

- exact prices
- discounts
- availability
- delivery time
- medical/legal/financial advice
- confirmed booking/order status
- unconfigured services or policies

If exact details are missing, it captures customer details and asks staff to follow up.

## Sending Guard

Live WhatsApp sending is disabled unless:

```env
VOICE_WHATSAPP_SEND_ENABLED=true
```

The tenant integration must also be enabled and have a stored encrypted access token.

When sending is disabled, WhatsQuery stores the AI response as `DRAFTED_NOT_SENT` so admins can inspect what would have been sent.

## Compliance Notes

- Respect WhatsApp's 24-hour customer service window.
- Outside the service window, use approved templates only.
- Do not spam.
- Do not expose access tokens in forms, pages, logs, or API responses.
- Keep all tenant conversations isolated by `organizationId`.

## Admin Monitoring

Super admin route:

```txt
/voice/admin/whatsapp
```

Shows:

- tenant mappings
- enabled integrations
- recent conversations
- failed or unsent replies
- environment readiness

Tenants only see their own WhatsApp conversations and messages.
