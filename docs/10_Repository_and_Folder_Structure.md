# RozVisit — Repository and Folder Structure
### Document 10

**Sources:** Documents 00–09, especially the System Architecture (Document 09) whose folder outlines this document completes and makes final.
**Labels:** Everything here is confirmed unless marked *(Assumption)*, *(Recommendation)*, or *(Open)*.
**Module system:** ES modules (`import` / `export`) everywhere — client and server. This matches the confirmed stack (Vite requires ES modules on the client; the server package sets `"type": "module"`, already the pattern in the earlier repo scaffold). CommonJS (`require`) is not used.

---

## 1. The Complete Tree (Root)

One private GitHub repository, monorepo style, using npm workspaces so one install and one command run everything (NFR-007).

```
rozvisit/
├── client/                  # React frontend - all three portals
├── server/                  # Node.js + Express backend
├── docs/                    # This documentation series + design assets
├── scripts/                 # Repo-level helper scripts (seed, check-env)
├── .github/
│   └── workflows/
│       └── ci.yml           # Lint -> test -> build -> deploy gate
├── .gitignore
├── .prettierrc              # One formatting config for the whole repo
├── .oxlintrc.json           # Oxlint config (root; workspaces inherit)
├── package.json             # Root: workspaces + dev/test/lint commands
├── package-lock.json
└── README.md                # How to run, where the docs are, who this is
```

**Why a monorepo:** one developer, one product, tightly coupled halves (the client calls exactly this server). Separate repositories would double the ceremony (two CIs, two version histories, cross-repo changes) and buy nothing at this scale.

**Root package.json commands** *(Recommendation — exact script names fixed at build)*:

```json
{
  "workspaces": ["client", "server"],
  "scripts": {
    "dev": "concurrently \"npm run dev -w server\" \"npm run dev -w client\"",
    "lint": "oxlint .",
    "format": "prettier --write .",
    "test": "npm run test -w server && npm run test -w client",
    "seed": "node scripts/seed.js"
  }
}
```

---

## 2. Client Structure

```
client/
├── index.html                    # Vite entry page
├── package.json
├── vite.config.js                # Portal code-splitting, dev proxy to /api
├── public/                       # Static assets served as-is
│   ├── favicon.svg               # Logo mark, final palette
│   ├── logo.svg                  # Rozvisit_Logo_Final (regenerated colors, D-08)
│   └── manifest.webmanifest      # App name, icons, theme color #315A67
└── src/
    ├── main.jsx                  # React root, router, providers
    ├── App.jsx                   # Top-level routes -> lazy portal trees
    │
    ├── design-system/            # THE only home of raw palette values
    │   ├── tokens.js             # Palette, spacing, type scale as constants
    │   ├── Button.jsx
    │   ├── Card.jsx
    │   ├── Badge.jsx
    │   ├── StatusBadge.jsx       # status -> color token + text label (ACC-001)
    │   ├── Table.jsx
    │   ├── Modal.jsx
    │   ├── FormInput.jsx
    │   ├── Toast.jsx
    │   └── EmptyState.jsx        # icon + one sentence + one action (design rule)
    │
    ├── portals/
    │   ├── client-portal/
    │   │   ├── routes.jsx        # /app/* route tree (lazy-loaded)
    │   │   ├── pages/
    │   │   │   ├── Feed.jsx              # The core screen (FR-050)
    │   │   │   ├── ParentProfile.jsx     # Create/edit + map pin (FR-010)
    │   │   │   ├── PlanSelect.jsx        # Three plans, own currency (FR-020)
    │   │   │   ├── Schedule.jsx          # Slots within allowance (FR-030)
    │   │   │   ├── VisitDetail.jsx       # One visit: photos, checklist
    │   │   │   ├── Notifications.jsx
    │   │   │   └── Account.jsx           # Cancel plan (FR-024), settings
    │   │   └── components/               # Client-portal-only pieces
    │   │
    │   ├── caregiver-portal/
    │   │   ├── routes.jsx        # /care/* (lazy; cached by service worker)
    │   │   ├── pages/
    │   │   │   ├── Today.jsx             # Today's visits, offline-capable (FR-040)
    │   │   │   ├── VisitFlow.jsx         # Consent step -> checklist -> camera -> complete
    │   │   │   ├── Earnings.jsx          # Per-visit earnings (FR-048)
    │   │   │   └── ApplicationStatus.jsx # For "applied" accounts (FR-003)
    │   │   └── components/
    │   │       ├── ChecklistForm.jsx     # Tap-based (FR-041)
    │   │       ├── CameraCapture.jsx     # getUserMedia only (FR-042)
    │   │       └── SyncStateBar.jsx      # saved / waiting / sent (FR-043)
    │   │
    │   └── admin-portal/
    │       ├── routes.jsx        # /admin/*
    │       ├── pages/
    │       │   ├── Applications.jsx      # Verification pipeline (FR-080)
    │       │   ├── ApplicationDetail.jsx # Gates view; approve blocked if open (FR-081)
    │       │   ├── Visits.jsx            # Filterable oversight (FR-083)
    │       │   ├── Assign.jsx            # Continuity-first assignment (FR-034)
    │       │   └── Subscriptions.jsx     # Manual activation (FR-023)
    │       └── components/
    │
    ├── services/
    │   └── api.js               # ONE fetch wrapper: base URL, auth header,
    │                            # silent refresh, standard shape decoding (ERR-001)
    ├── context/
    │   └── AuthContext.jsx      # Session in memory, role, current user
    ├── hooks/
    │   ├── useOfflineQueue.js   # Queue read/write, retry, state list
    │   ├── useOnlineStatus.js
    │   └── useCamera.js         # Capture + device timestamp (FR-044)
    ├── offline/
    │   ├── db.js                # IndexedDB setup (drafts, photos, queue)
    │   ├── queue.js             # Append-only queue with client-generated ids
    │   └── sync.js              # The sync worker logic
    ├── sw.js                    # Service worker: caregiver shell caching
    ├── i18n/
    │   └── en.json              # Every user-facing string (LOC-002)
    └── styles/
        └── index.css            # Tailwind entry + base layers
```

**Folder purposes worth stating plainly:**

- **design-system/** exists so no screen ever writes a hex color. Screens import components and tokens. This is how the mandatory palette (Source of Truth Rule 3) is enforced by structure, not memory.
- **portals/** are three lazy route trees. Vite splits them; a caregiver phone never downloads admin code (PERF-003).
- **offline/** is its own folder — not buried inside the caregiver portal — because it is the highest-risk MVP code (Document 08 risk table) and gets its own heavy unit tests.
- **i18n/en.json** from day one makes Phase 5 Urdu a translation file, not a code hunt.

---

## 3. Server Structure

```
server/
├── package.json                 # "type": "module"
├── server.js                    # Boot: env check -> DB connect -> listen
└── src/
    ├── app.js                   # Express wiring; middleware order fixed here
    │
    ├── config/
    │   ├── env.js               # Load + verify required vars; refuse boot if missing
    │   ├── db.js                # Mongoose connection with retry
    │   ├── constants.js         # See Section 20
    │   └── sensitiveFields.js   # THE list driving encryption/redaction/access
    │
    ├── routes/
    │   ├── index.js             # Mounts all routers under /api/v1
    │   ├── auth.routes.js
    │   ├── parents.routes.js
    │   ├── plans.routes.js
    │   ├── visits.routes.js
    │   ├── feed.routes.js
    │   ├── admin.routes.js
    │   ├── notifications.routes.js
    │   └── health.routes.js
    │
    ├── middleware/
    │   ├── requireAuth.js
    │   ├── requireRole.js
    │   ├── validate.js          # Runs a named schema from validators/
    │   ├── rateLimit.js         # Auth routes (SEC-005)
    │   ├── auditContext.js      # Attaches actor info for audit events
    │   └── errorHandler.js      # Always last; one response shape (ERR-001)
    │
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── parents.controller.js
    │   ├── plans.controller.js
    │   ├── visits.controller.js
    │   ├── feed.controller.js
    │   ├── admin.controller.js
    │   └── notifications.controller.js
    │
    ├── services/
    │   ├── auth.service.js
    │   ├── profile.service.js
    │   ├── plan.service.js      # Subscription state machine (Doc 09 §9)
    │   ├── visit.service.js     # Allowance, completion rule, statuses
    │   ├── feed.service.js
    │   ├── admin.service.js
    │   └── notification.service.js
    │
    ├── repositories/
    │   ├── user.repo.js
    │   ├── parent.repo.js
    │   ├── caregiver.repo.js
    │   ├── subscription.repo.js
    │   ├── visit.repo.js
    │   ├── notification.repo.js
    │   └── token.repo.js
    │
    ├── models/
    │   ├── User.js
    │   ├── RefreshToken.js
    │   ├── AuthToken.js
    │   ├── ClientProfile.js
    │   ├── ParentProfile.js     # includes linkedFamilyMembers (FR-012)
    │   ├── CaregiverProfile.js
    │   ├── CarePlan.js
    │   ├── Subscription.js
    │   ├── Visit.js             # status history, media refs, checklist
    │   └── Notification.js
    │
    ├── validators/
    │   ├── auth.schemas.js
    │   ├── parents.schemas.js
    │   ├── plans.schemas.js
    │   ├── visits.schemas.js
    │   └── admin.schemas.js
    │
    ├── events/
    │   ├── bus.js               # In-process emitter (queue transport at Phase 4-5)
    │   └── listeners/
    │       ├── notification.listener.js
    │       └── audit.listener.js
    │
    ├── interfaces/
    │   ├── MediaStorage.js          # contract
    │   ├── media.cloudinary.js      # implementation (D-05)
    │   ├── PaymentProvider.js       # contract
    │   ├── payment.manual.js        # Phase 1 implementation
    │   ├── NotificationChannel.js   # contract
    │   ├── channel.inapp.js
    │   ├── channel.push.js          # Firebase
    │   └── channel.email.js
    │
    ├── sockets/                 # EMPTY at MVP except a README stub
    │   └── README.md            # "Phase 2. See Doc 09 §12. Do not fill early."
    │
    ├── scheduler/
    │   ├── tick.js              # In-process scheduler with boot catch-up
    │   ├── generateVisits.job.js
    │   └── graceTransitions.job.js   # FR-025, date-math correct
    │
    └── utils/
        ├── crypto.js            # THE field-encryption utility (one place)
        ├── logger.js            # Structured JSON, levels, redaction (OBS-001)
        ├── AppError.js          # Expected-vs-bug error type (ERR-002/003)
        └── respond.js           # The one response formatter
```

**Folder purposes worth stating plainly:**

- **validators/** is separate from middleware because schemas are content, `validate.js` is machinery. Adding a route means writing a schema here and naming it in the route — validation can never be "forgotten" silently in review.
- **interfaces/** holds contract + implementations side by side, named `<area>.<vendor>.js`. Swapping Cloudinary for S3 at Phase 5 is adding `media.s3.js` and changing one config line (INT-002).
- **sockets/** exists now, empty, with a README refusing early content — the Phase 2 seam is visible and guarded (AD-8).
- **scheduler/** is its own folder because its correctness rule (date-math, boot catch-up — Doc 09 §16) deserves its own tests and its own review attention.

---

## 4. Shared Code Structure

**Decision: no shared workspace package at MVP.** *(Recommendation — with reasoning.)*

The tempting candidates for sharing (status names, plan names, validation rules) are small and change rarely. A shared package adds build coupling and version friction that a solo developer pays daily. Instead:

- The server's `config/constants.js` is the source of truth for shared names (Section 20).
- The client mirrors only what it renders, in its own small constants file, checked by the end-to-end tests (a status the client cannot render fails Playwright, loudly).

If duplication ever genuinely hurts (three or more real sync bugs), a `shared/` workspace is a one-day refactor. Until then, simplicity wins (quality rank 4, Document 08).

---

## 5. Documentation Structure

```
docs/
├── 00_Project_Canonical_Brief.md
├── 01_Decision_Log.md
├── 02_Product_Vision_and_Strategy.md
├── 03_Business_Requirements_Document.md
├── 04_User_Personas.md
├── 05_User_Journeys_and_Service_Blueprint.md
├── 06_User_Stories_and_Acceptance_Criteria.md
├── 07_Software_Requirements_Specification.md
├── 08_RozVisit_SRAD.md
├── 09_System_Architecture.md
├── 10_Repository_and_Folder_Structure.md   # this document
└── assets/
    ├── Rozvisit_Logo_Final.svg             # regenerated in final palette (D-08)
    └── mockups/                            # the approved HTML mockups
```

The docs live in the repo (per the original confirmed decision) so they travel with the code, are versioned by the same commits, and Rule 8 amendments happen in the same pull request as the change they describe.

---

## 6. Tests Structure

```
server/tests/
├── unit/
│   ├── services/
│   │   ├── visit.service.test.js     # allowance, completion rule, declined
│   │   ├── plan.service.test.js      # state machine, grace transitions
│   │   ├── auth.service.test.js
│   │   └── profile.service.test.js   # consent gating
│   ├── scheduler/
│   │   └── graceTransitions.test.js  # date-math with fake clocks
│   └── utils/
│       └── crypto.test.js            # THE encryption utility
├── integration/
│   ├── auth.routes.test.js           # gates, rate limits, token flow
│   ├── visits.routes.test.js         # role refusals, validation, shapes
│   ├── feed.routes.test.js           # ownership ring
│   └── admin.routes.test.js          # approval blocking, audit writes
└── helpers/
    ├── memoryDb.js                   # mongodb-memory-server setup
    ├── factories.js                  # test data builders
    └── fakeRepos.js                  # unit-test repository fakes

client/tests/
├── unit/
│   ├── offline/queue.test.js         # the highest-risk code, heaviest tests
│   ├── offline/sync.test.js          # dedupe by client id, retry states
│   └── design-system/StatusBadge.test.js  # every status has color + label
└── e2e/
    ├── acceptance.spec.js            # the 12 checks of Doc 07 §28 as scripts
    ├── offline-visit.spec.js         # airplane-mode visit end to end
    └── consent-declined.spec.js      # the Tariq path
```

Test placement mirrors code placement — a service's tests are findable from its name. The offline queue and the crypto utility get the heaviest unit coverage by explicit policy (Doc 08 risks).

---

## 7. Configuration Files

| File | Purpose |
|---|---|
| `.prettierrc` (root) | One formatting rule set for the whole repo |
| `.oxlintrc.json` (root) | Oxlint rules; workspaces inherit (confirmed linter) |
| `client/vite.config.js` | Dev proxy `/api` → server port; build splitting |
| `server/src/config/env.js` | The env contract: names, required flags, boot refusal |
| `.gitignore` | `node_modules`, `.env`, build output, logs, coverage |
| `render.yaml` *(Recommendation)* | Render blueprint: build + start commands, health check path — deploy config as code |

---

## 8. Environment Files

```
server/.env.example        # committed - documents the shape, never real values
server/.env                # NEVER committed
```

`.env.example` contents (the contract):

```
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=

# Auth
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

# Field encryption
FIELD_ENCRYPTION_KEY=

# Media (Cloudinary)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Push (Firebase)
FIREBASE_SERVICE_ACCOUNT_JSON=

# Email
EMAIL_PROVIDER_API_KEY=
EMAIL_FROM_ADDRESS=
```

Rules: `env.js` refuses boot if a required variable is missing (loud failure at deploy, not quiet failure at first login — Doc 09 §13). Production values live only in Render's environment settings. The client has no secrets at all — anything the browser receives is public by definition; the client's only config is the API base URL, and in the single-service deployment even that is just `/api`.

---

## 9. Scripts

```
scripts/
├── seed.js            # Three role accounts, sample parent, plans, visits ->
│                      # a fresh checkout reaches a working feed in minutes
└── check-env.js       # Prints which required vars are missing (used by CI too)
```

Plus the root package.json commands (Section 1): `dev`, `lint`, `format`, `test`, `seed`.

---

## 10. Public Assets

`client/public/` holds only true statics: favicon, logo, web manifest. Visit photos are never here — they live in Cloudinary behind minted links (SEC-008). The logo file is the D-08 regenerated version; the old-palette SVG does not enter the repo.

---

## 11. Feature Modules

The repo is layered-by-type on the server (routes/controllers/services/...) rather than folder-per-feature. Why: with ~7 features and 1 developer, layer folders keep the middleware chain, the response shape, and the audit wiring visibly uniform — the things most likely to drift. The feature grouping lives in the *names*: everything about visits is `visits.routes.js`, `visits.controller.js`, `visit.service.js`, `visit.repo.js`, `Visit.js`, `visits.schemas.js` — one word finds a whole feature across layers. On the client, portals are the feature grouping.

---

## 12–19. Layer-by-Layer Ownership (Utilities through Socket Handlers)

The trees above already place every layer. This table fixes what each layer may and may not do — the review checklist:

| Layer | May | May not |
|---|---|---|
| utils/ | Pure helpers (crypto, logger, AppError, respond) | Import services, repos, or models |
| middleware/ | Read request, verify, attach context, refuse | Contain business rules or DB queries |
| models/ | Define schema, indexes, strict mode | Contain business logic in hooks *(schema-level validation only)* |
| controllers/ | Parse request, call ONE service, format response | Import Mongoose; contain rules; call repos directly |
| services/ | All business rules; call repos, interfaces, bus | Import Express types; send responses; touch req/res |
| routes/ | Map URL -> middleware chain -> controller | Contain any logic |
| validators/ | Declare input schemas | Query the database |
| sockets/ | (Phase 2) Verify JWT, join ownership rooms, relay | Bypass services to write data |
| interfaces/ | Define contracts; wrap vendors | Leak vendor types upward into services |
| events/ | Announce and listen | Listeners writing anything except notifications/audit |

---

## 20. Constants

`server/src/config/constants.js` — the single home of shared names:

```javascript
export const ROLES = { CLIENT: "client", CAREGIVER: "caregiver", ADMIN: "admin" };

export const VISIT_STATUS = {
  SCHEDULED: "scheduled", IN_PROGRESS: "in_progress", COMPLETED: "completed",
  MISSED: "missed", PARENT_DECLINED: "parent_declined", FLAGGED: "flagged",
};

export const SUBSCRIPTION_STATE = {
  SELECTED: "selected", LINK_SENT: "link_sent", ACTIVE: "active",
  GRACE: "grace", PAUSED: "paused", CANCELLED: "cancelled",
};

export const PLAN_NAMES = { BASIC: "basic", STANDARD: "standard", PREMIUM: "premium" };

export const LIMITS = {
  PAGE_DEFAULT: 20, PAGE_MAX: 100,
  MEDIA_MAX_MB: 50,
  UPLOAD_FLAG_HOURS: 24,        // FR-046 (Recommendation value)
  CANCEL_CUTOFF_HOURS: 12,      // FR-033 (Recommendation value)
  GRACE_DAYS: 5,                // FR-025 (Recommendation value)
  RESET_LINK_MINUTES: 30,       // FR-006 (Recommendation value)
};
```

Magic numbers from the SRS live here once, named, with their requirement IDs beside them. Changing a recommended value when the founder confirms it is a one-line change.

---

## 21. Logs

No `logs/` folder. Logs are streams, not files (twelve-factor style): the structured JSON logger (utils/logger.js) writes to stdout; Render captures it; Sentry captures errors (OBS-003). Locally, the same stream prints prettily to the terminal. Audit records are *data*, not logs — they live in MongoDB (Doc 09 §14) precisely because they must be queryable evidence.

---

## 22. CI/CD Files

`.github/workflows/ci.yml` — the gate (Doc 08 §26):

```yaml
# Shape (final syntax at build):
# on: push + pull_request to main
# jobs:
#   check:
#     - checkout, setup Node 20, npm ci
#     - npm run lint          (Oxlint + Prettier check)
#     - npm run test          (Jest unit + Supertest integration)
#     - npm run build -w client
#   deploy (main only, after green):
#     - trigger Render deploy
#     - wait for /health to return healthy
```

No merge without green. E2E (Playwright) runs pre-release rather than per-commit at MVP *(Recommendation — per-commit E2E joins when a staging environment exists at Phase 2)*.

---

## 23. Docker Files

**None at MVP — deliberately.** Docker arrives at Phase 2 with staging (the confirmed timing, Doc 08 §26). Render builds from the repo directly at MVP. When Phase 2 comes, `Dockerfile` (server+built client) and `docker-compose.yml` (app + local MongoDB) are added at the root; nothing in this structure has to move to accommodate them.

---

## 24. Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| React components | PascalCase files | `StatusBadge.jsx` |
| Hooks | `use` prefix, camelCase | `useOfflineQueue.js` |
| Server layer files | `feature.layer.js` | `visit.service.js`, `visits.routes.js` |
| Models | PascalCase singular | `Visit.js`, `ParentProfile.js` |
| Interface implementations | `area.vendor.js` | `media.cloudinary.js` |
| Tests | mirror + `.test.js` / `.spec.js` | `visit.service.test.js` |
| Constants | UPPER_SNAKE in constants.js | `VISIT_STATUS.PARENT_DECLINED` |
| DB fields / JSON | camelCase | `scheduledAt`, `linkedFamilyMembers` |
| Routes | plural nouns, kebab if needed | `/api/v1/visits/:id/complete` |
| Env vars | UPPER_SNAKE | `JWT_ACCESS_SECRET` |
| Branches | `feat/`, `fix/`, `docs/`, `chore/` + short-kebab | `feat/visit-offline-queue` |
| Commits | Conventional Commits (confirmed) | `feat(visits): enforce completion rule` |

---

## 25. Import Conventions

1. ES modules only; file extensions included in server imports (`import x from "./visit.service.js"`) — required by Node ES module resolution.
2. Import order per file: node built-ins → npm packages → internal, separated by blank lines. Prettier + Oxlint keep it honest.
3. **Direction rule (the architecture, enforced by imports):** routes → controllers → services → repositories → models. An import against the arrows (a service importing a controller, a util importing a service) is a review-blocking defect. *(Recommendation — add an Oxlint/dependency-check rule for this when available; until then it is a stated review rule.)*
4. No deep imports across portals on the client: `client-portal` code never imports from `caregiver-portal`. Shared pieces live in `design-system/` or `hooks/` — or they are not shared.
5. Interfaces are imported by contract name; implementations are selected in one config spot only.

---

## 26. Module Ownership Rules

With one developer, "ownership" means *rules of engagement per area* — what needs extra care, tests, or a documented decision before changing:

| Area | Rule of engagement |
|---|---|
| `offline/` (client) | Highest-risk code. No change lands without its unit tests updated in the same commit. |
| `utils/crypto.js` + `config/sensitiveFields.js` | Security-critical pair. Changes require a test run of encrypt/decrypt round-trips and a note in the commit body naming which SEC/PRV requirement is touched. |
| `middleware/` order in `app.js` | Load-bearing (Doc 09 §7). Reordering requires a documented reason. |
| `events/listeners/audit.listener.js` | Append-only guarantee lives here. Never add update/delete paths. |
| `interfaces/` contracts | Contract changes ripple to every implementation — change contract and all implementations in one commit. |
| `config/constants.js` | Values with requirement IDs change only when the founder confirms the recommended value (Source of Truth Rule 2). |
| `docs/` | Rule 8: a change that alters a canonical fact updates the doc in the same pull request. |
| `sockets/` | Stays empty until Phase 2 formally starts (AD-8). |

---

*End of Document 10 — RozVisit Repository and Folder Structure*
