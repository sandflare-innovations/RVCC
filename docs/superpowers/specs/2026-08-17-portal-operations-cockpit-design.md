# Portal Operations Cockpit Design

**Date:** 2026-08-17  
**Status:** Approved direction — ready for review  
**Scope:** RVCC admin and vendor portals

## Purpose

Redesign the authenticated RVCC portals so users can immediately see their next action, complete routine tasks on desktop or mobile, and receive responsive page loads. The admin portal serves procurement staff; the vendor portal serves invited suppliers submitting sealed quotes.

## Design principles

1. **Action first.** Dashboards lead with the most urgent work, not a generic account summary.
2. **One primary action.** Each screen has an obvious next step with a visible, consistently placed primary button.
3. **Brand-only palette.** All interfaces use RVCC blue (`#0073BC`), black (`#000000`), white (`#FFFFFF`), and the established grey (`#A6A6A6`), with tonal variations only through opacity. Status meaning is expressed with text, icons, labels, and borders—not new colours.
4. **Responsive by design.** Navigation remains reachable at every width. Tables preserve key context and expose all actions without clipping.
5. **Fast by default.** Server-rendered data, compact dashboard payloads, no background polling beyond the existing notification load, and persistent Worker database clients.

## Information architecture

### Admin portal

Navigation remains: Dashboard, Vendor Registrations, Requirements, Vendor Accounts, and Site Content. The visible sidebar gains counts only where a queue needs attention; it collapses to an accessible mobile drawer with a persistent menu control.

The dashboard becomes a procurement operations view:

- Header: staff greeting, current date, **Create requirement**, and **Add vendor**.
- Priority queue: submitted registrations, requirements closing within 48 hours, and closed requirements awaiting award.
- KPI row: active suppliers, open requirements, response rate over 90 days, submitted quotes, and pending registration reviews.
- Activity list: latest registrations, quote submissions, and awards, each linking to its detail page.

Registration, vendor, and requirement pages retain their current routes and permissions. Their filters become scrollable chips on small screens, search controls occupy full width when needed, and tables use horizontal overflow plus sticky identifying columns. Row actions use labelled buttons or an accessible overflow menu, never controls that disappear outside the viewport.

### Vendor portal

Navigation becomes: Overview, Requirements, Profile, and Password. “Requirements” is a first-class navigation item and the current page’s primary action is always visible.

The vendor overview becomes a work queue:

- Header: supplier identity, registration state, notification bell, account menu, and **View requirements**.
- KPI row: open invitations, due within 48 hours, submitted quotes, drafts, and registration/profile state.
- “Your next actions”: up to three nearest-closing requirements with clear deadline, current quote state, and contextual action—**Submit quote**, **Continue draft**, or **View closed requirement**.
- Company/profile summary: concise account data with a link to support instead of a dense, full-page registration dump.

The requirements list becomes a responsive card/table hybrid: cards on narrow screens; a compact table on wide screens. Every row exposes its deadline, quote state, reference, and a visible action. Requirement details retain sealed-quote protections and make the deadline and submission state prominent above the form.

## Visual system

The visual signature is an RVCC-blue “work rail”: a narrow blue edge on the active queue and its most urgent item, used as a structural orientation marker rather than decoration. The rest of each page is deliberately quiet: white content surfaces on a light grey canvas, black text, subtle grey rules, and blue only for navigation, primary actions, focus, links, and the active work rail.

Typography uses the existing sans-serif stack with a small, practical scale. Data uses tabular numerals. Headings are sentence case; labels use concise uppercase only for compact data groupings. Buttons have minimum 44px touch height, visible focus rings, and never rely on colour alone.

```text
Desktop admin
┌───────────────┬────────────────────────────────────────────┐
│ RVCC          │ Good morning                     + Create  │
│ Dashboard     │ ────────────────────────────────────────── │
│ Registrations │ [Needs review] [Closing soon] [Awards due] │
│ Requirements  │                                            │
│ Vendors       │ Priority work                              │
│ Content       │ Recent activity                            │
└───────────────┴────────────────────────────────────────────┘

Mobile vendor
┌──────────────────────────────────────────┐
│ RVCC Supplier                      [Menu]│
│ Welcome, Al Noor Contracting              │
│ [Open] [Due soon] [Submitted] [Drafts]   │
│                                          │
│ Your next actions                         │
│ ┃ Project A · closes in 18h               │
│ ┃ Draft saved                [Continue]  │
│                                          │
│                         View requirements │
└──────────────────────────────────────────┘
```

## Data and performance

### Admin dashboard

The server dashboard consolidates independent counts with `Promise.all`, limits detailed activity to a small recent set, and selects only fields rendered by the dashboard. The existing vendor-performance calculation remains bounded. Query shapes use existing indexes; any newly added query must include a matching Prisma/schema index before deployment.

### Vendor dashboard

Add a single authenticated vendor dashboard endpoint returning only:

- registration/company summary needed for the overview;
- counts of open invites, items due within 48 hours, submitted quotes, and drafts;
- up to three nearest-closing accessible requirements with quote state.

The portal fetches this one payload in its server component. Requirement detail and list routes stay separate, preserving access checks and avoiding over-fetching. The endpoint performs one session validation and bounded, index-backed queries.

### Worker lifecycle

Admin and vendor Workers retain their PostgreSQL client per warm isolate and no longer call `sql.end()` after every request. This prevents connection setup from becoming part of every page/API request. Production requires redeploying both Workers using Node.js 22 or later for Wrangler.

## Error handling and accessibility

- Preserve existing auth redirects, roles, and sealed quote visibility rules.
- Replace empty dashboard states with clear next-step cards (for example, “No open requirements — you will be notified when invited”).
- Keep retry-safe mutation behavior and display an inline, specific failure message near the action that failed.
- Provide skeleton loading only where it improves perceived progress; respect reduced-motion preferences.
- Ensure menus, dialogs, filters, buttons, and tables are keyboard operable and have accessible names.

## Verification

- Unit-test the vendor dashboard data derivation and Worker client reuse.
- Type-check both apps and both Workers.
- Test responsive navigation, visible actions, filter/search access, and quote submission at desktop and mobile breakpoints.
- Run the affected test suite; database integration tests require the configured test PostgreSQL instance.
- After deployment, measure Worker and portal route latency for authenticated dashboard, requirements list, and requirement detail requests.

## Out of scope

- New business workflows, exports, charting dashboards, or a vendor-editable registration profile.
- Database schema redesign beyond narrow indexes required by a measured dashboard query.
- Changes to the public RVCC website.
