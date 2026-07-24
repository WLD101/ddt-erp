# WhatsQuery Technical Overview for Telecom Partners

## Document Purpose

This document explains how WhatsQuery works from a telecom, cloud infrastructure, SIP trunking, data flow, and enterprise integration perspective. It is designed to help telecom operators, data center teams, SIP engineers, and enterprise technology stakeholders understand the platform architecture and deployment model.

WhatsQuery positioning:

> Bridging the gap between Carrier Networks and Enterprise Databases.

WhatsQuery connects business communication channels such as phone calls, SIP trunks, WhatsApp/business messaging, AI workflows, customer data, CRM/ERP records, call logs, and operational dashboards into one secure business automation platform.

## 1. High-Level Product Overview

WhatsQuery is a multi-tenant SaaS platform for small and growing businesses. It currently includes two major product areas:

- WhatsQuery ERP: business operations platform for customers, products, inventory, sales, purchases, finance, reports, users, roles, subscriptions, and Smart Assistant workflows.
- WhatsQuery Voice: AI receptionist and business communication automation platform for calls, WhatsApp messages, leads, appointments, order requests, call logs, usage tracking, and tenant-level business training.

For telecom partnership purposes, the most relevant product is WhatsQuery Voice.

```mermaid
flowchart LR
    A["Customers"] --> B["Carrier / SIP / WhatsApp Channels"]
    B --> C["WhatsQuery Voice"]
    C --> D["AI Receptionist"]
    C --> E["Business Rules & Training"]
    C --> F["Lead / Order / Booking Capture"]
    C --> G["Call Logs & Conversations"]
    C --> H["Tenant Dashboard"]
    C --> I["Admin Command Center"]
    H --> J["Business Owner / Staff"]
    I --> K["WhatsQuery Operations Team"]
```

## 2. Core Platform Components

WhatsQuery consists of the following major layers:

| Layer | Purpose |
|---|---|
| Web Dashboard | Tenant and admin user interface |
| Backend API | Business logic, tenant enforcement, billing, integrations |
| PostgreSQL Database | Tenant data, call logs, leads, business profiles, usage records |
| SIP / Asterisk Layer | SIP trunking, inbound call routing, call metadata, optional recordings |
| WhatsApp Channel | WhatsApp Business Platform integration and customer conversations |
| AI Workflow Layer | AI receptionist prompts, intent handling, safe action routing |
| Admin Command Center | Platform monitoring, tenant management, usage, costs, support |
| Monitoring & Logs | System health, errors, slow queries, backup status |
| Backup Layer | Database, media, configuration, and disaster recovery backups |

```mermaid
flowchart TB
    subgraph Channels["Communication Channels"]
        SIP["SIP Trunk / PSTN Calls"]
        WA["WhatsApp Business Messages"]
        WEB["Web Dashboard Users"]
    end

    subgraph App["WhatsQuery Application Layer"]
        NEXT["Next.js Web + API"]
        AUTH["Authentication & RBAC"]
        TENANT["Tenant Isolation Layer"]
        AI["AI Receptionist Workflow"]
        BILLING["Usage / Billing Controls"]
    end

    subgraph Data["Data Layer"]
        PG["PostgreSQL"]
        FILES["Recordings / Media Storage"]
        BACKUPS["Backups"]
    end

    subgraph Ops["Operations Layer"]
        MON["Monitoring"]
        LOGS["Logs"]
        ADMIN["Admin Command Center"]
    end

    SIP --> NEXT
    WA --> NEXT
    WEB --> NEXT
    NEXT --> AUTH
    AUTH --> TENANT
    TENANT --> AI
    TENANT --> BILLING
    AI --> PG
    NEXT --> PG
    NEXT --> FILES
    PG --> BACKUPS
    FILES --> BACKUPS
    NEXT --> MON
    PG --> MON
    MON --> ADMIN
    LOGS --> ADMIN
```

## 3. Multi-Tenant Model

Each business using WhatsQuery is represented as a tenant or organization. Tenant data is separated by `organizationId`.

Examples:

- Cafe tenant with 2 branches
- Restaurant tenant with 4 branches
- Clinic tenant with appointment workflows
- Retail tenant with support/order workflows

Tenant-specific data includes:

- Business profile
- Branches
- Users and roles
- Voice agents
- Receptionist settings
- Knowledge base and FAQs
- Leads
- Orders and booking requests
- Call logs
- WhatsApp conversations
- Usage and billing records

```mermaid
flowchart TB
    subgraph Platform["WhatsQuery Platform"]
        AUTH["Authenticated User"]
        RESOLVE["Resolve Tenant Context"]
        GUARD["Role & Permission Guard"]
        ACTION["Allowed Action"]
    end

    subgraph TenantA["Tenant A: Cafe"]
        A1["Customers"]
        A2["VoiceAgent"]
        A3["Call Logs"]
        A4["WhatsApp Conversations"]
    end

    subgraph TenantB["Tenant B: Restaurant"]
        B1["Customers"]
        B2["VoiceAgent"]
        B3["Call Logs"]
        B4["WhatsApp Conversations"]
    end

    AUTH --> RESOLVE --> GUARD --> ACTION
    ACTION --> TenantA
    ACTION -. "No cross-tenant access" .-> TenantB
```

## 4. WhatsQuery Voice: AI Receptionist Concept

WhatsQuery Voice is a business communication layer that helps businesses handle customer interactions over phone and WhatsApp.

It can:

- Answer common business questions
- Explain business hours
- Capture customer details
- Capture leads
- Capture appointment requests
- Capture table booking requests
- Capture order/takeaway requests
- Escalate to staff when needed
- Store call/message logs
- Generate usage and cost reports

It must not:

- Invent prices
- Invent discounts
- Confirm availability without backend confirmation
- Give medical/legal/financial advice
- Confirm bookings or orders unless the business rules allow it
- Use data from another tenant

```mermaid
flowchart LR
    Q["Customer Question"] --> C{"Can answer from tenant profile, FAQs, menu, hours, or rules?"}
    C -- "Yes" --> A["Answer in business tone"]
    C -- "No" --> F["Capture details for callback / staff confirmation"]
    A --> L["Log conversation"]
    F --> L
    L --> D["Tenant Dashboard"]
```

## 5. Phone Call / SIP Trunk Flow

For telecom integration, inbound calls can be routed from the carrier/SIP trunk into the WhatsQuery SIP/Asterisk layer. The call is then connected to the WhatsQuery Voice workflow.

Recommended production approach:

- Telecom operator provides SIP trunk and DID numbers.
- SIP trunk is IP-whitelisted to a Pakistan-hosted WhatsQuery SIP/Asterisk server.
- Asterisk handles call routing and call metadata.
- WhatsQuery maps the DID/phone number to the correct tenant and VoiceAgent.
- AI receptionist handles the conversation.
- Call metadata, duration, recording link if enabled, and summary are stored under the tenant.

```mermaid
sequenceDiagram
    participant Caller as Customer Caller
    participant Telco as Telco / SIP Trunk
    participant SIP as WhatsQuery SIP / Asterisk
    participant App as WhatsQuery Voice API
    participant AI as AI Receptionist
    participant DB as PostgreSQL
    participant Dash as Tenant Dashboard

    Caller->>Telco: Calls business number
    Telco->>SIP: Routes inbound SIP call
    SIP->>App: Sends call event / mapped DID
    App->>DB: Resolve tenant and VoiceAgent
    App->>AI: Start receptionist workflow
    AI->>Caller: Greets and handles conversation
    AI->>App: Structured outcome
    App->>DB: Save call log, lead/order/booking if needed
    DB->>Dash: Tenant sees call activity
```

## 6. WhatsApp AI Receptionist Flow

WhatsQuery also supports WhatsApp Business Platform as a separate channel. This is important for Pakistani businesses because many businesses rely heavily on WhatsApp for sales, support, orders, and customer communication.

WhatsApp channel behavior:

- Customer sends WhatsApp message to business number.
- Meta webhook sends event to WhatsQuery.
- WhatsQuery maps by WhatsApp `phoneNumberId`.
- The mapped tenant and VoiceAgent are loaded.
- AI response is generated using only that tenant's business training profile.
- Reply is sent through WhatsApp Cloud API if enabled.
- If live sending is disabled, the reply is stored as a draft/not-sent record.
- Conversations are visible in tenant dashboard.
- Admin can monitor mappings and failed/unsent messages.

```mermaid
sequenceDiagram
    participant Customer as Customer on WhatsApp
    participant Meta as WhatsApp Business Platform
    participant Webhook as WhatsQuery WhatsApp Webhook
    participant Map as Tenant Mapping
    participant AI as AI Receptionist
    participant DB as PostgreSQL
    participant Tenant as Tenant Inbox
    participant Admin as Admin Monitor

    Customer->>Meta: Sends WhatsApp message
    Meta->>Webhook: POST webhook with phone_number_id
    Webhook->>Map: Resolve integration by phoneNumberId
    Map->>DB: Load tenant business profile and VoiceAgent
    DB->>AI: Provide tenant-only context
    AI->>Webhook: Draft response and intent
    Webhook->>Meta: Send reply if enabled
    Webhook->>DB: Store inbound/outbound messages
    DB->>Tenant: Show conversation
    DB->>Admin: Show mapping and failed message status
```

## 7. Tenant Business Training Profile

The AI receptionist is trained from tenant-controlled business information.

Training data includes:

- Business name
- Industry
- Branch/location details
- Opening hours
- Greeting message
- FAQs
- Services/menu
- Pricing notes
- Booking rules
- Order rules
- Handoff rules
- Allowed and blocked actions
- Language and tone

```mermaid
flowchart TB
    P["Business Profile"] --> PB["Prompt Builder"]
    H["Opening Hours"] --> PB
    FAQ["FAQs"] --> PB
    MENU["Services / Menu"] --> PB
    BR["Booking Rules"] --> PB
    OR["Order Rules"] --> PB
    HR["Handoff Rules"] --> PB
    SEC["Allowed / Blocked Actions"] --> PB
    PB --> AI["Tenant VoiceAgent Prompt"]
    AI --> CALL["Phone Channel"]
    AI --> WA["WhatsApp Channel"]
```

## 8. Data Flow and Storage

WhatsQuery stores operational records under each tenant.

Key stored data:

- Users and roles
- Tenant business profile
- VoiceAgent configuration
- Call logs
- WhatsApp conversations and messages
- Leads
- Order requests
- Appointment/reservation requests
- Usage records
- Cost records
- Audit logs
- Integration settings

Sensitive tokens are encrypted or stored as hashes where appropriate.

```mermaid
erDiagram
    Organization ||--o{ VoiceAgent : owns
    Organization ||--|| VoiceBusinessProfile : has
    Organization ||--o{ VoiceCallLog : stores
    Organization ||--o{ VoiceLead : captures
    Organization ||--o{ VoiceOrderRequest : captures
    Organization ||--o{ VoiceReservationRequest : captures
    Organization ||--o{ VoiceWhatsappIntegration : configures
    VoiceWhatsappIntegration ||--o{ VoiceWhatsappConversation : receives
    VoiceWhatsappConversation ||--o{ VoiceWhatsappMessage : contains
    VoiceAgent ||--o{ VoiceCallLog : handles
    VoiceAgent ||--o{ VoiceWhatsappConversation : handles
```

## 9. Admin and Tenant Views

Tenant dashboard:

- Business profile
- AI receptionist settings
- Knowledge base
- Leads
- Call logs
- Orders
- Reservations
- WhatsApp inbox
- Usage and package limits
- Integration settings

Admin command center:

- Tenant directory
- Packages and billing
- AI agent overview
- Call logs
- WhatsApp monitor
- Usage and cost monitoring
- Failed webhook/message monitoring
- Support/ticket requests
- Audit logs

```mermaid
flowchart LR
    subgraph Tenant["Tenant Admin"]
        T1["Setup Business Profile"]
        T2["Train AI"]
        T3["View Calls / WhatsApp"]
        T4["Review Leads / Orders / Bookings"]
    end

    subgraph Platform["WhatsQuery Super Admin"]
        A1["Monitor Tenants"]
        A2["Monitor SIP / WhatsApp"]
        A3["Review Usage & Costs"]
        A4["Support / Troubleshooting"]
    end

    T1 --> T2 --> T3 --> T4
    A1 --> A2 --> A3 --> A4
```

## 10. Security Model

Security controls include:

- Authentication for dashboard users
- Role-based access control
- Tenant-scoped database queries
- Platform-admin-only system views
- Tenant-only dashboard data
- Encrypted integration tokens
- Hashed webhook verification tokens where applicable
- Audit logs for sensitive actions
- Firewall restrictions
- SSL/TLS for web access
- SIP IP whitelisting where supported
- PostgreSQL not exposed publicly
- Backup monitoring

```mermaid
flowchart TB
    R["Incoming Request"] --> AUTH{"Authenticated?"}
    AUTH -- "No" --> DENY["Reject / Redirect to Login"]
    AUTH -- "Yes" --> TENANT["Resolve Tenant Context"]
    TENANT --> ROLE{"Role Allowed?"}
    ROLE -- "No" --> BLOCK["Forbidden"]
    ROLE -- "Yes" --> SCOPE["Apply organizationId Scope"]
    SCOPE --> ACTION["Execute Action"]
    ACTION --> AUDIT["Audit Log"]
```

## 11. Pakistan-Hosted Deployment Model

For telco production, WhatsQuery can be hosted inside Pakistan using:

- Telco-approved cloud/data center
- Pakistan-based local cloud/VPS provider
- Colocated WhatsQuery-owned server infrastructure

Recommended production model separates critical layers:

- Load balancer / Nginx
- App/API server
- PostgreSQL database server
- SIP/Asterisk or SBC server
- Backup storage
- Monitoring/logging server or service

```mermaid
flowchart TB
    Internet["Internet / Tenant Users"] --> CF["DNS / SSL / WAF Optional"]
    CF --> NGINX["Nginx / Reverse Proxy"]
    NGINX --> APP["WhatsQuery App/API Server"]

    Telco["Telco SIP Trunk"] --> SIP["SIP Gateway / Asterisk Server"]
    SIP --> APP

    Meta["WhatsApp Business Platform"] --> NGINX

    APP --> DB["PostgreSQL Server"]
    APP --> STORE["Media / Recording Storage"]
    DB --> BACKUP["Encrypted Backups"]
    STORE --> BACKUP

    APP --> MON["Monitoring & Logs"]
    DB --> MON
    SIP --> MON
    MON --> ADMIN["Admin Command Center"]
```

## 12. Pilot Deployment Model

For 5 to 10 early clients, a cost-effective pilot can run on Pakistan-hosted VPS/cloud.

Minimum pilot:

- 1 server
- 4 vCPU
- 8 GB RAM
- 100 GB SSD
- Static IP
- Docker Compose
- App/API, PostgreSQL, and Asterisk on one server
- Daily backups

Preferred pilot:

- App/API + database server
- Separate SIP/Asterisk server
- Static IP for SIP
- Daily off-server backups
- Basic monitoring

```mermaid
flowchart LR
    Users["Tenant Users"] --> VPS["Pakistan VPS / Cloud"]
    SIP["Telco SIP Trunk"] --> VPS
    WA["WhatsApp Webhook"] --> VPS
    VPS --> APP["App/API"]
    VPS --> DB["PostgreSQL"]
    VPS --> AST["Asterisk"]
    VPS --> BK["Daily Backup"]
```

## 13. SIP Trunking Requirements

WhatsQuery requires the following SIP information from the telecom operator:

- SIP trunk type
- Static public IP requirements
- IP whitelisting process
- SIP authentication method
- DID/local number allocation
- Concurrent channel limit
- Codec support
- RTP port range
- Inbound routing rules
- Outbound routing rules
- Caller ID rules
- CDR access
- SLA and escalation contacts
- Test trunk credentials
- Firewall/NAT requirements
- Any local data residency requirements for CDRs and recordings

```mermaid
flowchart TB
    TELCO["Telco Provides SIP Trunk"] --> DID["DID Numbers"]
    TELCO --> CH["Concurrent Channels"]
    TELCO --> IP["IP Whitelisting"]
    TELCO --> RTP["SIP/RTP Ranges"]
    TELCO --> CDR["CDR / Billing Data"]
    DID --> WQ["WhatsQuery SIP Gateway"]
    CH --> WQ
    IP --> WQ
    RTP --> WQ
    CDR --> WQ
```

## 14. Monitoring and Capacity Planning

WhatsQuery monitors both infrastructure and product usage.

Infrastructure metrics:

- CPU
- RAM
- disk
- network
- app response time
- Nginx 4xx/5xx
- database connections
- slow queries
- backup status
- SIP service status

Tenant/product metrics:

- Calls
- Call minutes
- Missed calls
- WhatsApp conversations
- Leads
- Orders
- Bookings
- Assistant actions
- Storage usage
- Estimated cost where enabled

```mermaid
flowchart LR
    APP["App/API"] --> MET["Metrics Collector"]
    DB["PostgreSQL"] --> MET
    SIP["Asterisk/SIP"] --> MET
    WA["WhatsApp Webhooks"] --> MET
    MET --> ALERT["Alerts"]
    MET --> DASH["System Health Dashboard"]
    MET --> REPORT["Usage & Cost Reports"]
```

## 15. Backup and Disaster Recovery

Recommended backup model:

- Daily PostgreSQL backup
- Daily application file backup
- Daily SIP/Asterisk configuration backup
- Optional call recording backup
- Off-server backup storage
- Restore test schedule
- Rollback plan for deployments

```mermaid
flowchart TB
    DB["PostgreSQL"] --> DUMP["Daily DB Dump"]
    FILES["Files / Media / Recordings"] --> FB["File Backup"]
    SIP["Asterisk Config"] --> SB["SIP Config Backup"]
    DUMP --> ENC["Encrypted Backup Storage"]
    FB --> ENC
    SB --> ENC
    ENC --> RESTORE["Restore Test / DR Plan"]
```

## 16. Deployment and Migration Flow

Migration from current early-stage VPS to Pakistan-hosted environment:

```mermaid
flowchart TD
    A["Provision Pakistan-hosted server/cloud"] --> B["Install OS, firewall, Docker/Node/PostgreSQL/Asterisk"]
    B --> C["Backup current database and files"]
    C --> D["Restore database and media"]
    D --> E["Configure environment variables and secrets"]
    E --> F["Run Prisma migrations"]
    F --> G["Build and start WhatsQuery"]
    G --> H["Configure Nginx and SSL"]
    H --> I["Configure SIP trunk and static IP whitelist"]
    I --> J["Run smoke tests"]
    J --> K["Switch DNS / production traffic"]
    K --> L["Monitor logs, calls, webhooks, backups"]
    L --> M["Keep old server as rollback temporarily"]
```

## 17. Compliance-Friendly Data Residency Approach

WhatsQuery can separate public and production workloads.

Recommended model:

- Public website and marketing assets can remain outside Pakistan if acceptable.
- Telecom production workloads should run inside Pakistan.
- Customer operational data should remain inside Pakistan.
- SIP traffic, CDRs, call logs, and recordings should remain inside Pakistan where required.
- Backups should be stored inside Pakistan if required by telco/data residency expectations.

```mermaid
flowchart LR
    subgraph Public["Public / Non-sensitive"]
        MKT["Website"]
        DEMO["Demo Content"]
        DOCS["Documentation"]
    end

    subgraph Local["Pakistan-hosted Production"]
        APP["App/API"]
        DB["Customer Database"]
        SIP["SIP / Asterisk"]
        LOGS["Call Logs / CDRs"]
        REC["Recordings if enabled"]
        BK["Backups"]
    end

    Public -. "separate from production data" .-> Local
```

## 18. Telco Integration Responsibilities

WhatsQuery responsibilities:

- Application deployment
- Tenant isolation
- AI receptionist workflows
- Dashboard and admin controls
- SIP gateway configuration on WhatsQuery side
- Data storage and backups
- Monitoring and logs
- Security controls

Telco responsibilities:

- SIP trunk provisioning
- DID/local number allocation
- IP whitelisting
- SIP/RTP technical details
- CDR/billing reconciliation
- SLA and escalation support
- Data center/cloud hosting option if applicable

```mermaid
flowchart LR
    TELCO["Telco"] -->|SIP trunk, DIDs, IP whitelist, SLA| WQ["WhatsQuery"]
    WQ -->|Tenant dashboard, AI workflows, logs, routing| CLIENT["Business Clients"]
    CLIENT -->|Customer calls/messages| TELCO
```

## 19. Suggested Pilot Scope

Initial pilot businesses:

- Cafe with 2 branches
- Restaurant with 4 branches

Pilot goals:

- Validate inbound SIP call routing
- Validate tenant-to-number mapping
- Validate AI receptionist greeting and business context
- Validate lead capture
- Validate order/table request capture
- Validate call logs and usage tracking
- Validate WhatsApp message flow
- Validate admin monitoring
- Validate backup and restore process

Pilot success criteria:

- Calls route to correct tenant
- WhatsApp messages route to correct tenant
- No cross-tenant data leakage
- Call logs and message logs are accurate
- Admin can monitor failed events
- Tenant can view only their own activity
- Backups complete successfully
- System remains stable under expected early traffic

## 20. Final Summary

WhatsQuery is designed to connect telecom communication channels with business databases and AI workflows. The platform can operate as a multi-tenant SaaS system while keeping telecom production data inside Pakistan when required.

For telco partnership, WhatsQuery is prepared to deploy production workloads through:

- Telco-approved cloud/data center
- Pakistan-based VPS/cloud provider
- WhatsQuery-owned colocated infrastructure

The recommended approach is to start with a Pakistan-hosted pilot, validate SIP and WhatsApp flows with real businesses, then scale into a separated production architecture with dedicated SIP, application, database, backup, and monitoring layers.

This keeps the deployment cost-effective at the beginning while remaining credible, secure, and scalable for telecom-grade production.
