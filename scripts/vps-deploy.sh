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

echo "[vps-deploy] building apps"
pnpm build

echo "[vps-deploy] reloading PM2"
pm2 startOrReload "$ROOT/ecosystem.config.cjs" --update-env
pm2 save

echo "[vps-deploy] health check"
curl -fsS "http://127.0.0.1:4000/health" >/dev/null
echo "[vps-deploy] done"
