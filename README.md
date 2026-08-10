# RVCC Monorepo - Industrial Standard Construction Portal

This is the primary repository for the RVCC Construction Company web infrastructure. It is built as a high-performance monorepo using **npm workspaces**, **Turborepo**, and **Next.js**.

## 🏗 Project Structure

- `apps/web`: Public Surface (marketing, enquire BFF, careers).
- `apps/admin`: Staff admin panel (BFF → `workers/admin-api`).
- `apps/vendor`: Supplier portal (BFF → `workers/vendor-api`).
- `workers/enquire-api`: Supplier registration OTP/mail Worker.
- `workers/admin-api`: Admin auth, reviews, careers, vendors.
- `workers/vendor-api`: Vendor auth and dashboard API.
- `workers/pdf-cdn`: Cloudflare Worker + R2/assets CDN for PDF books.
- `packages/db`: Shared Prisma schema + client.
- `packages/auth-password`: Shared scrypt password helpers.
- `packages/eslint-config`: Shared ESLint configurations.
- `packages/ui`: Shared React component library (`StatusBadge`, icons).
- `.husky/`: Git hooks for automated quality enforcement.

## 💎 Industrial Quality Standards

We maintain a "Zero-Technical-Debt" policy through automated enforcement:

### 1. Unified Linting

We use a **Shared Config Package** strategy. Standards are defined once in `packages/eslint-config` and extended by all applications. This ensures absolute consistency in code quality across the entire workspace.

### 2. Automated Code Organization

We use **Prettier** with advanced plugins to automatically handle:

- **Tailwind Class Sorting**: Keeps utility classes organized and readable.
- **Import Sorting**: Automatically categorizes and orders imports (Standard -> Workspace -> Relative).
- **Formatting**: Strict 2-space indentation and 100-character line limits.

### 3. Pre-Commit Hooks (Husky + lint-staged)

You cannot commit "dirty" code. Every commit triggers a validation pipeline that:

- Fixes linting errors automatically.
- Re-organizes and formats code.
- Ensures environment variables are correctly declared.

## 🛠 Development Workflow

### 1. Installation

```bash
npm install
```

### 2. Development

Run all apps and packages in parallel with hot-reloading:

```bash
npm run dev
```

### 3. Quality Check

Run linting across the entire monorepo:

```bash
npm run lint
```

### 4. Code Formatting

Manually trigger the organization pass:

```bash
npm run format
```

### 5. PDF CDN (Cloudflare Worker)

**Live:** `https://rvcc-pdf-cdn.rvcc.workers.dev`

Most PDFs and the pdf.js worker are stored on **Cloudflare Workers Static Assets** (edge). The ~166 MB water-feature PDF is pulled from Vercel once and then edge-cached (Workers Assets max file size is 25 MiB).

```bash
cd workers/pdf-cdn
npm install
npm run deploy
```

App env (`apps/web/.env.local` and Vercel):

```env
NEXT_PUBLIC_PDF_CDN_URL=https://rvcc-pdf-cdn.rvcc.workers.dev
```

See `workers/pdf-cdn/README.md`.

---

&copy; 2026 RVCC Construction Company. Built for Excellence.
