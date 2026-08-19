# RVCC Supplier Portal (`apps/vendor`)

Production vendor portal on port **3002**:

| Area | Paths |
| ---- | ----- |
| Portal | `/`, `/requirements`, `/password`, `/login` |
| Registration | `/register/*` (supplier onboarding) |
| Access hold | `/access-held` |

Backend: unified API at `apps/api` via `API_URL`.

```bash
cd apps/api && npm run dev          # :4000
cd apps/vendor && npm run dev       # :3002
```

Marketing site lives in `apps/web` — not this app.
