#!/bin/bash
set -euo pipefail

APP_DIR="/var/www/whatsquery"
APP_USER="whatsquery"

echo "=== ZERO-DOWNTIME DEPLOYMENT PIPELINE ==="

cd "$APP_DIR"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Refusing deployment: uncommitted changes."
  exit 1
fi

echo "[1/8] Updating source code..."
sudo chown -R $APP_USER:$APP_USER $APP_DIR
sudo -u $APP_USER git fetch origin main
sudo -u $APP_USER git merge --ff-only origin/main

echo "[2/8] Installing dependencies..."
sudo -u $APP_USER npm ci

echo "[3/8] Generating Prisma client & Migrations..."
sudo -u $APP_USER npx prisma generate
sudo -u $APP_USER npx prisma migrate deploy

echo "[4/8] Building Next.js Standalone..."
# If the build fails, the script exits here, and the old version keeps running perfectly!
sudo -u $APP_USER npm run build

# Copy public/ and static assets to standalone for self-contained serving
sudo -u $APP_USER cp -r public .next-build/standalone/ || true
sudo -u $APP_USER cp -r .next-build/static .next-build/standalone/.next-build/ || true

echo "[5/8] Determining Blue/Green Port Strategy..."
# Find active port from NGINX
CURRENT_PORT=$(grep -oP 'proxy_pass http://127.0.0.1:\K[0-9]+' /etc/nginx/sites-enabled/whatsquery || echo "3000")
if [ "$CURRENT_PORT" = "3000" ]; then
    NEW_PORT="3001"
    NEW_NAME="whatsquery-green"
    OLD_NAME="whatsquery-blue"
else
    NEW_PORT="3000"
    NEW_NAME="whatsquery-blue"
    OLD_NAME="whatsquery-green"
fi

echo "Current active port is $CURRENT_PORT. Deploying new instance to $NEW_PORT ($NEW_NAME)..."

echo "[6/8] Starting new instance..."
# Ensure PM2 is installed globally or accessible
sudo -u $APP_USER pm2 start .next-build/standalone/server.js --name "$NEW_NAME" --env PORT=$NEW_PORT

echo "[7/8] Running Health Checks on new instance..."
HEALTH_CHECK_URL="http://127.0.0.1:$NEW_PORT/api/health/ready"

MAX_RETRIES=15
RETRY_COUNT=0
HEALTHY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    echo "Pinging $HEALTH_CHECK_URL (Attempt $((RETRY_COUNT+1))/$MAX_RETRIES)..."
    HTTP_STATUS=$(curl -o /dev/null -s -w "%{http_code}\n" "$HEALTH_CHECK_URL" || echo "000")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        HEALTHY=true
        break
    fi
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT+1))
done

if [ "$HEALTHY" = false ]; then
    echo "❌ FATAL: New instance failed health checks. Rolling back!"
    sudo -u $APP_USER pm2 delete "$NEW_NAME" || true
    exit 1
fi
echo "✅ Health checks passed! Database and Redis are connected."

echo "[8/8] Switching Traffic (Zero-Downtime Reload)..."
# Update NGINX config with the new port
sudo sed -i "s/proxy_pass http:\/\/127.0.0.1:$CURRENT_PORT;/proxy_pass http:\/\/127.0.0.1:$NEW_PORT;/g" /etc/nginx/sites-enabled/whatsquery
sudo nginx -t
sudo nginx -s reload

echo "Traffic switched to $NEW_PORT successfully!"

echo "Tearing down old instance ($OLD_NAME)..."
sudo -u $APP_USER pm2 delete "$OLD_NAME" || true
sudo -u $APP_USER pm2 save

# Stop the old systemd service so it doesn't conflict
sudo systemctl stop whatsquery || true
sudo systemctl disable whatsquery || true

echo "=== DEPLOYMENT SUCCESSFUL ==="
