cd /var/www/whatsquery

sudo chown -R whatsquery:whatsquery /var/www/whatsquery/.git
sudo chown -R whatsquery:whatsquery /var/www/whatsquery/.next-build 2>/dev/null || true

sudo -u whatsquery bash -lc '
cd /var/www/whatsquery
git fetch origin main
git reset --hard origin/main
npm install
npx prisma db push --accept-data-loss
npx prisma generate
npm run build
'

sudo systemctl restart whatsquery
sudo systemctl status whatsquery --no-pager
sudo nginx -t
