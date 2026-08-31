# Vendor Portal & Blind-Bidding Specification

**apps/vendor: Secure Blind-Bidding Cockpit, SSE Real-Time Stream, and Multi-Currency FX**

*RVCC Enterprise Monorepo Architecture • Version 2.0.0 (Production)*

---

## 1. Application Overview & Value Proposition

`apps/vendor` is the dedicated external portal for approved and registered suppliers. It provides a secure, streamlined workspace where vendors can discover open tenders, participate in live blind bidding, submit itemized commercial quotes, and track contract awards.

  
    
#### Key Capabilities

    
      - **Blind Bidding Cockpit:** Participate in competitive price auctions without revealing identity.
      - **Multi-Currency Support:** Submit quotes in USD, EUR, GBP, AED, QAR, or SAR with auto-conversion.
      - **Quote Lifecycle Management:** Manage draft, submitted, under-review, and awarded bids.
      - **Compliance Profile:** Update bank accounts, addresses, and renewal certificates.
    
  
  
    
#### Security & Integrity

    
      - **Blind Anonymity:** Cryptographic anonymization of competitor identities.
      - **Anti-Collusion:** Competitor names, company details, and bid histories are strictly masked.
      - **Authentication:** Session-based HttpOnly JWT cookies + OTP challenge fallbacks.
      - **Access Gating:** Pending suppliers are automatically routed to `/access-held`.
    
  

## 2. Live Blind-Bidding Cockpit Architecture

The Live Bidding engine (`/requirements/[id]`) is built for high-stakes, fast-paced commercial auctions.

```

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

```

---

## 3. Technical Mechanics of `use-vendor-live-bidding.ts`

The vendor live bidding hook manages the real-time lifecycle with high resilience:

  - **EventSource Stream:** Connects to `/api/requirements/[id]/live` to stream server-sent events whenever any participant submits a revised quote.
  - **Background Polling Fallback:** If the network drops or the SSE connection fails, the hook seamlessly switches to an automated 5-second polling fallback until the SSE stream reconnects.
  - **Sound & Visual Alerts:** Real-time audio chimes and pulse animations notify the vendor when their rank drops from #1 to #2.

## 4. Multi-Currency Normalization Engine

Vendors can quote in their preferred operating currency while the system automatically normalizes all bids to Saudi Riyals (SAR) for impartial ranking.

  
    
      Currency Code
      Exchange Rate Source
      Normalization Math
      Display Format
    
  
  
    
      **SAR** (Base Currency)
      Internal Baseline (1.0000)
      `amountSar = amount`
      `SAR 45,000.00`
    
    
      **USD** (US Dollar)
      Automated Daily Cron (3.7500)
      `amountSar = amount * 3.75`
      `$12,000.00 (≈ SAR 45,000.00)`
    
    
      **EUR** (Euro)
      Automated Daily Cron (4.0500)
      `amountSar = amount * 4.05`
      `€11,111.00 (≈ SAR 45,000.00)`
    
    
      **AED / QAR** (GCC)
      Automated Daily Cron (1.0200 / 1.0300)
      `amountSar = amount * rate`
      `AED 44,100.00 (≈ SAR 45,000.00)`
    
  

## 5. Supplier Compliance & Account Profile Management

  - **Company Dossier:** Maintain official CR licenses, Chamber of Commerce membership details, and tax documentation.
  - **Bank Account Verification:** Manage verified IBAN records used for electronic purchase order payment processing.
  - **Notification Center:** Real-time in-app notifications and email alerts for newly published RFQs, tender invitations, and award notifications.
