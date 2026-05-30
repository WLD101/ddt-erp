# Voice Subdomain Deployment

This foundation adds a separate WhatsQuery Voice product tree inside the existing Next.js app and exposes it through `voice.whatsquery.com`.

## Why this is the safest VPS setup

- one Next.js process continues serving both ERP and Voice
- `voice.whatsquery.com` is rewritten internally to `/voice/*`
- no second Node runtime, PM2 cluster, or extra database is required yet
- ERP routes remain unchanged on `erp.whatsquery.com`

## Nginx

Use a second server block beside the ERP host and proxy it to the same local Next.js port:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name voice.whatsquery.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name voice.whatsquery.com;

    ssl_certificate /etc/letsencrypt/live/voice.whatsquery.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/voice.whatsquery.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
}
```

## SSL with Certbot

If the ERP certificate was issued separately, add the voice host with Certbot:

```bash
sudo certbot --nginx -d voice.whatsquery.com
```

If you manage both hosts together, a combined certificate is also acceptable:

```bash
sudo certbot --nginx -d erp.whatsquery.com -d voice.whatsquery.com
```

## Environment variables

Add these names to the VPS `.env` when the product is ready for live telephony:

```bash
VOICE_APP_HOST=voice.whatsquery.com
VOICE_APP_URL=https://voice.whatsquery.com
VOICE_PRODUCT_ENABLED=true

VOICE_TELEPHONY_PROVIDER=disabled

VOICE_VAPI_API_KEY=
VOICE_VAPI_ASSISTANT_ID=
VOICE_VAPI_PHONE_NUMBER_ID=

VOICE_TWILIO_ACCOUNT_SID=
VOICE_TWILIO_AUTH_TOKEN=
VOICE_TWILIO_PHONE_NUMBER=
VOICE_TWILIO_WEBHOOK_SECRET=

VOICE_CALENDAR_PROVIDER=
VOICE_CRM_WEBHOOK_URL=
```

Do not set fake secrets. Leave unused integrations blank.

## Deployment process

Because Voice runs inside the same Next.js app, deployment remains the same:

```bash
cd /var/www/whatsquery
git fetch origin main
git reset --hard origin/main
npm run build
systemctl restart whatsquery
systemctl status whatsquery --no-pager
```

## What still remains before real AI calling works

This foundation does **not** yet provide:

- inbound phone call handling
- SIP or programmable voice routing
- telephony webhook ingestion
- stored call transcripts
- receptionist memory/state
- appointment booking execution
- lead workflow persistence
- live knowledge-base retrieval
- call-quality review or analytics

Those will require schema design, telephony APIs, webhook routes, background jobs, and security review in a later phase.
