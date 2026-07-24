# Voice Subdomain Production Deployment

This runbook deploys the standalone WhatsQuery Voice surface on:

- `voice.whatsquery.com`

using the **same Next.js app and same `whatsquery` service** that already powers:

- `erp.whatsquery.com`

The voice product remains a separate product surface because host-based Proxy rewriting maps:

- external `voice.whatsquery.com/*`
- to internal `/voice/*`

without changing ERP routes or mixing the receptionist with the ERP Smart Assistant.

## 1. Routing behavior

Current implementation:

- `voice.whatsquery.com/*` rewrites to internal `/voice/*`
- `erp.whatsquery.com/*` keeps existing ERP behavior
- `/api/*`, `/_next/*`, and `/auth/*` are **not** rewritten
- voice dashboard auth is still handled by the shared auth system

Files involved:

- [proxy.ts](C:/Users/WLD10/.gemini/antigravity/scratch/ddt-erp/proxy.ts)
- [lib/voice/routing.ts](C:/Users/WLD10/.gemini/antigravity/scratch/ddt-erp/lib/voice/routing.ts)

## 2. Auth behavior and safety

Current auth is safe to reuse for the subdomain because:

- `NextAuth` is configured with `trustHost: true`
- voice login uses the same app on the **voice host**
- cookies remain **host-scoped** by default, which is the safest option right now

That means:

- users who sign in on `voice.whatsquery.com` get a session for that host
- users who sign in on `erp.whatsquery.com` get a session for that host
- we are **not** forcing a shared parent-domain cookie across subdomains

Safest rule for now:

- do **not** set a shared cookie domain like `.whatsquery.com` yet
- do **not** rewrite auth flows to bounce across hosts

If cross-subdomain SSO is wanted later, that should be a separate security review.

## 3. Required environment variables

Add these to the VPS `.env` before enabling the voice host:

```bash
VOICE_APP_HOST="voice.whatsquery.com"
VOICE_APP_URL="https://voice.whatsquery.com"
VOICE_PRODUCT_ENABLED="true"

VOICE_TELEPHONY_PROVIDER="disabled"

VOICE_VAPI_API_KEY=""
VOICE_VAPI_ASSISTANT_ID=""
VOICE_VAPI_PHONE_NUMBER_ID=""

VOICE_TWILIO_ACCOUNT_SID=""
VOICE_TWILIO_AUTH_TOKEN=""
VOICE_TWILIO_PHONE_NUMBER=""
VOICE_TWILIO_WEBHOOK_SECRET=""

VOICE_CALENDAR_PROVIDER=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

VOICE_CRM_WEBHOOK_URL=""
VOICE_WHATSAPP_FOLLOW_UP_WEBHOOK_URL=""
```

Important:

- these are placeholders only
- do not invent fake provider secrets
- telephony stays disabled in this phase

## 4. DNS checklist

Create a DNS record for `voice.whatsquery.com` pointing to the same VPS as ERP.

Recommended options:

1. `A` record to the VPS IPv4
2. `AAAA` record to the VPS IPv6 if you already use IPv6
3. or `CNAME` to the same canonical host if your DNS setup prefers it

Check DNS from the server or your workstation:

```bash
dig +short voice.whatsquery.com
dig +short AAAA voice.whatsquery.com
```

On Windows / PowerShell:

```powershell
Resolve-DnsName voice.whatsquery.com
```

Do not continue to SSL until DNS resolves correctly.

## 5. Nginx server block

Create a separate Nginx site config for the voice host and proxy it to the same local app:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name voice.whatsquery.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
}
```

Suggested path:

```bash
sudo nano /etc/nginx/sites-available/voice.whatsquery.com
sudo ln -s /etc/nginx/sites-available/voice.whatsquery.com /etc/nginx/sites-enabled/voice.whatsquery.com
```

Test Nginx:

```bash
sudo nginx -t
```

Reload after config is valid:

```bash
sudo systemctl reload nginx
```

## 6. SSL with Certbot

Issue the certificate after DNS and Nginx are in place:

```bash
sudo certbot --nginx -d voice.whatsquery.com
```

If you prefer both hosts on one certificate:

```bash
sudo certbot --nginx -d erp.whatsquery.com -d voice.whatsquery.com
```

Validate:

```bash
curl -I https://voice.whatsquery.com
```

## 7. Database migration deployment

Voice foundation migration:

- `202605300001_voice_receptionist_foundation`

Safety notes:

- additive only
- creates six new voice tables
- does **not** alter ERP Smart Assistant tables
- does **not** drop or rename existing ERP tables

Deploy it with:

```bash
cd /var/www/whatsquery
npx prisma migrate deploy
```

Optional status check:

```bash
npx prisma migrate status
```

## 8. App deployment commands

Deploy voice using the same app/service as ERP:

```bash
cd /var/www/whatsquery
git fetch origin main
test -z "$(git status --porcelain)"
git merge --ff-only origin/main
npm ci
npx prisma validate
npx prisma generate
npx prisma migrate status || true
npx prisma migrate deploy
npx prisma migrate status
npx prisma generate
npm run build
sudo systemctl restart whatsquery
sudo systemctl status whatsquery --no-pager
```

## 9. Log checks

Application logs:

```bash
sudo journalctl -u whatsquery -n 200 --no-pager
sudo journalctl -u whatsquery -f
```

Nginx logs:

```bash
sudo tail -n 100 /var/log/nginx/access.log
sudo tail -n 100 /var/log/nginx/error.log
```

If you use host-specific logs, read the matching `voice.whatsquery.com` log paths instead.

## 10. Smoke test URLs

Public checks:

- `https://voice.whatsquery.com/`
- `https://voice.whatsquery.com/login`
- `https://voice.whatsquery.com/status`

Auth behavior checks:

- `https://voice.whatsquery.com/onboarding`
- `https://voice.whatsquery.com/dashboard`

Expected behavior:

- `/` loads publicly
- `/login` loads publicly
- `/status` loads publicly and confirms voice routing is active
- `/onboarding` redirects to voice login when signed out
- `/dashboard` redirects to voice login when signed out
- signed-in owner/admin users can access onboarding + dashboard

Example smoke test commands:

```bash
curl -I https://voice.whatsquery.com/
curl -I https://voice.whatsquery.com/login
curl -I https://voice.whatsquery.com/status
```

## 11. What is deployed after this phase

Ready after Phase 3:

- standalone voice landing page
- auth-ready login entry
- login-protected onboarding
- login-protected receptionist dashboard shell
- database-backed business profile
- database-backed receptionist settings
- database-backed leads
- database-backed knowledge base items
- database-backed call log placeholders
- integration readiness placeholders

## 12. What is still not live

This phase does **not** make AI calling live.

Still missing before real receptionist calling works:

- Vapi or Twilio provider integration
- inbound call webhook routes
- real call event ingestion
- transcript storage from live calls
- call routing rules
- appointment booking execution
- Google Calendar booking sync
- WhatsApp follow-up execution
- live telephony analytics and quality review
