# WhatsQuery Incident Response

Last reviewed: 2026-07-23

## First response

1. Assign incident lead, severity, timeline, and evidence custodian.
2. Contain without destroying logs; use emergency provider/tenant feature stops.
3. Preserve relevant audit/security events, proxy logs, database logs, provider
   event IDs, deployment versions, and access records.
4. Do not paste secrets, transcripts, recordings, or full customer data into chat/tickets.
5. Decide notification and legal obligations with the authorized business/privacy owner.

## Scenario playbooks

| Incident | Immediate containment | Recovery |
| --- | --- | --- |
| API/provider key leak | Disable integration/provider; rotate key; revoke old key | Reconnect, test least scopes, review actions since first exposure |
| Database credential leak | Block source/network; rotate DB role password; drain sessions | Review grants/logs, verify tenant integrity, restore if altered |
| Tenant account compromise | Increment session version, revoke devices, require reset/MFA | Review exports, recordings, messages, integrations, notify tenant |
| Admin compromise | Emergency platform lock, revoke sessions/SSH/provider access | Rotate privileged secrets, review every admin action and tenant impact |
| Cross-tenant exposure | Disable affected route/worker, preserve evidence, identify records/users | Patch/test isolation, assess notification, verify all tenants |
| Webhook forgery/replay | Disable endpoint/provider or require HMAC; preserve event hashes | Rotate secret, replay trusted events only, reconcile outcomes |
| Vapi compromise | Disable calling/tool writes, rotate keys and HMAC credential | Verify mappings, calls, recordings, outcomes, then controlled re-enable |
| OAuth compromise | Revoke provider grant and encrypted token; disable connection | Reauthorize minimum scopes, inspect provider audit history |
| Public recording | Disable recording redirects/provider access immediately | Revoke URLs, identify access, notify as required, verify retention |
| VPS/ransomware | Isolate host at provider firewall; use Contabo console; preserve snapshot | Rebuild clean host, rotate all secrets, restore verified backup |
| Backup failure | Stop risky migrations; fix schedule/off-server destination | Create/verify new backup and perform restore test |

## Cross-tenant severity

Treat confirmed cross-tenant data access as Critical. Determine:

- tenants and records affected;
- data categories and jurisdictions;
- first/last possible access;
- whether data was viewed, changed, exported, or deleted;
- regulatory/contract notification deadlines.

## Evidence and communication

- Maintain UTC timestamps and a decision log.
- Use masked caller numbers and stable event/correlation IDs.
- Restrict evidence to incident responders.
- Provide tenants factual impact and mitigation; do not speculate.
- Preserve legal holds before retention jobs remove relevant records.

## Post-incident

Complete root-cause analysis, control/test changes, credential rotation inventory,
tenant notification decision, recovery verification, and an owner/due date for
every action. Reclassify release readiness before restoring disabled features.

