# RVCC Unified API

Single Node backend for **admin**, **vendor**, and **enquire** (supplier registration).

## Run

```bash
cd apps/api
cp .env.example .env   # fill DATABASE_URL, SMTP_*, ALLOWED_ORIGINS
npm install            # from monorepo root is fine
npm run dev            # http://localhost:4000
```

Production:

```bash
npm run build && npm start
```

## Routes

| Prefix        | Domain                                                                   |
| ------------- | ------------------------------------------------------------------------ |
| `GET /health` | Liveness (`204`)                                                         |
| `/admin/*`    | Staff auth, registrations, vendors, careers, requirements, notifications |
| `/vendor/*`   | Vendor auth, password, requirements/quotes, notifications                |
| `/enquire/*`  | OTP, draft, submit (+ SMTP)                                              |

Session headers:

- `X-Admin-Session`
- `X-Vendor-Session`
- `X-Enquire-Session`

Frontends set `API_URL=http://localhost:4000` (or `NEXT_PUBLIC_API_URL`). Next.js `/api` routes remain thin cookie BFFs that forward to this host.
