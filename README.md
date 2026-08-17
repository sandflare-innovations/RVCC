# RVCC

Three independent apps. Install and run each from its own folder.

| App           | Folder        | Local | Production                        |
| ------------- | ------------- | ----- | --------------------------------- |
| Public site   | `apps/rvcc`   | :3000 | https://rvcc-prod.vercel.app      |
| Staff admin   | `apps/admin`  | :3001 | https://rvcc-admin.vercel.app     |
| API           | `apps/api`    | :4000 | https://rvcc-api.rvcc.workers.dev |

There is **no vendor portal host** — suppliers use the same site (`/register`, `/login`, `/portal`).

## Setup

```bash
cp apps/api/.env.example apps/api/.env
cp apps/rvcc/.env.example apps/rvcc/.env.local
cp apps/admin/.env.example apps/admin/.env.local
```

```env
API_URL=https://rvcc-api.rvcc.workers.dev
NEXT_PUBLIC_SITE_URL=https://rvcc-prod.vercel.app
NEXT_PUBLIC_VENDOR_PORTAL_URL=https://rvcc-prod.vercel.app
NEXT_PUBLIC_ADMIN_PORTAL_URL=https://rvcc-admin.vercel.app
NEXT_PUBLIC_ASSET_CDN_URL=https://pub-7f8ca337d3ac4e7f9f6ed54470da92a0.r2.dev
NEXT_PUBLIC_PDF_CDN_URL=https://pub-7f8ca337d3ac4e7f9f6ed54470da92a0.r2.dev
DOC_PASSWORD=     # 4-digit document download PIN (server-only, required on apps/rvcc)
```

```bash
cd apps/api && npm ci && npm run dev          # :4000
cd apps/rvcc && npm ci && npm run dev         # :3000
cd apps/admin && npm ci && npm run dev        # :3001
```

Vercel: set the project **Root Directory** to `apps/rvcc` or `apps/admin`.

Cloudflare Workers Builds: **Root directory** `apps/api`, install `npm ci`. Deploy with `npm run deploy` from `apps/api`.

PDFs and video are on Cloudflare R2 (not in this repo).
