# WhatsQuery Infrastructure and SIP Trunking Deployment Proposal

## 1. Executive Summary

WhatsQuery is a business communication and AI automation platform designed to bridge the gap between carrier networks and enterprise databases. The platform connects SIP/call routing, AI receptionist workflows, WhatsApp/business messaging, CRM/database integrations, customer records, call metadata, and administrative dashboards into one controlled business communication layer.

WhatsQuery is currently operating in an early-stage deployment environment while serving initial pilot clients. For telecom and SIP production deployment, we are prepared to host production workloads inside Pakistan using a telco-approved cloud/data center, a Pakistan-based cloud/VPS provider, or our own colocated server infrastructure where required.

Our objective is to establish a deployment model that is cost-effective for pilot clients, professionally manageable for the first commercial rollout, and compatible with Pakistani telecom operator requirements for SIP trunking, data residency, security, monitoring, and operational support.

## 2. Current Deployment Overview

WhatsQuery currently uses the following early-stage infrastructure:

- Provider: Contabo
- Plan: Cloud VPS 20 SSD
- Disk: 200 GB SSD
- CPU: 6 cores
- RAM: 12 GB
- Backups: daily backups
- Current use: first 5 to 10 early-stage clients

This environment is suitable for development, demonstrations, and limited early validation. It is not intended to be the final telecom production environment if local hosting or Pakistan-based telecom infrastructure is required.

## 3. Regulatory and Data Residency Consideration

We understand that telecom-related production workloads may require local hosting or telco-approved infrastructure, especially where SIP traffic, call detail records, call recordings, customer records, and operational telecom data are involved.

Without presenting this as legal advice, WhatsQuery is prepared to follow a compliance-friendly deployment approach where production telecom workloads and customer operational data are hosted inside Pakistan.

The Pakistan-hosted production scope may include:

- SIP trunking and call routing infrastructure
- Asterisk/FreePBX or SIP gateway layer
- Call detail records and call metadata
- Optional call recordings
- Customer profiles and branch-level data
- PostgreSQL production database
- AI workflow logs and operational audit logs
- Admin panel and tenant dashboards
- Backup and disaster recovery storage

Public marketing pages, non-sensitive demos, documentation, and external static assets may remain outside Pakistan if acceptable, while production telecom and customer data remain hosted locally.

## 4. Proposed Pakistan-Hosted Deployment Model

For pilot and early commercial deployment, WhatsQuery proposes a Pakistan-hosted architecture with separation between web application, database, and SIP/call routing components.

Recommended deployment model:

- Web dashboard and backend API hosted on Pakistan-based VPS/cloud or telco cloud
- PostgreSQL hosted on a separate local VM/server where possible
- Asterisk/FreePBX or SIP gateway hosted on a dedicated local VM/server
- Private networking between app, database, and SIP components
- Static public IPs for SIP trunk whitelisting
- Firewall rules limiting access to required ports only
- SSL/TLS for web dashboard and API access
- Daily encrypted backups
- Monitoring for CPU, RAM, disk, database health, SIP availability, and application response time

For the first pilot stage, a single Pakistan-hosted server with Docker or separate services may be acceptable if traffic is low. For telco-facing production, we recommend separating the SIP layer from the application/database layer.

## 5. SIP Trunking Requirements

WhatsQuery requests the following SIP trunking details and support from the telecom operator:

- SIP trunk type: IP-based SIP trunk preferred
- Static public IP whitelisting for our SIP gateway/Asterisk server
- Authentication method: IP-based authentication preferred; SIP username/password if required
- Concurrent channels: initial 5 to 10 channels for pilot, expandable as clients grow
- DID/local numbers: numbers assigned per client or per business use case
- Inbound routing: DID-to-client/business routing support
- Outbound routing: authorized outbound calling rules and caller ID handling
- Codec support: G.711 A-law/u-law preferred; confirmation of other supported codecs
- Caller ID support: caller ID presentation and restrictions
- CDR access: call detail records or reconciliation method
- Blocked/emergency destinations: clear list of restricted destinations, if applicable
- NAT/firewall requirements: required SIP/RTP port ranges and source IP ranges
- RTP media handling: confirmed media IP ranges and codec behavior
- SLA: uptime, support response, and escalation path
- Test trunk: pilot SIP credentials/trunk for controlled testing

## 6. Cloud/Data Center Requirements

For Pakistan-hosted production, WhatsQuery requires infrastructure with:

- Linux VPS/cloud VM or dedicated VM support
- Static public IP addresses
- Firewall/security group controls
- Ability to run Node.js/Next.js backend services
- PostgreSQL support or ability to self-host PostgreSQL
- Ability to run Asterisk/FreePBX/SIP services
- Root/admin access or managed equivalent
- Daily backup support
- Snapshot support preferred
- Private networking between servers preferred
- Monitoring/log access
- Optional object storage for recordings/backups
- Option to scale CPU/RAM/storage as tenants increase

Minimum pilot capacity:

- 4 vCPU
- 8 GB RAM
- 100 GB SSD
- Daily backups
- Static public IP

Recommended early commercial capacity:

- App/API server: 4 to 6 vCPU, 8 to 12 GB RAM
- Database server: 4 vCPU, 8 to 16 GB RAM, SSD storage
- SIP/Asterisk server: 2 to 4 vCPU, 4 to 8 GB RAM, static public IP
- Separate backup location

## 7. Security and Backup Approach

WhatsQuery will follow a security-first deployment approach:

- SSL/TLS for web dashboard and API access
- Firewall restrictions for SSH, database, SIP, and RTP ports
- SSH key-based access preferred
- Role-based access control inside the application
- Tenant-level data separation
- Separate credentials for provider integrations
- Encrypted storage for sensitive integration tokens
- Daily database backups
- Backup restore testing
- Optional call recording storage policy based on client/telco requirements
- Monitoring alerts for disk, CPU, RAM, database health, failed backups, 5xx errors, and SIP service availability

Production backup approach:

- Daily PostgreSQL backups
- Application file/media backups
- Optional recording backups
- Off-server backup storage inside Pakistan where required
- Retention policy agreed with the telco/client
- Disaster recovery procedure with documented restore steps

## 8. Pilot Deployment Plan

The recommended pilot scope is designed for a cafe business with 2 branches, a restaurant business with 4 branches, and approximately 5 to 10 early clients.

Pilot deployment steps:

1. Provision Pakistan-hosted VPS/cloud or telco cloud VM.
2. Configure static public IP and firewall rules.
3. Deploy WhatsQuery dashboard/API.
4. Deploy PostgreSQL locally or on a separate local VM.
5. Deploy Asterisk/FreePBX on the same server for very small pilot, or preferably on a separate VM.
6. Configure SIP test trunk from telco.
7. Configure SSL certificates.
8. Configure daily backups.
9. Configure monitoring and basic alerts.
10. Test inbound calls, outbound calls, call routing, call logs, and tenant data separation.
11. Test WhatsApp/business messaging workflows separately.
12. Document results and prepare for production scale-up.

## 9. Production Deployment Roadmap

Phase 1: Pakistan-hosted pilot

- Single local VPS/cloud or small multi-VM deployment
- 5 to 10 clients
- Basic monitoring and daily backups
- Controlled SIP trunk testing

Phase 2: Early commercial production

- Separate app/API, database, and SIP/Asterisk servers
- Improved firewall and private networking
- Structured backup and restore testing
- Tenant-level usage monitoring
- Dedicated call recording storage if required

Phase 3: Telco-grade production

- Telco-approved cloud/data center or colocated infrastructure
- Optional SBC/SIP gateway layer
- High availability for app/API and SIP layer
- Database replica or managed backup strategy
- Centralized logging and monitoring
- Formal SLA, escalation path, and DR runbook

Phase 4: Scale beyond 50 clients

- Load-balanced app/API layer
- Dedicated PostgreSQL server or managed local database
- Multiple SIP nodes or SBC architecture
- Object storage for recordings
- Advanced monitoring and cost/usage reporting

## 10. Required Support from Telco

WhatsQuery requests the following support from the telecom operator:

- Confirmation of acceptable hosting/data residency model
- Pakistan-hosted cloud/data center proposal, if available
- SIP trunk technical specifications
- Test SIP trunk for pilot
- Static IP whitelisting requirements
- DID allocation process
- Channel pricing and concurrency limits
- CDR and billing reconciliation method
- SIP/RTP firewall requirements
- SLA and support escalation process
- Guidance on call recording/data retention expectations, if applicable

## 11. Conclusion

WhatsQuery is flexible and compliance-ready. Our current Contabo VPS is an early-stage deployment used for development, demonstrations, and initial pilot validation. For telecom/SIP production deployment, we are prepared to move production workloads into Pakistan through a telco-approved cloud/data center, a Pakistan-based local cloud/VPS provider, or our own colocated server infrastructure.

Our preferred practical approach is to begin with a Pakistan-hosted pilot deployment, validate SIP trunking and customer workflows with the telco, and then scale into a separated production architecture as client volume grows.

This approach keeps the pilot cost-effective while positioning WhatsQuery for serious telecom partnership, local data residency, secure SIP integration, and future multi-tenant SaaS growth.
