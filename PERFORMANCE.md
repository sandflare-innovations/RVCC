# Performance roadmap — RVCC

Production speed plan for Vercel frontends and the CF Workers API.

## Architecture

```
Browser → Next.js (Vercel, region: bom1) → CF Worker API → Postgres (+ optional read replica)
                              ↓ optional
                         Upstash Redis (session cache)
```

---

## Phase 1 — Complete

| Item | Status |
|------|--------|
| Careers ISR (60s) + API Cache-Control | Done |
| Session `unstable_cache` (45s) | Done |
| Admin/vendor prefetch on hover | Done |
| Enquire step code-splitting | Done |
| Marketing route group (no Lenis on `/enquire`) | Done |
| Hero LCP + deferred Clarity | Done |

---

## Phase 2 — Complete

| Item | Status | Notes |
|------|--------|-------|
| Vercel region `bom1` | Done | Change in `vercel.json` if Postgres is elsewhere |
| Cloudflare Hyperdrive | Done (config) | Uncomment `[[hyperdrive]]` in `apps/api/wrangler` after creating binding |
| Upstash Redis session cache | Done (optional) | Set `UPSTASH_REDIS_REST_*` on admin + vendor |
| Profile cookie — skip layout `/auth/me` | Done | Set at login; layout reads cookie |
| Enquire PATCH debounce (400ms) | Done | Coalesces rapid step navigation |
| Lazy 3D (About, Quality) | Done | `dynamic(..., { ssr: false })` |
| PDF Range proxy | Done | `/api/documents/pdf?path=/pdf/...` |
| Remove unused Sanity | Done | Deps + files removed |

---

## Phase 3 — Complete

| Item | Status | Notes |
|------|--------|-------|
| Read replica support | Done | `DATABASE_READ_URL` — dashboard uses `createReadSql` |
| Dashboard isolate cache (15s) | Done | `getIsolateCache` + `Cache-Control: private, max-age=15` |
| Preview CORS (`*.vercel.app`, `*.pages.dev`) | Done | `apps/api/src/lib/http.ts` |
| Vercel Speed Insights | Done | web + admin layouts |
| Bundle analyzer | Done | `pnpm run analyze` in `apps/web` |
| Observability baseline | Done | Speed Insights; use CF Worker analytics for API |

---

## Deploy checklist

### Web (Vercel — `apps/web`)

```env
API_URL=https://rvcc-api.rvcc.workers.dev
NEXT_PUBLIC_SITE_URL=https://rvcc-enquiry.vercel.app
NEXT_PUBLIC_VENDOR_PORTAL_URL=https://rvcc-vendor.vercel.app
NEXT_PUBLIC_ADMIN_PORTAL_URL=https://rvcc-admin.vercel.app
```

### Admin (Vercel — `apps/admin`)

```env
API_URL=https://rvcc-api.rvcc.workers.dev
NEXT_PUBLIC_SITE_URL=https://rvcc-enquiry.vercel.app
NEXT_PUBLIC_VENDOR_PORTAL_URL=https://rvcc-vendor.vercel.app
NEXT_PUBLIC_ADMIN_PORTAL_URL=https://rvcc-admin.vercel.app
UPSTASH_REDIS_REST_URL=   # optional, recommended
UPSTASH_REDIS_REST_TOKEN=
```

### Vendor (Vercel — `apps/vendor`)

Same public URLs as above. Upstash vars optional.

### API (Cloudflare Workers)

1. Set `DATABASE_URL` secret.
2. Optional: `DATABASE_READ_URL` for read replica.
3. Create Hyperdrive config → add binding to `wrangler`:

```toml
[[hyperdrive]]
binding = "HYPERDRIVE"
id = "<your-hyperdrive-config-id>"
```

4. Deploy API.

### Region alignment

- Vercel functions: `bom1` (Mumbai) in each app's `vercel.json`.
- If Postgres is in EU/US, change `regions` to match (e.g. `iad1`, `fra1`).

---

## Measuring success

| Metric | Target |
|--------|--------|
| Careers TTFB (cached) | < 200ms |
| Admin dashboard (warm) | < 1.5s |
| Admin nav (profile cookie) | No `/auth/me` on layout |
| Enquire step change | UI instant; save debounced 400ms |
| Home LCP | < 2.5s |

```bash
curl -w "\n%{time_total}s\n" https://rvcc-api.rvcc.workers.dev/health
curl -I https://rvcc-api.rvcc.workers.dev/careers
ANALYZE=true pnpm run build   # in apps/web
```

---

## Key files

| Area | Path |
|------|------|
| Careers cache | `apps/web/src/lib/cache.ts` |
| Session + Redis | `apps/admin/src/lib/session.ts`, `redis-cache.ts` |
| Profile cookie | `apps/admin/src/lib/profile-cookie.ts` |
| PDF proxy | `apps/web/src/app/api/documents/pdf/route.ts` |
| Hyperdrive | `apps/api/src/worker`, `apps/api/src/lib/sql.ts` |
| Dashboard cache | `apps/api/src/lib/isolate-cache.ts`, `handlers.ts` |

---

## What stays uncached

- Enquire draft read/write
- Admin/vendor mutations
- OTP / submit / logout

Do not enable blanket caching on authenticated routes without per-route review.
