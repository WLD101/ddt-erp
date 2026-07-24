# WhatsQuery Internal Infrastructure Recommendation

## Executive Recommendation

For the next stage, we should use a hybrid approach:

- Keep public website, demos, and non-sensitive marketing assets wherever they are cost-effective.
- Move telecom production workloads into Pakistan before serious SIP/telco launch.
- Use a Pakistan-based VPS/cloud or telco cloud for the first 5 to 10 production clients.
- Do not build our own office data center right now.
- Do not buy expensive hardware until SIP demand and revenue are clearer.
- Consider colocation only after the pilot is stable or if the telco requires it.

The most practical startup path is:

1. Immediate pilot: Pakistan-based VPS/cloud with static IP.
2. First 10 clients: 2 or 3 local VMs/servers separating app, database, and SIP.
3. Telco-approved production: telco cloud/data center or local colocation.
4. Beyond 50 clients: proper multi-node architecture with dedicated database, SIP layer, monitoring, backups, and optional HA.

## Why We Should Not Stay Fully on Contabo

Contabo is useful for development, demos, and low-risk early validation. It is cheap and already working.

But for telecom/SIP production in Pakistan, Contabo has strategic risk:

- European hosting may create PTA/telco objections.
- SIP operators may prefer local static IPs and local data residency.
- Call records, recordings, and customer operational data may be expected to remain inside Pakistan.
- It may weaken our position in telecom partnership meetings.

Recommendation: keep Contabo only for non-production, demos, staging, or fallback unless the telco explicitly approves it.

## Hosting Options Compared

| Option | Cost | Compliance Risk | Reliability | SIP Fit | Startup Fit | Telco Meeting Fit |
|---|---:|---:|---:|---:|---:|---:|
| Continue Contabo for everything | Low | High | Medium | Weak | Good short-term | Weak |
| Pakistan VPS/cloud | Low to medium | Low to medium | Medium | Good | Best immediate option | Good |
| Telco cloud/data center | Medium to high | Low | High if managed well | Best | Good if affordable | Best |
| Office-hosted server | Low upfront, hidden costs high | Medium | Low | Risky | Bad for production | Weak |
| Own server in colocation | Medium | Low | Medium to high | Good | Good after pilot | Strong |
| Hybrid model | Balanced | Low | Good | Good | Best strategic path | Strong |

## Recommended 2 to 6 Month Pilot Architecture

Target:

- Cafe with 2 branches
- Restaurant with 4 branches
- 5 to 10 early clients
- Limited concurrent calls
- Controlled WhatsApp/business messaging
- Basic AI workflows

Minimum acceptable setup:

- 1 Pakistan-hosted VPS/cloud
- 4 vCPU
- 8 GB RAM
- 100 GB SSD
- Static public IP
- Daily backups
- Docker Compose
- App/API, PostgreSQL, and Asterisk on same server only for pilot

Recommended setup:

- App/API server: 4 to 6 vCPU, 8 to 12 GB RAM
- Database server: 4 vCPU, 8 to 16 GB RAM, SSD
- SIP/Asterisk server: 2 to 4 vCPU, 4 to 8 GB RAM, static public IP
- Daily backup to separate storage
- Basic monitoring dashboard

If budget is tight, start with one strong Pakistan VPS and split later. If we want to look stronger in front of telco, use at least separate SIP and app/database VMs.

## Should Asterisk Run on Same Server?

For pilot only: yes, acceptable if call volume is low and uptime expectations are modest.

For production: no, separate it.

Reason:

- SIP/RTP traffic has different firewall and latency needs.
- Asterisk can become noisy under call load.
- Separating SIP reduces blast radius if the web app has an issue.
- Telcos are more comfortable with a clear SIP gateway/server.

Recommended:

- Pilot: same server allowed.
- First commercial clients: separate Asterisk VM.
- Telco production: dedicated SIP/Asterisk or SBC layer.

## PostgreSQL Recommendation

For pilot:

- Self-host PostgreSQL on same local server if budget is tight.
- Use daily `pg_dump` backups.
- Keep WAL/PITR only if we can maintain it properly.

For first 10 clients:

- Move PostgreSQL to a separate local VM/server.
- Enable automated daily backups.
- Monitor connections, slow queries, DB size, and table growth.

For production:

- Dedicated PostgreSQL server in Pakistan.
- Backups to separate storage.
- Restore testing.
- Consider replica/standby after usage grows.

## Backup Strategy

Minimum:

- Daily PostgreSQL dump.
- Daily app upload/media backup.
- Daily Asterisk config backup.
- Store backup outside the main server.
- Retain 7 daily and 4 weekly backups.

Better:

- Encrypted backups.
- Separate Pakistan-hosted backup storage.
- Monthly restore test.
- Separate call recording retention policy.

Do not rely only on provider snapshots. Snapshots are useful, but database-level backups are still required.

## Monitoring Strategy

We need monitoring before production SIP launch.

Track:

- CPU
- RAM
- disk
- network
- app response time
- Nginx 4xx/5xx
- PostgreSQL connections
- slow queries
- DB size
- Asterisk service status
- SIP registration/trunk status
- active calls
- failed backups
- queue/job failures

Alert thresholds:

- CPU above 80%
- RAM above 85%
- disk above 75%
- DB connections above 80%
- slow queries above 1 second
- 5xx spike
- response time above 2 seconds
- backup failure
- SIP trunk down

## Security Strategy

Minimum security controls:

- SSH key login only.
- Disable root password login.
- Firewall all unused ports.
- Open SIP/RTP only to telco IP ranges where possible.
- PostgreSQL not publicly exposed.
- SSL/TLS for dashboard/API.
- Separate secrets per environment.
- Encrypt integration tokens.
- Role-based access in app.
- Tenant-level data isolation.
- Daily backups.

For SIP:

- Static public IP.
- IP whitelisting with telco.
- Strong SIP credentials if username/password is used.
- Fail2ban or equivalent for SIP if exposed.
- Keep RTP port range narrow and documented.

## Hardware Feasibility

Can we host on cheap hardware?

Yes, for lab or pilot only. Not recommended for serious production unless colocated or professionally hosted.

Acceptable pilot hardware:

- Mini PC or tower with modern i5/i7/Ryzen
- 32 GB RAM preferred
- NVMe SSD
- UPS
- Static IP or business-grade internet
- Good cooling

Acceptable production hardware:

- Rack server or enterprise tower server
- ECC RAM
- RAID/mirrored enterprise SSDs
- Dual power if possible
- Colocation in Pakistani data center
- Proper backup storage
- Remote management/IPMI preferred

Not acceptable:

- Old desktop PC
- Single consumer HDD
- Office internet without static IP/SLA
- No UPS
- No offsite backups
- No remote management

Office hosting risks:

- Power cuts
- Internet downtime
- Heating/cooling issues
- No physical security
- Weak SLA
- Hard to present professionally to telco

Colocation becomes better when:

- We have paying SIP customers.
- Telco requires local infrastructure.
- Downtime affects revenue.
- We need static IP, stable power, and better network.

## What to Ask the Telco

Ask for:

- IP-based SIP trunk
- Test trunk first
- Initial 5 to 10 concurrent channels
- Expandable channel pricing
- DID/local number allocation
- Static IP whitelisting process
- SIP signaling IPs
- RTP media IPs and port ranges
- Codec support, especially G.711 A-law/u-law
- Caller ID rules
- Inbound DID routing
- Outbound route permissions
- CDR access
- Billing reconciliation
- SLA and escalation contacts
- Required firewall/NAT settings
- Whether call recordings/CDRs must stay inside Pakistan
- Whether they offer cloud/data center hosting
- Whether our local VPS/cloud provider is acceptable

## Cost-Effective Decision

Best option for immediate pilot:

- Pakistan-based VPS/cloud with static IP.
- One server is acceptable if budget is tight.

Best option for first 10 clients:

- Pakistan-based multi-VM setup.
- Separate SIP server and app/database server.

Best option for telco-approved production:

- Telco cloud/data center if pricing is acceptable.
- Otherwise, Pakistan local cloud/VPS with telco approval.
- Colocated own server if telco requires stronger local control.

Best option beyond 50 clients:

- Multi-node local deployment.
- Separate app/API, database, SIP/SBC, backup, monitoring, and storage layers.
- Consider HA/failover.

Avoid:

- Office-hosted production.
- Running everything forever on one VPS.
- Publicly exposing PostgreSQL.
- SIP open to the whole internet.
- Keeping telecom production on Europe-hosted VPS if the telco objects.

## Migration Plan from Contabo

1. Prepare Pakistan-hosted target environment.
2. Install OS hardening, firewall, SSH keys, Docker/Node/PostgreSQL/Asterisk as needed.
3. Freeze risky changes before migration.
4. Take PostgreSQL backup from Contabo.
5. Take file/media backup.
6. Export Asterisk/FreePBX configs if already used.
7. Restore database on Pakistan-hosted environment.
8. Restore file/media assets.
9. Configure `.env` and secrets.
10. Run Prisma migrations.
11. Build and start app.
12. Configure Nginx and SSL.
13. Configure Asterisk/SIP trunk.
14. Test app login, dashboard, tenant isolation, call logs, WhatsApp flow, backups.
15. Test inbound/outbound SIP calls with telco.
16. Lower DNS TTL before cutover.
17. Switch DNS after successful testing.
18. Monitor logs and calls closely.
19. Keep Contabo as rollback for a short period.
20. After stable operation, decommission or keep Contabo for staging/demo.

Downtime-minimizing strategy:

- Pre-sync database and files.
- Put app in maintenance mode for final DB dump.
- Restore final dump.
- Switch DNS.
- Keep old server untouched for rollback.

Rollback plan:

- Repoint DNS to Contabo.
- Restore previous `.env` if changed.
- Keep database write window carefully controlled to avoid split-brain data.

## Internal Final Recommendation

We should not buy expensive hardware immediately. We should also not keep telecom production fully on Contabo if the telco has already raised a PTA/local hosting concern.

Recommended move:

1. Get pricing from the telco for local cloud/data center.
2. In parallel, shortlist 2 to 3 Pakistan VPS/cloud providers with static IP and backups.
3. Deploy a Pakistan-hosted pilot environment.
4. Separate Asterisk as soon as SIP testing begins.
5. Keep Contabo for staging/demo until local production is stable.
6. Use the formal proposal document to show the telco that WhatsQuery is flexible, compliance-ready, and serious.

If the telco cloud is reasonably priced, use it for production because it improves credibility and reduces compliance friction.

If telco cloud is too expensive, use a Pakistan-based VPS/cloud for the first 10 clients and ask the telco to approve that hosting model.

If the telco requires stronger infrastructure later, move to colocation or telco data center once revenue justifies it.
