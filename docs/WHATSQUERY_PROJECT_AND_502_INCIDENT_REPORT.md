# WhatsQuery Project and 502 Incident Report

Date: 2026-07-30  
Repository: `C:\Users\WLD10\.gemini\antigravity\scratch\ddt-erp`  
Production domains discussed: `whatsquery.com`, `voice.whatsquery.com`  
Deployment target discussed: Contabo VPS for ERP/Voice, Hostinger for the public website

## 1. Executive Summary

WhatsQuery is a multi-tenant AI-first ERP and Voice SaaS platform. The product combines a traditional business ERP with AI receptionist, voice automation, Vapi call handling, WhatsApp/media workflows, tenant operations, customer management, bookings, order drafts, reporting, and localized market behavior for the United Kingdom and Pakistan.

The most recent work focused on making the repository production-buildable again, adding safer deployment/health tooling, improving market-specific behavior, adding voice review and staff inbox flows, improving integrations, and diagnosing a production `502 Bad Gateway` incident on `voice.whatsquery.com`.

The `502 Bad Gateway` occurred because Nginx was reachable but the upstream application behind `voice.whatsquery.com` was not returning a valid response. The available evidence points to the Voice/ERP Node or Next.js application process being stopped, unhealthy, crashing, or not listening on the port expected by Nginx. The root `whatsquery.com` website was still serving HTML, which means this was not a full DNS or global hosting outage. It was isolated to the Voice app deployment path or its upstream service.

No production VPS changes were made directly from this local Codex environment. SSH access was attempted earlier but could not proceed without successful authentication, so VPS commands were prepared for manual execution by the operator.

## 2. What This Project Is About

WhatsQuery ERP is a monolithic Next.js enterprise application for local SME and enterprise operations. It is designed to provide a single SaaS workspace where tenants can run operational workflows, connect communication channels, and use AI voice agents that understand the tenant's business context.

Core product idea:

- Give each business tenant an ERP workspace.
- Add an AI receptionist that can answer calls, capture customer intent, create bookings or order drafts, and route uncertain outcomes to staff.
- Keep tenant data, voice activity, integrations, audit trails, and operational records inside one controlled business system.
- Support different country and market behavior, especially for UK and Pakistan tenants.
- Prepare the platform for production release, controlled pilots, secure integrations, and disaster recovery.

The project is not only a landing page. It includes a full SaaS application stack with authentication, database schema, business modules, voice workflows, integration placeholders, tests, deployment scripts, and operational runbooks.

## 3. High-Level Architecture

Current stack from the repository:

- Framework: Next.js App Router
- Language: TypeScript
- Database ORM: Prisma
- Database target: PostgreSQL
- Styling/UI: Tailwind CSS, Radix UI, Framer Motion
- Queues/background jobs: BullMQ and Redis
- Voice integration: Vapi and Twilio-related telecom workflows
- Auth: NextAuth/Auth.js with Prisma adapter
- Storage/integration direction: S3-compatible storage support through AWS SDK, with prior Cloudflare R2 backup planning
- Testing: Node.js native test runner through `tsx --test`

Important project areas:

- `app/`: Next.js routes and pages
- `modules/voice/`: Voice workflows, Vapi integration, ERP outcome handling, review flows
- `modules/markets/`: Country and market-specific logic
- `modules/onboarding/`: Tenant onboarding and country-first setup flows
- `modules/integrations/`: Integration worker/runtime logic and external service placeholders
- `prisma/`: Prisma schema and migration history
- `scripts/`: deployment, migration, diagnostics, seeding, verification, and operational scripts
- `docs/`: architecture reports, deployment guides, voice operations, migration recovery notes, and production readiness documentation

## 4. Recent Changes and Why They Were Made

### 4.1 Voice Review Workflow and Staff Inbox

Relevant commit:

- `88c4766 Add voice review workflow and staff inbox`

Purpose:

- Allow AI-handled calls to create structured outcomes.
- Route uncertain or sensitive outcomes to staff instead of letting automation silently make unsafe decisions.
- Improve operational trust by giving human users a review queue.
- Support a production-grade AI receptionist where humans remain in control of important exceptions.

Why it matters:

The AI receptionist must not behave like an uncontrolled chatbot. For enterprise ERP use, ambiguous bookings, customer identity conflicts, payment-sensitive actions, or unsupported requests should become reviewable staff tasks.

### 4.2 Market Audit and Voice Acceptance Coverage

Relevant commit:

- `f0a6e8f Add market audit and voice acceptance coverage`

Purpose:

- Add tests and acceptance checks for market-specific voice behavior.
- Ensure UK and Pakistan flows do not accidentally mix pricing, compliance assumptions, phone policy, or operational defaults.
- Reduce the risk of future changes breaking localized behavior.

Why it matters:

WhatsQuery is not intended to behave identically in every country. The tenant's country affects phone number policy, sales messaging, pricing display, onboarding defaults, and operational assumptions.

### 4.3 Country-First Onboarding and UK/Pakistan Separation

Purpose:

- Make country selection a first-class onboarding decision.
- Use the tenant country to drive voice policy, localized sales copy, and market behavior.
- Avoid guessing tenant location only from browser or IP when persistent business configuration is needed.

Expected behavior:

- The tenant selects a country during onboarding.
- The selected country becomes a durable tenant setting.
- Voice, pricing display, docs, and sales flows can adapt from that setting.
- UK and Pakistan should have different assumptions where required.

Why it matters:

IP-based detection is useful for display, but it is not enough for business rules. A tenant's selected operating country is more reliable for ERP behavior.

### 4.4 Vapi-to-ERP Outcome Pipeline

Purpose:

- Convert voice call outcomes into ERP actions.
- Resolve customers from voice calls.
- Link outcomes to bookings, order drafts, customer records, and staff reviews.
- Preserve auditability around what the AI did and what a human reviewed.

Known previously broken imports included examples such as:

- `@/modules/markets/tenant-market`
- `@/modules/voice/erp/customer-resolution`
- `@/modules/voice/erp/outcome-links`

These errors indicated that the dependency graph had drifted across feature branches or local development states. The repository stabilization work focused on restoring missing modules, correcting imports, and making the app build cleanly on Linux.

Why it matters:

The voice workflow is one of the highest-risk areas of the product because it bridges real customer conversations into business records. Broken imports in this path block builds and can prevent deployment.

### 4.5 Integration Runtime and One-Click Integration Placeholders

Relevant commits:

- `8e35ccc feat: add integration worker runtime slice`
- `d59bbf2 feat: add one-click integration placeholders for stripe, slack, make, and hubspot`

Purpose:

- Prepare the system for external integrations.
- Add placeholders and worker runtime structure for services like Stripe, Slack, Make, and HubSpot.
- Move toward controlled integration activation rather than ad-hoc scripts.

Why it matters:

ERP systems become much more valuable when they connect to billing, communication, automation, and CRM platforms. These changes establish the scaffolding for that future work.

### 4.6 Zero-Downtime Deployment and Health Endpoints

Relevant commit:

- `279e9d4 feat: zero downtime deployments and health endpoints`

Purpose:

- Improve deployment safety.
- Add health checks so the operator can detect whether the app is healthy before and after deploys.
- Reduce downtime during rebuild/restart cycles.

Why it matters:

The `502` incident shows why health endpoints and controlled deployment are necessary. Nginx can be alive while the upstream app is dead. A proper deployment flow must verify the app before sending traffic to it.

### 4.7 UI and Navigation Cleanup

Relevant commits:

- `2274190 style: update sidebar logo to professional compact variant and remove command palette`
- `8ce3a29 fix: correct user menu dropdown 404 links and add localized docs option`
- `b8f299d refactor: global logo redesign and component unification`
- `9a7ac23 fix: correct footer layout overflow in command palette`

Purpose:

- Improve UI consistency.
- Remove broken or confusing navigation paths.
- Add localized docs navigation.
- Prevent layout overflow and polish brand presentation.

Why it matters:

The ERP/Voice product must feel trustworthy. Broken menu links, overflow bugs, or inconsistent branding reduce user confidence during demos and pilot onboarding.

### 4.8 Security and Build Hardening

Relevant commits:

- `a5bf107 fix: remove untracked logger dependency from providers`
- `07f03a4 fix: replace eval require with static imports for libphonenumber-js`
- `a6c8ca5 Phase 1: ESLint and config cleanup`

Purpose:

- Remove dependency and bundling issues that caused build instability.
- Replace dynamic/eval-style imports with static imports where possible.
- Clean up lint and configuration issues.

Why it matters:

Next.js production builds are stricter than local development. Dynamic imports, missing dependencies, Windows-only casing assumptions, and stale aliases can all pass locally but fail on a clean Linux VPS.

### 4.9 Backup and Disaster Recovery Direction

The user requested an enterprise-grade backup and disaster recovery system covering PostgreSQL, Prisma migrations, MinIO uploads, tenant files, invoices, receipts, reports, customer/supplier/inventory data, AI settings, Vapi settings, encrypted environment backup, scheduled jobs, cron configuration, checksums, restore testing, and multi-destination storage such as Cloudflare R2 and Backblaze B2/AWS S3/Wasabi.

Important status note:

This report does not claim the full enterprise backup system is production-deployed. The backup/PITR work is a required production objective and should be tracked as a release gate unless the implementation and restore tests are verified in the current branch.

Why it matters:

The VPS must not be the only source of truth. If the Contabo VPS dies, WhatsQuery must be restorable from encrypted, verified backups.

## 5. Current Repository State Observed Locally

Local git status at the time of this report showed:

- Modified: `deploy.sh`
- Untracked: `audit.log`
- Untracked: `components/ui/logo.tsx`
- Untracked: `fix-502.sh`
- Untracked: `fix-build.sh`
- Untracked: `scripts/clean-deploy.sh`
- Untracked: `scripts/emergency-fix.sh`
- Untracked: `scripts/force-deploy.sh`
- Untracked: `sre-diagnostic.sh`

Operational interpretation:

- The repository contains active local deployment/debug artifacts.
- These files should be reviewed before committing.
- Some scripts may be useful for recovery, but destructive scripts must not be run casually.
- Production should not be patched directly until the repository is clean and verified.

Security note:

`deploy.sh` previously contained a GitHub personal access token embedded in a remote URL. The local file was sanitized to use a normal GitHub URL instead of a tokenized URL. If that token was real, it should be revoked and rotated immediately because it appeared in local deployment script history/state.

## 6. Local Verification Status From Recent Work

The following local verification results were previously observed during repository stabilization work:

- `npm ci`: Passed after an initial Windows `ENOTEMPTY` file-handle issue in existing `node_modules\prisma`.
- `npx prisma generate`: Passed.
- `npx prisma validate`: Passed.
- `npx tsc --noEmit`: Passed after fixing a hook-order issue in `app/onboarding/steps/IndustryStep.tsx`.
- `npm run lint`: Passed with warnings.
- `npm run build`: Passed.
- `npm run test`: Passed across migration, integration, security, onboarding, telecom, enterprise, and acceptance suites.

Known warning:

- `npm audit` still reported high-severity vulnerabilities in the dependency chain involving `brace-expansion` through packages such as `exceljs`/`archiver`. This should remain an open security follow-up unless a later verified audit shows zero vulnerabilities.

Important distinction:

Local build success does not automatically mean production is fixed. Production can still return `502` if the VPS has a stale checkout, failed build, bad environment variables, wrong port, broken service manager config, or a crashed process.

## 7. 502 Bad Gateway Incident Report

### 7.1 Incident Title

`voice.whatsquery.com` returned `502 Bad Gateway`.

### 7.2 Date and Context

The incident was discussed and diagnosed on 2026-07-30.

The user reported that changes did not appear on `https://voice.whatsquery.com/` and that the site showed a `502 Bad Gateway` error.

### 7.3 Impact

Affected:

- `voice.whatsquery.com`
- WhatsQuery Voice landing/app entry
- Customer-facing demo path for the Voice product
- Any user trying to access the Voice application through the public subdomain

Not proven affected:

- Root public website at `whatsquery.com`
- Database data integrity
- Supabase/PostgreSQL data
- Vapi external account
- Hostinger-hosted marketing site

### 7.4 Confirmed Evidence

Evidence available from the conversation and screenshot:

- `https://voice.whatsquery.com/` returned `HTTP 502 Bad Gateway`.
- `https://whatsquery.com/` served HTML normally.
- The deployment target for ERP/Voice is the Contabo VPS, not Hostinger.
- The public website and ERP/Voice project were previously mixed up during deployment attempts.
- A manual VPS/QEMU session showed PM2 output and a restart attempt.
- The diagnostic script printed:
  - `Local status: 000`
  - `Remote status: 502`
  - `Rebuild attempt because remote is still not healthy`
  - warning that the local working tree had changes
  - instruction not to force reset
  - shell error: `bash: line 81: syntax error: unexpected end of file`

### 7.5 What `Local status: 000` Means

In curl-based diagnostics, status `000` usually means curl did not receive an HTTP response. Common reasons:

- connection refused
- no service listening on the target port
- process crashed before responding
- timeout
- invalid local target
- firewall or socket issue

For this incident, `Local status: 000` strongly suggests the local upstream app on the VPS was not reachable by the diagnostic script.

### 7.6 What `Remote status: 502` Means

`502 Bad Gateway` from Nginx means:

- Nginx itself is running and reachable.
- Nginx tried to proxy the request to an upstream app.
- The upstream app did not respond correctly.

Common causes:

- Node/Next.js app is not running.
- App is running on a different port than Nginx expects.
- App process is crashing on startup.
- App build output is missing or invalid.
- Environment variables are missing or wrong.
- Nginx upstream config points to the wrong host/port.
- PM2/systemd service is running the wrong command or wrong working directory.
- Deployment left the server in a partial state.

### 7.7 Most Likely Cause

The most likely cause is that the Voice/ERP upstream application on the VPS was unavailable after a deployment or rebuild attempt.

The strongest evidence:

- Nginx returned `502`, so the reverse proxy was alive.
- The root website was alive, so global DNS/network was not fully down.
- Local upstream health returned `000`, so the application behind Nginx was not serving HTTP.
- The rebuild/restart helper script itself failed with a shell syntax error before completing cleanly.

Probable root cause category:

- failed or partial deployment of the Voice/ERP app
- app process not listening on expected local port
- PM2/systemd process crash
- VPS checkout/build mismatch
- dirty VPS working tree blocking clean update

Exact root cause not yet confirmed:

The exact crash stack requires VPS logs from systemd, PM2, Nginx, and the app runtime. Without those logs, it would be unsafe to claim the precise failing line or module.

### 7.8 Contributing Factors

Likely contributing factors:

- Website and ERP/Voice deployments were previously mixed up.
- Hostinger hosts the main website while ERP/Voice runs on the Contabo VPS.
- Local Windows paths were accidentally pasted into the VPS shell earlier, which cannot work on Linux.
- The VPS working tree had local changes, preventing safe force reset or clean deployment.
- A paste.rs diagnostic/recovery script failed with `unexpected end of file`.
- Earlier repository work involved many feature branches and migrations, increasing the chance of stale or mismatched production state.
- Production deployment and repository recovery were happening close together, which increases operational risk.

### 7.9 What Was Ruled Out or Considered Less Likely

Less likely based on available evidence:

- Full DNS outage, because Nginx responded with `502`.
- Full server/network outage, because the VPS console and Nginx were reachable.
- Hostinger public website failure, because `whatsquery.com` was serving.
- Browser cache issue, because a server-side `502` is returned by the proxy.

Not ruled out:

- Bad environment variables.
- Prisma/database connectivity issue during app startup.
- Redis dependency failure.
- Missing `.next` build output.
- Wrong systemd service file.
- Wrong PM2 process command.
- Wrong Nginx upstream port.
- Broken code deployed on VPS.

## 8. Recovery Actions Discussed

Because SSH authentication from this Codex environment did not succeed, recovery commands were prepared for manual VPS execution.

Earlier paste.rs command:

```bash
curl -fsSL https://paste.rs/9QUNt | bash
```

Observed result:

- The script ran partially.
- It attempted restart and rebuild.
- It failed with `bash: line 81: syntax error: unexpected end of file`.

Corrected paste.rs command prepared afterward:

```bash
curl -fsSL https://paste.rs/0SSTV | bash
```

Expected purpose of the corrected script:

- Diagnose Nginx/app status.
- Collect PM2/systemd logs.
- Restart safely.
- Rebuild only if the remote health check remains unhealthy.
- Avoid force reset.
- Avoid Prisma migration history edits.

Important:

The final success of the corrected script was not verified in this chat. Therefore, this report must treat the incident as diagnosed but not conclusively resolved unless later production checks show `200 OK`.

## 9. Manual VPS Recovery Runbook

Use this only on the Contabo VPS for the ERP/Voice project.

### 9.1 Quick Health Check

```bash
curl -I https://voice.whatsquery.com/
curl -sS http://127.0.0.1:3000/api/health || true
sudo nginx -t
sudo systemctl status nginx --no-pager
```

If the app is managed by systemd:

```bash
sudo systemctl status whatsquery --no-pager
sudo journalctl -u whatsquery -n 120 --no-pager
```

If the app is managed by PM2:

```bash
pm2 status
pm2 logs --nostream --lines 120
```

### 9.2 Confirm Correct Project Directory

```bash
pwd
ls -la
git remote -v
git branch --show-current
git status --short
git log --oneline -10
```

Expected project directory from prior VPS screenshot:

```bash
/var/www/whatsquery
```

Do not paste Windows paths like this into the VPS shell:

```text
C:\Users\WLD10\.gemini\antigravity\scratch\ddt-erp
```

That path exists only on the Windows workstation.

### 9.3 Safe Build Check

```bash
cd /var/www/whatsquery
npm ci
npx prisma generate
npx prisma validate
npm run build
```

Do not run:

```bash
npx prisma migrate reset
```

Do not use `prisma db push` as a replacement for migrations.

### 9.4 Safe Restart

If systemd is the active service manager:

```bash
sudo systemctl restart whatsquery
sudo systemctl status whatsquery --no-pager
sudo nginx -t
sudo systemctl reload nginx
curl -I https://voice.whatsquery.com/
```

If PM2 is the active service manager:

```bash
pm2 restart all
pm2 status
sudo nginx -t
sudo systemctl reload nginx
curl -I https://voice.whatsquery.com/
```

### 9.5 If `git pull --ff-only` Fails

Stop and capture diagnostics:

```bash
cd /var/www/whatsquery
git status --short
git branch --show-current
git log --oneline -5
sudo journalctl -u whatsquery -n 120 --no-pager
pm2 logs --nostream --lines 120
```

Do not run `git reset --hard` unless the exact VPS state has been reviewed and important uncommitted production changes have been backed up.

## 10. Why the 502 Happened in Plain English

The browser reached Nginx successfully. Nginx then tried to reach the WhatsQuery Voice app running behind it. That app did not respond correctly, so Nginx returned `502 Bad Gateway`.

In this situation, the problem is usually not the browser and not the domain itself. It is normally the application process, its port, its build, its environment variables, or the Nginx upstream configuration.

For WhatsQuery, the evidence points to the Voice/ERP app on the Contabo VPS being unhealthy or unavailable while Nginx was still online.

## 11. Prevention Plan

### 11.1 Separate Website and ERP/Voice Deployments

The public website and ERP/Voice app must be treated as separate deployment targets:

- `whatsquery.com` public marketing site: Hostinger
- `voice.whatsquery.com` ERP/Voice app: Contabo VPS

This prevents pushing the right code to the wrong host.

### 11.2 Require Pre-Deploy Local Verification

Before deployment, the repo should pass:

```bash
npm ci
npx prisma generate
npx prisma validate
npm run lint
npm run build
npm run test
```

For emergency deploys, minimum gate:

```bash
npm ci
npx prisma generate
npx prisma validate
npm run build
```

### 11.3 Use Health-Gated Deployments

Deployment should:

- build the app
- start it on a candidate port
- check `/api/health`
- only switch Nginx traffic after health passes
- keep the previous release available for rollback

### 11.4 Do Not Force Reset Production Casually

Scripts such as `scripts/clean-deploy.sh` and `scripts/force-deploy.sh` must be treated carefully if they use commands like:

```bash
git reset --hard origin/main
```

That command can delete uncommitted production changes. It should only be run after a backup or after confirming the working tree contains no valuable changes.

### 11.5 Avoid Remote Paste Scripts for Long-Term Operations

Paste scripts are useful in an emergency when QEMU paste is painful, but they should not become the permanent deployment mechanism.

Preferred long-term approach:

- keep scripts in the repository
- review them in git
- deploy by versioned commit
- avoid `curl | bash` for production unless the script content is pinned and verified

### 11.6 Add Monitoring and Alerts

Minimum monitoring:

- external uptime check for `https://voice.whatsquery.com/`
- internal health check for `http://127.0.0.1:3000/api/health`
- PM2/systemd process status
- Nginx error log alerts
- disk space alerts
- memory and CPU alerts
- database connectivity checks

Alert conditions:

- health endpoint returns non-200
- Nginx returns 502
- app restarts repeatedly
- disk usage above threshold
- build fails
- migration deploy fails
- database connection fails

## 12. Open Risks

Open risks identified:

- Production health has not been confirmed after the corrected paste.rs recovery script.
- Exact app crash reason has not been captured from VPS logs in this report.
- `npm audit` still had high-severity dependency findings in the local repository state.
- The VPS working tree may contain local changes that block clean deployment.
- Some local recovery scripts are untracked and need review before being committed.
- Any previously exposed GitHub token must be revoked if it was valid.
- Full backup/disaster recovery implementation must be verified before declaring production readiness.

## 13. Recommended Next Actions

Priority 1:

- Run the manual VPS diagnostics.
- Capture `journalctl`, PM2 logs, Nginx config test, app local health, and `git status`.
- Confirm whether `voice.whatsquery.com` returns `200 OK`.

Priority 2:

- Clean the repository state.
- Decide which recovery scripts should be committed, rewritten, or deleted.
- Remove any unsafe `curl | bash` production dependency from normal deployment.

Priority 3:

- Rotate any exposed GitHub token.
- Resolve remaining `npm audit` findings.
- Add production uptime and process alerts.

Priority 4:

- Complete and verify the enterprise backup/disaster recovery system.
- Run a real restore test into a temporary environment.
- Document restore time objective and restore point objective.

## 14. Production Readiness Position

Current position:

- The repository was recently brought to a locally buildable and testable state.
- The production Voice service experienced a confirmed `502` symptom.
- The likely issue is an unavailable upstream app behind Nginx.
- Production should not be considered fully healthy until `voice.whatsquery.com` is verified with a successful HTTP response and the VPS logs confirm the app is stable.

Recommended release gate:

Do not deploy additional feature work to production until these pass on the VPS:

```bash
npm ci
npx prisma generate
npx prisma validate
npm run build
sudo nginx -t
curl -I https://voice.whatsquery.com/
```

Recommended health result:

```text
HTTP/2 200
```

or:

```text
HTTP/1.1 200 OK
```

## 15. Appendix: Useful Commands

### Local Repository Check

```powershell
cd "C:\Users\WLD10\.gemini\antigravity\scratch\ddt-erp"
git status --short
git log --oneline -12
npm ci
npx prisma generate
npx prisma validate
npm run build
```

### VPS Diagnostic Check

```bash
cd /var/www/whatsquery
pwd
git status --short
git log --oneline -10
sudo nginx -t
sudo systemctl status nginx --no-pager
sudo systemctl status whatsquery --no-pager
sudo journalctl -u whatsquery -n 120 --no-pager
pm2 status
pm2 logs --nostream --lines 120
curl -I https://voice.whatsquery.com/
curl -sS http://127.0.0.1:3000/api/health || true
```

### Corrected Paste.rs Emergency Helper

```bash
curl -fsSL https://paste.rs/0SSTV | bash
```

Use only if manual paste into QEMU is difficult and the script content is trusted for that moment.

