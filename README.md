# RVCC

Five apps in one monorepo. Install and run each from its own folder.

| App                 | Folder             | Local | Production (VPS)                         |
| ------------------- | ------------------ | ----- | ---------------------------------------- |
| Marketing + enquire | `apps/web`         | :3000 | https://site.147-93-105-74.nip.io        |
| Vendor portal       | `apps/vendor`      | :3002 | https://vendor.147-93-105-74.nip.io      |
| Staff admin         | `apps/admin`       | :3001 | https://admin.147-93-105-74.nip.io       |
| Procurement         | `apps/procurement` | :3003 | https://procurement.147-93-105-74.nip.io |
| API                 | `apps/api`         | :4000 | https://api.147-93-105-74.nip.io         |

**Production is the VPS only** (PM2 via GitHub Actions `VPS CI/CD`). Do not use `*.vercel.app` hosts for live traffic.

Marketing (`apps/web`) and the supplier portal (`apps/vendor`) are **separate deploys**. They share the unified API and Postgres, but not a codebase or host.

## Setup

Shared env templates live at the repo root / per-app `.env.example` (not committed secrets):

| File           | Use                                                                 |
| -------------- | ------------------------------------------------------------------- |
| `.env.server`  | Copy to `apps/api/.env` locally; production secrets stay on the VPS |
| `.env.example` | Per-app templates → copy to `.env.local` / `.env.production`        |

```bash
cp .env.server apps/api/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/vendor/.env.example apps/vendor/.env.local
cp apps/admin/.env.example apps/admin/.env.local
cp apps/procurement/.env.example apps/procurement/.env.local
```

```bash
cd apps/api && pnpm install && pnpm run dev          # :4000
cd apps/web && pnpm install && pnpm run dev          # :3000
cd apps/admin && pnpm install && pnpm run dev        # :3001
cd apps/vendor && pnpm install && pnpm run dev       # :3002
cd apps/procurement && pnpm install && pnpm run dev  # :3003
```

## Production deploy (VPS)

Push / merge to `main` runs **VPS CI/CD**: rsync → build → `pm2 startOrReload ecosystem.config.cjs`.

On the server, app env files live next to each app (never commit them):

- `apps/api/.env`
- `apps/web/.env.production`
- `apps/admin/.env.production`
- `apps/vendor/.env.production`
- `apps/procurement/.env.production`

Set frontends to talk to the VPS API:

```bash
API_URL=https://api.147-93-105-74.nip.io
NEXT_PUBLIC_SITE_URL=https://site.147-93-105-74.nip.io
NEXT_PUBLIC_VENDOR_PORTAL_URL=https://vendor.147-93-105-74.nip.io
NEXT_PUBLIC_ADMIN_PORTAL_URL=https://admin.147-93-105-74.nip.io
```

API CORS / portal defaults should allow the same hosts (`ALLOWED_ORIGINS`, `VENDOR_PORTAL_URL`, `ADMIN_PORTAL_URL`).

After deploy, `GET https://api.147-93-105-74.nip.io/health` should return healthy. Enquire UI lives at `/enquire/verify` on the site (legacy `/register` redirects there).

For performance tuning see [`PERFORMANCE.md`](PERFORMANCE.md).

Optional Cloudflare Worker deploy for the API still exists (`pnpm run deploy` in `apps/api`), but **live production fronts the VPS API** above.

PDFs and video are on Cloudflare R2 (not in this repo).
