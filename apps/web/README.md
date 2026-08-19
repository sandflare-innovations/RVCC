# RVCC Construction - Web Portal

Premium marketing site and supplier registration (`/enquire`) for RVCC, built with Next.js 16.

## Architecture

- `src/app/(marketing)`: Public marketing routes (Lenis + Navbar layout)
- `src/app/enquire`: Supplier registration wizard (lean layout)
- `src/app/api`: BFF routes to the unified API
- `src/components`: UI, layout, and section components
- `src/lib`: Utilities, caching, and API clients

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org) (App Router)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com)
- **Animation**: Framer Motion, Lenis (marketing routes only)

## Performance

See [`../../PERFORMANCE.md`](../../PERFORMANCE.md) for caching, ISR, and deploy tuning.

## Quality Standards

This app uses Next.js ESLint defaults (`eslint-config-next`).

## Getting Started

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Setup Environment**:
   Copy from the example:

   ```bash
   cp .env.example .env.local
   ```

3. **Run Development Server**:

   ```bash
   npm run dev
   ```

4. **Build for Production**:
   ```bash
   npm run build
   ```

## 📄 License

&copy; 2026 RVCC Construction Company. All rights reserved.
