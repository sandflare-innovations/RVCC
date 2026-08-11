# RVCC Admin API (Cloudflare Worker)

Secure BFF for the admin panel. **Postgres credentials stay on Cloudflare**
(`DATABASE_URL` / Hyperdrive). The Next.js admin app only holds `ADMIN_API_URL`
and `ADMIN_API_SECRET` — sessions are httpOnly cookies set by the BFF from the
raw token returned by `POST /auth/login`.

## Endpoints

| Method   | Path                          | Auth                 | Notes                       |
| -------- | ----------------------------- | -------------------- | --------------------------- |
| GET/HEAD | `/health`                     | Public               | `204`                       |
| POST     | `/auth/login`                 | Public               | Returns `{ ok, token }`     |
| POST     | `/auth/logout`                | Bearer + session     | Revokes `X-Admin-Session`   |
| GET      | `/auth/me`                    | Bearer + session     | `{ id, email, name, role }` |
| GET      | `/registrations`              | Bearer + REVIEWER+   | `?status=&q=`               |
| GET      | `/registrations/:id`          | Bearer + REVIEWER+   | Full detail                 |
| POST     | `/registrations/:id/review`   | Bearer + ADMIN+      | APPROVE / REJECT            |
| DELETE   | `/registrations/:id`          | Bearer + SUPER_ADMIN | Permanent delete            |
| GET      | `/vendors`                    | Bearer + REVIEWER+   | Vendor accounts             |
| PATCH    | `/vendors/:id`                | Bearer + ADMIN+      | `{ isActive }`              |
| POST     | `/vendors/:id/reset-password` | Bearer + ADMIN+      | Temp password once          |
| GET      | `/careers`                    | Bearer + REVIEWER+   | Job postings                |
| GET      | `/careers/:id`                | Bearer + REVIEWER+   | One posting                 |
| POST     | `/careers`                    | Bearer + ADMIN+      | Create                      |
| PATCH    | `/careers/:id`                | Bearer + ADMIN+      | Partial update              |
| DELETE   | `/careers/:id`                | Bearer + SUPER_ADMIN | Delete                      |
| GET      | `/dashboard`                  | Bearer + REVIEWER+   | Counts                      |

## Setup

```bash
cd workers/admin-api
npm install

npx wrangler secret put API_SECRET

# Option A — Hyperdrive (recommended)
npx wrangler hyperdrive create rvcc-admin --connection-string="postgresql://..."
# put the id into wrangler.toml [[hyperdrive]]

# Option B — direct secret (dev / until Hyperdrive is ready)
npx wrangler secret put DATABASE_URL

# Notify (approval/rejection mail via enquire Worker)
npx wrangler secret put ENQUIRE_WORKER_URL
npx wrangler secret put ENQUIRE_API_SECRET
npx wrangler secret put VENDOR_PORTAL_URL   # https://rvcc-app.vercel.app

npm run deploy
```

Set on the admin app (`.env.local`):

```env
ADMIN_API_URL=https://rvcc-admin-api.rvcc.workers.dev
ADMIN_API_SECRET=<same as Worker API_SECRET>
NEXT_PUBLIC_SITE_URL=https://rvcc-prod.vercel.app
NEXT_PUBLIC_VENDOR_PORTAL_URL=https://rvcc-app.vercel.app
NEXT_PUBLIC_ADMIN_PORTAL_URL=https://rvcc-admin.vercel.app
DATABASE_URL=postgresql://...
```
