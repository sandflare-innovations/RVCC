# API parity matrix (cutover safety)

Do **not** delete a Next `app/api` route until its row is green in production.

## Admin (`apps/admin/src/app/api` → `apps/api` `/admin`)

| Next route         | Backend                      | Status                   |
| ------------------ | ---------------------------- | ------------------------ |
| `login` / `logout` | `/admin/auth/*` + cookie BFF | Kept (cookie bridge)     |
| `registrations/*`  | `/admin/registrations/*`     | Kept (proxy)             |
| `vendors/*`        | `/admin/vendors/*`           | Kept (proxy)             |
| `careers/*`        | `/admin/careers/*`           | Kept (proxy)             |
| `requirements/*`   | `/admin/requirements/*`      | Kept (proxy)             |
| `notifications`    | `/admin/notifications`       | Ported from Prisma → API |

## Vendor

| Next route                      | Backend                        | Status                   |
| ------------------------------- | ------------------------------ | ------------------------ |
| `login` / `logout` / `password` | `/vendor/auth/*`               | Kept (cookie bridge)     |
| `requirements/*/quote`          | `/vendor/requirements/*/quote` | Kept (proxy)             |
| `notifications`                 | `/vendor/notifications`        | Ported from Prisma → API |

## Web enquire

| Next route                 | Backend                     | Status                                        |
| -------------------------- | --------------------------- | --------------------------------------------- |
| `otp/*`, `draft`, `submit` | `/enquire/*` (Worker logic) | Kept; Prisma fallback only if `API_URL` unset |
| `logout`                   | Cookie clear only           | Next-only (intentional)                       |

## Worker-only (no Next twin) — live on `apps/api`

- `/admin/auth/me`, `/admin/dashboard`, list endpoints used by RSC
- `/vendor/auth/me`, `/vendor/dashboard`, requirements list/get
- `GET /careers` (public published jobs for marketing)
- In-process mail (former enquire `/notify/*`)
