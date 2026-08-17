# Portal Operations Cockpit Design

**Date:** 2026-08-17
**Status:** Approved direction — ready for review
**Scope:** RVCC admin and vendor portals

## Purpose

Redesign the authenticated RVCC portals so users can immediately see their next action, complete routine tasks on desktop or mobile, and receive fast page loads. The admin portal serves procurement staff; the vendor portal serves invited suppliers submitting sealed quotes.

Two problems are being solved together, because they share the same cause. The screens show raw records instead of work, and they load those raw records in full on every request. Narrowing what each screen shows is what makes it fast; making it fast is what lets it show the right thing.

## Design principles

1. **Action first.** Dashboards lead with the most urgent work, not a generic account summary.
2. **One primary action.** Each screen has an obvious next step with a visible, consistently placed primary button.
3. **Brand-only palette.** RVCC blue (`#0073BC`), black (`#000000`), white (`#FFFFFF`), and the established grey (`#A6A6A6`), with tonal variation only through opacity. Status meaning is expressed with text, icons, labels, and borders — not new colours.
4. **Responsive by design.** Navigation stays reachable at every width. Tables preserve key context and expose all actions without clipping.
5. **Fetch only what renders.** No screen queries a field, a relation, or a row it does not paint. This is the rule that governs the performance work below.
6. **Nothing blocks on the slowest query.** Page shell and navigation render immediately; each data region streams in on its own.

## Information architecture

### Admin portal

Navigation remains: Dashboard, Vendor Registrations, Requirements, Vendor Accounts, Site Content. The sidebar gains counts only where a queue needs attention, and collapses to an accessible mobile drawer with a persistent menu control.

The dashboard becomes a procurement operations view:

- Header: staff greeting, current date, **Create requirement**, **Add vendor**.
- Priority queue: submitted registrations, requirements closing within 48 hours, closed requirements awaiting award.
- KPI row: active suppliers, open requirements, response rate over 90 days, submitted quotes, pending registration reviews.
- Activity list: latest registrations, quote submissions, and awards, each linking to its detail page.
- Supplier performance moves off the dashboard into Vendor Accounts, where it belongs and where its cost is paid only by the person who asked for it.

Registration, vendor, and requirement pages keep their current routes and permissions. Filters become scrollable chips on small screens, search occupies full width when needed, and tables use horizontal overflow with sticky identifying columns. Row actions are labelled buttons or an accessible overflow menu — never controls that disappear outside the viewport.

**Lists become paginated and summary-only.** Today the registrations list renders 100 rows and, for each, pulls the company profile, up to eight contacts, up to eight addresses, linked vendor accounts, and a bank-account count — none of which the list paints. The redesigned list shows reference, company, status, submitted date, and one action; the nested detail loads on the detail page, where it is read.

### Vendor portal

Navigation becomes: Overview, Requirements, Profile, Password. "Requirements" becomes a first-class navigation item — it is currently unreachable from the chrome — and the current page's primary action is always visible.

The vendor overview becomes a work queue:

- Header: supplier identity, registration state, notification bell, account menu, **View requirements**.
- KPI row: open invitations, due within 48 hours, submitted quotes, drafts, registration/profile state.
- "Your next actions": up to three nearest-closing requirements with deadline, quote state, and contextual action — **Submit quote**, **Continue draft**, or **View closed requirement**.
- Company summary: concise account data with a link to support, replacing today's full-page registration dump.

The requirements list becomes a responsive card/table hybrid: cards on narrow screens, compact table on wide. Every row exposes deadline, quote state, reference, and a visible action. Requirement details keep sealed-quote protections and make deadline and submission state prominent above the form.

## Visual system

The visual signature is an RVCC-blue "work rail": a narrow blue edge on the active queue and its most urgent item, used as a structural orientation marker rather than decoration. Everything else is deliberately quiet — white surfaces on a light grey canvas, black text, subtle grey rules, and blue reserved for navigation, primary actions, focus, links, and the active rail.

Typography uses the existing sans-serif stack on a small, practical scale. Data uses tabular numerals. Headings are sentence case; uppercase is reserved for compact data-group labels. Buttons have a minimum 44px touch height, visible focus rings, and never rely on colour alone.

```text
Desktop admin
┌───────────────┬────────────────────────────────────────────┐
│ RVCC          │ Good morning                     + Create  │
│ Dashboard     │ ────────────────────────────────────────── │
│ Registrations │ [Needs review] [Closing soon] [Awards due]  │
│ Requirements  │                                            │
│ Vendors       │ Priority work                              │
│ Content       │ Recent activity                            │
└───────────────┴────────────────────────────────────────────┘

Mobile vendor
┌──────────────────────────────────────────┐
│ RVCC Supplier                      [Menu]│
│ Welcome, Al Noor Contracting             │
│ [Open] [Due soon] [Submitted] [Drafts]   │
│                                          │
│ Your next actions                        │
│ ┃ Project A · closes in 18h              │
│ ┃ Draft saved                [Continue]  │
│                                          │
│                       View requirements  │
└──────────────────────────────────────────┘
```

## Performance

### Budget

Every authenticated route must meet these targets on production data, measured server-side:

| Measure                              | Target        |
| ------------------------------------ | ------------- |
| Shell and navigation visible         | under 300 ms  |
| Dashboard content complete           | under 800 ms  |
| List page first row painted          | under 800 ms  |
| Detail page complete                 | under 1000 ms |
| Database round-trips per page render | 4 or fewer    |
| Rows fetched per list render         | 25 (one page) |

A change that misses a target is not finished. Latency is recorded before and after each phase so the improvement is a number, not an impression.

### Why requests are slow today

Six causes, each verified against the current source:

1. **List pages over-fetch by an order of magnitude.** `apps/admin/src/app/(protected)/registrations/page.tsx:44` loads 100 registrations with five nested relations, including contacts and addresses capped at eight each, plus a bank-account count. That is roughly 500 correlated subquery results to paint a table that shows none of them. `vendors/page.tsx:69` and `requirements/page.tsx:26` have the same shape at smaller scale.

2. **The admin dashboard runs a report nobody asked for.** `(protected)/page.tsx:35` fetches up to 100 vendors, each with two date-filtered relation counts and a nested awarded-quote lookup, purely to render the supplier-performance table below the fold. It is the slowest query on the slowest-loading screen.

3. **`Quote` has no index on `vendorUserId`.** The model carries `@@unique([requirementId, vendorUserId])` and `@@index([requirementId, status])`; neither serves a vendor-leading lookup. Every per-vendor quote count — on the admin dashboard now, and on the vendor dashboard after this redesign — scans the table.

4. **Two queries run in sequence where one wait would do.** `vendors/page.tsx` awaits industries, then awaits vendors. The two are unrelated.

5. **The vendor overview fetches the wrong payload entirely.** `apps/vendor/src/app/(protected)/page.tsx:31` loads the full registration and company profile — the vendor's own filed paperwork — while showing nothing about quotes due. The redesigned overview needs different data and less of it.

6. **Every page waits for its slowest query before sending any HTML.** All protected routes are `force-dynamic` with a single segment-level `loading.tsx`, so a slow dashboard query holds back the sidebar, the header, and the navigation the user was reaching for.

### The fixes

**Paginate and narrow every list.** 25 rows per page with server-side paging, selecting only painted columns. Nested relations move to detail pages. This alone takes the registrations query from ~500 subquery results to 25 flat rows.

**Add the missing indexes** before the queries that need them ship:

- `Quote`: `@@index([vendorUserId, status])` — serves both dashboards' quote counts.
- `SupplierRegistration`: `@@index([status, submittedAt])` — serves the filtered-and-sorted registrations list.
- `RequirementInvite`: `@@index([vendorUserId, createdAt])` — serves the 90-day invite window.

Each ships as a Prisma migration, with the query plan checked against production-shaped data before merge.

**Stream each region independently.** Wrap every data region in `Suspense` with a skeleton matching its final layout. Chrome and navigation render from the session alone, which is already cached; KPI row, priority queue, and activity list each arrive when ready. The user can navigate before the slowest query returns.

**Give the vendor overview its own endpoint.** One authenticated call returning only: company summary for the header, counts of open invites / due within 48h / submitted / drafts, and up to three nearest-closing requirements with quote state. One session validation, bounded index-backed queries, no registration dump. Requirement list and detail routes stay separate, preserving their access checks.

**Move supplier performance to Vendor Accounts,** paginated, so the dashboard stops paying for it.

**Parallelise independent queries.** `Promise.all` wherever two awaits have no dependency between them.

**Keep the Worker client fix and deploy it.** Both `workers/admin-api/src/db.ts` and `workers/vendor-api/src/db.ts` now cache one `postgres` client per connection string per warm isolate instead of calling `sql.end()` per request. The change is in the working tree and unreleased — production still pays connection setup on every authenticated request until both Workers are redeployed with Wrangler on Node.js 22 or later. `workers/enquire-api/src/index.ts:76` still ends its client per request; that is the public site and out of scope here, but it is the same bug and should be fixed next.

**Leave the session cache as it is.** `getAdminFromSession` and `getVendorFromSession` already combine React `cache` with a 45-second process-local TTL, and correctly avoid logging users out on 5xx. It is not a bottleneck and should not be touched.

## Error handling and accessibility

- Preserve existing auth redirects, roles, and sealed-quote visibility rules.
- Replace empty dashboard states with clear next-step cards ("No open requirements — you will be notified when invited").
- Keep retry-safe mutation behaviour and show an inline, specific failure message next to the action that failed.
- Skeletons match the shape of the content they replace, so arrival does not shift layout. Respect reduced-motion preferences.
- Menus, dialogs, filters, buttons, and tables are keyboard operable with accessible names. Pagination controls are reachable by keyboard and announce the current page.

## Verification

- Unit-test the vendor dashboard data derivation, pagination boundaries, and Worker client reuse.
- Type-check both apps and both Workers.
- Confirm each new index is used, by reading the query plan — not by assuming.
- Test responsive navigation, visible actions, filter and search access, and quote submission at desktop and mobile breakpoints.
- Run the affected test suite; database integration tests need the configured test PostgreSQL instance.
- Record route latency against the budget table before and after each phase, for dashboard, requirements list, and requirement detail on both portals.

## Out of scope

- New business workflows, exports, charting dashboards, or a vendor-editable registration profile.
- Schema changes beyond the three indexes named above.
- The public RVCC website, except for noting the `enquire-api` client-lifecycle bug.
