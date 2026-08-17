# RVCC Monorepo - CI CD

Industrial construction portal — Turborepo + Next.js + Cloudflare API.

## Apps

| App | Local | Production | Role |
|-----|-------|------------|------|
| `apps/vendor` | :3000 | https://rvcc-prod.vercel.app | Marketing + register + `/portal` |
| `apps/admin` | :3001 | https://rvcc-admin.vercel.app | Staff admin |
| `apps/api` | :4000 | https://rvcc-api.rvcc.workers.dev | Unified backend |

There is **no separate vendor portal host** — suppliers use the same site as marketing (`/register`, `/login`, `/portal`).

## Packages

`packages/db`, `packages/auth-password`, `packages/ui`, `packages/rfq`, `packages/eslint-config`

## Env

```env
API_URL=https://rvcc-api.rvcc.workers.dev
NEXT_PUBLIC_SITE_URL=https://rvcc-prod.vercel.app
NEXT_PUBLIC_VENDOR_PORTAL_URL=https://rvcc-prod.vercel.app
NEXT_PUBLIC_ADMIN_PORTAL_URL=https://rvcc-admin.vercel.app
NEXT_PUBLIC_ASSET_CDN_URL=https://pub-7f8ca337d3ac4e7f9f6ed54470da92a0.r2.dev
NEXT_PUBLIC_PDF_CDN_URL=https://pub-7f8ca337d3ac4e7f9f6ed54470da92a0.r2.dev
```

PDFs and video are on Cloudflare R2 (not in this repo).

## Quality

```bash
npm run lint
npm test
npm run format
```
