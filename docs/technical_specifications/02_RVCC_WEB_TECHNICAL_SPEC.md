# Public Web & Vendor Onboarding Specification

**apps/web: 3D WebGL Canvas, 10-Step Supplier Qualification Train & Marketing Portal**

*RVCC Enterprise Monorepo Architecture • Version 2.0.0 (Production)*

---

## 1. Application Overview & Objectives

`apps/web` is the primary public-facing corporate website, marketing portal, and vendor self-service onboarding hub for RVCC. It delivers high-impact visual presentation through 3D architectural rendering while providing high-performance interactive tools for clients, job applicants, and prospective suppliers.

  
    
#### Target Audience & Portals

    
      - **Corporate Clients:** Explore civil engineering, electromechanical, landscaping, and infrastructure project portfolios.
      - **Prospective Vendors:** Multi-step audited supplier registration train.
      - **Job Applicants:** Interactive careers listing and resume submission portal.
      - **Stakeholders:** Interactive PDF flipbook for company profiles and quality policy.
    
  
  
    
#### Core Technology Stack

    
      - **Framework:** Next.js 16 (App Router + Turbopack).
      - **Rendering Engine:** Three.js / WebGL with custom GLSL shaders.
      - **Styling & Animations:** Tailwind CSS, Lenis Smooth Scroll, Framer Motion.
      - **State Management:** React Context + LocalStorage Draft Persistence.
    
  

## 2. Route Tree & Page Topology

  
    
      Route Path
      Rendering Mode
      Key Components & Functionality
    
  
  
    
      `/` (Home)
      Static Prerender (SSG)
      Hero, Skyscraper 3D Canvas, About Overview, Our Works Marquee, Services Carousel, Major Projects showcase, CSR Initiatives.
    
    
      `/about`
      Static Prerender (SSG)
      Company history timeline, Mission/Vision/Values, Executive Leadership cards, ISO Certifications grid, Safety & Sustainability metrics.
    
    
      `/services/[slug]`
      Incremental Static (ISG)
      Dynamic service showcase (Artificial Grass, Architectural Services, Artificial Lakes, etc.) with pre-generated static params.
    
    
      `/projects/[slug]`
      Dynamic Server / SSR
      Interactive project inspection, high-resolution photo galleries, technical specifications, client metadata, and location tags.
    
    
      `/documents`
      Static + Dynamic
      Document showcase with secure PDF Flipbook Reader (`FlipbookReader.tsx`) and authenticated unlocking gateway.
    
    
      `/careers`
      Dynamic SSR + SWR
      Live job opening board with category filtering, detailed job descriptions, and multi-part resume application upload endpoint.
    
    
      `/enquire/[step]`
      Dynamic Client Train
      10-step wizard for supplier pre-qualification, auto-save state recovery, file attachment processing, and OTP email verification.
    
  

---

## 3. 3D Architectural WebGL & Interactive Graphics

The web application features high-performance WebGL graphics powered by Three.js:

  - `SkyscraperCanvas.tsx`: Real-time 3D rendered skyscraper model with interactive camera orbit controls and dynamic lighting that reacts to user mouse movement.
  - `Interactive3DCard.tsx`: CSS 3D perspective transform cards providing tactile depth, specular highlights, and smooth physics-based tilting.
  - `LogoMarquee.tsx` & `3d-marquee.tsx`: Infinite hardware-accelerated logo ticker with zero layout shifts and seamless looping.
  - `LenisProvider.tsx`: Virtual smooth inertia scrolling delivering a unified luxury aesthetic across desktop and mobile devices.

## 4. Multi-Step Supplier Onboarding Engine (10-Step Wizard)

The vendor onboarding workflow (`/enquire`) is structured as a fault-tolerant, state-preserving wizard that allows suppliers to complete qualification in stages.

  
    
      Step #
      Step Name
      Form Schema & Collected Attributes
    
  
  
    
      1
      **Company Profile**
      Legal Trade Name, Commercial Registration (CR) Number, VAT Identification Number, Establishment Date, Website URL.
    
    
      2
      **Physical Addresses**
      Headquarters Location, Branch Offices, City, Postal Code, Building Number, GPS Coordinates.
    
    
      3
      **Classifications**
      Primary & Secondary Business Sectors, General Contracting, Specialized MEP, Landscaping, Material Supply categories.
    
    
      4
      **Bank Account**
      Beneficiary Name, Bank Name, IBAN Number, SWIFT / BIC Code, Account Currency (SAR/USD).
    
    
      5
      **Key Contacts**
      Authorized Executive Representative, Procurement Officer, Finance Contact (Full Name, Designation, Official Email, Phone).
    
    
      6
      **Questionnaire**
      Compliance disclosures, Quality certifications (ISO 9001/14001/45001), Safety Track Record, Annual Turnover.
    
    
      7
      **Attachments**
      CR Certificate PDF, VAT Registration PDF, Chamber of Commerce Certificate, Company Profile deck, Bank Proof letter.
    
    
      8
      **Review Summary**
      Consolidated preview of all 7 sections with inline edit triggers and validation status flags.
    
    
      9
      **Email OTP Verification**
      Cryptographic 6-digit one-time passcode verification to prove ownership of the authorized corporate email domain.
    
    
      10
      **Submission & Confirmation**
      Generates a unique Tracking Reference Number (`REG-XXXXXX`), triggers backend notification, and displays tracking badge.
    
  

  State Persistence & Draft Recovery
  `EnquireContext.tsx` automatically serializes the form state to encrypted LocalStorage and syncs draft checkpoints to `/api/enquire/draft`. If a supplier accidentally closes their browser, their progress is instantly restored upon re-opening the page.
