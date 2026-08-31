import fs from "node:fs";
import path from "node:path";
import { convertHtmlToPdf } from "./generate-pdf.mjs";

const docsDir = path.resolve("docs");
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

const masterPdfPath = path.join(docsDir, "RVCC_MASTER_TECHNICAL_DOCUMENTATION.pdf");
const tempHtmlPath = path.join(docsDir, "temp_master_doc.html");

const unifiedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>RVCC Enterprise Master Technical Architecture Specification</title>
  <style>
    @page {
      size: A4;
      margin: 16mm 14mm 16mm 14mm;
      @bottom-right {
        content: counter(page);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 8pt;
        color: #94a3b8;
      }
      @bottom-left {
        content: "RVCC Enterprise Platform • Technical Architecture Specification";
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 8pt;
        color: #94a3b8;
      }
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 9pt;
      line-height: 1.5;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }

    /* COVER PAGE */
    .cover-page {
      height: 96vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      padding: 40px 36px;
      background: linear-gradient(145deg, #0f172a 0%, #1e293b 60%, #0369a1 100%);
      color: #ffffff;
      page-break-after: always;
    }
    .cover-top .org-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.25);
      color: #38bdf8;
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      padding: 6px 14px;
      border-radius: 9999px;
      margin-bottom: 24px;
    }
    .cover-title {
      font-size: 26pt;
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -0.02em;
      margin: 0 0 12px 0;
      color: #ffffff;
    }
    .cover-subtitle {
      font-size: 13pt;
      color: #94a3b8;
      font-weight: 400;
      line-height: 1.4;
      max-width: 90%;
      margin: 0 0 28px 0;
    }
    .cover-metrics {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 16px;
      border-radius: 8px;
      backdrop-filter: blur(10px);
    }
    .metric-card {
      border-right: 1px solid rgba(255, 255, 255, 0.1);
      padding-right: 8px;
    }
    .metric-card:last-child {
      border-right: none;
    }
    .metric-val {
      font-size: 16pt;
      font-weight: 800;
      color: #38bdf8;
    }
    .metric-lbl {
      font-size: 7.5pt;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 2px;
    }
    .cover-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      padding-top: 18px;
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: #94a3b8;
    }
    .cover-footer strong {
      color: #f8fafc;
    }

    /* SECTION HEADERS */
    .section-header {
      border-bottom: 2px solid #0284c7;
      padding-bottom: 8px;
      margin: 28px 0 16px 0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      page-break-after: avoid;
    }
    .section-header h2 {
      font-size: 14pt;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.01em;
      border: none;
      padding: 0;
    }
    .section-badge {
      display: inline-block;
      background: #e0f2fe;
      color: #0369a1;
      padding: 3px 8px;
      border-radius: 9999px;
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border: 1px solid #bae6fd;
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
      margin-bottom: 3px;
    }

    /* TABLES */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0 14px 0;
      font-size: 8pt;
      page-break-inside: avoid;
    }
    th {
      background: #f1f5f9;
      color: #0f172a;
      text-align: left;
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
      font-weight: 700;
    }
    td {
      padding: 5px 8px;
      border: 1px solid #e2e8f0;
      color: #334155;
      vertical-align: top;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }

    /* CARDS & CALLOUTS */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin: 8px 0 12px 0;
      page-break-inside: avoid;
    }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 10px;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .card-title {
      font-weight: 700;
      color: #0f172a;
      font-size: 8.5pt;
      margin-bottom: 4px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 3px;
    }
    .callout {
      background: #f0fdf4;
      border-left: 3px solid #16a34a;
      padding: 6px 10px;
      margin: 8px 0;
      border-radius: 0 6px 6px 0;
      font-size: 8pt;
      page-break-inside: avoid;
    }
    .callout-info {
      background: #eff6ff;
      border-left: 3px solid #2563eb;
    }
    .callout-title {
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 2px;
    }

    code {
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 7.5pt;
      background: #f1f5f9;
      padding: 1px 3px;
      border-radius: 3px;
      color: #0369a1;
      border: 1px solid #e2e8f0;
    }
    pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 8px 10px;
      border-radius: 6px;
      font-size: 7pt;
      font-family: 'Consolas', monospace;
      overflow-x: hidden;
      white-space: pre-wrap;
      word-break: break-all;
      margin: 6px 0 10px 0;
      page-break-inside: avoid;
    }
    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>

  <!-- ==================== COVER PAGE ==================== -->
  <div class="cover-page">
    <div class="cover-top">
      <div class="org-badge">RVCC Enterprise Engineering</div>
      <h1 class="cover-title">Master Technical Architecture Specification</h1>
      <p class="cover-subtitle">Complete End-to-End Architectural Reference & Implementation Guide for the RVCC Digital Procurement, Real-Time Bidding, and Enterprise Resource Planning Ecosystem.</p>
      
      <div class="cover-metrics">
        <div class="metric-card">
          <div class="metric-val">5 Apps</div>
          <div class="metric-lbl">Turborepo Packages</div>
        </div>
        <div class="metric-card">
          <div class="metric-val">65,453</div>
          <div class="metric-lbl">Lines of TypeScript</div>
        </div>
        <div class="metric-card">
          <div class="metric-val">31 Models</div>
          <div class="metric-lbl">Prisma Relational DB</div>
        </div>
        <div class="metric-card">
          <div class="metric-val">100% Pass</div>
          <div class="metric-lbl">Vitest & CI Tests</div>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <div><strong>System Version:</strong> 2.0.0 (Production Release)</div>
      <div><strong>Stack:</strong> Next.js 16 • Turbopack • Cloudflare Edge • Prisma ORM</div>
      <div><strong>Published:</strong> August 2026</div>
    </div>
  </div>

  <!-- ==================== SECTION 1: MONOREPO & CORE ==================== -->
  <div class="section-header">
    <h2>1. Monorepo & Shared Architecture</h2>
    <span class="section-badge">Core Foundation</span>
  </div>

  <p>The <strong>RVCC Digital Ecosystem</strong> is structured as an enterprise-grade Turborepo monorepo powered by PNPM workspaces. It isolates concerns across 5 full-stack applications and 3 shared internal packages while maximizing code reuse and type safety.</p>

  <pre>
RVCC-MONOREPO/
├── apps/
│   ├── web/           # Port 3000 - Public Corporate & Vendor Onboarding Portal (Next.js 16)
│   ├── admin/         # Port 3001 - Enterprise Super-Admin & Sourcing Governance ERP (Next.js 16)
│   ├── vendor/        # Port 3002 - Vendor Portal & Real-Time Blind Bidding Cockpit (Next.js 16)
│   ├── procurement/   # Port 3003 - Internal Department Requisition & Approval Engine (Next.js 16)
│   └── api/           # Port 8787 - Edge Backend API, SSE Streaming Engine & Prisma ORM
└── packages/
    ├── schemas/       # @rvcc/schemas - Shared Zod validation contracts (Single Source of Truth)
    ├── types/         # @rvcc/types - Centralized TypeScript interfaces & DB entity shapes
    └── utils/         # @rvcc/utils - Common currency math, string sanitizers & formatters
  </pre>

  <h3>Shared Packages Matrix</h3>
  <table>
    <thead>
      <tr>
        <th>Package</th>
        <th>Exports & Key Modules</th>
        <th>Role & Architecture Benefit</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>@rvcc/schemas</code></td>
        <td><code>auth.ts</code>, <code>procurement.ts</code>, <code>sourcing.ts</code>, <code>vendor-onboarding.ts</code>, <code>rbac.ts</code>, <code>audit.ts</code>, <code>enums.ts</code></td>
        <td>Runtime schema validation using Zod. Guaranteed boundary validation on all API requests and frontend form submissions.</td>
      </tr>
      <tr>
        <td><code>@rvcc/types</code></td>
        <td>Database entity types, API response generics (<code>ApiResponse&lt;T&gt;</code>), Live Bidding contracts, Currency models.</td>
        <td>Compile-time type safety preventing contract drift between backend edge workers and frontend clients.</td>
      </tr>
      <tr>
        <td><code>@rvcc/utils</code></td>
        <td><code>formatters.ts</code>, <code>currency.ts</code>, <code>sanitize.ts</code>, <code>rank.ts</code>, <code>cn.ts</code></td>
        <td>High-performance utility functions for SAR multi-currency conversions, L1 ranking algorithms, and styling.</td>
      </tr>
    </tbody>
  </table>

  <div class="grid-2">
    <div class="card">
      <div class="card-title">CI/CD & DevOps Automation</div>
      <ul>
        <li><strong>GitHub Actions CI:</strong> Automated test, lint, and build validation on every pull request.</li>
        <li><strong>Multi-Cloud Deploy:</strong> Cloudflare Workers for <code>apps/api</code> and Vercel for Next.js applications.</li>
        <li><strong>Turborepo Cache:</strong> Remote caching with dependency graph hashing.</li>
      </ul>
    </div>
    <div class="card">
      <div class="card-title">Code Standards & Tooling</div>
      <ul>
        <li><strong>ESLint 9 Flat Config:</strong> Automated unused import removal and simple-import-sort ordering.</li>
        <li><strong>Prettier + Tailwind Plugin:</strong> Deterministic formatting and automatic class sorting.</li>
        <li><strong>Vitest Test Suites:</strong> 10/10 automated tests running across all apps.</li>
      </ul>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 2: WEB APPLICATION ==================== -->
  <div class="section-header">
    <h2>2. Public Corporate & Vendor Onboarding Application</h2>
    <span class="section-badge">apps/web (Port 3000)</span>
  </div>

  <p><code>apps/web</code> serves as RVCC's corporate platform, interactive civil/MEP project showcase, and prospective supplier qualification portal. Built with Next.js 16 (App Router) and WebGL graphics.</p>

  <h3>Key Features & Routing Architecture</h3>
  <table>
    <thead>
      <tr>
        <th>Route Path</th>
        <th>Rendering Strategy</th>
        <th>Technical Functionality</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>/</code> (Home)</td>
        <td>Static Prerender (SSG)</td>
        <td>Hero with 3D Skyscraper WebGL canvas, Divisions showcase, Projects marquee, CSR initiatives.</td>
      </tr>
      <tr>
        <td><code>/about</code></td>
        <td>Static Prerender (SSG)</td>
        <td>Corporate journey timeline, Mission/Vision/Values, Leadership, ISO certifications grid.</td>
      </tr>
      <tr>
        <td><code>/services/[slug]</code></td>
        <td>Incremental Static (ISR)</td>
        <td>Dynamic service pages (Artificial Grass, MEP, Civil, Landscaping) with pre-generated static params.</td>
      </tr>
      <tr>
        <td><code>/projects/[slug]</code></td>
        <td>Dynamic Server / SSR</td>
        <td>High-resolution architectural photography, client metadata, engineering specifications.</td>
      </tr>
      <tr>
        <td><code>/documents</code></td>
        <td>Static + Dynamic Gate</td>
        <td>Document showcase with secure PDF Flipbook Reader (<code>FlipbookReader.tsx</code>) and password unlock.</td>
      </tr>
      <tr>
        <td><code>/careers</code></td>
        <td>Dynamic SSR + SWR</td>
        <td>Live job vacancies board with resume submission and automated multipart upload API.</td>
      </tr>
      <tr>
        <td><code>/enquire/[step]</code></td>
        <td>Client Wizard Train</td>
        <td>10-step supplier qualification train with draft recovery, document upload, and email OTP verification.</td>
      </tr>
    </tbody>
  </table>

  <h3>10-Step Supplier Qualification Train Matrix</h3>
  <table>
    <thead>
      <tr>
        <th>Step</th>
        <th>Domain Area</th>
        <th>Form Data & Business Validation</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1 - 2</td>
        <td><strong>Company & Addresses</strong></td>
        <td>Trade Name, Commercial Registration (CR), VAT Number, Establishment Year, HQ and Branch GPS coordinates.</td>
      </tr>
      <tr>
        <td>3 - 4</td>
        <td><strong>Classifications & Bank</strong></td>
        <td>Primary/Secondary industry classifications, Beneficiary Name, Bank Name, IBAN, SWIFT code, Currency.</td>
      </tr>
      <tr>
        <td>5 - 6</td>
        <td><strong>Contacts & Questionnaire</strong></td>
        <td>Executive contacts, Procurement representatives, ISO compliance disclosures, safety track record.</td>
      </tr>
      <tr>
        <td>7 - 8</td>
        <td><strong>Attachments & Review</strong></td>
        <td>CR Certificate, VAT Proof, Chamber of Commerce membership PDF, consolidated preview terminal.</td>
      </tr>
      <tr>
        <td>9 - 10</td>
      <td><strong>OTP & Finalize</strong></td>
        <td>Cryptographic 6-digit email OTP verification, tracking reference generation (<code>REG-XXXXXX</code>).</td>
      </tr>
    </tbody>
  </table>

  <div class="callout callout-info">
    <div class="callout-title">Interactive 3D WebGL & Physics Cards</div>
    <code>SkyscraperCanvas.tsx</code> utilizes Three.js with custom lighting and camera mouse-parallax tracking. <code>Interactive3DCard.tsx</code> implements hardware-accelerated CSS 3D perspective transforms.
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 3: ADMIN ERP ==================== -->
  <div class="section-header">
    <h2>3. Admin ERP & Sourcing Governance Portal</h2>
    <span class="section-badge">apps/admin (Port 3001)</span>
  </div>

  <p><code>apps/admin</code> is the centralized ERP and governance platform for procurement executives, sourcing officers, and auditors. It provides strict Role-Based Access Control, tender creation, live auction monitoring, and supplier verification.</p>

  <h3>Role-Based Access Control (RBAC) Hierarchy</h3>
  <table>
    <thead>
      <tr>
        <th>Role Name</th>
        <th>Granular Permissions Assigned</th>
        <th>Administrative Scope</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>SUPER_ADMIN</strong></td>
        <td>All 12 Permissions (<code>MANAGE_STAFF</code>, <code>MANAGE_REQUIREMENTS</code>, <code>AWARD_REQUIREMENTS</code>, etc.)</td>
        <td>Full governance, security policies, system configuration, user provisioning, and audit log inspection.</td>
      </tr>
      <tr>
        <td><strong>PROCUREMENT_MANAGER</strong></td>
        <td><code>VIEW_PROCUREMENT</code>, <code>MANAGE_PROCUREMENT</code>, <code>VIEW_REQUIREMENTS</code>, <code>AWARD_REQUIREMENTS</code></td>
        <td>Requisition approvals, tender publishing, quote evaluation, and contract awarding.</td>
      </tr>
      <tr>
        <td><strong>SOURCING_OFFICER</strong></td>
        <td><code>VIEW_REQUIREMENTS</code>, <code>MANAGE_REQUIREMENTS</code>, <code>VIEW_VENDORS</code>, <code>MANAGE_VENDORS</code></td>
        <td>BOQ creation, vendor invite matching, live bidding monitoring, and registration document review.</td>
      </tr>
      <tr>
        <td><strong>AUDITOR / COMPLIANCE</strong></td>
        <td><code>VIEW_REQUIREMENTS</code>, <code>VIEW_VENDORS</code>, <code>VIEW_AUDIT_LOGS</code>, <code>VIEW_FINANCIALS</code></td>
        <td>Read-only inspection across all bidding histories, financial quotes, and system mutation logs.</td>
      </tr>
      <tr>
        <td><strong>CONTENT_MANAGER</strong></td>
        <td><code>VIEW_CONTENT</code>, <code>MANAGE_CONTENT</code></td>
        <td>CMS management for corporate website services, projects, careers, and media gallery.</td>
      </tr>
    </tbody>
  </table>

  <h3>Sourcing & RFQ Lifecycle</h3>
  <pre>
[ Requisition Approved ] ──► [ Create Itemized RFQ ] ──► [ Publish Tender (Sealed/Live) ]
                                                                   │
                                                                   ▼
[ Award Contract & PO ]  ◄── [ Commercial Evaluation / L1 ] ◄─── [ Receive Vendor Quotes ]
  </pre>

  <div class="grid-2">
    <div class="card">
      <div class="card-title">Live Market Monitoring Cockpit</div>
      <ul>
        <li><strong>Real-Time SSE Feed:</strong> Sub-second updates as vendors submit price revisions.</li>
        <li><strong>L1 Ranking Engine:</strong> Instant recalculation of lowest bids normalized to SAR.</li>
        <li><strong>Anonymized View:</strong> Toggle between blind view (for bias-free evaluation) and unmasked view.</li>
      </ul>
    </div>
    <div class="card">
      <div class="card-title">Supplier Document Verification</div>
      <ul>
        <li><strong>Split-Screen Inspector:</strong> Review CR licenses, tax filings, and bank documents.</li>
        <li><strong>Status Transitions:</strong> Approve, request amendments, reject, or suspend accounts.</li>
        <li><strong>Auto-Provisioning:</strong> Instantly provisions vendor accounts on approval.</li>
      </ul>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 4: VENDOR PORTAL ==================== -->
  <div class="section-header">
    <h2>4. Vendor Portal & Blind-Bidding Cockpit</h2>
    <span class="section-badge">apps/vendor (Port 3002)</span>
  </div>

  <p><code>apps/vendor</code> provides registered suppliers with an external workspace to discover tender invitations, enter live blind auctions, submit multi-currency commercial bids, and manage compliance records.</p>

  <h3>Blind-Bidding Mechanics & Anonymization</h3>
  <p>To eliminate market collusion and guarantee fair competition, the Live Bidding Cockpit (<code>/requirements/[id]</code>) implements cryptographic participant anonymization:</p>

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
│  [ Enter Unit Price ]  [ Match L1 Target (42,500 SAR) ]  [ SUBMIT BID ] │
└────────────────────────────────────────────────────────────────────────┘
  </pre>

  <h3>Multi-Currency Normalization Engine (SAR Baseline)</h3>
  <table>
    <thead>
      <tr>
        <th>Currency</th>
        <th>Sync Mechanism</th>
        <th>Conversion Formula</th>
        <th>Display & Ranking</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>SAR</strong> (Base)</td>
        <td>1.0000 Baseline</td>
        <td><code>amountSar = amount</code></td>
        <td>Official currency for all L1 ranking comparisons.</td>
      </tr>
      <tr>
        <td><strong>USD</strong></td>
        <td>Daily 24h Cron Sync</td>
        <td><code>amountSar = amount * rateUsd</code></td>
        <td>Displays vendor quote in USD with live normalized SAR equivalence.</td>
      </tr>
      <tr>
        <td><strong>EUR / GBP</strong></td>
        <td>Daily 24h Cron Sync</td>
        <td><code>amountSar = amount * rateEur</code></td>
        <td>Real-time automatic conversion preventing currency volatility bias.</td>
      </tr>
      <tr>
        <td><strong>AED / QAR</strong></td>
        <td>Daily 24h Cron Sync</td>
        <td><code>amountSar = amount * rateGcc</code></td>
        <td>Supports regional GCC currency quoting natively.</td>
      </tr>
    </tbody>
  </table>

  <div class="callout callout-info">
    <div class="callout-title">Resilient Streaming (use-vendor-live-bidding.ts)</div>
    Connects via Server-Sent Events (SSE) for zero-latency bid updates. If network degradation occurs, it automatically falls back to a 5-second polling loop and seamlessly recovers the SSE connection when connectivity stabilizes.
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 5: PROCUREMENT APP ==================== -->
  <div class="section-header">
    <h2>5. Internal Procurement & Requisition App</h2>
    <span class="section-badge">apps/procurement (Port 3003)</span>
  </div>

  <p><code>apps/procurement</code> is the dedicated internal purchase requisition platform designed for department managers, site engineers, and project controllers to initiate and track material/service requests.</p>

  <h3>Purchase Requisition Lifecycle</h3>
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

  <h3>Requisition Data Model & Attributes</h3>
  <table>
    <thead>
      <tr>
        <th>Attribute</th>
        <th>Data Type</th>
        <th>Description & Business Logic</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>requisitionNumber</code></td>
        <td>String (Unique)</td>
        <td>Sequential reference code (e.g. <code>PR-2026-0042</code>).</td>
      </tr>
      <tr>
        <td><code>department</code></td>
        <td>Enum (Department)</td>
        <td>Civil, MEP, Landscaping, Infrastructure, Architecture, Logistics.</td>
      </tr>
      <tr>
        <td><code>priorityLevel</code></td>
        <td>Enum (Priority)</td>
        <td><code>LOW</code>, <code>STANDARD</code>, <code>URGENT</code>, <code>EMERGENCY</code> (controls approval SLA).</td>
      </tr>
      <tr>
        <td><code>estimatedBudget</code></td>
        <td>Decimal (SAR)</td>
        <td>Estimated spend checked against departmental budget allocations.</td>
      </tr>
      <tr>
        <td><code>items</code></td>
        <td>Array&lt;BOQItem&gt;</td>
        <td>Item name, technical specifications, quantity, unit of measure, estimated rate.</td>
      </tr>
      <tr>
        <td><code>attachments</code></td>
        <td>Array&lt;File&gt;</td>
        <td>BOQ spreadsheets, technical datasheets, site engineering drawings.</td>
      </tr>
    </tbody>
  </table>

  <div class="grid-2">
    <div class="card">
      <div class="card-title">Mobile & On-Site Engineering UX</div>
      <ul>
        <li><strong>PWA Offline Support:</strong> Create requisition drafts on construction sites without active internet.</li>
        <li><strong>Quick-Action Modal:</strong> Rapid 3-click requisition submission with voice-to-text note capture.</li>
        <li><strong>Status KPI Badges:</strong> Real-time colorized visual cues (<code>DRAFT</code>, <code>APPROVED</code>, <code>SOURCING</code>, <code>ORDERED</code>).</li>
      </ul>
    </div>
    <div class="card">
      <div class="card-title">Approval Matrix & Budget Control</div>
      <ul>
        <li><strong>Threshold Routing:</strong> Requisitions over defined SAR thresholds require Finance Director sign-off.</li>
        <li><strong>Rejection Feedback:</strong> Comprehensive justification notes returned to the requesting engineer.</li>
        <li><strong>Audit Logging:</strong> All approval and rejection timestamps immutably recorded.</li>
      </ul>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 6: API & DATABASE ==================== -->
  <div class="section-header">
    <h2>6. Edge API & Database Architecture</h2>
    <span class="section-badge">apps/api & PostgreSQL</span>
  </div>

  <p><code>apps/api</code> is the high-throughput Edge Backend API. Powered by Cloudflare Workers / Node.js Edge Runtime and Prisma ORM v5.22 with the <code>@prisma/adapter-pg</code> connection driver, it handles sub-millisecond query execution, real-time SSE streaming, and secure authentication.</p>

  <h3>Complete 31-Model Relational Database Architecture</h3>
  <table>
    <thead>
      <tr>
        <th>Domain Group</th>
        <th>Prisma Entity Models</th>
        <th>Architectural Function</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>1. Staff & RBAC</strong></td>
        <td><code>AdminUser</code>, <code>Role</code>, <code>Permission</code>, <code>RolePermission</code>, <code>AdminSession</code>, <code>AdminOtp</code>, <code>AdminLoginHistory</code></td>
        <td>Granular role-permission mappings, secure session tokens, password reset OTP challenges, and chronological login history.</td>
      </tr>
      <tr>
        <td><strong>2. Vendor & Auth</strong></td>
        <td><code>VendorUser</code>, <code>VendorSession</code>, <code>VendorOtp</code>, <code>VendorLoginHistory</code>, <code>SupplierRegistration</code></td>
        <td>Vendor authentication, passwordless OTP verification, session lifecycle, and registration dossiers.</td>
      </tr>
      <tr>
        <td><strong>3. Supplier Dossier</strong></td>
        <td><code>CompanyProfile</code>, <code>SupplierContact</code>, <code>SupplierAddress</code>, <code>BusinessClassification</code>, <code>BankAccount</code>, <code>QuestionnaireAnswer</code>, <code>RegistrationAttachment</code></td>
        <td>Complete 7-part supplier qualification records including legal, banking, contact, and compliance documents.</td>
      </tr>
      <tr>
        <td><strong>4. Sourcing & Bidding</strong></td>
        <td><code>Requirement</code>, <code>RequirementInvite</code>, <code>Quote</code>, <code>ExchangeRate</code>, <code>Industry</code></td>
        <td>Tender requirements, itemized BOQ, targeted supplier invites, multi-currency quotes, and daily FX rates.</td>
      </tr>
      <tr>
        <td><strong>5. Procurement PR</strong></td>
        <td><code>PurchaseRequest</code>, <code>PurchaseRequestItem</code>, <code>PurchaseRequestAttachment</code></td>
        <td>Purchase requisitions, line item breakdowns, approval history, and direct links to sourcing tenders.</td>
      </tr>
      <tr>
        <td><strong>6. Audit & Content</strong></td>
        <td><code>Notification</code>, <code>AuditLog</code>, <code>JobPosting</code>, <code>JobApplication</code></td>
        <td>Real-time user notifications, immutable audit log ledger with JSON state diffs, careers CMS and candidate applications.</td>
      </tr>
    </tbody>
  </table>

  <h3>Prisma Soft-Delete Extension</h3>
  <pre>
// apps/api/src/db.ts - Soft-Delete Safeguard
export const prisma = new PrismaClient().$extends({
  query: {
    $allModels: {
      async delete({ model, args }) {
        return (prisma[model] as any).update({ ...args, data: { deletedAt: new Date() } });
      },
      async findMany({ model, args }) {
        args.where = { deletedAt: null, ...args.where };
        return (prisma[model] as any).findMany(args);
      }
    }
  }
});
  </pre>

  <h3>Real-Time SSE Streaming Bus & Security Governance</h3>
  <ul>
    <li><strong>Server-Sent Events (SSE):</strong> Sub-second broadcasting of revised bids with automated delta rankings. Dual payloads prevent competitor identity leaks to vendor clients while giving administrators full visibility.</li>
    <li><strong>Automated Daily FX Sync:</strong> Background cron service queries official exchange rates for USD, EUR, GBP, AED, QAR against SAR and caches them in memory.</li>
    <li><strong>Zero-Trust Session Security:</strong> HttpOnly, Secure, SameSite=Lax JWT cookies preventing XSS token exfiltration. Timing-safe OTP hash comparisons prevent timing attack exploits.</li>
    <li><strong>Immutable Audit Logging:</strong> Every state change across tenders, quotes, approvals, and user accounts is logged with before/after JSON diffs, user ID, IP address, and microsecond timestamps.</li>
  </ul>

</body>
</html>`;

console.log("[Docs Builder] Generating Unified Master Technical Documentation PDF...");
fs.writeFileSync(tempHtmlPath, unifiedHtml, "utf8");

const success = convertHtmlToPdf(tempHtmlPath, masterPdfPath);
if (success) {
  console.log(`[Docs Builder] Successfully created Master PDF: ${masterPdfPath}`);
  fs.unlinkSync(tempHtmlPath);
} else {
  console.error("[Docs Builder] Failed to generate Master PDF.");
}

// Clean up separate technical_specifications folder if it exists
const specDir = path.resolve("docs/technical_specifications");
if (fs.existsSync(specDir)) {
  fs.rmSync(specDir, { recursive: true, force: true });
  console.log("[Docs Builder] Removed separate individual specification files.");
}

console.log("[Docs Builder] Done! Master PDF is ready at docs/RVCC_MASTER_TECHNICAL_DOCUMENTATION.pdf");
