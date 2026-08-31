# Admin ERP & Sourcing Governance Specification

**apps/admin: Super-Admin ERP, Granular RBAC, RFQ Sourcing, and Live Bidding Monitor**

*RVCC Enterprise Monorepo Architecture • Version 2.0.0 (Production)*

---

## 1. Application Overview & Purpose

`apps/admin` is the core Enterprise Resource Planning (ERP), Sourcing Governance, and Multi-Tenant Administration application. It empowers procurement executives, sourcing officers, and auditors to manage the entire sourcing lifecycle, evaluate quotes, monitor live blind bidding, review supplier compliance, and manage staff access control.

  
    
#### Governance Modules

    
      - **Sourcing & RFQ Management:** Create, publish, invite, evaluate, and award requirements.
      - **Supplier Verification:** Review, approve, reject, or suspend vendor registrations.
      - **Live Bidding Cockpit:** Real-time monitoring of active auctions and price updates.
      - **Staff Management & RBAC:** Granular role and permission administration.
    
  
  
    
#### Technical Architecture

    
      - **Framework:** Next.js 16 (App Router) + Zustand.
      - **Security:** HttpOnly Session Cookies + CSRF Protection + Granular RBAC.
      - **Real-Time:** SSE streaming proxy with automatic reconnection.
      - **PWA:** Installable PWA with offline caching for enterprise tablets.
    
  

## 2. Role-Based Access Control (RBAC) Architecture

The Admin application implements enterprise RBAC with 12 discrete permission flags stored in the database and validated on every API route and UI navigation gate.

  
    
      Role Name
      Standard Permissions
      Operational Scope
    
  
  
    
      **SUPER_ADMIN**
      All 12 Permissions (`MANAGE_STAFF`, `MANAGE_REQUIREMENTS`, `AWARD_REQUIREMENTS`, etc.)
      Full unrestricted system governance, system configuration, audit review, and user provisioning.
    
    
      **PROCUREMENT_MANAGER**
      `VIEW_PROCUREMENT`, `MANAGE_PROCUREMENT`, `VIEW_REQUIREMENTS`, `MANAGE_REQUIREMENTS`, `AWARD_REQUIREMENTS`
      Approve purchase requisitions, initiate sourcing tenders, evaluate commercial quotes, and award vendor contracts.
    
    
      **SOURCING_OFFICER**
      `VIEW_REQUIREMENTS`, `MANAGE_REQUIREMENTS`, `VIEW_VENDORS`, `MANAGE_VENDORS`
      Publish RFQs, invite qualified suppliers, monitor live bidding cockpits, and review supplier compliance documents.
    
    
      **AUDITOR / COMPLIANCE**
      `VIEW_REQUIREMENTS`, `VIEW_VENDORS`, `VIEW_AUDIT_LOGS`, `VIEW_FINANCIALS`
      Read-only access across all sourcing history, audit logs, price revision histories, and vendor records.
    
    
      **CONTENT_MANAGER**
      `VIEW_CONTENT`, `MANAGE_CONTENT`
      Edit public website content, publish news, update gallery collections, and manage job vacancies.
    
  

---

## 3. Sourcing & RFQ Evaluation Workflow

```

[ Requisition Created ] ──► [ Manager Approval ] ──► [ RFQ Draft Created ]
                                                             │
                                                             ▼
[ Award Contract ] ◄── [ Quote Evaluation / L1 ] ◄── [ Published to Bidding ]

```

  - **Itemized BOQ Builder:** Sourcing officers create requirements with detailed line items, unit measures, estimated baseline budgets, delivery timelines, and technical specification attachments.
  - **Targeted Vendor Invites:** Select specific pre-qualified vendors or publish to the open vendor pool based on industry classification codes.
  - **Bid Status Governance:** Supports Sealed Bidding (bids locked until closing date) and Live Blind Bidding (real-time price updates).
  - **Contract Awarding Engine:** One-click awarding of selected L1 or technical preference quotes with automated email notifications and rejection notifications sent to non-awarded bidders.

## 4. Real-Time Admin Live Bidding Monitor

The Admin Live Market Cockpit (`/live-market/[id]`) establishes a Server-Sent Events (SSE) streaming proxy directly to the Edge API:

  - **Live Price Feed:** Sub-second updates as vendors submit price revisions.
  - **L1 Dense Ranking:** Real-time recalculation of rank positions based on SAR normalized values.
  - **Activity Telemetry:** Tracks bid timestamps, revision deltas (percentage drops), and vendor interaction logs.
  - **Anonymized vs Unmasked Views:** Sourcing managers can toggle between anonymized blind views (for impartial governance) and unmasked vendor views.

## 5. Supplier Document Review & Onboarding Terminal

The Vendor Management panel (`/registrations/[id]`) provides an interactive split-screen document verification terminal:

  - **CR & Tax Verification:** Inspect uploaded commercial licenses, tax certificates, and bank confirmation letters in an integrated PDF viewer.
  - **Approval Workflow:** Approve, request additional documents, reject with justification comments, or suspend accounts.
  - **Automated Credentials:** On approval, the system provisions an active Vendor account and dispatches an onboarding welcome email with login credentials.
