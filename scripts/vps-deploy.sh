#!/usr/bin/env bash
# Rebuild the monorepo on the VPS and reload PM2.
# Env files on the server are not overwritten by rsync.
# Do not set RVCC_AUTO_DEPLOY here — that would publish to Cloudflare.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export NODE_ENV=production
unset RVCC_AUTO_DEPLOY || true
unset CLOUDFLARE_API_TOKEN || true

# pnpm 11.15.1 matches packageManager in the root package.json.
if ! command -v pnpm >/dev/null 2>&1; then
  corepack enable
  corepack prepare pnpm@11.15.1 --activate
fi

# PM2 keeps the five Node processes alive across SSH sessions.
if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

echo "[vps-deploy] installing dependencies"
pnpm install --frozen-lockfile

echo "[vps-deploy] generating Prisma client"
pnpm --filter api db:generate

# Additive schema sync. nginx must disable buffering on SSE:
#   location ~ /api/requirements/.*/live {
#     proxy_buffering off;
#     proxy_cache off;
#     proxy_read_timeout 3600s;
#     add_header X-Accel-Buffering no;
#   }
echo "[vps-deploy] syncing Prisma schema to Postgres"
pnpm --filter api exec prisma db push --skip-generate

echo "[vps-deploy] building apps"
pnpm build

echo "[vps-deploy] reloading PM2"
# Keep the server's ecosystem file (rsync excludes it) so Hostinger ports stay 3010-3013.
if [ -f "$ROOT/ecosystem.config.cjs" ]; then
  pm2 startOrReload "$ROOT/ecosystem.config.cjs" --update-env
else
  pm2 restart rvcc-website rvcc-admin rvcc-vendor rvcc-procurement rvcc-api
fi
pm2 save

echo "[vps-deploy] health check"
# Hostinger API listens on PORT from apps/api/.env (4010), not the local default 4000.
API_PORT=4000
if [ -f "$ROOT/apps/api/.env" ]; then
  env_port="$(grep -E '^PORT=' "$ROOT/apps/api/.env" | tail -1 | cut -d= -f2- | tr -d '[:space:]' | tr -d '"' | tr -d "'")"
  if [ -n "$env_port" ]; then
    API_PORT="$env_port"
  fi
fi
ok=0
for _ in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS "http://127.0.0.1:${API_PORT}/health" >/dev/null; then
    ok=1
    break
  fi
  sleep 2
done
if [ "$ok" != 1 ]; then
  echo "[vps-deploy] health check failed on 127.0.0.1:${API_PORT}/health"
  exit 1
fi
echo "[vps-deploy] done"
