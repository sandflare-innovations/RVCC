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

Shared env files live at the repo root (not committed):

| File | Use |
| ---- | --- |
| `.env.vercel` | Paste into **all three** Vercel projects (web / vendor / admin) |
| `.env.server` | Copy to `apps/api/.env` locally; secrets go to Cloudflare `wrangler secret put` |

```bash
cp .env.server apps/api/.env
cp .env.vercel apps/web/.env.local
cp .env.vercel apps/vendor/.env.local
cp .env.vercel apps/admin/.env.local
```

```bash
cd apps/api && pnpm install && pnpm run dev          # :4000
cd apps/web && pnpm install && pnpm run dev          # :3000
cd apps/admin && pnpm install && pnpm run dev        # :3001
cd apps/vendor && pnpm install && pnpm run dev       # :3002
```

**Vercel:** one project per frontend — set **Root Directory** to `apps/web`, `apps/vendor`, or `apps/admin`. Paste `.env.vercel` into each project's environment variables.

After deploy, open `/api/enquire/health` — it should report `apiReachable: true`. Enquire UI lives at `/enquire/verify` (legacy `/register` redirects there).

For performance tuning see [`PERFORMANCE.md`](PERFORMANCE.md).

Cloudflare Workers Builds: **Root directory** `apps/api`, install `pnpm install`. Deploy with `pnpm run deploy` from `apps/api`. Set `ALLOWED_ORIGINS` and `VENDOR_PORTAL_URL` in Wrangler to match the Vercel hosts above.

PDFs and video are on Cloudflare R2 (not in this repo).
