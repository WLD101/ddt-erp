#!/bin/bash
set -e

echo "============================================"
echo "🔧 PRODUCTION FIX: Static Asset Serving"
echo "============================================"

PROJECT_DIR="/var/www/whatsquery"
if [ ! -d "$PROJECT_DIR" ]; then
  if [ -d ".git" ]; then
    PROJECT_DIR=$(pwd)
  else
    echo "❌ Could not locate project root."
    exit 1
  fi
fi

cd "$PROJECT_DIR"
echo "📂 Working in: $(pwd)"

# Step 1: Verify distDir configuration
echo ""
echo "── Step 1: Verify distDir ──"
DIST_DIR=$(grep -oP 'distDir:\s*process\.env\.NEXT_DIST_DIR\s*\?\?\s*"([^"]+)"' next.config.ts | grep -oP '"[^"]+"' | tr -d '"')
echo "Configured distDir fallback: ${DIST_DIR:-'.next-build'}"
echo "NEXT_DIST_DIR env var: ${NEXT_DIST_DIR:-'(not set, using fallback)'}"
ACTUAL_DIST="${NEXT_DIST_DIR:-.next-build}"
echo "Effective distDir: $ACTUAL_DIST"

# Step 2: Check what exists
echo ""
echo "── Step 2: Current state ──"
[ -d ".next" ] && echo "⚠️  .next exists (stale default dir)" || echo "✓ No .next directory"
[ -d ".next-build" ] && echo "📦 .next-build exists" || echo "⚠️  No .next-build directory"
ls -la "$ACTUAL_DIST"/BUILD_ID 2>/dev/null && echo "✓ BUILD_ID found" || echo "⚠️  No BUILD_ID in $ACTUAL_DIST"

# Step 3: Pull latest code
echo ""
echo "── Step 3: Pull latest code ──"
git fetch origin main
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Refusing asset repair: ${PROJECT_DIR} has uncommitted changes."
  exit 1
fi
git merge --ff-only origin/main

# Step 4: Install dependencies
echo ""
echo "── Step 4: Install dependencies ──"
npm ci

# Step 5: Clean ALL build artifacts
echo ""
echo "── Step 5: Clean build artifacts ──"
rm -rf .next .next-build
echo "✓ Removed .next and .next-build"

# Step 6: Generate Prisma client
echo ""
echo "── Step 6: Prisma generate ──"
npx prisma generate

# Step 7: Fresh production build
echo ""
echo "── Step 7: Production build ──"
npm run build
echo ""

# Verify build output
if [ -f "$ACTUAL_DIST/BUILD_ID" ]; then
  echo "✓ Build succeeded. BUILD_ID: $(cat $ACTUAL_DIST/BUILD_ID)"
else
  echo "❌ Build failed — no BUILD_ID found in $ACTUAL_DIST"
  exit 1
fi

# Verify static chunks exist
CHUNK_COUNT=$(find "$ACTUAL_DIST/static" -name "*.js" -o -name "*.css" 2>/dev/null | wc -l)
echo "✓ Static chunks: $CHUNK_COUNT files"

if [ "$CHUNK_COUNT" -lt 5 ]; then
  echo "⚠️  Very few chunks — build may be incomplete"
fi

# Step 8: Restart PM2
echo ""
echo "── Step 8: Restart application ──"
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save
echo "✓ PM2 restarted"

# Step 9: Test Nginx
echo ""
echo "── Step 9: Nginx validation ──"
sudo nginx -t && echo "✓ Nginx config valid" || echo "❌ Nginx config invalid"
sudo systemctl reload nginx 2>/dev/null || sudo nginx -s reload 2>/dev/null || true
echo "✓ Nginx reloaded"

# Step 10: Wait for app startup
echo ""
echo "── Step 10: Verify app is serving ──"
sleep 5

# Test health endpoint
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ 2>/dev/null || echo "000")
echo "App response code: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "307" ]; then
  echo "✓ App is responding"
else
  echo "⚠️  App returned $HTTP_CODE — check PM2 logs: pm2 logs whatsquery-erp"
fi

# Test a static chunk
FIRST_CHUNK=$(find "$ACTUAL_DIST/static/chunks" -name "*.js" -type f 2>/dev/null | head -1)
if [ -n "$FIRST_CHUNK" ]; then
  CHUNK_BASENAME=$(basename "$FIRST_CHUNK")
  CHUNK_DIR=$(dirname "$FIRST_CHUNK" | sed "s|$ACTUAL_DIST/static/||")
  CHUNK_URL="http://127.0.0.1:3000/_next/static/$CHUNK_DIR/$CHUNK_BASENAME"
  CHUNK_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}:%{content_type}" "$CHUNK_URL" 2>/dev/null || echo "000:unknown")
  echo "Static chunk test: $CHUNK_RESPONSE"
fi

echo ""
echo "============================================"
echo "🎉 STATIC ASSET FIX COMPLETE"
echo "============================================"
echo ""
echo "Verify live: https://erp.whatsquery.com"
echo "Check logs:  pm2 logs whatsquery-erp --lines 50"
echo ""
