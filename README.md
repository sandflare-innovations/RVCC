# RVCC Monorepo

Industrial construction portal — Turborepo + Next.js + Node API.

## Apps

| App | Port | Role |
|-----|------|------|
| `apps/vendor` | 3000 | Public marketing site + supplier registration + portal |
| `apps/admin` | 3001 | Staff admin |
| `apps/api` | 4000 | Unified backend (admin / vendor / enquire) |

## Packages

`packages/db`, `packages/auth-password`, `packages/ui`, `packages/rfq`, `packages/eslint-config`

## Env (local)

```env
API_URL=http://localhost:4000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_VENDOR_PORTAL_URL=http://localhost:3000
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
