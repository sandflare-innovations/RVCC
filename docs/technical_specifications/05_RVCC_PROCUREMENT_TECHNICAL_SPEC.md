# Procurement & Purchase Requisition Specification

**apps/procurement: Department Purchase Requests, Cost Center Tracking & Mobile PWA**

*RVCC Enterprise Monorepo Architecture • Version 2.0.0 (Production)*

---

## 1. Application Overview & Business Goals

`apps/procurement` is the internal purchase requisition and departmental spend management platform. It allows internal department managers (Site Engineers, Project Managers, Facility Directors) to initiate purchase requests, track item delivery status, and enforce budgetary approvals before tenders are published to the market.

  
    
#### Core Features

    
      - **Purchase Requisition Creation:** Multi-item BOQ entry with cost estimations.
      - **Approval Hierarchy:** Multi-level review based on expenditure thresholds.
      - **Sourcing Integration:** Direct conversion of approved PRs into Sourcing RFQs.
      - **Order Tracking:** End-to-end status visibility from request to site delivery.
    
  
  
    
#### Key Integrations

    
      - **Admin ERP Sourcing:** Seamless data pipeline to Sourcing Officers.
      - **Unified Auth:** Centralized staff credentials and session state.
      - **PWA Mobile App:** Optimized for on-site engineers using tablets/phones.
      - **Zustand Store:** Centralized client-side state management.
    
  

## 2. Purchase Requisition Lifecycle & Matrix

```

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

```

---

## 3. Data Models & Requisition Schema

  
    
      Entity Field
      Data Type
      Description & Validation Rules
    
  
  
    
      `requisitionNumber`
      String (Unique)
      Auto-generated sequential reference (e.g. `PR-2026-0042`).
    
    
      `department`
      Enum (Department)
      Civil, MEP, Landscaping, Infrastructure, Architecture, Logistics.
    
    
      `priorityLevel`
      Enum (Priority)
      `LOW`, `STANDARD`, `URGENT`, `EMERGENCY` (affects SLA).
    
    
      `estimatedBudget`
      Decimal (SAR)
      Estimated departmental allocation for expenditure verification.
    
    
      `items`
      Array<Item>
      Item Name, Description, Quantity, Unit (Nos, SqM, Metric Tons), Estimated Rate.
    
    
      `attachments`
      Array<File>
      BOQ Excel sheets, site architectural drawings, technical datasheets.
    
  

## 4. Responsive PWA & Mobile Site Engineer Experience

To support engineers on active construction sites, `apps/procurement` is optimized as an offline-capable Progressive Web App:

  - **Quick-Action Modal:** Rapid 3-click requisition submission with voice-to-text note capture.
  - **Touch-Optimized Grids:** Collapsible card views and status-colorized KPI badges (`DRAFT`, `PENDING`, `APPROVED`, `SOURCING`, `ORDERED`, `FULFILLED`).
  - **PWA Install Banner:** Prompts mobile and tablet users to install the application natively to their home screen with zero app store overhead.
