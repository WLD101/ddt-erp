set -euo pipefail

APP_DIR=/var/www/whatsquery
APP_USER=whatsquery

cd $APP_DIR

echo '--- BEFORE COMMIT ---'
git log -1 --oneline
git status --short

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Refusing deployment: $APP_DIR has uncommitted changes."
  exit 1
fi

echo '--- FIX FULL APP OWNERSHIP ---'
sudo chown -R $APP_USER:$APP_USER $APP_DIR

echo '--- FETCH AND FAST-FORWARD AS APP USER ---'
sudo -u $APP_USER git fetch origin main
sudo -u $APP_USER git merge --ff-only origin/main

echo '--- FIX OWNERSHIP AFTER RESET ---'
sudo chown -R $APP_USER:$APP_USER $APP_DIR

echo '--- AFTER COMMIT ---'
git log -1 --oneline
git status --short || true

echo '--- INSTALL DEPENDENCIES AS APP USER ---'
sudo -u $APP_USER npm ci

echo '--- PRISMA VALIDATE ---'
sudo -u $APP_USER npx prisma validate

echo '--- PRISMA GENERATE BEFORE STATUS ---'
sudo -u $APP_USER npx prisma generate

echo '--- PRISMA STATUS BEFORE MIGRATION ---'
sudo -u $APP_USER npx prisma migrate status || true

echo '--- PRISMA MIGRATE ---'
sudo -u $APP_USER npx prisma migrate deploy

echo '--- PRISMA STATUS AFTER MIGRATION ---'
sudo -u $APP_USER npx prisma migrate status

echo '--- PRISMA GENERATE AFTER MIGRATION ---'
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
