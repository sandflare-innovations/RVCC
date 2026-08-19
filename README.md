# RVCC

Four independent apps. Install and run each from its own folder.

| App            | Folder        | Local | Production                          |
| -------------- | ------------- | ----- | ----------------------------------- |
| Marketing + enquire | `apps/web`    | :3000 | https://rvcc-enquiry.vercel.app |
| Vendor portal  | `apps/vendor` | :3002 | https://rvcc-vendor.vercel.app      |
| Staff admin    | `apps/admin`  | :3001 | https://rvcc-admin.vercel.app       |
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
NEXT_PUBLIC_SITE_URL=https://rvcc-enquiry.vercel.app
NEXT_PUBLIC_VENDOR_PORTAL_URL=https://rvcc-vendor.vercel.app
NEXT_PUBLIC_ADMIN_PORTAL_URL=https://rvcc-admin.vercel.app
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

**Vercel:** one project per frontend — set **Root Directory** to `apps/web`, `apps/vendor`, or `apps/admin`.

Web project env:

```env
API_URL=https://rvcc-api.rvcc.workers.dev
DOC_PASSWORD=your-4-digit-pin
NEXT_PUBLIC_SITE_URL=https://rvcc-enquiry.vercel.app
NEXT_PUBLIC_VENDOR_PORTAL_URL=https://rvcc-vendor.vercel.app
NEXT_PUBLIC_ADMIN_PORTAL_URL=https://rvcc-admin.vercel.app
NEXT_PUBLIC_PDF_CDN_URL=https://pub-7f8ca337d3ac4e7f9f6ed54470da92a0.r2.dev
```

After deploy, open `/api/enquire/health` — it should report `apiReachable: true`. Enquire UI lives at `/enquire/verify` (legacy `/register` redirects there).

For performance tuning see [`PERFORMANCE.md`](PERFORMANCE.md).

Cloudflare Workers Builds: **Root directory** `apps/api`, install `npm ci`. Deploy with `npm run deploy` from `apps/api`. Set `ALLOWED_ORIGINS` and `VENDOR_PORTAL_URL` in Wrangler to match the Vercel hosts above.

PDFs and video are on Cloudflare R2 (not in this repo).
