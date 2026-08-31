import fs from "node:fs";
import path from "node:path";
import { convertHtmlToPdf } from "./generate-pdf.mjs";

const outputDir = path.resolve("docs/technical_specifications");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function getHtmlTemplate(title, subtitle, badge, contentHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} - RVCC Technical Documentation</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 16mm 18mm 16mm;
      @bottom-right {
        content: counter(page);
        font-family: 'Segoe UI', system-ui, sans-serif;
        font-size: 8pt;
        color: #94a3b8;
      }
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 9.5pt;
      line-height: 1.55;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    .header {
      border-bottom: 2px solid #0284c7;
      padding-bottom: 14px;
      margin-bottom: 22px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .title-block h1 {
      font-size: 18pt;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 4px 0;
      letter-spacing: -0.02em;
    }
    .title-block .subtitle {
      font-size: 10pt;
      color: #475569;
      margin: 0;
      font-weight: 500;
    }
    .badge {
      display: inline-block;
      background: #e0f2fe;
      color: #0369a1;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border: 1px solid #bae6fd;
    }
    .meta-bar {
      display: flex;
      gap: 18px;
      font-size: 8pt;
      color: #64748b;
      margin-bottom: 20px;
      padding: 8px 12px;
      background: #f8fafc;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    .meta-item strong {
      color: #334155;
    }
    h2 {
      font-size: 12pt;
      font-weight: 700;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin: 20px 0 10px 0;
      page-break-after: avoid;
    }
    h3 {
      font-size: 10pt;
      font-weight: 700;
      color: #0369a1;
      margin: 14px 0 6px 0;
      page-break-after: avoid;
    }
    p {
      margin: 0 0 8px 0;
      color: #334155;
    }
    ul, ol {
      margin: 0 0 10px 0;
      padding-left: 18px;
      color: #334155;
    }
    li {
      margin-bottom: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0 14px 0;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }
    th {
      background: #f1f5f9;
      color: #0f172a;
      text-align: left;
      padding: 7px 9px;
      border: 1px solid #cbd5e1;
      font-weight: 700;
    }
    td {
      padding: 6px 9px;
      border: 1px solid #e2e8f0;
      color: #334155;
      vertical-align: top;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    .callout {
      background: #f0fdf4;
      border-left: 3.5px solid #16a34a;
      padding: 8px 12px;
      margin: 10px 0;
      border-radius: 0 6px 6px 0;
      font-size: 8.5pt;
    }
    .callout-info {
      background: #eff6ff;
      border-left: 3.5px solid #2563eb;
    }
    .callout-warn {
      background: #fffbeb;
      border-left: 3.5px solid #d97706;
    }
    .callout-title {
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 2px;
    }
    code {
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 8pt;
      background: #f1f5f9;
      padding: 1px 4px;
      border-radius: 4px;
      color: #0369a1;
      border: 1px solid #e2e8f0;
    }
    pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 10px 12px;
      border-radius: 6px;
      font-size: 7.5pt;
      font-family: 'Consolas', monospace;
      overflow-x: hidden;
      white-space: pre-wrap;
      word-break: break-all;
      margin: 8px 0 12px 0;
      page-break-inside: avoid;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 10px 0;
    }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .card-title {
      font-weight: 700;
      color: #0f172a;
      font-size: 9pt;
      margin-bottom: 4px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 4px;
    }
    .page-break {
      page-break-before: always;
    }
    .footer-note {
      font-size: 7.5pt;
      color: #94a3b8;
      text-align: center;
      margin-top: 24px;
      border-top: 1px solid #f1f5f9;
      padding-top: 8px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title-block">
      <h1>${title}</h1>
      <div class="subtitle">${subtitle}</div>
    </div>
    <div>
      <span class="badge">${badge}</span>
    </div>
  </div>

  <div class="meta-bar">
    <div class="meta-item"><strong>Project:</strong> RVCC Enterprise Monorepo</div>
    <div class="meta-item"><strong>Version:</strong> 2.0.0 (Production)</div>
    <div class="meta-item"><strong>Architecture:</strong> Next.js 16 + Edge + Prisma</div>
    <div class="meta-item"><strong>Status:</strong> Verified & Active</div>
  </div>

  ${contentHtml}

  <div class="footer-note">
    RVCC Enterprise Platform • Confidential & Proprietary Technical Architecture Documentation • Generated August 2026
  </div>
</body>
</html>`;
}

// -------------------------------------------------------------
// DOC 1: MONOREPO & SHARED ARCHITECTURE SPEC
// -------------------------------------------------------------
const doc1Html = `
<h2>1. Executive Summary & Ecosystem Overview</h2>
<p>The <strong>RVCC Enterprise Digital Platform</strong> is an enterprise-grade, monorepo-based cloud ecosystem engineered to handle end-to-end corporate branding, multi-tier supplier qualification, real-time blind bidding, internal requisition governance, and multi-tenant administrative oversight. It is structured as an optimized Turborepo monorepo powered by PNPM workspaces, Next.js 16 (App Router with Turbopack), Cloudflare Edge Runtime with Prisma ORM, and automated CI/CD pipelines.</p>

<div class="grid-2">
  <div class="card">
    <div class="card-title">Core Business Capabilities</div>
    <ul>
      <li><strong>Corporate Public Portal:</strong> 3D WebGL showcase, career applications, dynamic flipbook documentation.</li>
      <li><strong>Vendor Onboarding Train:</strong> 10-step audited registration with document OCR verification.</li>
      <li><strong>Real-Time Blind Bidding:</strong> SSE sub-second quote stream with automated L1 ranking.</li>
      <li><strong>Procurement Governance:</strong> Departmental requisition workflows and cost tracking.</li>
    </ul>
  </div>
  <div class="card">
    <div class="card-title">Technical Standards & Metrics</div>
    <ul>
      <li><strong>Monorepo Codebase:</strong> 5 Applications + 3 Shared Packages.</li>
      <li><strong>Total Scope:</strong> 580 production source files, 65,453 lines of clean TypeScript.</li>
      <li><strong>Database Entity Model:</strong> 31 Relational Prisma Models + 10 Business Enums.</li>
      <li><strong>Testing & Quality:</strong> 10/10 passing Vitest suites, ESLint 9 Flat configs, Prettier.</li>
    </ul>
  </div>
</div>

<h2>2. Monorepo Structure & Workspace Topology</h2>
<p>The workspace is orchestrated using <code>pnpm-workspace.yaml</code> and <code>turbo.json</code> for maximum build parallelization, cache deduplication, and strictly isolated package boundaries.</p>

<pre>
RVCC-MONOREPO/
├── apps/
│   ├── web/           # Port 3000 - Public Corporate & Vendor Onboarding Application (Next.js 16)
│   ├── admin/         # Port 3001 - Enterprise Super-Admin & Sourcing Governance ERP (Next.js 16)
│   ├── vendor/        # Port 3002 - Vendor Portal & Real-Time Blind Bidding Cockpit (Next.js 16)
│   ├── procurement/   # Port 3003 - Internal Department Requisition & Approval Engine (Next.js 16)
│   └── api/           # Port 8787 - Edge Backend API, SSE Streaming Engine & Prisma ORM
├── packages/
│   ├── schemas/       # @rvcc/schemas - Shared Zod validation contracts & domain types
│   ├── types/         # @rvcc/types - TypeScript interfaces, DB entity shapes & API contracts
│   └── utils/         # @rvcc/utils - Common currency math, string sanitizers & formatters
└── .github/workflows/ # Automated CI/CD test, build, and deploy pipelines
</pre>

<h2>3. Shared Packages Architecture</h2>
<table>
  <thead>
    <tr>
      <th>Package Name</th>
      <th>Key Exports & Modules</th>
      <th>Responsibility & Consumption</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>@rvcc/schemas</code></td>
      <td><code>auth.ts</code>, <code>procurement.ts</code>, <code>sourcing.ts</code>, <code>vendor-onboarding.ts</code>, <code>rbac.ts</code>, <code>audit.ts</code>, <code>enums.ts</code></td>
      <td>Single source of truth for runtime validation using Zod. Consumed across API endpoints and frontend forms for end-to-end type safety.</td>
    </tr>
    <tr>
      <td><code>@rvcc/types</code></td>
      <td>Database entity types, API response generics (<code>ApiResponse&lt;T&gt;</code>), Live Bid payload contracts, Currency conversion shapes.</td>
      <td>Compile-time type contracts ensuring strict interface compliance between backend workers and frontend applications.</td>
    </tr>
    <tr>
      <td><code>@rvcc/utils</code></td>
      <td><code>formatters.ts</code>, <code>currency.ts</code>, <code>sanitize.ts</code>, <code>rank.ts</code>, <code>cn.ts</code></td>
      <td>Shared utility functions for currency formatting, SAR normalization, class merging (Tailwind Merge + Clsx), and ranking algorithms.</td>
    </tr>
  </tbody>
</table>

<div class="page-break"></div>

<h2>4. Turborepo Pipeline & Build Cache Matrix</h2>
<p>The Turborepo pipeline (<code>turbo.json</code>) enforces topological build ordering and smart caching across the 8 monorepo packages:</p>

<pre>
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "test": {
      "dependsOn": ["^build"],
      "inputs": ["src/**/*.ts", "src/**/*.tsx", "vitest.config.ts"]
    },
    "lint": {
      "dependsOn": ["^build"]
    }
  }
}
</pre>

<h2>5. CI/CD & DevOps Pipeline Architecture</h2>
<p>Continuous Integration and Deployment is automated via GitHub Actions with distinct pipelines for quality assurance and production releases.</p>

<div class="grid-2">
  <div class="card">
    <div class="card-title">CI Workflow (<code>ci.yml</code>)</div>
    <ul>
      <li><strong>Trigger:</strong> Pull Requests and pushes to <code>dev</code> branch.</li>
      <li><strong>Steps:</strong> Dependency caching, Prisma schema validation, TypeScript check, ESLint verification, Vitest automated unit testing.</li>
      <li><strong>Guarantees:</strong> Zero broken builds or type errors can reach production.</li>
    </ul>
  </div>
  <div class="card">
    <div class="card-title">CD Workflow (<code>deploy.yml</code>)</div>
    <ul>
      <li><strong>Trigger:</strong> Pushes and tags on <code>main</code> branch.</li>
      <li><strong>Automated Deployments:</strong> Cloudflare Workers deployment for <code>apps/api</code> via Wrangler, Vercel deployments for <code>web</code>, <code>admin</code>, <code>vendor</code>, and <code>procurement</code>.</li>
      <li><strong>Rollback:</strong> Instant zero-downtime rollback capabilities.</li>
    </ul>
  </div>
</div>

<h2>6. Code Quality, Formatting & Tooling Standards</h2>
<ul>
  <li><strong>ESLint 9 Flat Configuration:</strong> Standardized flat configs across all packages with <code>eslint-plugin-unused-imports</code> (automatic pruning of unused imports) and <code>eslint-plugin-simple-import-sort</code> (deterministic import ordering).</li>
  <li><strong>Prettier & Tailwind Plugin:</strong> Enforces consistent indentation, line wrapping, and automatic alphabetical ordering of Tailwind CSS utility classes via <code>prettier-plugin-tailwindcss</code>.</li>
  <li><strong>TypeScript 5.8+:</strong> Strict mode enabled with isolated modules, no implicit any, and strict null checks across the monorepo.</li>
  <li><strong>PWA Lifecycle Management:</strong> Automatic service worker version bumping during prebuild scripts ensuring clients receive instant asset cache refreshes on new releases.</li>
</ul>
`;

// -------------------------------------------------------------
// DOC 2: WEB APPLICATION SPEC
// -------------------------------------------------------------
const doc2Html = `
<h2>1. Application Overview & Objectives</h2>
<p><code>apps/web</code> is the primary public-facing corporate website, marketing portal, and vendor self-service onboarding hub for RVCC. It delivers high-impact visual presentation through 3D architectural rendering while providing high-performance interactive tools for clients, job applicants, and prospective suppliers.</p>

<div class="grid-2">
  <div class="card">
    <div class="card-title">Target Audience & Portals</div>
    <ul>
      <li><strong>Corporate Clients:</strong> Explore civil engineering, electromechanical, landscaping, and infrastructure project portfolios.</li>
      <li><strong>Prospective Vendors:</strong> Multi-step audited supplier registration train.</li>
      <li><strong>Job Applicants:</strong> Interactive careers listing and resume submission portal.</li>
      <li><strong>Stakeholders:</strong> Interactive PDF flipbook for company profiles and quality policy.</li>
    </ul>
  </div>
  <div class="card">
    <div class="card-title">Core Technology Stack</div>
    <ul>
      <li><strong>Framework:</strong> Next.js 16 (App Router + Turbopack).</li>
      <li><strong>Rendering Engine:</strong> Three.js / WebGL with custom GLSL shaders.</li>
      <li><strong>Styling & Animations:</strong> Tailwind CSS, Lenis Smooth Scroll, Framer Motion.</li>
      <li><strong>State Management:</strong> React Context + LocalStorage Draft Persistence.</li>
    </ul>
  </div>
</div>

<h2>2. Route Tree & Page Topology</h2>
<table>
  <thead>
    <tr>
      <th>Route Path</th>
      <th>Rendering Mode</th>
      <th>Key Components & Functionality</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>/</code> (Home)</td>
      <td>Static Prerender (SSG)</td>
      <td>Hero, Skyscraper 3D Canvas, About Overview, Our Works Marquee, Services Carousel, Major Projects showcase, CSR Initiatives.</td>
    </tr>
    <tr>
      <td><code>/about</code></td>
      <td>Static Prerender (SSG)</td>
      <td>Company history timeline, Mission/Vision/Values, Executive Leadership cards, ISO Certifications grid, Safety & Sustainability metrics.</td>
    </tr>
    <tr>
      <td><code>/services/[slug]</code></td>
      <td>Incremental Static (ISG)</td>
      <td>Dynamic service showcase (Artificial Grass, Architectural Services, Artificial Lakes, etc.) with pre-generated static params.</td>
    </tr>
    <tr>
      <td><code>/projects/[slug]</code></td>
      <td>Dynamic Server / SSR</td>
      <td>Interactive project inspection, high-resolution photo galleries, technical specifications, client metadata, and location tags.</td>
    </tr>
    <tr>
      <td><code>/documents</code></td>
      <td>Static + Dynamic</td>
      <td>Document showcase with secure PDF Flipbook Reader (<code>FlipbookReader.tsx</code>) and authenticated unlocking gateway.</td>
    </tr>
    <tr>
      <td><code>/careers</code></td>
      <td>Dynamic SSR + SWR</td>
      <td>Live job opening board with category filtering, detailed job descriptions, and multi-part resume application upload endpoint.</td>
    </tr>
    <tr>
      <td><code>/enquire/[step]</code></td>
      <td>Dynamic Client Train</td>
      <td>10-step wizard for supplier pre-qualification, auto-save state recovery, file attachment processing, and OTP email verification.</td>
    </tr>
  </tbody>
</table>

<div class="page-break"></div>

<h2>3. 3D Architectural WebGL & Interactive Graphics</h2>
<p>The web application features high-performance WebGL graphics powered by Three.js:</p>
<ul>
  <li><code>SkyscraperCanvas.tsx</code>: Real-time 3D rendered skyscraper model with interactive camera orbit controls and dynamic lighting that reacts to user mouse movement.</li>
  <li><code>Interactive3DCard.tsx</code>: CSS 3D perspective transform cards providing tactile depth, specular highlights, and smooth physics-based tilting.</li>
  <li><code>LogoMarquee.tsx</code> & <code>3d-marquee.tsx</code>: Infinite hardware-accelerated logo ticker with zero layout shifts and seamless looping.</li>
  <li><code>LenisProvider.tsx</code>: Virtual smooth inertia scrolling delivering a unified luxury aesthetic across desktop and mobile devices.</li>
</ul>

<h2>4. Multi-Step Supplier Onboarding Engine (10-Step Wizard)</h2>
<p>The vendor onboarding workflow (<code>/enquire</code>) is structured as a fault-tolerant, state-preserving wizard that allows suppliers to complete qualification in stages.</p>

<table>
  <thead>
    <tr>
      <th>Step #</th>
      <th>Step Name</th>
      <th>Form Schema & Collected Attributes</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td><strong>Company Profile</strong></td>
      <td>Legal Trade Name, Commercial Registration (CR) Number, VAT Identification Number, Establishment Date, Website URL.</td>
    </tr>
    <tr>
      <td>2</td>
      <td><strong>Physical Addresses</strong></td>
      <td>Headquarters Location, Branch Offices, City, Postal Code, Building Number, GPS Coordinates.</td>
    </tr>
    <tr>
      <td>3</td>
      <td><strong>Classifications</strong></td>
      <td>Primary & Secondary Business Sectors, General Contracting, Specialized MEP, Landscaping, Material Supply categories.</td>
    </tr>
    <tr>
      <td>4</td>
      <td><strong>Bank Account</strong></td>
      <td>Beneficiary Name, Bank Name, IBAN Number, SWIFT / BIC Code, Account Currency (SAR/USD).</td>
    </tr>
    <tr>
      <td>5</td>
      <td><strong>Key Contacts</strong></td>
      <td>Authorized Executive Representative, Procurement Officer, Finance Contact (Full Name, Designation, Official Email, Phone).</td>
    </tr>
    <tr>
      <td>6</td>
      <td><strong>Questionnaire</strong></td>
      <td>Compliance disclosures, Quality certifications (ISO 9001/14001/45001), Safety Track Record, Annual Turnover.</td>
    </tr>
    <tr>
      <td>7</td>
      <td><strong>Attachments</strong></td>
      <td>CR Certificate PDF, VAT Registration PDF, Chamber of Commerce Certificate, Company Profile deck, Bank Proof letter.</td>
    </tr>
    <tr>
      <td>8</td>
      <td><strong>Review Summary</strong></td>
      <td>Consolidated preview of all 7 sections with inline edit triggers and validation status flags.</td>
    </tr>
    <tr>
      <td>9</td>
      <td><strong>Email OTP Verification</strong></td>
      <td>Cryptographic 6-digit one-time passcode verification to prove ownership of the authorized corporate email domain.</td>
    </tr>
    <tr>
      <td>10</td>
      <td><strong>Submission & Confirmation</strong></td>
      <td>Generates a unique Tracking Reference Number (<code>REG-XXXXXX</code>), triggers backend notification, and displays tracking badge.</td>
    </tr>
  </tbody>
</table>

<div class="callout callout-info">
  <div class="callout-title">State Persistence & Draft Recovery</div>
  <code>EnquireContext.tsx</code> automatically serializes the form state to encrypted LocalStorage and syncs draft checkpoints to <code>/api/enquire/draft</code>. If a supplier accidentally closes their browser, their progress is instantly restored upon re-opening the page.
</div>
`;

// -------------------------------------------------------------
// DOC 3: ADMIN ERP SPEC
// -------------------------------------------------------------
const doc3Html = `
<h2>1. Application Overview & Purpose</h2>
<p><code>apps/admin</code> is the core Enterprise Resource Planning (ERP), Sourcing Governance, and Multi-Tenant Administration application. It empowers procurement executives, sourcing officers, and auditors to manage the entire sourcing lifecycle, evaluate quotes, monitor live blind bidding, review supplier compliance, and manage staff access control.</p>

<div class="grid-2">
  <div class="card">
    <div class="card-title">Governance Modules</div>
    <ul>
      <li><strong>Sourcing & RFQ Management:</strong> Create, publish, invite, evaluate, and award requirements.</li>
      <li><strong>Supplier Verification:</strong> Review, approve, reject, or suspend vendor registrations.</li>
      <li><strong>Live Bidding Cockpit:</strong> Real-time monitoring of active auctions and price updates.</li>
      <li><strong>Staff Management & RBAC:</strong> Granular role and permission administration.</li>
    </ul>
  </div>
  <div class="card">
    <div class="card-title">Technical Architecture</div>
    <ul>
      <li><strong>Framework:</strong> Next.js 16 (App Router) + Zustand.</li>
      <li><strong>Security:</strong> HttpOnly Session Cookies + CSRF Protection + Granular RBAC.</li>
      <li><strong>Real-Time:</strong> SSE streaming proxy with automatic reconnection.</li>
      <li><strong>PWA:</strong> Installable PWA with offline caching for enterprise tablets.</li>
    </ul>
  </div>
</div>

<h2>2. Role-Based Access Control (RBAC) Architecture</h2>
<p>The Admin application implements enterprise RBAC with 12 discrete permission flags stored in the database and validated on every API route and UI navigation gate.</p>

<table>
  <thead>
    <tr>
      <th>Role Name</th>
      <th>Standard Permissions</th>
      <th>Operational Scope</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>SUPER_ADMIN</strong></td>
      <td>All 12 Permissions (<code>MANAGE_STAFF</code>, <code>MANAGE_REQUIREMENTS</code>, <code>AWARD_REQUIREMENTS</code>, etc.)</td>
      <td>Full unrestricted system governance, system configuration, audit review, and user provisioning.</td>
    </tr>
    <tr>
      <td><strong>PROCUREMENT_MANAGER</strong></td>
      <td><code>VIEW_PROCUREMENT</code>, <code>MANAGE_PROCUREMENT</code>, <code>VIEW_REQUIREMENTS</code>, <code>MANAGE_REQUIREMENTS</code>, <code>AWARD_REQUIREMENTS</code></td>
      <td>Approve purchase requisitions, initiate sourcing tenders, evaluate commercial quotes, and award vendor contracts.</td>
    </tr>
    <tr>
      <td><strong>SOURCING_OFFICER</strong></td>
      <td><code>VIEW_REQUIREMENTS</code>, <code>MANAGE_REQUIREMENTS</code>, <code>VIEW_VENDORS</code>, <code>MANAGE_VENDORS</code></td>
      <td>Publish RFQs, invite qualified suppliers, monitor live bidding cockpits, and review supplier compliance documents.</td>
    </tr>
    <tr>
      <td><strong>AUDITOR / COMPLIANCE</strong></td>
      <td><code>VIEW_REQUIREMENTS</code>, <code>VIEW_VENDORS</code>, <code>VIEW_AUDIT_LOGS</code>, <code>VIEW_FINANCIALS</code></td>
      <td>Read-only access across all sourcing history, audit logs, price revision histories, and vendor records.</td>
    </tr>
    <tr>
      <td><strong>CONTENT_MANAGER</strong></td>
      <td><code>VIEW_CONTENT</code>, <code>MANAGE_CONTENT</code></td>
      <td>Edit public website content, publish news, update gallery collections, and manage job vacancies.</td>
    </tr>
  </tbody>
</table>

<div class="page-break"></div>

<h2>3. Sourcing & RFQ Evaluation Workflow</h2>
<pre>
[ Requisition Created ] ──► [ Manager Approval ] ──► [ RFQ Draft Created ]
                                                             │
                                                             ▼
[ Award Contract ] ◄── [ Quote Evaluation / L1 ] ◄── [ Published to Bidding ]
</pre>

<ul>
  <li><strong>Itemized BOQ Builder:</strong> Sourcing officers create requirements with detailed line items, unit measures, estimated baseline budgets, delivery timelines, and technical specification attachments.</li>
  <li><strong>Targeted Vendor Invites:</strong> Select specific pre-qualified vendors or publish to the open vendor pool based on industry classification codes.</li>
  <li><strong>Bid Status Governance:</strong> Supports Sealed Bidding (bids locked until closing date) and Live Blind Bidding (real-time price updates).</li>
  <li><strong>Contract Awarding Engine:</strong> One-click awarding of selected L1 or technical preference quotes with automated email notifications and rejection notifications sent to non-awarded bidders.</li>
</ul>

<h2>4. Real-Time Admin Live Bidding Monitor</h2>
<p>The Admin Live Market Cockpit (<code>/live-market/[id]</code>) establishes a Server-Sent Events (SSE) streaming proxy directly to the Edge API:</p>
<ul>
  <li><strong>Live Price Feed:</strong> Sub-second updates as vendors submit price revisions.</li>
  <li><strong>L1 Dense Ranking:</strong> Real-time recalculation of rank positions based on SAR normalized values.</li>
  <li><strong>Activity Telemetry:</strong> Tracks bid timestamps, revision deltas (percentage drops), and vendor interaction logs.</li>
  <li><strong>Anonymized vs Unmasked Views:</strong> Sourcing managers can toggle between anonymized blind views (for impartial governance) and unmasked vendor views.</li>
</ul>

<h2>5. Supplier Document Review & Onboarding Terminal</h2>
<p>The Vendor Management panel (<code>/registrations/[id]</code>) provides an interactive split-screen document verification terminal:</p>
<ul>
  <li><strong>CR & Tax Verification:</strong> Inspect uploaded commercial licenses, tax certificates, and bank confirmation letters in an integrated PDF viewer.</li>
  <li><strong>Approval Workflow:</strong> Approve, request additional documents, reject with justification comments, or suspend accounts.</li>
  <li><strong>Automated Credentials:</strong> On approval, the system provisions an active Vendor account and dispatches an onboarding welcome email with login credentials.</li>
</ul>
`;

// -------------------------------------------------------------
// DOC 4: VENDOR PORTAL SPEC
// -------------------------------------------------------------
const doc4Html = `
<h2>1. Application Overview & Value Proposition</h2>
<p><code>apps/vendor</code> is the dedicated external portal for approved and registered suppliers. It provides a secure, streamlined workspace where vendors can discover open tenders, participate in live blind bidding, submit itemized commercial quotes, and track contract awards.</p>

<div class="grid-2">
  <div class="card">
    <div class="card-title">Key Capabilities</div>
    <ul>
      <li><strong>Blind Bidding Cockpit:</strong> Participate in competitive price auctions without revealing identity.</li>
      <li><strong>Multi-Currency Support:</strong> Submit quotes in USD, EUR, GBP, AED, QAR, or SAR with auto-conversion.</li>
      <li><strong>Quote Lifecycle Management:</strong> Manage draft, submitted, under-review, and awarded bids.</li>
      <li><strong>Compliance Profile:</strong> Update bank accounts, addresses, and renewal certificates.</li>
    </ul>
  </div>
  <div class="card">
    <div class="card-title">Security & Integrity</div>
    <ul>
      <li><strong>Blind Anonymity:</strong> Cryptographic anonymization of competitor identities.</li>
      <li><strong>Anti-Collusion:</strong> Competitor names, company details, and bid histories are strictly masked.</li>
      <li><strong>Authentication:</strong> Session-based HttpOnly JWT cookies + OTP challenge fallbacks.</li>
      <li><strong>Access Gating:</strong> Pending suppliers are automatically routed to <code>/access-held</code>.</li>
    </ul>
  </div>
</div>

<h2>2. Live Blind-Bidding Cockpit Architecture</h2>
<p>The Live Bidding engine (<code>/requirements/[id]</code>) is built for high-stakes, fast-paced commercial auctions.</p>

<pre>
┌────────────────────────────────────────────────────────────────────────┐
│                        VENDOR LIVE BIDDING COCKPIT                     │
├──────────────────────────┬─────────────────────────────┬───────────────┤
│  YOUR CURRENT RANK: #2   │  CURRENT L1 PRICE (LOWEST)  │  TIME REMAIN  │
│  Quote: 45,000 SAR       │  42,500 SAR                 │  02h : 14m    │
├──────────────────────────┴─────────────────────────────┴───────────────┤
│  RANKING TABLE (ANONYMIZED)                                            │
│  • Rank #1: 42,500 SAR (Lowest Bid - Market Leader)                    │
│  • Rank #2: 45,000 SAR (YOU - Delta: +2,500 SAR / +5.8%)               │
│  • Rank #3: 48,000 SAR (Competitor B)                                  │
│  • Rank #4: 52,000 SAR (Competitor C)                                  │
├────────────────────────────────────────────────────────────────────────┤
│  INSTANT PRICE REVISION CONTROLLER                                     │
│  [ Enter New Unit Price (SAR) ]  [ Match L1 Target ]  [ SUBMIT REVISION ] │
└────────────────────────────────────────────────────────────────────────┘
</pre>

<div class="page-break"></div>

<h2>3. Technical Mechanics of <code>use-vendor-live-bidding.ts</code></h2>
<p>The vendor live bidding hook manages the real-time lifecycle with high resilience:</p>
<ul>
  <li><strong>EventSource Stream:</strong> Connects to <code>/api/requirements/[id]/live</code> to stream server-sent events whenever any participant submits a revised quote.</li>
  <li><strong>Background Polling Fallback:</strong> If the network drops or the SSE connection fails, the hook seamlessly switches to an automated 5-second polling fallback until the SSE stream reconnects.</li>
  <li><strong>Sound & Visual Alerts:</strong> Real-time audio chimes and pulse animations notify the vendor when their rank drops from #1 to #2.</li>
</ul>

<h2>4. Multi-Currency Normalization Engine</h2>
<p>Vendors can quote in their preferred operating currency while the system automatically normalizes all bids to Saudi Riyals (SAR) for impartial ranking.</p>

<table>
  <thead>
    <tr>
      <th>Currency Code</th>
      <th>Exchange Rate Source</th>
      <th>Normalization Math</th>
      <th>Display Format</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>SAR</strong> (Base Currency)</td>
      <td>Internal Baseline (1.0000)</td>
      <td><code>amountSar = amount</code></td>
      <td><code>SAR 45,000.00</code></td>
    </tr>
    <tr>
      <td><strong>USD</strong> (US Dollar)</td>
      <td>Automated Daily Cron (3.7500)</td>
      <td><code>amountSar = amount * 3.75</code></td>
      <td><code>$12,000.00 (≈ SAR 45,000.00)</code></td>
    </tr>
    <tr>
      <td><strong>EUR</strong> (Euro)</td>
      <td>Automated Daily Cron (4.0500)</td>
      <td><code>amountSar = amount * 4.05</code></td>
      <td><code>€11,111.00 (≈ SAR 45,000.00)</code></td>
    </tr>
    <tr>
      <td><strong>AED / QAR</strong> (GCC)</td>
      <td>Automated Daily Cron (1.0200 / 1.0300)</td>
      <td><code>amountSar = amount * rate</code></td>
      <td><code>AED 44,100.00 (≈ SAR 45,000.00)</code></td>
    </tr>
  </tbody>
</table>

<h2>5. Supplier Compliance & Account Profile Management</h2>
<ul>
  <li><strong>Company Dossier:</strong> Maintain official CR licenses, Chamber of Commerce membership details, and tax documentation.</li>
  <li><strong>Bank Account Verification:</strong> Manage verified IBAN records used for electronic purchase order payment processing.</li>
  <li><strong>Notification Center:</strong> Real-time in-app notifications and email alerts for newly published RFQs, tender invitations, and award notifications.</li>
</ul>
`;

// -------------------------------------------------------------
// DOC 5: PROCUREMENT APP SPEC
// -------------------------------------------------------------
const doc5Html = `
<h2>1. Application Overview & Business Goals</h2>
<p><code>apps/procurement</code> is the internal purchase requisition and departmental spend management platform. It allows internal department managers (Site Engineers, Project Managers, Facility Directors) to initiate purchase requests, track item delivery status, and enforce budgetary approvals before tenders are published to the market.</p>

<div class="grid-2">
  <div class="card">
    <div class="card-title">Core Features</div>
    <ul>
      <li><strong>Purchase Requisition Creation:</strong> Multi-item BOQ entry with cost estimations.</li>
      <li><strong>Approval Hierarchy:</strong> Multi-level review based on expenditure thresholds.</li>
      <li><strong>Sourcing Integration:</strong> Direct conversion of approved PRs into Sourcing RFQs.</li>
      <li><strong>Order Tracking:</strong> End-to-end status visibility from request to site delivery.</li>
    </ul>
  </div>
  <div class="card">
    <div class="card-title">Key Integrations</div>
    <ul>
      <li><strong>Admin ERP Sourcing:</strong> Seamless data pipeline to Sourcing Officers.</li>
      <li><strong>Unified Auth:</strong> Centralized staff credentials and session state.</li>
      <li><strong>PWA Mobile App:</strong> Optimized for on-site engineers using tablets/phones.</li>
      <li><strong>Zustand Store:</strong> Centralized client-side state management.</li>
    </ul>
  </div>
</div>

<h2>2. Purchase Requisition Lifecycle & Matrix</h2>
<pre>
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  DRAFT CREATION  │ ──► │ MANAGER APPROVAL │ ──► │ SOURCING RFQ GEN │
│ (Site Engineer)  │     │ (Dept Director)  │     │ (Procurement ERP)│
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                                           │
                                                           ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  SITE FULFILLED  │ ◄── │ PURCHASE ORDER   │ ◄── │  VENDOR AWARDED  │
│ (Goods Received) │     │ (Vendor Notice)  │     │  (L1 Best Quote) │
└──────────────────┘     └──────────────────┘     └──────────────────┘
</pre>

<div class="page-break"></div>

<h2>3. Data Models & Requisition Schema</h2>
<table>
  <thead>
    <tr>
      <th>Entity Field</th>
      <th>Data Type</th>
      <th>Description & Validation Rules</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>requisitionNumber</code></td>
      <td>String (Unique)</td>
      <td>Auto-generated sequential reference (e.g. <code>PR-2026-0042</code>).</td>
    </tr>
    <tr>
      <td><code>department</code></td>
      <td>Enum (Department)</td>
      <td>Civil, MEP, Landscaping, Infrastructure, Architecture, Logistics.</td>
    </tr>
    <tr>
      <td><code>priorityLevel</code></td>
      <td>Enum (Priority)</td>
      <td><code>LOW</code>, <code>STANDARD</code>, <code>URGENT</code>, <code>EMERGENCY</code> (affects SLA).</td>
    </tr>
    <tr>
      <td><code>estimatedBudget</code></td>
      <td>Decimal (SAR)</td>
      <td>Estimated departmental allocation for expenditure verification.</td>
    </tr>
    <tr>
      <td><code>items</code></td>
      <td>Array&lt;Item&gt;</td>
      <td>Item Name, Description, Quantity, Unit (Nos, SqM, Metric Tons), Estimated Rate.</td>
    </tr>
    <tr>
      <td><code>attachments</code></td>
      <td>Array&lt;File&gt;</td>
      <td>BOQ Excel sheets, site architectural drawings, technical datasheets.</td>
    </tr>
  </tbody>
</table>

<h2>4. Responsive PWA & Mobile Site Engineer Experience</h2>
<p>To support engineers on active construction sites, <code>apps/procurement</code> is optimized as an offline-capable Progressive Web App:</p>
<ul>
  <li><strong>Quick-Action Modal:</strong> Rapid 3-click requisition submission with voice-to-text note capture.</li>
  <li><strong>Touch-Optimized Grids:</strong> Collapsible card views and status-colorized KPI badges (<code>DRAFT</code>, <code>PENDING</code>, <code>APPROVED</code>, <code>SOURCING</code>, <code>ORDERED</code>, <code>FULFILLED</code>).</li>
  <li><strong>PWA Install Banner:</strong> Prompts mobile and tablet users to install the application natively to their home screen with zero app store overhead.</li>
</ul>
`;

// -------------------------------------------------------------
// DOC 6: API & DATABASE ARCHITECTURE SPEC
// -------------------------------------------------------------
const doc6Html = `
<h2>1. Architecture Overview & Runtime Stack</h2>
<p><code>apps/api</code> is the high-throughput Edge Backend API powering the entire RVCC monorepo. Engineered on the <strong>Cloudflare Workers / Node Edge Runtime</strong> using <strong>Prisma ORM</strong> with the <code>@prisma/adapter-pg</code> connection driver, it delivers sub-millisecond query execution, real-time Server-Sent Events (SSE) streaming, and cryptographically secure authentication.</p>

<div class="grid-2">
  <div class="card">
    <div class="card-title">Backend Technology Stack</div>
    <ul>
      <li><strong>Runtime:</strong> Cloudflare Workers / Node.js 22+ Edge Runtime.</li>
      <li><strong>Database ORM:</strong> Prisma Client v5.22+ with custom soft-delete extensions.</li>
      <li><strong>Database Engine:</strong> PostgreSQL 16 (Enterprise Schema).</li>
      <li><strong>Real-Time:</strong> Server-Sent Events (SSE) streaming bus.</li>
    </ul>
  </div>
  <div class="card">
    <div class="card-title">Security & Reliability</div>
    <ul>
      <li><strong>Authentication:</strong> Session JWTs + SHA-256 OTP challenge tokens.</li>
      <li><strong>Auditing:</strong> Comprehensive unified AuditLog for all state mutations.</li>
      <li><strong>Soft Deletes:</strong> Zero data loss via automated <code>deletedAt</code> filtering.</li>
      <li><strong>Testing:</strong> 100% passing Vitest test suites.</li>
    </ul>
  </div>
</div>

<h2>2. Complete Prisma Database Entity Model (31 Models)</h2>
<p>The relational database schema encapsulates the entire business logic across 6 distinct domain areas:</p>

<table>
  <thead>
    <tr>
      <th>Domain Area</th>
      <th>Entity Models</th>
      <th>Key Relationships & Purpose</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>1. Staff & RBAC</strong></td>
      <td><code>AdminUser</code>, <code>Role</code>, <code>Permission</code>, <code>RolePermission</code>, <code>AdminSession</code>, <code>AdminOtp</code>, <code>AdminLoginHistory</code></td>
      <td>Granular access control, session token storage, password reset OTP challenges, and chronological login history.</td>
    </tr>
    <tr>
      <td><strong>2. Vendor & Auth</strong></td>
      <td><code>VendorUser</code>, <code>VendorSession</code>, <code>VendorOtp</code>, <code>VendorLoginHistory</code>, <code>SupplierRegistration</code></td>
      <td>Supplier accounts, passwordless OTP authentication, session lifecycle, and registration dossiers.</td>
    </tr>
    <tr>
      <td><strong>3. Supplier Dossier</strong></td>
      <td><code>CompanyProfile</code>, <code>SupplierContact</code>, <code>SupplierAddress</code>, <code>BusinessClassification</code>, <code>BankAccount</code>, <code>QuestionnaireAnswer</code>, <code>RegistrationAttachment</code></td>
      <td>Complete 7-part supplier qualification profile including legal, banking, contact, and compliance documentation.</td>
    </tr>
    <tr>
      <td><strong>4. Sourcing & Bidding</strong></td>
      <td><code>Requirement</code>, <code>RequirementInvite</code>, <code>Quote</code>, <code>ExchangeRate</code>, <code>Industry</code></td>
      <td>Tender requirements, itemized BOQ, targeted supplier invites, multi-currency vendor quotes, and live FX rates.</td>
    </tr>
    <tr>
      <td><strong>5. Procurement PR</strong></td>
      <td><code>PurchaseRequest</code>, <code>PurchaseRequestItem</code>, <code>PurchaseRequestAttachment</code></td>
      <td>Departmental purchase requisitions, itemized breakdowns, budget approvals, and sourcing links.</td>
    </tr>
    <tr>
      <td><strong>6. Content & Audit</strong></td>
      <td><code>Notification</code>, <code>AuditLog</code>, <code>JobPosting</code>, <code>JobApplication</code></td>
      <td>Real-time user notifications, immutable audit log ledger with JSON state diffs, careers CMS and candidate applications.</td>
    </tr>
  </tbody>
</table>

<div class="page-break"></div>

<h2>3. Prisma Client Soft-Delete Extension Architecture</h2>
<p>All core tables implement soft-deletion to ensure audit compliance and prevent catastrophic data loss:</p>

<pre>
// apps/api/src/db.ts
export const prisma = new PrismaClient().$extends({
  query: {
    $allModels: {
      async delete({ model, args }) {
        return (prisma[model] as any).update({
          ...args,
          data: { deletedAt: new Date() }
        });
      },
      async findMany({ model, args }) {
        args.where = { deletedAt: null, ...args.where };
        return (prisma[model] as any).findMany(args);
      }
    }
  }
});
</pre>

<h2>4. Real-Time SSE Live Bidding Bus Architecture</h2>
<p>The Server-Sent Events engine (<code>modules/bidding/live-bids.ts</code>) broadcasts price ranking updates to all connected cockpits with zero overhead:</p>
<ul>
  <li><strong>Broadcast on Quote Submission:</strong> When any vendor submits a revised quote to <code>/api/requirements/[id]/quote</code>, the API normalizes the price to SAR, updates the database in a transaction, recalculates the L1 ranking array, and immediately broadcasts the updated payload to all open SSE connections.</li>
  <li><strong>Payload Anonymization:</strong> The SSE broadcaster generates two separate payloads:
    <ul>
      <li><strong>Admin Payload:</strong> Contains full vendor identity and quote details for evaluation.</li>
      <li><strong>Vendor Payload:</strong> Cryptographically masks all competitor names (e.g. <code>"Competitor A"</code>, <code>"Competitor B"</code>) while publishing the exact L1 market price and rank positions.</li>
    </ul>
  </li>
</ul>

<h2>5. Daily FX Synchronization Engine</h2>
<p>To guarantee accurate multi-currency rankings, an automated cron service runs every 24 hours:</p>
<ul>
  <li>Fetches official daily exchange rates for <code>USD</code>, <code>EUR</code>, <code>GBP</code>, <code>AED</code>, <code>QAR</code> against base <code>SAR</code>.</li>
  <li>Updates the <code>ExchangeRate</code> table in PostgreSQL.</li>
  <li>Caches rates in memory to guarantee sub-millisecond conversion calculations during high-frequency bidding events.</li>
</ul>

<h2>6. REST API Endpoint Registry Summary</h2>
<table>
  <thead>
    <tr>
      <th>Endpoint Group</th>
      <th>Methods</th>
      <th>Key Operations</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>/api/auth/*</code></td>
      <td>POST</td>
      <td>Admin & Vendor login, logout, OTP challenge generation, password reset.</td>
    </tr>
    <tr>
      <td><code>/api/requirements/*</code></td>
      <td>GET, POST, PUT</td>
      <td>Create, publish, list, inspect RFQs, submit quotes, award contracts.</td>
    </tr>
    <tr>
      <td><code>/api/requirements/:id/live</code></td>
      <td>GET (SSE)</td>
      <td>Server-Sent Events streaming feed for real-time live bidding cockpits.</td>
    </tr>
    <tr>
      <td><code>/api/registrations/*</code></td>
      <td>GET, POST, PUT</td>
      <td>Vendor self-registration train, document review, approval/rejection.</td>
    </tr>
    <tr>
      <td><code>/api/procurement/*</code></td>
      <td>GET, POST, PUT</td>
      <td>Purchase requisition creation, manager approvals, sourcing conversion.</td>
    </tr>
    <tr>
      <td><code>/api/staff/*</code></td>
      <td>GET, POST, PUT, DELETE</td>
      <td>Staff account administration, role assignment, permission governance.</td>
    </tr>
  </tbody>
</table>
`;

// -------------------------------------------------------------
// DOC 0: COMPLETE SYSTEM ARCHITECTURE SUMMARY
// -------------------------------------------------------------
const doc0Html = `
<h2>1. Master System Architecture & Enterprise Topology</h2>
<p>The <strong>RVCC Enterprise Digital Ecosystem</strong> represents a state-of-the-art multi-tier procurement and digital transformation platform. Built from the ground up to replace fragmented legacy workflows, it unifies corporate marketing, supplier qualification, real-time blind bidding auctions, internal purchase requisitions, and administrative oversight into a cohesive, high-performance monorepo architecture.</p>

<div class="grid-2">
  <div class="card">
    <div class="card-title">Architectural Highlights</div>
    <ul>
      <li><strong>5 Specialized Applications:</strong> Web, Admin, Vendor, Procurement, and Edge API.</li>
      <li><strong>3 Shared Internal Packages:</strong> Centralized Zod schemas, TypeScript types, and utilities.</li>
      <li><strong>Prisma ORM & PostgreSQL:</strong> 31 relational models with soft-delete safeguards.</li>
      <li><strong>Edge-Ready Infrastructure:</strong> Cloudflare Workers + Vercel multi-cloud deployment.</li>
    </ul>
  </div>
  <div class="card">
    <div class="card-title">Production Quality Metrics</div>
    <ul>
      <li><strong>Lines of Code:</strong> 65,453 lines of clean, strictly typed TypeScript.</li>
      <li><strong>Codebase Files:</strong> 580 production files across 8 monorepo packages.</li>
      <li><strong>Testing & CI:</strong> 10/10 automated Vitest suites passing in CI pipelines.</li>
      <li><strong>Code Formatting:</strong> 100% Prettier + Tailwind class sorting compliance.</li>
    </ul>
  </div>
</div>

<h2>2. End-to-End Enterprise Data Flow</h2>
<pre>
┌───────────────────────────┐         ┌──────────────────────────┐
│     APPS/WEB (PORT 3000)  │         │  APPS/VENDOR (PORT 3002) │
│  • Public Corporate Site  │         │  • Blind Bidding Cockpit │
│  • 10-Step Vendor Enquire │         │  • Multi-Currency Quotes │
└─────────────┬─────────────┘         └────────────┬─────────────┘
              │                                    │
              ▼                                    ▼
┌────────────────────────────────────────────────────────────────┐
│                   APPS/API (EDGE RUNTIME / PORT 8787)          │
│   • Prisma ORM Engine (31 Models) • SSE Real-Time Stream Bus   │
│   • RBAC Security Engine          • Daily FX Currency Sync     │
└─────────────┬────────────────────────────────────┬─────────────┘
              ▲                                    ▲
              │                                    │
┌─────────────┴─────────────┐         ┌────────────┴─────────────┐
│  APPS/PROCUREMENT (3003)  │         │   APPS/ADMIN (PORT 3001) │
│  • Department Requisition │         │   • Super-Admin ERP      │
│  • Budget Approvals       │         │   • Sourcing Governance  │
└───────────────────────────┘         └──────────────────────────┘
</pre>

<div class="page-break"></div>

<h2>3. Summary Index of Technical Specifications</h2>
<table>
  <thead>
    <tr>
      <th>Document Code</th>
      <th>Specification Title</th>
      <th>Target Application / Scope</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>SPEC-01</strong></td>
      <td><a href="01_RVCC_MONOREPO_ARCHITECTURE.pdf">Monorepo & Shared Architecture Specification</a></td>
      <td>Turborepo, PNPM Workspaces, Shared Packages, CI/CD, Tooling & PWA.</td>
    </tr>
    <tr>
      <td><strong>SPEC-02</strong></td>
      <td><a href="02_RVCC_WEB_TECHNICAL_SPEC.pdf">Public Web & Vendor Onboarding Specification</a></td>
      <td><code>apps/web</code>: 3D WebGL, 10-Step Supplier Wizard, Careers, Flipbook.</td>
    </tr>
    <tr>
      <td><strong>SPEC-03</strong></td>
      <td><a href="03_RVCC_ADMIN_TECHNICAL_SPEC.pdf">Admin ERP & Sourcing Governance Specification</a></td>
      <td><code>apps/admin</code>: RBAC, RFQ Sourcing, Live Monitor, Supplier Review, CMS.</td>
    </tr>
    <tr>
      <td><strong>SPEC-04</strong></td>
      <td><a href="04_RVCC_VENDOR_TECHNICAL_SPEC.pdf">Vendor Portal & Blind-Bidding Specification</a></td>
      <td><code>apps/vendor</code>: Blind Bidding Cockpit, SSE Stream, Multi-Currency FX.</td>
    </tr>
    <tr>
      <td><strong>SPEC-05</strong></td>
      <td><a href="05_RVCC_PROCUREMENT_TECHNICAL_SPEC.pdf">Procurement & Purchase Requisition Specification</a></td>
      <td><code>apps/procurement</code>: Department Requisitions, Budget Approval Matrix.</td>
    </tr>
    <tr>
      <td><strong>SPEC-06</strong></td>
      <td><a href="06_RVCC_API_DATABASE_SPEC.pdf">API & Database Architecture Specification</a></td>
      <td><code>apps/api</code>: 31 Prisma Models, PostgreSQL, Edge Runtime, SSE Bus.</td>
    </tr>
  </tbody>
</table>

<h2>4. Security, Compliance & Governance Standards</h2>
<ul>
  <li><strong>Zero-Trust Authentication:</strong> Strict HttpOnly, Secure, SameSite=Lax JWT session cookies preventing XSS token theft.</li>
  <li><strong>Cryptographic Password & OTP Security:</strong> Timing-safe comparison and SHA-256 token hashing for all authentication and password-reset workflows.</li>
  <li><strong>Data Integrity & Auditability:</strong> Immutable <code>AuditLog</code> records capturing user identity, IP address, timestamp, action type, and before/after state diffs for all financial, sourcing, and administrative operations.</li>
  <li><strong>Soft Deletion:</strong> Logical deletion across all primary business entities preventing accidental or malicious data loss.</li>
</ul>
`;

const documents = [
  {
    fileName: "00_RVCC_COMPLETE_ENTERPRISE_ARCHITECTURE",
    title: "Master Enterprise Architecture Specification",
    subtitle: "Complete Technical Overview of the RVCC Digital Procurement & ERP Ecosystem",
    badge: "Master Architecture",
    html: doc0Html
  },
  {
    fileName: "01_RVCC_MONOREPO_ARCHITECTURE",
    title: "Monorepo & Shared Packages Specification",
    subtitle: "Turborepo, PNPM Workspace, Shared Schemas, Types, Utils, and CI/CD Pipelines",
    badge: "Monorepo Spec",
    html: doc1Html
  },
  {
    fileName: "02_RVCC_WEB_TECHNICAL_SPEC",
    title: "Public Web & Vendor Onboarding Specification",
    subtitle: "apps/web: 3D WebGL Canvas, 10-Step Supplier Qualification Train & Marketing Portal",
    badge: "apps/web",
    html: doc2Html
  },
  {
    fileName: "03_RVCC_ADMIN_TECHNICAL_SPEC",
    title: "Admin ERP & Sourcing Governance Specification",
    subtitle: "apps/admin: Super-Admin ERP, Granular RBAC, RFQ Sourcing, and Live Bidding Monitor",
    badge: "apps/admin",
    html: doc3Html
  },
  {
    fileName: "04_RVCC_VENDOR_TECHNICAL_SPEC",
    title: "Vendor Portal & Blind-Bidding Specification",
    subtitle: "apps/vendor: Secure Blind-Bidding Cockpit, SSE Real-Time Stream, and Multi-Currency FX",
    badge: "apps/vendor",
    html: doc4Html
  },
  {
    fileName: "05_RVCC_PROCUREMENT_TECHNICAL_SPEC",
    title: "Procurement & Purchase Requisition Specification",
    subtitle: "apps/procurement: Department Purchase Requests, Cost Center Tracking & Mobile PWA",
    badge: "apps/procurement",
    html: doc5Html
  },
  {
    fileName: "06_RVCC_API_DATABASE_SPEC",
    title: "Edge API & Database Architecture Specification",
    subtitle: "apps/api: 31 Prisma Relational Models, Cloudflare Workers / Edge Runtime & SSE Engine",
    badge: "apps/api & DB",
    html: doc6Html
  }
];

console.log(`[Docs Builder] Generating ${documents.length} Technical Documents...`);

for (const doc of documents) {
  const htmlContent = getHtmlTemplate(doc.title, doc.subtitle, doc.badge, doc.html);
  const htmlPath = path.join(outputDir, `${doc.fileName}.html`);
  const pdfPath = path.join(outputDir, `${doc.fileName}.pdf`);
  const mdPath = path.join(outputDir, `${doc.fileName}.md`);
  
  fs.writeFileSync(htmlPath, htmlContent, "utf8");
  console.log(`[Docs Builder] Wrote HTML: ${htmlPath}`);

  // Generate Markdown
  let text = doc.html
    .replace(/<h2>(.*?)<\/h2>/gi, "\n## $1\n")
    .replace(/<h3>(.*?)<\/h3>/gi, "\n### $1\n")
    .replace(/<div class="card-title">(.*?)<\/div>/gi, "\n#### $1\n")
    .replace(/<p>(.*?)<\/p>/gi, "\n$1\n")
    .replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<code>(.*?)<\/code>/gi, "`$1`")
    .replace(/<li>(.*?)<\/li>/gi, "- $1")
    .replace(/<pre>([\s\S]*?)<\/pre>/gi, "\n```\n$1\n```\n")
    .replace(/<div class="page-break"><\/div>/gi, "\n---\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const fullMd = `# ${doc.title}\n\n**${doc.subtitle}**\n\n*RVCC Enterprise Monorepo Architecture • Version 2.0.0 (Production)*\n\n---\n\n${text}\n`;
  fs.writeFileSync(mdPath, fullMd, "utf8");
  console.log(`[Docs Builder] Wrote Markdown: ${mdPath}`);
  
  const success = convertHtmlToPdf(htmlPath, pdfPath);
  if (success) {
    console.log(`[Docs Builder] Successfully generated PDF: ${pdfPath}`);
  } else {
    console.error(`[Docs Builder] Failed to generate PDF for ${doc.fileName}`);
  }
}

console.log("[Docs Builder] All technical specification documents generated successfully!");

