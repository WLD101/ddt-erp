#!/bin/bash
cd /var/www/whatsquery
sudo grep -E "VAPI_|VOICE_" .env.production 2>/dev/null | sed -E 's/=.*/=***REDACTED***/'
