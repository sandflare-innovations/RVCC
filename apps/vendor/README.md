# RVCC Supplier Portal (`apps/vendor`)

Production vendor portal on port **3002**:

| Area | Paths |
| ---- | ----- |
| Portal | `/`, `/requirements`, `/password`, `/login` |
| Registration | `/register/*` (supplier onboarding) |
| Access hold | `/access-held` |

Backend: unified API at `apps/api` via `API_URL`.

```bash
cd apps/api && pnpm run dev          # :4000
cd apps/vendor && pnpm run dev       # :3002
```

Marketing site lives in `apps/web` — not this app.
