#!/bin/bash
set -e

echo "============================================"
echo "🚨 INITIATING EMERGENCY SYSTEM HOTFIX DEPLOY"
echo "============================================"

# Step 1: Find project root
PROJECT_DIR="/var/www/whatsquery"
if [ ! -d "$PROJECT_DIR" ]; then
  echo "❌ Error: Directory $PROJECT_DIR not found. Checking if we are currently in a repo..."
  if [ -d ".git" ]; then
    PROJECT_DIR=$(pwd)
    echo "Found .git in current directory: $PROJECT_DIR"
  else
    echo "❌ CRITICAL ERROR: Could not locate the Project repository root."
    exit 1
  fi
fi

cd "$PROJECT_DIR"
echo "📂 Operating in: $(pwd)"

# Step 2: Wipe Git Stale Locks and Pull
echo "⬇️  Pulling latest changes from Main Branch..."
git fetch origin main
git reset --hard origin/main

# Step 3: Clear System Rate Limits
echo "🧹 Clearing Redis state and rate limit locks..."
if command -v redis-cli >/dev/null 2>&1; then
    redis-cli flushall
    echo "✅ Redis memory cleared."
else
    echo "⚠️ Redis CLI not detected, skipping flush."
fi

# Step 4: Dependancy Check and Migration
echo "📦 Re-building Prisma client and synchronizing schema..."
npm install --legacy-peer-deps
npx prisma generate

# Step 5: RUN RESCUE ENGINE FOR DEMO
echo "🚀 EXECUTING SYSTEM DEMO RECOVERY..."
npx tsx scripts/rescue-demo-env.ts
echo "--------------------------------------------"

# Step 6: FORCED CLEAN BUILD
echo "🏗️  Executing Clean Next.js Build..."
# Remove cached build folder to FORCE a total visual refresh
# distDir is set to .next-build in next.config.ts
rm -rf .next-build .next
npm run build

# Step 7: HARD PM2 RESTART (Deletes old cluster to clear memory)
echo "♻️  Purging old server memory and launching cluster..."
pm2 delete all || true
pm2 start ecosystem.config.js --env production
pm2 save

echo "============================================"
echo "🎉 EMERGENCY HOTFIX SUCCESSFULLY DEPLOYED!"
echo "🌐 Live on: https://erp.whatsquery.com"
echo "============================================"
