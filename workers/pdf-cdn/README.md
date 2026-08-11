# RVCC PDF CDN (Cloudflare Worker)

**Live CDN:** https://rvcc-pdf-cdn.rvcc.workers.dev

## How files are served (performance order)

| Layer                    | Where files live             | When used                                                             |
| ------------------------ | ---------------------------- | --------------------------------------------------------------------- |
| **1. Cloudflare Assets** | On the Worker (edge)         | pdf.js worker + PDFs ≤ 25 MiB                                         |
| **2. Edge cache**        | Cloudflare Cache API         | After first pull of oversized PDFs                                    |
| **3. Vercel origin**     | https://rvcc-prod.vercel.app | Only the ~166 MB water-feature PDF (Workers Assets max file = 25 MiB) |

Most readers never hit Vercel. The oversized PDF hits Vercel once per PoP, then stays cached.

## Deploy / update assets

```bash
cd workers/pdf-cdn
npm install
npm run deploy    # runs prepare-assets, then wrangler deploy
```

Set on local + Vercel:

```env
NEXT_PUBLIC_PDF_CDN_URL=https://rvcc-pdf-cdn.rvcc.workers.dev
```

## Optional: move the 166 MB PDF fully onto Cloudflare

Enable R2 in the Dashboard (payment method required), uncomment `[[r2_buckets]]` in `wrangler.toml`, then `npm run upload`.

## Verify

```bash
curl -I https://rvcc-pdf-cdn.rvcc.workers.dev/health
curl -I https://rvcc-pdf-cdn.rvcc.workers.dev/pdfjs/pdf.worker.min.mjs
curl -I https://rvcc-pdf-cdn.rvcc.workers.dev/pdf/books/rvcc-general-profile.pdf
# Header X-CDN-Source should be: cloudflare-assets | edge-cache | origin-vercel
```
