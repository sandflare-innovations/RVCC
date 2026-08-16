# RVCC Vendor API (Cloudflare Worker)

Secure BFF for the vendor portal. **Postgres credentials stay on Cloudflare**
(`DATABASE_URL` / Hyperdrive). Next.js only holds `VENDOR_API_URL` and
`VENDOR_API_SECRET` — it never talks to Postgres for vendor auth.

Sessions use header `X-Vendor-Session` only. Admin sessions (`X-Admin-Session`)
are never accepted.

## Endpoints

| Method | Path             | Auth                    | Notes                                       |
| ------ | ---------------- | ----------------------- | ------------------------------------------- |
| GET    | `/` or `/health` | Public                  | `204` only — no service/DB fingerprinting   |
| POST   | `/auth/login`    | Bearer                  | Returns `{ ok, token, mustChangePassword }` |
| POST   | `/auth/logout`   | Bearer + vendor session | Revokes current session                     |
| GET    | `/auth/me`       | Bearer + vendor session | Vendor identity                             |
| POST   | `/auth/password` | Bearer + vendor session | Change password; revokes other sessions     |
| GET    | `/dashboard`     | Bearer + vendor session | Registration summary for portal home        |

## Setup

```bash
cd workers/vendor-api
pnpm install

# Shared secret (same value as apps/vendor VENDOR_API_SECRET)
pnpm dlx wrangler secret put API_SECRET

# Option A — Hyperdrive (recommended)
pnpm dlx wrangler hyperdrive create rvcc-vendor --connection-string="postgresql://..."
# put the id into wrangler.toml [[hyperdrive]]

# Option B — direct secret (dev / until Hyperdrive is ready)
pnpm dlx wrangler secret put DATABASE_URL

pnpm run deploy
```

Set on Vercel / `.env.local` (**no DATABASE_URL here**):

```env
VENDOR_API_URL=https://rvcc-vendor-api.rvcc.workers.dev
VENDOR_API_SECRET=<same as Worker API_SECRET>
NEXT_PUBLIC_SITE_URL=https://rvcc-prod.vercel.app
NEXT_PUBLIC_VENDOR_PORTAL_URL=https://rvcc-app.vercel.app
NEXT_PUBLIC_ADMIN_PORTAL_URL=https://rvcc-admin.vercel.app
```

Push schema once from the app (Prisma):

```bash
cd apps/web
pnpm dlx prisma db push
```
