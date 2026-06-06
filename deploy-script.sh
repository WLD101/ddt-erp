set -euo pipefail

APP_DIR=/var/www/whatsquery
APP_USER=whatsquery

cd $APP_DIR

echo '--- BEFORE COMMIT ---'
git log -1 --oneline
git status --short || true

echo '--- FIX FULL APP OWNERSHIP ---'
sudo chown -R $APP_USER:$APP_USER $APP_DIR

echo '--- FETCH RESET AS APP USER ---'
sudo -u $APP_USER git fetch origin main
sudo -u $APP_USER git reset --hard origin/main

echo '--- FIX OWNERSHIP AFTER RESET ---'
sudo chown -R $APP_USER:$APP_USER $APP_DIR

echo '--- AFTER COMMIT ---'
git log -1 --oneline
git status --short || true

echo '--- INSTALL DEPENDENCIES AS APP USER ---'
sudo -u $APP_USER npm install

echo '--- PRISMA MIGRATE ---'
sudo -u $APP_USER npx prisma migrate deploy

echo '--- PRISMA GENERATE ---'
sudo -u $APP_USER npx prisma generate

echo '--- CLEAN NEXT BUILD CACHE ---'
sudo -u $APP_USER rm -rf .next-build

echo '--- BUILD AS APP USER ---'
sudo -u $APP_USER npm run build

echo '--- RESTART SERVICE ---'
sudo systemctl restart whatsquery

echo '--- SERVICE STATUS ---'
sudo systemctl status whatsquery --no-pager

echo '--- NGINX TEST ---'
sudo nginx -t

echo '--- ROUTE CHECKS ---'
curl -I https://voice.whatsquery.com/admin/command-center
curl -I https://voice.whatsquery.com/admin/tenants
curl -I https://voice.whatsquery.com/admin/packages
curl -I https://voice.whatsquery.com/status
curl -I https://erp.whatsquery.com/

echo '--- VERIFY ADMIN UI TEXT EXISTS ON VPS FILES ---'
grep -RIn "Voice Platform Command Center\|Create Tenant\|Manage Packages\|Assign Package\|Manual Payment\|Stripe" app modules | head -n 80 || true

echo '--- DONE ---'
