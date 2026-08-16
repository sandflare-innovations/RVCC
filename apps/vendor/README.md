# RVCC public site + supplier portal (`apps/vendor`)

Production app on port **3000**:

| Area | Paths |
|------|--------|
| Marketing | `/`, `/about`, `/services`, `/projects`, `/documents`, `/careers`, … |
| Registration | `/register/*` |
| Portal | `/login`, `/portal/*` |
| Compat | `/enquire/*` → `/register/*`, `/requirements/*` → `/portal/requirements/*` |

Backend: `apps/api` via `API_URL`. PDFs/video render from Cloudflare R2 (`NEXT_PUBLIC_ASSET_CDN_URL`).

```bash
cd apps/api && npm run dev          # :4000
cd apps/vendor && npm run dev       # :3000
```
