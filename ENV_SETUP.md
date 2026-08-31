# Environment Configuration & Deployment Guide

This guide details how environment variables are structured, validated, and deployed across the RVCC Monorepo.

---

## 1. Local Development Setup

Each app manages its own `.env.local` file. Copy the example templates to get started:

```bash
# Web (Public Portal & Enquiry)
cp apps/web/.env.example apps/web/.env.local

# Admin Portal
cp apps/admin/.env.example apps/admin/.env.local

# Vendor Portal
cp apps/vendor/.env.example apps/vendor/.env.local

# Procurement Portal
cp apps/procurement/.env.example apps/procurement/.env.local

# Unified API (Cloudflare / Node)
cp apps/api/.env.example apps/api/.env
```

---

## 2. Architecture & Security Rules

1. **Never commit `.env` or `.env.local` files to Git**:
   - Only `.env.example` files containing dummy placeholder values are committed.
2. **Type-Safe Validation**:
   - Environment variables are validated using Zod schemas exported from `@rvcc/schemas`.
   - Each app imports its typed `env` from `@rvcc/schemas` via `src/env.ts`.
3. **Turborepo Build Cache Invalidation**:
   - Build-time variables (`NEXT_PUBLIC_*`, `API_URL`, etc.) are declared in `turbo.json` under `tasks.build.env` so changing an environment variable automatically invalidates only the relevant build cache.

---

## 3. Production Deployment Matrix

### A. Vercel Projects (Frontend Apps)

Configure the following variables in each app's **Vercel Project Settings → Environment Variables**:

| App                    | Required Environment Variables                                                                                                                                                                       | Notes                                                     |
| :--------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------- |
| **`apps/web`**         | `API_URL`<br>`NEXT_PUBLIC_SITE_URL`<br>`NEXT_PUBLIC_VENDOR_PORTAL_URL`<br>`NEXT_PUBLIC_ADMIN_PORTAL_URL`<br>`NEXT_PUBLIC_ASSET_CDN_URL`<br>`NEXT_PUBLIC_PDF_CDN_URL`<br>`DOC_PASSWORD`               | Set `DOC_PASSWORD` for document download security PIN.    |
| **`apps/admin`**       | `API_URL`<br>`NEXT_PUBLIC_SITE_URL`<br>`NEXT_PUBLIC_VENDOR_PORTAL_URL`<br>`NEXT_PUBLIC_ADMIN_PORTAL_URL`<br>`UPSTASH_REDIS_REST_URL`<br>`UPSTASH_REDIS_REST_TOKEN`<br>`NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Upstash Redis is used for fast cross-lambda auth caching. |
| **`apps/vendor`**      | `API_URL`<br>`NEXT_PUBLIC_SITE_URL`<br>`NEXT_PUBLIC_VENDOR_PORTAL_URL`<br>`NEXT_PUBLIC_ADMIN_PORTAL_URL`<br>`UPSTASH_REDIS_REST_URL`<br>`UPSTASH_REDIS_REST_TOKEN`                                   | Upstash Redis is used for vendor session caching.         |
| **`apps/procurement`** | `API_URL`<br>`NEXT_PUBLIC_SITE_URL`<br>`NEXT_PUBLIC_VENDOR_PORTAL_URL`<br>`NEXT_PUBLIC_ADMIN_PORTAL_URL`                                                                                             | Cross-portal navigation links.                            |

### B. Cloudflare Workers (`apps/api`)

Production API runs on Cloudflare Workers. Configure secrets via Wrangler CLI or Cloudflare Dashboard:

```bash
# Required Database URL (or Hyperdrive connection string)
npx wrangler secret put DATABASE_URL

# Allowed Frontend Origins (comma-separated, no trailing slash)
npx wrangler secret put ALLOWED_ORIGINS

# SMTP Credentials for OTP and Email Notifications
npx wrangler secret put SMTP_HOST
npx wrangler secret put SMTP_PORT
npx wrangler secret put SMTP_USER
npx wrangler secret put SMTP_PASS
npx wrangler secret put SMTP_FROM
npx wrangler secret put ENQUIRE_FROM_EMAIL

# Cloudflare R2 Uploads
npx wrangler secret put R2_ACCOUNT_ID
npx wrangler secret put R2_BUCKET_NAME
npx wrangler secret put R2_PUBLIC_URL
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
```
