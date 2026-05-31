#!/bin/bash
set -e
cd /var/www/whatsquery
git fetch origin main
git reset --hard origin/main
npm install
npx prisma migrate deploy
npx prisma generate
npm run build
sudo systemctl restart whatsquery
sudo systemctl status whatsquery --no-pager
sudo nginx -t
