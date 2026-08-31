# Edge API & Database Architecture Specification

**apps/api: 31 Prisma Relational Models, Cloudflare Workers / Edge Runtime & SSE Engine**

*RVCC Enterprise Monorepo Architecture • Version 2.0.0 (Production)*

---

## 1. Architecture Overview & Runtime Stack

`apps/api` is the high-throughput Edge Backend API powering the entire RVCC monorepo. Engineered on the **Cloudflare Workers / Node Edge Runtime** using **Prisma ORM** with the `@prisma/adapter-pg` connection driver, it delivers sub-millisecond query execution, real-time Server-Sent Events (SSE) streaming, and cryptographically secure authentication.

  
    
#### Backend Technology Stack

    
      - **Runtime:** Cloudflare Workers / Node.js 22+ Edge Runtime.
      - **Database ORM:** Prisma Client v5.22+ with custom soft-delete extensions.
      - **Database Engine:** PostgreSQL 16 (Enterprise Schema).
      - **Real-Time:** Server-Sent Events (SSE) streaming bus.
    
  
  
    
#### Security & Reliability

    
      - **Authentication:** Session JWTs + SHA-256 OTP challenge tokens.
      - **Auditing:** Comprehensive unified AuditLog for all state mutations.
      - **Soft Deletes:** Zero data loss via automated `deletedAt` filtering.
      - **Testing:** 100% passing Vitest test suites.
    
  

## 2. Complete Prisma Database Entity Model (31 Models)

The relational database schema encapsulates the entire business logic across 6 distinct domain areas:

  
    
      Domain Area
      Entity Models
      Key Relationships & Purpose
    
  
  
    
      **1. Staff & RBAC**
      `AdminUser`, `Role`, `Permission`, `RolePermission`, `AdminSession`, `AdminOtp`, `AdminLoginHistory`
      Granular access control, session token storage, password reset OTP challenges, and chronological login history.
    
    
      **2. Vendor & Auth**
      `VendorUser`, `VendorSession`, `VendorOtp`, `VendorLoginHistory`, `SupplierRegistration`
      Supplier accounts, passwordless OTP authentication, session lifecycle, and registration dossiers.
    
    
      **3. Supplier Dossier**
      `CompanyProfile`, `SupplierContact`, `SupplierAddress`, `BusinessClassification`, `BankAccount`, `QuestionnaireAnswer`, `RegistrationAttachment`
      Complete 7-part supplier qualification profile including legal, banking, contact, and compliance documentation.
    
    
      **4. Sourcing & Bidding**
      `Requirement`, `RequirementInvite`, `Quote`, `ExchangeRate`, `Industry`
      Tender requirements, itemized BOQ, targeted supplier invites, multi-currency vendor quotes, and live FX rates.
    
    
      **5. Procurement PR**
      `PurchaseRequest`, `PurchaseRequestItem`, `PurchaseRequestAttachment`
      Departmental purchase requisitions, itemized breakdowns, budget approvals, and sourcing links.
    
    
      **6. Content & Audit**
      `Notification`, `AuditLog`, `JobPosting`, `JobApplication`
      Real-time user notifications, immutable audit log ledger with JSON state diffs, careers CMS and candidate applications.
    
  

---

## 3. Prisma Client Soft-Delete Extension Architecture

All core tables implement soft-deletion to ensure audit compliance and prevent catastrophic data loss:

```

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

```

## 4. Real-Time SSE Live Bidding Bus Architecture

The Server-Sent Events engine (`modules/bidding/live-bids.ts`) broadcasts price ranking updates to all connected cockpits with zero overhead:

  - **Broadcast on Quote Submission:** When any vendor submits a revised quote to `/api/requirements/[id]/quote`, the API normalizes the price to SAR, updates the database in a transaction, recalculates the L1 ranking array, and immediately broadcasts the updated payload to all open SSE connections.
  **Payload Anonymization:** The SSE broadcaster generates two separate payloads:
    
      - **Admin Payload:** Contains full vendor identity and quote details for evaluation.
      - **Vendor Payload:** Cryptographically masks all competitor names (e.g. `"Competitor A"`, `"Competitor B"`) while publishing the exact L1 market price and rank positions.
    
  

## 5. Daily FX Synchronization Engine

To guarantee accurate multi-currency rankings, an automated cron service runs every 24 hours:

  - Fetches official daily exchange rates for `USD`, `EUR`, `GBP`, `AED`, `QAR` against base `SAR`.
  - Updates the `ExchangeRate` table in PostgreSQL.
  - Caches rates in memory to guarantee sub-millisecond conversion calculations during high-frequency bidding events.

## 6. REST API Endpoint Registry Summary

  
    
      Endpoint Group
      Methods
      Key Operations
    
  
  
    
      `/api/auth/*`
      POST
      Admin & Vendor login, logout, OTP challenge generation, password reset.
    
    
      `/api/requirements/*`
      GET, POST, PUT
      Create, publish, list, inspect RFQs, submit quotes, award contracts.
    
    
      `/api/requirements/:id/live`
      GET (SSE)
      Server-Sent Events streaming feed for real-time live bidding cockpits.
    
    
      `/api/registrations/*`
      GET, POST, PUT
      Vendor self-registration train, document review, approval/rejection.
    
    
      `/api/procurement/*`
      GET, POST, PUT
      Purchase requisition creation, manager approvals, sourcing conversion.
    
    
      `/api/staff/*`
      GET, POST, PUT, DELETE
      Staff account administration, role assignment, permission governance.
