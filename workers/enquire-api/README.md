# RVCC Enquire API (Cloudflare Worker)

Secure BFF for supplier registration. **Postgres + SMTP credentials stay on Cloudflare**
(`DATABASE_URL` / Hyperdrive + `SMTP_*` secrets). Next.js only holds `ENQUIRE_WORKER_URL`
and `ENQUIRE_API_SECRET` — it never receives OTP plaintext or SMTP passwords.

## Endpoints

| Method    | Path             | Auth             | Notes                                                     |
| --------- | ---------------- | ---------------- | --------------------------------------------------------- |
| GET       | `/` or `/health` | Public           | `204` only — no service/DB fingerprinting                 |
| POST      | `/otp/request`   | Bearer           | Creates OTP, sends mail on Worker, **never returns code** |
| POST      | `/otp/verify`    | Bearer           | Returns `sessionToken`                                    |
| GET/PATCH | `/draft`         | Bearer + session | Draft CRUD                                                |
| POST      | `/submit`        | Bearer + session | Submit + confirmation mail                                |

## Setup

```bash
cd workers/enquire-api
pnpm install

# Shared secret (same value as apps/web ENQUIRE_API_SECRET)
pnpm dlx wrangler secret put API_SECRET

# Option A — Hyperdrive (recommended)
pnpm dlx wrangler hyperdrive create rvcc-enquire --connection-string="postgresql://..."
# put the id into wrangler.toml [[hyperdrive]]

# Option B — direct secret (dev / until Hyperdrive is ready)
pnpm dlx wrangler secret put DATABASE_URL

# SMTP (required for OTP + submission confirmation)
pnpm dlx wrangler secret put SMTP_HOST
pnpm dlx wrangler secret put SMTP_PORT          # e.g. 587
pnpm dlx wrangler secret put SMTP_USER
pnpm dlx wrangler secret put SMTP_PASS
pnpm dlx wrangler secret put ENQUIRE_FROM_EMAIL  # e.g. RVCC Procurement <procurement@domain.com>
# optional: SMTP_SECURE=true for port 465

pnpm run deploy
```

Set on Vercel / `.env.local` (**no SMTP here**):

```env
ENQUIRE_WORKER_URL=https://rvcc-enquire-api.<account>.workers.dev
ENQUIRE_API_SECRET=<same as Worker API_SECRET>
```

Push schema once from the app (Prisma):

```bash
cd apps/web
pnpm dlx prisma db push
```
