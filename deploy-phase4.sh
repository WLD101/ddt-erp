#!/usr/bin/env bash
set -euo pipefail
cd /var/www/whatsquery

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Refusing deployment: /var/www/whatsquery has uncommitted changes."
  exit 1
fi

git fetch origin main
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
sudo nginx -t
