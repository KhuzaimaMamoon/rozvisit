# RozVisit

**A calm way for overseas Pakistanis to know their parents are okay today.**

RozVisit is a subscription-based care coordination platform that connects diaspora clients — in the UAE, UK, US, and Saudi Arabia — with verified local caregivers who perform scheduled wellbeing visits on their aging or alone parents in Pakistan, with photo proof, checklists, and honest reporting from every visit.

---

## Table of Contents

1. [Product Overview](#product-overview)
2. [Key Features](#key-features)
3. [User Roles](#user-roles)
4. [Screenshots](#screenshots)
5. [Technology Stack](#technology-stack)
6. [Architecture Summary](#architecture-summary)
7. [Repository Structure](#repository-structure)
8. [Local Setup](#local-setup)
9. [Scripts](#scripts)
10. [Testing](#testing)
11. [Linting and Formatting](#linting-and-formatting)
12. [Documentation](#documentation)
13. [Contribution Workflow](#contribution-workflow)
14. [Security Reporting](#security-reporting)
15. [Roadmap Summary](#roadmap-summary)
16. [License](#license)
17. [Project Status](#project-status)

---

## Product Overview

### The problem

Overseas Pakistanis miss their aging parents in ways that daily phone calls do not fix. A parent living alone in Rawalpindi may say "I'm fine" every evening while quietly running out of medication, skipping meals, or feeling lonelier than they will admit. From Dubai or London, a working son or daughter has no honest way to know that their parent is okay today — not last month, not in an emergency, but on an ordinary Tuesday.

Existing options fall short:

- Hiring a full-time caregiver from abroad is expensive and hard to oversee.
- Occasional visits from relatives are inconsistent.
- Video calls only show what the parent chooses to show.
- Nothing gives a diaspora family the calm, daily reassurance that their parent is being looked after.

### The solution

RozVisit lets an overseas client subscribe to a plan — for example, three visits a week — and have a **verified local caregiver** visit their parent on that schedule. Every visit produces:

- A short checklist (medication taken, mood, concerns).
- One or more proof photos captured inside the app.
- An honest summary the client can read in their morning feed.

If something goes wrong — a missed visit, a health concern, an emergency — the client learns about it truthfully, in their timezone, on their preferred channel.

**The product's promise is calm, not surveillance.** The parent's dignity is central to the design. Every caregiver is verified (CNIC, background check, interview, references). Every visit begins with the parent's consent recorded in their own words on the first visit. Every parent may withdraw at any time.

---

## Key Features

**For the client (payer, overseas):**

- Multi-currency subscription pricing (USD, GBP, AED, SAR).
- A calm proof feed: photos, checklist, honest notes from every visit.
- Weekly visit scheduling with clear plan allowances.
- Rescheduling, cancellation with cutoff protection.
- Consent management for the parent's care preferences.
- Notifications on the channels that suit the client — in-app, push, email; SMS and WhatsApp added at Phase 2.

**For the caregiver (in Pakistan):**

- An offline-first daily list — works on 2 GB Android and 3G networks.
- In-app camera capture for proof (no gallery upload path, ever — proof means proof).
- A concise visit flow: consent (first visit), checklist, camera, complete — under two minutes typical.
- Automatic sync when the network returns.
- Transparent earnings display.

**For the admin (operations):**

- Caregiver verification pipeline with three gates (CNIC, interview, reference).
- Visit oversight with flags and SLA tracking.
- Subscription workbench for the manual-payment phase.
- Emergency oversight (Phase 2) with a live timeline.
- Full audit trail on every sensitive read and mutation.

**Cross-cutting:**

- Field-level encryption on sensitive data (care notes, addresses, CNIC references, consent recording references).
- Correlation IDs across every request, log line, error response, notification, and audit event.
- Honest missed-visit and pending-photo states — the product never pretends things happened when they didn't.

---

## User Roles

| Role | Description |
|---|---|
| **Client** | The overseas subscriber. Adds a parent, chooses a plan, schedules visits, sees proof. |
| **Caregiver** | The verified local visitor. Sees today's assignments, performs visits, captures proof, uploads (immediately or when the network returns). |
| **Admin** | Operations staff. Verifies caregivers, assigns visits, reviews flags, manages subscriptions, oversees emergencies. |
| **Parent** | The person receiving care. Not a portal user; consent is captured on the first visit; withdrawal is honored anytime. |

Full personas — including edge personas (Tariq the reluctant parent, Saima the dead-zone caregiver, Kevin the non-Urdu-speaking in-law) — are documented in [`docs/04_User_Personas.md`](docs/04_User_Personas.md).

---

## Screenshots

Placeholders below. Real screenshots will be added as portals reach preview-quality.

### Client portal

![Client — Proof feed](docs/assets/screenshots/client-feed.placeholder.png)
*The morning feed: today's visit, photos, honest summary, capture-vs-upload times.*

![Client — Plan selection](docs/assets/screenshots/client-plan.placeholder.png)
*Plans in the client's own currency, introductory pricing shown honestly.*

### Caregiver portal

![Caregiver — Today](docs/assets/screenshots/caregiver-today.placeholder.png)
*The offline-first daily list on a 360 px screen.*

![Caregiver — Visit flow](docs/assets/screenshots/caregiver-visit-flow.placeholder.png)
*Consent, checklist, in-app camera capture, sync-state honesty.*

### Admin portal

![Admin — Overview](docs/assets/screenshots/admin-overview.placeholder.png)
*Applications, subscriptions, flags — the numbers that matter this week.*

![Admin — Application detail](docs/assets/screenshots/admin-application.placeholder.png)
*Three verification gates; Approve is disabled until all three are complete.*

---

## Technology Stack

**Backend:**
- Node.js 20 LTS
- Express 4
- MongoDB 7.x (Atlas M0 at MVP)
- Mongoose 8 (strict schemas throughout)
- JWT authentication (short-lived access + revocable refresh)
- Field-level AES-256-GCM encryption
- Socket.io (Phase 2 only — emergency system + live admin views)

**Frontend:**
- React 18 (function components + hooks only)
- Vite 8.1.5 (portal code splitting)
- Tailwind CSS with a single design-token source
- Lucide icons

**Infrastructure and services:**
- Render (web hosting)
- Cloudinary (media storage; signed direct uploads)
- Firebase Cloud Messaging (push notifications)
- Sentry (error tracking, from Phase 1)
- Payoneer (payments — manual at Phase 1, in-app API at Phase 4)
- Twilio and WhatsApp Business API (Phase 2, emergency channels)
- Daily.co (Phase 3, live video)

**Developer tooling:**
- ES modules everywhere
- npm workspaces (client + server + docs + scripts)
- Oxlint (linter)
- Prettier (formatter)
- Jest + Supertest (unit + integration tests)
- Playwright (end-to-end tests)
- GitHub Actions (CI)

Rationale for each major choice is captured as an ADR in [`docs/29_Risk_Register_and_ADRs.md`](docs/29_Risk_Register_and_ADRs.md) (Part B).

---

## Architecture Summary

RozVisit is a **layered monolith** deployed as a single Node.js/Express service. The client, caregiver, and admin surfaces are three portal-split React apps served by the same backend.

**Layer boundaries (strict):**

```
routes → controllers → services → repositories → models
```

- **Routes** wire URLs to controllers; middleware is named inline (rate limit → parse → auth → role → validate → controller → errorHandler).
- **Controllers** are thin: read the request, call one service, format the response.
- **Services** own all business rules and state machines (auth, plans, visits, consent, emergencies, notifications).
- **Repositories** are the only files that import Mongoose.
- **Models** hold strict schemas, indexes, and append-only guards on evidence collections.

**Three swap-ready interfaces** anticipate future change:
- `MediaStorage` (Cloudinary today; S3 evaluation at Phase 5).
- `PaymentProvider` (Payoneer today; Stripe at Scale stage after foreign entity).
- `NotificationChannel` (in-app + push + email today; SMS + WhatsApp at Phase 2).

**Offline-first caregiver flow**: service worker + IndexedDB + capture-time preservation + `clientVisitId` unique index for offline sync deduplication. The caregiver portal works on 2 GB Android and 3G networks by design.

**Three authorization rings** on every sensitive path: role, ownership, and audit.

Full architecture: [`docs/09_System_Architecture.md`](docs/09_System_Architecture.md).

---

## Repository Structure

```
rozvisit/
├── client/                 # React portals (client + caregiver + admin, portal-split)
│   ├── src/
│   ├── public/
│   ├── .env.example        # Shape only — never real values
│   └── package.json
├── server/                 # Express API + shared static portal serving
│   ├── src/
│   │   ├── config/         # env.js, constants.js, sensitiveFields.js
│   │   ├── models/         # Mongoose schemas + indexes
│   │   ├── repositories/   # Only files that import Mongoose
│   │   ├── services/       # Business rules and state machines
│   │   ├── routes/         # URL wiring per module
│   │   ├── controllers/    # Thin request handlers
│   │   ├── validators/     # Per-endpoint schema validation
│   │   ├── notifications/  # Templates + dispatcher
│   │   ├── utils/          # AppError, crypto, respond, logger
│   │   └── sockets/        # Empty until Phase 2 (Socket.io)
│   ├── tests/              # Jest unit + Supertest integration
│   ├── .env.example        # Shape only — never real values
│   └── package.json
├── docs/                   # The canonical documentation series (00–29)
├── scripts/                # Seed, migrations, verify-media
├── e2e/                    # Playwright tests
├── .github/                # PR template, issue templates, CI workflow
├── package.json            # npm workspaces root
├── README.md               # This file
└── LICENSE                 # See Project Status below
```

Full folder discipline and file-ownership tables: [`docs/10_Repository_and_Folder_Structure.md`](docs/10_Repository_and_Folder_Structure.md).

---

## Local Setup

A fresh checkout should reach a working feed in **under ten minutes**. If it takes longer, that is a workflow bug — report it.

### Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 20 LTS | Verify with `node --version` (v20.x) |
| npm | 10+ | Ships with Node 20 |
| Git | Any recent | Any modern Git works |
| MongoDB | Atlas free-tier cluster **or** local MongoDB 7.x | See below |
| Browser | Modern evergreen | Chrome recommended for dev tools consistency |

**MongoDB options:**

- **Atlas free-tier cluster (recommended)** — matches production shape; create a small M0 in Mumbai (`ap-south-1`), copy the connection string.
- **Local MongoDB via Docker** — for offline development:
  ```
  docker run -d --name rozmongo -p 27017:27017 mongo:7
  ```
  Then use `MONGO_URI=mongodb://localhost:27017/rozvisit_dev`.

### Installation

```bash
# 1. Clone
git clone git@github.com:<owner>/rozvisit.git
cd rozvisit

# 2. Install dependencies (via npm workspaces — installs client + server together)
npm install

# 3. Copy the environment template
cp server/.env.example server/.env
# Edit server/.env with your local values. Never commit this file.

# 4. Seed the database with realistic fake data (Ayesha, Bilal, Amina Bibi)
npm run seed

# 5. Start client + server together in dev mode
npm run dev
```

**What `npm run dev` starts:**
- **Server**: `nodemon server/server.js` on port `5000`.
- **Client**: Vite dev server on port `5173` with an API proxy to the `PORT` configured in `server/.env` (default `5000`).

Open `http://localhost:5173`. `npm run seed` prints these development-only credentials:

- Admin: `nasreen-admin@example.com` / `adminPass123`
- Client: `ayesha-client@example.com` / `safePass123`
- Caregiver: `bilal-caregiver@example.com` / `caregiverPass123`

**macOS port 5000 note:** AirPlay Receiver can reserve port `5000`. Either disable AirPlay
Receiver in macOS settings or set `PORT=5001` in `server/.env` before starting the server.
The Vite proxy reads that same `server/.env` port automatically, so no separate client setting is needed.

### Environment Variables

The `.env.example` files at `server/.env.example` and `client/.env.example` document the **shape only** — never actual values. `.env` is gitignored.

Server (server/.env):

```
# Runtime
PORT=
NODE_ENV=

# Database
MONGO_URI=

# Auth — two separate secrets, ≥32 bytes each, different values
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

# Field encryption (32-byte random material, base64)
FIELD_ENCRYPTION_KEY=

# Media (Cloudinary)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Push notifications
FIREBASE_SERVICE_ACCOUNT_JSON=

# Email
EMAIL_PROVIDER_API_KEY=
EMAIL_FROM_ADDRESS=

# Optional
SENTRY_DSN=
LOG_LEVEL=

# Phase 2 additions (not required at MVP)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
WHATSAPP_API_TOKEN=
```

Client (client/.env):

```
VITE_API_BASE_URL=
```

**The server refuses to boot** if any required variable is missing or fails validation — a security property, not just a convenience.

Full variable reference (nine fields per variable, sensitivity tiers, validation rules): [`docs/26_Environment_Variables_Reference.md`](docs/26_Environment_Variables_Reference.md).

### Running the client alone

```bash
npm run dev -w client
```

### Running the server alone

```bash
npm run dev -w server
```

---

## Scripts

Run from the repository root.

| Command | Purpose |
|---|---|
| `npm install` | Install client + server + tooling dependencies |
| `npm run dev` | Start client and server together in dev mode |
| `npm run dev -w client` | Start only the client (Vite) |
| `npm run dev -w server` | Start only the server (nodemon) |
| `npm run build -w client` | Build the client for production |
| `npm run seed` | Seed the database with realistic fake data |
| `npm run test` | Run Jest unit + Supertest integration tests |
| `npm run test:watch` | Run tests in watch mode during development |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npm run lint` | Run Oxlint across the workspaces |
| `npm run format` | Run Prettier over the whole tree |
| `npm run format:check` | Prettier check without writing (used by CI) |
| `npm audit` | Dependency vulnerability check |

---

## Testing

RozVisit uses four testing layers, matched to the risk of each surface.

**Unit (Jest):**
- Service rules, offline queue logic (highest coverage priority), the crypto utility, the scheduler's date math.
- Run: `npm run test`.

**Integration (Supertest + in-memory MongoDB):**
- Every route through the middleware chain, role refusals, standard error shape, idempotent visit sync.

**End-to-end (Playwright):**
- The **12 acceptance checks** (Doc 07 §28) — especially the airplane-mode visit and the consent-declined path.
- Run: `npm run test:e2e`.
- At MVP the e2e suite runs pre-release; at Phase 2 (with staging) it runs per-PR.

**Manual pre-release:**
- Real-device 3G test on a budget Android (the "Bilal test").
- Adversarial auth pass (same message and timing for wrong-email vs wrong-password vs unverified account).
- Chaos-style spot checks: kill Cloudinary and email providers mid-flow; verify recovery.

**Coverage guidance:** 80% overall; 100% on critical paths (offline queue, crypto utility, allowance math, completion rule). Coverage is a signal, not a goal.

Testing details: [`docs/09_System_Architecture.md`](docs/09_System_Architecture.md) §27 and [`docs/20_Error_Handling_and_Validation.md`](docs/20_Error_Handling_and_Validation.md) §28.

---

## Linting and Formatting

**Linter:** Oxlint. **Formatter:** Prettier.

- `.oxlintrc.json` at the repo root.
- `.prettierrc` at the repo root.
- Both run in CI on every pull request.
- Pre-commit hooks (Husky + lint-staged) run both on staged files.

The choice of Oxlint over ESLint is documented as an ADR in [`docs/29_Risk_Register_and_ADRs.md`](docs/29_Risk_Register_and_ADRs.md) (AD-11), with the reason recorded per Rule 8 of the documentation series.

Formatting is not a stylistic debate — Prettier's rules are the rules. Anyone disagreeing reconfigures Prettier once and lives with it.

Coding standards: [`docs/23_Engineering_and_Coding_Standards.md`](docs/23_Engineering_and_Coding_Standards.md).

---

## Documentation

The `docs/` folder is **the source of truth for RozVisit**. If a fact matters, it is here.

| # | Document |
|---|---|
| 00 | [Project Canonical Brief](docs/00_Project_Canonical_Brief.md) |
| 01 | [Decision Log](docs/01_Decision_Log.md) |
| 02 | [Product Vision and Strategy](docs/02_Product_Vision_and_Strategy.md) |
| 03 | [Business Requirements Document](docs/03_Business_Requirements_Document.md) |
| 04 | [User Personas](docs/04_User_Personas.md) |
| 05 | [User Journeys and Service Blueprint](docs/05_User_Journeys_and_Service_Blueprint.md) |
| 06 | [User Stories and Acceptance Criteria](docs/06_User_Stories_and_Acceptance_Criteria.md) |
| 07 | [Software Requirements Specification](docs/07_Software_Requirements_Specification.md) |
| 08 | [Software Requirements and Architecture Document](docs/08_RozVisit_SRAD.md) |
| 09 | [System Architecture](docs/09_System_Architecture.md) |
| 10 | [Repository and Folder Structure](docs/10_Repository_and_Folder_Structure.md) |
| 11 | [Database Design](docs/11_Database_Design.md) |
| 12 | [API Specification](docs/12_API_Specification.md) |
| 13 | [Authentication and Authorization](docs/13_Authentication_and_Authorization.md) |
| 14 | [Module Functional Specifications](docs/14_Module_Functional_Specifications.md) |
| 15 | [Design System](docs/15_RozVisit_Design_System.md) |
| 16 | [Screen Inventory and UI Specifications](docs/16_Screen_Inventory_and_UI_Specifications.md) |
| 17 | [Wireframe and Mockup Brief](docs/17_Wireframe_and_Mockup_Brief.md) |
| 18 | [Security and Privacy](docs/18_Security_and_Privacy.md) |
| 19 | [Notifications and Real-Time Events](docs/19_Notifications_and_Real_Time_Events.md) |
| 20 | [Error Handling and Validation](docs/20_Error_Handling_and_Validation.md) |
| 21 | [Performance, Reliability and Scalability](docs/21_Performance_Reliability_and_Scalability.md) |
| 22 | [Testing and QA Strategy](docs/22_Testing_and_QA_Strategy.md) |
| 23 | [Engineering and Coding Standards](docs/23_Engineering_and_Coding_Standards.md) |
| 24 | [Git and Development Workflow](docs/24_Git_and_Development_Workflow.md) |
| 25 | [DevOps and Deployment Guide](docs/25_DevOps_and_Deployment_Guide.md) |
| 26 | [Environment Variables Reference](docs/26_Environment_Variables_Reference.md) |
| 27 | [Analytics and Product Metrics](docs/27_Analytics_and_Product_Metrics.md) |
| 28 | [Product and Engineering Roadmap](docs/28_Product_and_Engineering_Roadmap.md) |
| 29 | [Risk Register and ADRs](docs/29_Risk_Register_and_ADRs.md) |
| 31 | [Documentation Consistency Audit](docs/31_Documentation_Consistency_Audit.md) |
| 32 | [Final Documentation Index](docs/32_Final_Documentation_Index.md) |

**Rule 8:** any code change that alters a canonical fact updates the relevant doc in the same PR. This is how the documentation stays trustworthy over time.

---

## Contribution Workflow

RozVisit uses a **trunk-based flow** with short-lived branches from `main`.

**Branch types:**
`feat/<slug>`, `fix/<slug>`, `hotfix/<slug>`, `docs/<slug>`, `chore/<slug>`, `refactor/<slug>`.

**Commit convention:** Conventional Commits (`feat(visits): enforce completion rule`), imperative mood, ≤72-character subject.

**Pull requests:**
- The PR template at `.github/pull_request_template.md` guides you through what, why, how, tests, docs, review checklist, and risk.
- CI must be green before merge: install, lint, tests, build, bundle budget, `npm audit`.
- Squash-merge to `main`; the branch is deleted after merge.
- Every merge to `main` is a candidate for production.

**Solo-developer note:** at MVP, the founder is the sole developer. Self-review is a real discipline, not a formality — the PR is opened, CI is watched, the review checklist is walked, then merge. At team stage, one approving review from someone other than the author becomes mandatory.

Full workflow (branch strategy, hotfix procedure, rollback, definition of ready, definition of done, solo vs future-team distinctions): [`docs/24_Git_and_Development_Workflow.md`](docs/24_Git_and_Development_Workflow.md).

---

## Security Reporting

**Please do not open a public issue for security vulnerabilities.**

If you discover a security issue in RozVisit, report it privately:

- Preferred: file a **private security advisory** on the GitHub repository (Security → Advisories → New draft advisory).
- Alternative: contact the incident owner (currently the founder) via a channel that does not include the vulnerability details in the initial message; a private channel will be shared for the disclosure.

**What to include in a report:**
- A description of the issue and its impact.
- Reproduction steps.
- Affected surface (client portal, caregiver portal, admin portal, API).
- Your correlation ID from any error screen encountered, if relevant.

**Response expectations:**
- Acknowledgment within 72 hours.
- Coordinated disclosure timeline agreed with the reporter.

RozVisit's security posture — including the "revoke everything + force reset" incident lever, correlation IDs across every diagnostic layer, and the field-level encryption model — is documented in [`docs/18_Security_and_Privacy.md`](docs/18_Security_and_Privacy.md).

Please review the [security policy](SECURITY.md) if present in this repository. If it is not yet present, the practices in [`docs/18_Security_and_Privacy.md`](docs/18_Security_and_Privacy.md) §34 (incident response) apply.

---

## Roadmap Summary

RozVisit follows the confirmed six-phase roadmap. Each phase has explicit success criteria and named triggers for the next phase — no dates that pretend to be promises.

| Phase | Description | Focus |
|---|---|---|
| **Phase 0 — Foundation** | Manual validation | 5 paying families onboarded via WhatsApp; 3–5 verified caregivers; real visits; prove willingness to pay. No code shipped. |
| **Phase 1 — MVP** | Core software launch | The 20 stories; 27 screens across three portals; offline-first caregiver flow; the 12 acceptance checks; launch gate passed. |
| **Phase 2 — Private beta** | Trust features | AD-12 hosting move; emergency system with four-channel broadcast; GPS check-in; errands; admin dashboard; Twilio + WhatsApp; staging environment; Docker. |
| **Phase 3 — Public beta** | Live presence | Live video (Daily.co); selfie identity match; ratings maturity; more caregivers; second admin. |
| **Phase 4 — V1** | Revenue maturity | In-app Payoneer checkout; wallet; split billing; automatic refunds; auto-renewal; BullMQ + Redis. |
| **Phase 5 — Growth** | Wider reach | Urdu language toggle; voice notes; simple vitals; family group access at scale; team-scale documentation practices. |
| **Phase 6 — Scale** | Multi-city | Second city (Lahore); foreign entity + Stripe; caregiver certification program. |

Full roadmap with per-phase goals, features, technical work, design work, testing, security, deployment, documentation, dependencies, risks, success criteria, and explicit exclusions: [`docs/28_Product_and_Engineering_Roadmap.md`](docs/28_Product_and_Engineering_Roadmap.md).

Risks and architecture decisions along the way: [`docs/29_Risk_Register_and_ADRs.md`](docs/29_Risk_Register_and_ADRs.md).

---

## License

**License status:** not yet decided. The repository is private and no license file is currently in place.

The founder will select and add a license before the repository transitions to any form of public visibility. Until then, all rights are reserved by the founder. Contributors who join before the license decision agree that the license will apply retroactively to their contributions.

If you are evaluating RozVisit for partnership, investment, or collaboration, please contact the founder directly to discuss licensing terms for your specific context.

---

## Project Status

**Current status:** Foundation → MVP transition.

**Where we are:**
- The canonical documentation series is complete (Docs 00–29), plus the consistency audit (31) and final index (32).
- Product decisions are consolidated in the Decision Log (all 11 approved).
- Brand identity, palette, and design system are finalized.
- The 27-screen MVP surface is specified and 15 essential screens have full mockup briefs.
- Foundation phase (5-family manual pilot) is in preparation.
- MVP engineering work is beginning against the documented architecture.

**What's next (in order):**
1. Foundation success criteria met (5 paying families for at least one full billing cycle at ≥90% verified visit completion).
2. MVP engineering to launch gate (Doc 18 §38).
3. Phase 2 planning triggered by MVP success + AD-12 readiness.

**Team:** one part-time founder-developer. Operations lead role planned for Phase 2. Full team-growth plan: [Doc 28 §Team Requirements](docs/28_Product_and_Engineering_Roadmap.md).

**For reviewers, partners, and investors:**

RozVisit is designed to prove that a small, disciplined product can serve a real emotional need with honest software. Every non-trivial decision has a documented rationale. Every architectural choice includes a review trigger. Every phase names its own exclusions to prevent scope creep. This README is the entry point; the documentation series is the deep read.

If you would like to discuss the product, the model, or a specific role in RozVisit's growth, please open a conversation with the founder through the repository's contact channels.

---

*This README is maintained per Rule 8 of the RozVisit documentation series: changes to canonical facts land in the same PR as the code that makes them true.*
