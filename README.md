# RVCC

Four independent apps. Install and run each from its own folder.

| App            | Folder        | Local | Production                          |
| -------------- | ------------- | ----- | ----------------------------------- |
| Public site    | `apps/web`    | :3000 | https://rvcc-prod.pages.dev         |
| Vendor portal  | `apps/vendor` | :3002 | https://rvcc-vendor.pages.dev       |
| Staff admin    | `apps/admin`  | :3001 | https://rvcc-admin.pages.dev        |
| API            | `apps/api`    | :4000 | https://rvcc-api.rvcc.workers.dev   |

Marketing (`apps/web`) and the supplier portal (`apps/vendor`) are **separate deploys**. They share the unified API and Postgres, but not a codebase or host.

## Setup

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/vendor/.env.example apps/vendor/.env.local
cp apps/admin/.env.example apps/admin/.env.local
```

Production env (each app):

```env
API_URL=https://rvcc-api.rvcc.workers.dev
NEXT_PUBLIC_SITE_URL=https://rvcc-prod.pages.dev
NEXT_PUBLIC_VENDOR_PORTAL_URL=https://rvcc-vendor.pages.dev
NEXT_PUBLIC_ADMIN_PORTAL_URL=https://rvcc-admin.pages.dev
NEXT_PUBLIC_ASSET_CDN_URL=https://pub-7f8ca337d3ac4e7f9f6ed54470da92a0.r2.dev
NEXT_PUBLIC_PDF_CDN_URL=https://pub-7f8ca337d3ac4e7f9f6ed54470da92a0.r2.dev
DOC_PASSWORD=     # 4-digit document download PIN (server-only, apps/web)
```

```bash
cd apps/api && npm ci && npm run dev          # :4000
cd apps/web && npm ci && npm run dev          # :3000
cd apps/admin && npm ci && npm run dev        # :3001
cd apps/vendor && npm ci && npm run dev       # :3002
```

Cloudflare Pages: one project per frontend (`apps/web`, `apps/vendor`, `apps/admin`).

Cloudflare Workers Builds: **Root directory** `apps/api`, install `npm ci`. Deploy with `npm run deploy` from `apps/api`.

PDFs and video are on Cloudflare R2 (not in this repo).
