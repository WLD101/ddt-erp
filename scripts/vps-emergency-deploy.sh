#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/var/www/whatsquery"

echo "============================================"
echo "INITIATING EMERGENCY SYSTEM HOTFIX DEPLOY"
echo "============================================"

if [[ ! -d "${PROJECT_DIR}" ]]; then
  if [[ -d ".git" ]]; then
    PROJECT_DIR="$(pwd)"
  else
    echo "Could not locate the project repository root."
    exit 1
  fi
fi

cd "${PROJECT_DIR}"
echo "Operating in: $(pwd)"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Refusing emergency deployment: ${PROJECT_DIR} has uncommitted changes."
  exit 1
fi

git fetch origin main
git merge --ff-only origin/main

echo "Redis state is preserved; global flushes are not permitted."

npm ci
npx prisma validate
npx prisma generate
npx prisma migrate status || true
npx prisma migrate deploy
npx prisma migrate status

npx tsx scripts/rescue-demo-env.ts

# The project uses .next-build as its configured production output.
rm -rf .next-build .next
npm run build

pm2 startOrReload ecosystem.config.js --env production
pm2 save

echo "Emergency hotfix deployment completed."
