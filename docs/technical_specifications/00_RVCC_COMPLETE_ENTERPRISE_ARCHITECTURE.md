# Master Enterprise Architecture Specification

**Complete Technical Overview of the RVCC Digital Procurement & ERP Ecosystem**

*RVCC Enterprise Monorepo Architecture • Version 2.0.0 (Production)*

---

## 1. Master System Architecture & Enterprise Topology

The **RVCC Enterprise Digital Ecosystem** represents a state-of-the-art multi-tier procurement and digital transformation platform. Built from the ground up to replace fragmented legacy workflows, it unifies corporate marketing, supplier qualification, real-time blind bidding auctions, internal purchase requisitions, and administrative oversight into a cohesive, high-performance monorepo architecture.

  
    
#### Architectural Highlights

    
      - **5 Specialized Applications:** Web, Admin, Vendor, Procurement, and Edge API.
      - **3 Shared Internal Packages:** Centralized Zod schemas, TypeScript types, and utilities.
      - **Prisma ORM & PostgreSQL:** 31 relational models with soft-delete safeguards.
      - **Edge-Ready Infrastructure:** Cloudflare Workers + Vercel multi-cloud deployment.
    
  
  
    
#### Production Quality Metrics

    
      - **Lines of Code:** 65,453 lines of clean, strictly typed TypeScript.
      - **Codebase Files:** 580 production files across 8 monorepo packages.
      - **Testing & CI:** 10/10 automated Vitest suites passing in CI pipelines.
      - **Code Formatting:** 100% Prettier + Tailwind class sorting compliance.
    
  

## 2. End-to-End Enterprise Data Flow

```

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

```

---

## 3. Summary Index of Technical Specifications

  
    
      Document Code
      Specification Title
      Target Application / Scope
    
  
  
    
      **SPEC-01**
      Monorepo & Shared Architecture Specification
      Turborepo, PNPM Workspaces, Shared Packages, CI/CD, Tooling & PWA.
    
    
      **SPEC-02**
      Public Web & Vendor Onboarding Specification
      `apps/web`: 3D WebGL, 10-Step Supplier Wizard, Careers, Flipbook.
    
    
      **SPEC-03**
      Admin ERP & Sourcing Governance Specification
      `apps/admin`: RBAC, RFQ Sourcing, Live Monitor, Supplier Review, CMS.
    
    
      **SPEC-04**
      Vendor Portal & Blind-Bidding Specification
      `apps/vendor`: Blind Bidding Cockpit, SSE Stream, Multi-Currency FX.
    
    
      **SPEC-05**
      Procurement & Purchase Requisition Specification
      `apps/procurement`: Department Requisitions, Budget Approval Matrix.
    
    
      **SPEC-06**
      API & Database Architecture Specification
      `apps/api`: 31 Prisma Models, PostgreSQL, Edge Runtime, SSE Bus.
    
  

## 4. Security, Compliance & Governance Standards

  - **Zero-Trust Authentication:** Strict HttpOnly, Secure, SameSite=Lax JWT session cookies preventing XSS token theft.
  - **Cryptographic Password & OTP Security:** Timing-safe comparison and SHA-256 token hashing for all authentication and password-reset workflows.
  - **Data Integrity & Auditability:** Immutable `AuditLog` records capturing user identity, IP address, timestamp, action type, and before/after state diffs for all financial, sourcing, and administrative operations.
  - **Soft Deletion:** Logical deletion across all primary business entities preventing accidental or malicious data loss.
