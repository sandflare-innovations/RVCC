# RVCC Construction - Web Portal

A premium, high-performance web application for RVCC Construction Company, built with Next.js 16 and Sanity Headless CMS.

## 🏗 Architecture

The project follows a **Component-Based Architecture** with the following structure:

- `src/app`: Routing, global layout, and styles.
- `src/components/layout`: Global components like Navbar and Footer.
- `src/components/sections`: Page-level sections (Hero, Features, etc.).
- `src/components/ui`: Reusable atomic UI components.
- `src/lib`: Core utilities and CMS configuration.
- `src/types`: Centralized TypeScript definitions.

## 🚀 Tech Stack

- **Framework**: [Next.js](https://nextjs.org) (App Router)
- **CMS**: [Sanity.io](https://sanity.io)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com)
- **Icons**: [Lucide React](https://lucide.dev)
- **Animation**: [Framer Motion](https://framer.com/motion) (Recommended)

## 💎 Quality Standards

This application adheres to the global monorepo standards defined in the root [README](../../README.md):

- **ESLint**: Extends `@repo/eslint-config/next-js`.
- **Prettier**: Automatic Tailwind class sorting and import organization.
- **Git Hooks**: Pre-commit validation via Husky.

## 🛠 Getting Started

1. **Install dependencies**:

   ```bash
   pnpm install
   ```

2. **Setup Environment**:
   Create a `.env.local` file:

   ```env
   NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
   NEXT_PUBLIC_SANITY_DATASET=production
   ```

3. **Run Development Server**:

   ```bash
   pnpm dev
   ```

4. **Build for Production**:
   ```bash
   pnpm build
   ```

## 📄 License

&copy; 2026 RVCC Construction Company. All rights reserved.
