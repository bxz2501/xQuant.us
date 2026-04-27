#!/bin/bash
# Deploy perf-site to 104.64.202.162.
# Usage: ./deploy.sh
set -euo pipefail

REMOTE="${REMOTE:-root@104.64.202.162}"
APP_DIR="${APP_DIR:-/opt/perf-site}"

cd "$(dirname "$0")"

echo "==> npm run build"
npm run build

echo "==> assembling standalone bundle"
rm -f .next/standalone/users.db .next/standalone/users.db-shm .next/standalone/users.db-wal
cp -r .next/static .next/standalone/.next/
[ -d public ] && cp -r public .next/standalone/ || true

echo "==> rsync to $REMOTE:$APP_DIR"
# Preserve VM-installed node_modules/better-sqlite3 (built natively on the VM)
rsync -az --delete \
  --exclude 'node_modules/better-sqlite3' \
  -e "ssh -o StrictHostKeyChecking=accept-new" \
  .next/standalone/ "$REMOTE":"$APP_DIR"/

echo "==> chown + restart"
ssh "$REMOTE" "chown -R perfsite:perfsite $APP_DIR && systemctl restart perf-site && sleep 2 && systemctl is-active perf-site"

echo "==> health check"
curl -sf -o /dev/null -w "%{http_code}\n" https://xquant.us/login
echo "deploy ok"
