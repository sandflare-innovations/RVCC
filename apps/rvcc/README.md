# RVCC public site + supplier portal

Port **3000**.

| Area         | Paths                                                                      |
| ------------ | -------------------------------------------------------------------------- |
| Marketing    | `/`, `/about`, `/services`, `/projects`, `/documents`, `/careers`, …       |
| Registration | `/register/*`                                                              |
| Portal       | `/login`, `/portal/*`                                                      |
| Compat       | `/enquire/*` → `/register/*`, `/requirements/*` → `/portal/requirements/*` |

Backend: `apps/api` via `API_URL`. PDFs/video from Cloudflare R2 (`NEXT_PUBLIC_ASSET_CDN_URL`).

```bash
cd apps/api && npm ci && npm run dev
cd apps/rvcc && npm ci && npm run dev
```

Vercel root directory: `apps/rvcc`. Set `DOC_PASSWORD` (4 digits) for document downloads.
