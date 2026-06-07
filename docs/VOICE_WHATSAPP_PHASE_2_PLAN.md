# WhatsQuery Voice: WhatsApp Channel Roadmap (Phase 2)

This document outlines the future roadmap for integrating WhatsApp support into WhatsQuery Voice. 

## Scope Clarification for Launch

> [!IMPORTANT]
> **Today's Launch Focus**: The initial launch of WhatsQuery Voice is strictly focused on the **phone-call AI receptionist** powered by Vapi.
> There is no active WhatsApp message-replying chatbot or WhatsApp voice-calling receptionist in today's launch.

---

## Future Roadmap: Phase 2

### 1. WhatsApp Message AI Receptionist (Phase 2 - Core)
- **Objective**: Allow businesses to use WhatsApp Business Platform as a messaging channel for the AI receptionist.
- **Integration**: Multi-tenant business profiles, FAQs, and allowed action policies will be shared between Vapi (phone) and WhatsApp (text).
- **Core Features**:
  - Secure credentials mapping per tenant using Meta's `phoneNumberId`.
  - Inbound text message webhooks processing.
  - LLM response generation in English, Urdu, and Roman Urdu.
  - Execution of tool actions (`capture_lead`, `request_appointment`, `create_order_request`) based on user requests, saving results directly to WhatsQuery Voice without modifying the core ERP databases.
  - Enforcement of WhatsApp's 24-hour customer service window, falling back to pre-approved notification templates outside the window.

### 2. WhatsApp Call AI Receptionist (Enterprise Future Feature)
- **Objective**: Support answering voice calls made over WhatsApp Business accounts.
- **Integration**: Advanced/Enterprise tier feature using specialized SIP trunks or direct Meta Calling APIs as they mature, routing voice streams to the Vapi receptionist agent.

---

## Benefits of Phased Launch
- **Reduced Deployment Risk**: Zero extra database migrations, new routes, or third-party webhooks introduced on launch day.
- **Security Isolation**: Keeps tenant mapping robust and prevents cross-tenant data leakage by focusing testing entirely on Vapi webhook security.
