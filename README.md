# Contract Quotation Portal — ValvServe

[![React 19](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9_strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vite 8](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)](https://vite.dev)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel&logoColor=white)](https://qutation-saudi.vercel.app)

**Live demo → [https://qutation-saudi.vercel.app](https://qutation-saudi.vercel.app)**

## What is this project?

A valve-services workshop in Jubail, Saudi Arabia maintains safety valves, control valves and gate valves for industrial customers. Each customer signs a **master contract** — a multi-year agreement that fixes the price of every service (testing, overhauling, repairs, spares) for every valve type and size. While a contract is valid, its prices are **locked**: the workshop cannot charge more or less, no matter who writes the quotation.

This portal is the internal tool that makes that discipline effortless:

- An **estimator** picks the valve, its size, its rating and the service — and the tool reads the locked price straight from the contract. The estimator never types a number.
- If a combination isn't in the contract, the line is flagged **"Not contracted"** and an **admin** prices it once in a rate queue; every waiting quotation is backfilled automatically.
- When the quotation is complete, the tool issues the customer's **techno-commercial proposal** — a print-ready document produced by the browser's own print dialog.

The result: prices can't drift, gaps can't hide, and the customer document always matches the contract.

## Take the tour

Every screenshot below is from the live demo. Follow it top to bottom and you've seen the whole product.

### 1 · Master contracts — where pricing authority lives

![Master contracts screen](docs/screenshots/contracts.png)

The home screen. Each row is a customer's master contract: how many rate lines it defines, how many quotations are being drafted against it, and — on the coloured bar — how much of its multi-year term has been used. Status pills say who you may quote against: **Active** contracts are open, **Expiring** needs attention, **Expired** (Mawred, at 100%) can no longer be quoted.

### 2 · Contract detail — the locked price list

![Contract detail screen](docs/screenshots/contract-detail.png)

Inside one contract. The plates across the top summarise the agreement — five-year term, SAR 18.5M total contract value, 802 rate lines, five service bundles. The **Rate schedule** tab holds the price book itself: every row is one combination of *Category · Model · Size · Rating · Service* with its flat, VAT-inclusive rate. This is the single source of truth the composer reads from. Filters on top narrow the 802 lines down to what you need.

### 3 · Quotations — the estimator's worklist

![Quotations screen](docs/screenshots/quotations.png)

Every quotation for every customer, one row per customer work order. Status pills separate **Draft** from **Finalised** (locked for good) and **Closed**. The amber chips are the interesting part — *"1 not contracted"* means one line in that quotation is waiting on a missing rate. Drafts with open gaps can't be finalised until they're resolved.

### 4 · The quotation composer — the heart of the tool

![Quotation composer screen](docs/screenshots/composer.png)

This is where a quotation is built. On each line the estimator picks five positions — category, model, size, rating, service — and the tool **resolves the contract rate the moment the fifth is chosen** (the dark locked box shows the price it found). A line whose combination isn't contracted is flagged in amber instead of being priced by hand. Below: additional costs, the running summary (the big serif total on the dark band), and the **finalise gate** — the button stays disabled while any gap or missing valve tag remains.

### 5 · Proposal preview — what the customer receives

![Proposal preview screen](docs/screenshots/preview.png)

A faithful replica of the customer's techno-commercial proposal: the reference table, the scope, the price schedule with amounts per work order. Note the red **Not contracted** and **Excluded** marks — the customer document is honest about gaps too. The blue **Download PDF** button opens the browser's print dialog, so what you proof on this page is exactly what prints.

### 6 · Rate queue — the admin's backfill desk

![Rate queue screen](docs/screenshots/rate-queue.png)

Admin-only (switch roles from the account menu). When estimators hit combinations their contracts don't cover, the queue collects them — **one row per missing combination per contract**, no matter how many quotations are waiting. Each row shows exactly which five positions are missing and which quotations are blocked. An admin opens the quotation, enters the rate once, publishes — and every blank line on that contract's drafts fills in.

### 7 · Mobile — the same tool on a phone

![Mobile view](docs/screenshots/mobile-390.png)

The portal is fully responsive. At phone width the side rail collapses into a navigation sheet, the contracts table restacks into cards, touch targets grow to 44 px, and nothing scrolls sideways.

## How a quotation gets priced — the five rules

1. **Rates are contract-locked.** Every line price is a flat, VAT-inclusive SAR rate read from the master contract's schedule, keyed by the five-position identity (*Category · Model · Size · Rating · Service*). Estimators never type a price.
2. **"Not contracted" is flagged, never improvised.** A combination the schedule doesn't cover is marked on the line and raised in the admin rate queue. Publishing a rate there backfills every draft quotation waiting on it.
3. **Finalise is a gate.** A draft finalises only when every line carries a resolved rate and its valve tags are complete. Finalised quotations and their proposals become immutable.
4. **Contract term governs pricing; offer validity is the quotation's own clock.** The multi-year ARC term decides which rates apply (and drives Active / Expiring / Expired states); each quotation's validity — 30, 60 or 90 days — is independent of it.
5. **The proposal is a replica, not a redesign.** Preview renders the customer document on a white press sheet, and the PDF is produced through the browser's own print dialog — what you proof is what prints.

## Screen index

| Screen | Role | What happens there |
| --- | --- | --- |
| Master contracts | all | The four master ARCs: rate-line counts, drafts in flight, term-usage bars |
| Contract detail | all | The rate schedule by rating band, plus the contract's boilerplate blocks |
| Quotations | all | Drafts, finalised and closed quotations, with open-rate-gap chips |
| Quotation composer | all | The five-position identity key resolves one locked rate per line; additional costs; summary; the finalise gate |
| Proposal preview | all | The press-sheet replica of the techno-commercial proposal |
| Rate queue | admin | Missing combinations across contracts; publish-to-backfill |
| Reference data | admin | The service catalog the schedule is built from |
| Audit log | admin | Who did what, when |
| Import rate sheet | admin | Load a new contract's rate schedule |

## Tech stack

| Layer | Choice |
| --- | --- |
| Build | Vite 8 (Rolldown), TypeScript 5.9 strict |
| UI | React 19, shadcn/ui (radix-nova) on Radix primitives, lucide-react via an SVG sprite |
| Styling | Tailwind CSS v4 (`@theme` tokens, CSS-first), class-variance-authority |
| Type | Newsreader (300, display serif) + Inter (body), self-hosted via Fontsource |
| Feedback | Sonner toasts |
| Hosting | Vercel (`vercel.json`: pinned framework, `npm ci`, immutable asset cache, security headers) |

## Architecture

```
src/
  domain/        pure business logic — no React
    pricing.ts     rate resolution, totals, term/validity dates, TODAY clock
    catalog.ts     the five-position identity key and lookups
    format.ts      SAR money, dates, DN size labels
    types.ts       Screen, QuoteStatus, line and contract types
  state/
    portal.tsx     one reducer store: screen router, role, quotations, queue
  screens/        nine screens (contracts → composer → preview; admin queue/ref/audit/import)
  components/
    app/           domain components: Shell, DataTable, IdentityKey, Money, Plate, StatusPill…
    ui/            shadcn primitives (generated; see patches below)
  config/          navigation map, status tone map
  data/            seeded demo catalog, contracts and quotations
  index.css        the "Field Notes" theme: tokens, base, control overrides
```

The split matters: `domain/` knows nothing about React, so the pricing rules can be read (and later tested or moved server-side) on their own; `state/portal.tsx` is the single reducer that every screen talks to.

**Performance notes** (applied per Vercel's React best practices): the four screens a quotation always touches are static imports; the proposal preview and the admin screens are `React.lazy` chunks (Preview 9 kB, Import 10 kB, Rate queue 4 kB). Vendor 219 kB / main 237 kB (gzip ≈ 68 kB each). Derived figures are computed in the reducer, not in effects; lookup maps are built once at module level.

**Responsive:** the rail collapses to a navigation sheet below 60 rem, tables restack into cards, inputs grow to 44 px touch targets, and the line-item price cells drop to their own row on narrow screens.

**Design:** a warm-paper "field notes" system — cream canvas (`#f7f1e8`) with white reserved for elevated surfaces, a stone neutral doing the everyday work, one action blue (`#2a72de`) held strictly for the decisive CTA in each view, and earth accents (gold, clay, espresso, olive) for bands, chips and data. All tokens live in `src/index.css`.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | `tsc --noEmit` then the production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | TypeScript only |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` / `format:check` | Prettier |

No secrets are required. [.env.example](.env.example) documents the one optional variable (`VITE_API_BASE_URL`) for a future API.

## Deployment

Deployed on Vercel. `vercel.json` pins the Vite framework, runs `npm ci` → `npm run build`, serves `dist/`, caches hashed assets immutably, and sets `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` and `Permissions-Policy` headers.

## Assumptions

This is a **front-end demonstration of the workflow**, and the following are deliberate:

1. **The data is synthetic.** `src/data/seed.ts` ships a seeded catalog — four master contracts (2,560 rate lines combined) and quotations in draft, finalised and closed states — written to exercise every rule above. No real client data is included.
2. **There is no backend.** All state lives in a React reducer in memory; a reload resets the demo. The seed is the persistence layer for now.
3. **The demo clock is pinned.** `TODAY = '25/10/26'` in `domain/pricing.ts` drives term bars, expiring states and queue ages so the demo is reproducible; business dates are never derived from `Date.now()`.
4. **PDF means the browser print dialog.** No PDF library; the preview sheet carries dedicated print CSS. Exact pagination therefore varies slightly by browser.
5. **There is no sign-in.** The app opens directly as the Estimator; the account menu's "Switch to Admin (demo)" reveals the admin screens. Authentication is out of scope for the demo.
6. **Navigation is state, not URL.** There is no router; screens are a `Screen` union in the store, so there are no deep links.
7. **No automated tests.** Verification is `tsc --noEmit`, ESLint, the production build, and manual walkthroughs at 1280 px and 390 px.
8. **`noUncheckedIndexedAccess` stays off.** The seed tables and schedule lookups are guarded at the call sites that matter (rate resolution, totals); enabling it would ripple through the seed types without changing behaviour.
9. **Three one-class shadcn patches.** Generated `components/ui` files are kept pristine except: `transition-all` → `transition-colors` on button/badge/tabs (rule: never animate all), a `tracking-normal` on the dropdown-menu shortcut, and the dialog/sheet overlay tinted to the ink veil. The theme itself is imposed from `index.css` through unlayered `[data-slot]` overrides, so shadcn updates can't clobber it.
10. **Money is SAR and VAT-inclusive**, displayed exactly as the client's own contract forms present it; the proposal sheet keeps its own white document tokens (`--color-doc-*`) so the printed document stays white regardless of the app theme.

## Licence

[MIT](LICENSE)
