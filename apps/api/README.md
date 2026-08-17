# RVCC Unified API

Backend for admin, vendor, and supplier registration.

Local: Node. Production: Cloudflare Worker (`wrangler.toml`).

```bash
cp .env.example .env   # DATABASE_URL, SMTP_*, ALLOWED_ORIGINS
npm ci
npm run dev            # http://localhost:4000
npm run deploy         # wrangler deploy
```

Cloudflare Workers Builds: root directory = this folder, install = `npm ci`.

Schema: `prisma/schema.prisma`. SQL upgrades: `sql/upgrades/` (`npm run db:upgrade-sourcing`).

## Routes

| Prefix        | Domain                                                                   |
| ------------- | ------------------------------------------------------------------------ |
| `GET /health` | Liveness (`204`)                                                         |
| `/admin/*`    | Staff auth, registrations, vendors, careers, requirements, notifications |
| `/vendor/*`   | Vendor auth, password, requirements/quotes, notifications                |
| `/enquire/*`  | OTP, draft, submit (+ SMTP)                                              |

Session headers: `X-Admin-Session`, `X-Vendor-Session`, `X-Enquire-Session`.

Frontends set `API_URL=http://localhost:4000`. Next.js `/api` routes are cookie BFFs that forward here.
