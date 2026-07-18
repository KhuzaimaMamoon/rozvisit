# RozVisit — Codex Implementation Handoff
### Document 33

**Purpose:** This is the instruction document Codex reads first, before touching any code. It tells the AI coding agent (a) what to build, (b) where the authoritative rules live, (c) what it must never touch without approval, and (d) exactly what to build first.
**Audience:** An AI coding agent with repository access. Instructions are written to be parsed literally; ambiguity is treated as *(Open)*, not as license to invent.
**Labels:** Everything here is confirmed unless marked *(Assumption)*, *(Recommendation)*, or *(Open)*.
**Real secrets are never included in this document.** All environment values are shape only.

---

## The Two Rules That Override Everything

1. **The documentation series is the source of truth. Read before write.** If a rule exists in Docs 00–32, follow it. If a rule does not exist, do not invent one — see the Clarification Protocol below.
2. **Never lose user work, never leak sensitive data, never break the palette.** These three are ranked above everything else — including feature completeness, elegant code, and shipping speed.

---

## Clarification Protocol

When Codex encounters an ambiguity, an unresolved value, or a rule that cannot be traced to a source:

1. **Search the documentation series** (Docs 00–32) using keyword matches on the affected concept.
2. **Walk the source-of-truth hierarchy** (Section 1 below) to find the owner.
3. **If a value is missing entirely**, mark it as `(Open)` in a `CLARIFICATIONS_NEEDED.md` file at the repo root, add a specific question, and stop work on that specific item.
4. **Never fabricate** a business rule, a magic number, an API path, a status enum value, a palette color, or a security policy.
5. **Never re-decide** a decision that already exists in Doc 01 or Doc 29. If a decision seems wrong, add it to `CLARIFICATIONS_NEEDED.md` — do not act unilaterally.

**Ambiguity is data, not a blocker for the rest of the work.** Codex should proceed on other tasks while ambiguities queue for founder review.

---

# 1. Source-of-Truth Order

Ranked. When two documents conflict, the higher priority wins.

| Priority | Source | Owns |
|---|---|---|
| **P1** | Doc 01 — Decision Log (D-01 through D-11) | The 11 founder-approved decisions |
| **P2** | Doc 00 — Canonical Project Brief | Vision, market, roles, modules, palette, phases |
| **P3** | Doc 01 — Decision Log rationale | Alternatives rejected and why |
| **P4** | Doc 29 — ADRs (AD-1 through AD-27) | Confirmed technical decisions with review triggers |
| **P5** | Doc 11 (data), Doc 12 (API), Doc 13 (auth), Doc 15 (design system), Doc 18 (security), Doc 20 (errors) | Domain-specific canonicals |
| **P6** | Doc 07 (SRS) + Doc 03 (BRD) | Requirements |
| **P7** | Doc 14 (modules) + Doc 16 (screens) + Doc 17 (mockups) | Build-and-review references |
| **P8** | All other documents (02, 04, 05, 06, 08, 10, 19, 21–28, 31, 32) | Elaboration, guidance, workflow, roadmap, audit |
| **P9** | README.md | Public-facing summary; must match everything above |
| **P10** | Comments, commit messages, chat | Not a source of truth |

**When in doubt:** Doc 32 (Final Documentation Index) is the map. Doc 31 Part F is the hierarchy in canonical form.

---

# 2. Approved Scope

The MVP is exactly the following. Anything not listed is out of scope for the current work.

## 2.1 Twenty MVP User Stories

Owned by Doc 06. Eight epics, 20 stories total:

- **Auth (US-AUTH-001..004):** register client, apply as caregiver, log in with silent refresh, reset password.
- **Profile (US-PROFILE-001..003):** create parent profile, add emergency contacts, capture first-visit consent.
- **Plan (US-PLAN-001..003):** select plan, admin activation with payment reference, cancel with grace period.
- **Visit (US-VISIT-001..006):** schedule weekly slots, caregiver today list (offline), consent step, checklist, camera capture with proof, view completed visit in feed.
- **Admin (US-ADMIN-001..003):** verification pipeline, assign visits, review flagged visits.
- **Errand, Emergency, Notification:** MVP portion only — see Doc 06 for exact story lists.

## 2.2 Twenty-Seven MVP Screens

Owned by Doc 16 (S-01 through S-27 are MVP; S-28 through S-43 are Phase 2+ or system screens). Codex renders only the MVP subset at this stage.

## 2.3 Twelve Acceptance Criteria (AC-01..AC-12)

Owned by Doc 07 §28. **Every one is a Playwright E2E test.** These are the acceptance gates for MVP completion. Codex writes and passes these tests as part of the definition of done.

## 2.4 Explicit Won't-Build List

- Payment automation, wallet, split billing (Phase 4).
- Live video, selfie identity match (Phase 3).
- GPS check-in, errands beyond MVP stub, emergency system, admin dashboard beyond MVP lists (Phase 2).
- Urdu language toggle (Phase 5).
- Second city, Stripe integration (Phase 6).
- Any AI feature at any phase before Growth stage (Doc 28 Future AI).

**If a task description implies any of the above, treat it as scope creep and add it to `CLARIFICATIONS_NEEDED.md`.**

---

# 3. Approved Stack

Owned by Doc 00 §13, Doc 23. Codex does not choose alternatives.

## 3.1 Runtime and Language

- **Node.js 20 LTS** on the server.
- **ES Modules everywhere** (`import`/`export`; no `require`).
- **No TypeScript at MVP** (recorded in Doc 23 §2).
- **`package.json`** sets `"type": "module"` and `"engines": { "node": "20.x" }`.

## 3.2 Backend

- **Express 4** (the framework).
- **Mongoose 8** with strict schemas everywhere.
- **MongoDB 7.x** (Atlas M0 in production; local Docker in development is acceptable).
- **JWT** with two separate secrets — one for access (15 min), one for refresh (7 days).
- **bcrypt** for password hashing (cost ≥10).
- **Node's crypto module** for AES-256-GCM field encryption via one utility (`utils/crypto.js`).

## 3.3 Frontend

- **React 18** (function components only; hooks only; no class components).
- **Vite 8.1.5** as the bundler.
- **Tailwind CSS** with the design-token mapping from Doc 15 §Tailwind mapping.
- **Lucide** for icons (tree-shaken imports).
- **No third-party scripts in portals** (Doc 18 §12).

## 3.4 Tooling

- **npm workspaces** (client + server + docs + scripts).
- **Oxlint** for linting.
- **Prettier** for formatting.
- **Jest** + React Testing Library for unit tests.
- **Supertest** + `mongodb-memory-server` for integration tests.
- **Playwright** for E2E.
- **GitHub Actions** for CI.
- **Husky + lint-staged** for pre-commit hooks.

## 3.5 External Services (at MVP)

- **Cloudinary** for media storage (signed direct uploads).
- **Firebase Cloud Messaging** for push notifications.
- **Email provider** (chosen at build — *(Recommendation)* per Doc 25).
- **Sentry** for error tracking.
- **UptimeRobot** or equivalent for uptime monitoring.
- **Render** for hosting.
- **MongoDB Atlas** for the database.

**Codex does not add dependencies not listed above without adding a new ADR to Doc 29 first.**

---

# 4. Approved Architecture

Owned by Doc 09. Codex implements exactly this shape.

## 4.1 Layered Monolith

Strict five-layer stack. Each layer only talks to the one below.

```
routes → controllers → services → repositories → models
```

- **Routes** wire URLs to controllers; middleware is named inline on the route definition.
- **Controllers** are thin: read the request, call one service, format the response using `respond.ok/created`. **Never** touch Mongoose. **Never** touch outside SDKs.
- **Services** own all business rules and state machines. **Never** import Mongoose. **Never** touch `req`/`res`.
- **Repositories** are the only files that import Mongoose. Take plain args, return plain data (never Mongoose documents to services).
- **Models** hold strict schemas, indexes with justifying comments, and append-only guards on evidence collections.

## 4.2 Middleware Order (Fixed)

Owned by Doc 09 §7, Doc 10 §7, Doc 23 §5. This order is a security perimeter. Reordering is a review-blocking defect.

```
request logging (with correlation ID)
→ rate limit (auth routes only)
→ body parsing
→ requireAuth
→ requireRole
→ validate(schema)
→ controller
→ errorHandler (registered LAST)
```

## 4.3 Three Portals

One React codebase produces three portal-split apps: client, caregiver, admin. Each user downloads only their own portal's code.

Portal routing is at the top of the client app. Cross-portal imports are forbidden.

## 4.4 Three Swap-Ready Interfaces

Owned by AD-4 (Doc 29). Codex creates all three from day one, even when only one implementation exists:

- **`MediaStorage`** — Cloudinary at MVP; S3 evaluation at Phase 5.
- **`PaymentProvider`** — Payoneer (no-op logger at Phase 1, real API at Phase 4).
- **`NotificationChannel`** — in-app + push + email at MVP; SMS + WhatsApp at Phase 2.

**Codex creates a local no-op implementation for each** so development works without the outside services (Doc 09 §24).

## 4.5 Event Bus

Owned by AD-5. Node's `EventEmitter` for MVP. The bus API does not change when BullMQ + Redis replaces it at Phase 4.

## 4.6 Scheduler

Owned by AD-22 *(Recommendation)*. In-process scheduler (node-cron or equivalent) with **boot catch-up logic** — transitions are date-computed, not tick-dependent. Missing a tick delays nothing incorrectly.

## 4.7 Same-Origin Serving

Owned by AD-27. The Express server serves `client/dist/` for non-`/api` paths. **No CORS at MVP** (Doc 18 §14). No separate frontend host.

---

# 5. Approved Folder Structure

Owned by Doc 10. Codex creates this tree exactly. No deviation without an ADR.

```
rozvisit/
├── client/
│   ├── src/
│   │   ├── portals/          # Portal-split (client, caregiver, admin)
│   │   ├── design-system/    # Tokens + shared components
│   │   ├── api.js            # API wrapper with silent refresh
│   │   └── App.jsx
│   ├── public/
│   │   └── logo.svg          # D-08 palette (regenerated)
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js             # Boot-refusal on missing secrets
│   │   │   ├── constants.js       # All enums + recommendation values
│   │   │   └── sensitiveFields.js # Drives crypto + logging redaction
│   │   ├── models/                # Mongoose schemas + indexes
│   │   ├── repositories/          # ONLY layer that imports Mongoose
│   │   ├── services/              # Business rules + state machines
│   │   ├── routes/                # Per-module route files
│   │   ├── controllers/           # Thin request handlers
│   │   ├── validators/            # One file per module of validation schemas
│   │   ├── middleware/            # requireAuth, requireRole, validate, errorHandler
│   │   ├── notifications/
│   │   │   └── templates/         # One file per notification type
│   │   ├── media/                 # MediaStorage interface + implementations
│   │   ├── payments/              # PaymentProvider interface + no-op MVP
│   │   ├── sockets/               # EMPTY at MVP with a README.md gate
│   │   ├── utils/
│   │   │   ├── AppError.js
│   │   │   ├── crypto.js
│   │   │   ├── logger.js
│   │   │   └── respond.js
│   │   ├── events/                # Event bus + listeners
│   │   ├── scheduler/             # In-process cron
│   │   └── app.js                 # Express app assembly (middleware order fixed)
│   ├── server.js                  # Entry: env → connect → listen
│   ├── tests/                     # Jest + Supertest
│   ├── .env.example
│   └── package.json
├── e2e/                           # Playwright AC-01..AC-12
├── docs/                          # Documents 00–32
├── scripts/
│   ├── seed.js                    # Realistic fake data
│   └── verify-media.js            # Media reference completeness check
├── .github/
│   ├── workflows/
│   │   └── ci.yml
│   ├── pull_request_template.md
│   └── ISSUE_TEMPLATE/
├── .gitignore
├── .oxlintrc.json
├── .prettierrc
├── package.json                   # npm workspaces root
├── README.md
├── LICENSE                        # (Open — added before public visibility)
└── SECURITY.md
```

**Rule of engagement for `sockets/`:** the folder exists with only a `README.md` refusing content until Phase 2 (AD-8). Do not create files inside until AD-8's Phase 2 trigger fires.

---

# 6. Approved Database Models

Owned by Doc 11 + Doc 31 Part E. Codex implements these exactly.

## 6.1 Collections

The MVP collections are:

- `users` — auth identity + role
- `clientProfiles` — client-specific details
- `caregiverProfiles` — caregiver-specific details + verification state
- `parentProfiles` — the parents receiving care (with embedded consent)
- `carePlans` — reference data (three plans; seeded once)
- `subscriptions` — with `planSnapshot` and append-only state history
- `visits` — with `clientVisitId` unique for offline dedupe, embedded checklist, embedded status history
- `refreshTokens` — hashed, TTL-indexed
- `notifications` — with per-channel delivery state array
- `auditEvents` — append-only, queryable evidence
- `emergencyAlerts` — reserved for Phase 2; do not create until Phase 2 trigger

## 6.2 Enums (from Doc 31 Part E)

All enums live in `server/src/config/constants.js`:

```javascript
export const ROLES = Object.freeze({ CLIENT: 'client', CAREGIVER: 'caregiver', ADMIN: 'admin' });

export const USER_STATUS = Object.freeze({ ACTIVE: 'active', DISABLED: 'disabled' });

export const PARENT_STATUS = Object.freeze({
  PENDING_CONSENT: 'pending_consent',
  ACTIVE: 'active',
  PAUSED: 'paused',
  ARCHIVED: 'archived',
});

export const CAREGIVER_STATUS = Object.freeze({
  APPLIED: 'applied',
  IN_REVIEW: 'in_review',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  DEACTIVATED: 'deactivated',
});

export const CONSENT_STATE = Object.freeze({
  PENDING: 'pending', GIVEN: 'given', DECLINED: 'declined', WITHDRAWN: 'withdrawn',
});

export const VISIT_STATUS = Object.freeze({
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  MISSED: 'missed',
  PARENT_DECLINED: 'parent_declined',
  FLAGGED: 'flagged',
});

export const SUBSCRIPTION_STATE = Object.freeze({
  SELECTED: 'selected',
  LINK_SENT: 'link_sent',
  ACTIVE: 'active',
  GRACE: 'grace',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
});

export const PLAN_NAMES = Object.freeze({ BASIC: 'Basic', STANDARD: 'Standard', PREMIUM: 'Premium' });
```

**Rule:** never use a string literal for a role, status, or state anywhere in the code. Always import the constant.

## 6.3 Structural Rules (from Doc 11)

- Every schema has `strict: true` and `timestamps: true`.
- Every sensitive field (per `sensitiveFields.js`) uses `select: false`.
- Every list query is backed by an index with a justifying comment (Doc 11 §9).
- Evidence collections (`visits`, `auditEvents`, `emergencyAlerts` at Phase 2) have a schema-level save-guard refusing in-place edits to history arrays.
- `subscriptions.planSnapshot` copies the plan's terms at purchase (AD-14) — prices set on subscriptions never change with plan updates.
- `visits.clientVisitId` has a unique index — the offline dedupe seatbelt.
- `refreshTokens.expiresAt` has a TTL index for automatic cleanup.

---

# 7. Approved API Conventions

Owned by Doc 12. Codex implements these exactly.

## 7.1 Base URL and Versioning

- Path prefix: `/api/v1`.
- The version does not appear inside route files; it is mounted once in `routes/index.js`.

## 7.2 Response Envelope

**Every success response:**

```json
{ "success": true, "data": { /* payload */ } }
```

**Every error response:**

```json
{ "success": false, "error": {
  "code": "STABLE_MACHINE_STRING",
  "message": "Human sentence, safe to show when code has expose:true",
  "fields": { "fieldName": "Per-field message." },
  "correlationId": "req_YYYY-MM-DD_random8"
}}
```

Enforced by `respond.js`. Codex never handwrites JSON error shapes in controllers.

## 7.3 Error Codes (Stable Contract)

Owned by Doc 20 §13. Codex uses exactly these codes; adding one requires updating Doc 20 in the same PR.

Auth: `UNAUTHENTICATED`, `TOKEN_EXPIRED`, `VERIFY_EMAIL_FIRST`, `ACCOUNT_DISABLED`, `FORBIDDEN`, `PERMISSION_REQUIRED`.

Validation: `VALIDATION_FAILED`, `UNSUPPORTED_MEDIA`, `PAYLOAD_TOO_LARGE`.

Resource state: `NOT_FOUND`, `STATE_INVALID`, `DUPLICATE`, `ALLOWANCE_EXCEEDED`, `CONSENT_REQUIRED`, `STATE_EXPIRED`.

Rate limiting: `RATE_LIMITED`.

Upstream: `UPSTREAM_FAILED`, `DB_UNAVAILABLE`, `DB_TIMEOUT`, `MAINTENANCE`.

Generic: `INTERNAL` (never exposes internal detail to users).

## 7.4 Pagination

- Every list endpoint enforces pagination.
- Time-ordered lists use cursor pagination: `?before=<ISO date>&limit=<n>`.
- Default limit 20, max 100. Requests exceeding max receive `422 VALIDATION_FAILED`.

## 7.5 Endpoint Naming Rules

- Plural nouns for resources: `/parents`, `/subscriptions`, `/visits`, `/notifications`.
- Action verbs for state changes: `/subscriptions/:id/cancel`, `/visits/:id/complete`, `/visits/:id/parent-declined`.

**Naming note:** `/visits/:id/parent-declined` matches `VISIT_STATUS.parent_declined` exactly (Doc 31 AF-08). Do not shorten this endpoint path.

## 7.6 Idempotency

- `clientVisitId` unique index makes offline sync idempotent — a duplicate complete returns `200` with the existing record (Doc 12 §14).
- No generic idempotency-key header at MVP.

## 7.7 Media Upload Chain

Owned by AD-7. Codex implements exactly this sequence:

1. **`POST /visits/:id/media-permit`** verifies caregiver assignment → returns a short-lived Cloudinary signed permit, folder-scoped to `rozvisit/visits/<visitId>/`.
2. **Device uploads directly to Cloudinary** with that permit. **Files never touch the backend.**
3. **`POST /visits/:id/complete`** includes the media references with `sourceFlag: "in_app_camera"` (SEC-012). Any other `sourceFlag` is rejected.

---

# 8. Approved Design System

Owned by Doc 15. The palette is immutable (Doc 00 §Rule 3).

## 8.1 The Mandatory Palette

Codex uses exactly these 11 colors and the design-system-derived tints from Doc 15 §3. No other colors, no arbitrary Tailwind values (`bg-[#...]`).

| Token | Hex |
|---|---|
| Primary | `#315A67` |
| Primary Soft | `#E7F0F2` |
| Accent | `#7AA6B2` |
| Background | `#F8FAF9` |
| Surface | `#FFFFFF` |
| Text | `#18232A` |
| Muted Text | `#6B7C85` |
| Border | `#DCE5E8` |
| Success | `#3F8F6B` |
| Pending | `#8A7A5C` |
| Emergency | `#C94A44` |

Derived tints (from Doc 15 §3):
- Primary hover `#27484F`
- Surface sunken `#F1F4F3`
- Success soft `#E3F1EA`
- Pending soft `#F1ECE3`
- Emergency soft `#F8E6E5`
- Emergency hover `#A93B36`
- Focus ring: Primary at 25% alpha
- Overlay: Text at 50% alpha

## 8.2 Component Discipline

- Use only design-system components (StatusBadge, VisitCard, ChecklistForm, CameraCapture, SyncStateBar, ProofTimestamp, ConsentPanel, EmptyState, etc.).
- Screens compose components; they never extend them in place.
- Status colors always paired with word labels (ACC-001) — color alone is never the signal.

## 8.3 Absolute Rules

- **Never** `dangerouslySetInnerHTML`.
- **Never** arbitrary Tailwind colors — a CI rule fails these.
- **Never** custom shadow/radius/spacing values outside the token system.
- **Never** emojis in product copy.
- **Never** third-party marketing pixels or scripts (Doc 19 §5).

---

# 9. Security Rules

Owned by Doc 18. Non-negotiable.

## 9.1 The Sensitive Field List

`server/src/config/sensitiveFields.js` is the single source that drives:
- Field-level AES-256-GCM encryption at rest (via `utils/crypto.js`).
- Log line redaction (via `utils/logger.js`).
- Response schema `select: false`.

Initial list (Doc 18 §22):
```
careNotes, addresses.text, cnicNumber, cnicDocumentRef,
consentRecordingRef, emergencyContactNotes, visitNotes,
passwordHash, refreshTokenHash
```

**Never** log a value from this list. **Never** return it in an API response unless explicitly needed.

## 9.2 Absolute Prohibitions in Code

- No `console.log` anywhere in application code — use `utils/logger.js`. CI fails on `console`.
- No `dangerouslySetInnerHTML` — CI fails.
- No `process.env` access outside `config/env.js`.
- No Mongoose import outside `repositories/` and `models/`.
- No Express types (`req`, `res`) inside `services/`.
- No hard-coded palette hex or arbitrary Tailwind color values.
- No secrets in code, comments, PR descriptions, issues, or logs.
- No third-party scripts loaded into portals.
- No bare `throw new Error("...")` — throw a typed `AppError` subclass.
- No swallowed errors (`catch (e) {}` is a review-blocking defect).

## 9.3 Environment Contract

Owned by Doc 26. Codex creates `env.js` that:
- Loads `.env` via `dotenv`.
- Validates every required variable per Doc 26's Validation column.
- **Refuses to boot** with a loud error message if any required variable is missing or fails validation.
- Freezes the exported config object.

## 9.4 Auth Discipline

Owned by Doc 13.
- Two separate JWT secrets (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`), ≥32 characters each, different values. `env.js` refuses to boot if they are equal or too short.
- Access token in memory only on the client. Refresh cookie: `HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`.
- Uniform login response for wrong-email vs wrong-password vs unverified (same message, same shape, same timing).
- No account lockout — rate limits + progressive delay + reset-revokes-everything are the answer.
- bcrypt cost ≥10.

## 9.5 Correlation IDs Everywhere

Owned by AD-17. Every incoming request gets `req_<yyyy-mm-dd>_<random8>` (8 characters) at the request-logging middleware. This flows to:
- Every log line.
- Every error response.
- Every Sentry event.
- Every notification record.
- Every audit event.

Codex generates a fresh ID per request; the format is fixed.

## 9.6 Three Authorization Rings

Every sensitive path enforces three rings (Doc 09 §14):
1. **Role ring** (middleware): `requireRole` refuses wrong-role.
2. **Ownership ring** (services): clients see own family only; caregivers see assigned visits only.
3. **Audit ring** (listener): admin mutations and sensitive-document reads write `auditEvents` automatically.

Ownership violations return `403`, not `404` (Doc 12 §5).

---

# 10. Testing Requirements

Owned by Doc 22.

## 10.1 Coverage

- **Unit:** 80% overall; **100% on critical paths** — the offline queue, `utils/crypto.js`, allowance math, visit completion rule, `AppError` hierarchy.
- **Integration:** every API endpoint hit end-to-end through the real middleware chain (using `mongodb-memory-server`).
- **E2E:** the 12 acceptance criteria AC-01..AC-12 as executable Playwright tests.

## 10.2 The 12 Acceptance Criteria

**These are the MVP gate.** Codex is not done until every one passes.

Each AC-N is documented in Doc 07 §28 with the FR IDs it proves. The Playwright suite in `e2e/` must have one test per AC.

## 10.3 Non-Negotiable Tests

- **AC-06 (Airplane-mode visit):** the highest-value E2E test. Playwright toggles network offline mid-visit; the caregiver completes; the caregiver's device comes back online; the sync happens; the client sees the visit with capture-vs-upload times honest.
- **Adversarial auth pass:** wrong-email vs wrong-password vs unverified — same message, same shape, same timing.
- **Correlation ID trace:** a failing request's correlation ID appears in the error response, in log lines, in Sentry, and in the Unexpected Error UI.

## 10.4 CI Tests Per PR

- Lint (Oxlint + Prettier check).
- Unit tests (Jest).
- Integration tests (Supertest + `mongodb-memory-server`).
- Client build succeeds.
- Bundle budget check — client first-payload ≤ 300 KB compressed.
- `npm audit` — no unresolved high/critical.

**E2E** runs pre-release at MVP; per-PR from Phase 2 with staging.

---

# 11. Coding Standards

Owned by Doc 23. Highlights:

## 11.1 Language

- `const` default; `let` when reassignment is real; never `var`.
- Prefer named exports.
- `export default` allowed for React components, Mongoose models, and Express routers only.
- Comparisons: `===` and `!==` (or `== null` deliberately).
- Async is `async/await`. No mixed `.then()` inside `async` functions.
- Never `Promise.all` on an unbounded array.

## 11.2 React

- Function components + hooks only.
- `PascalCase.jsx` for components; `useCamelCase.js` for hooks.
- Props destructured at top.
- Every list `map` has a stable, meaningful `key`.
- Every `useEffect` dependency list is complete and honest.
- Fetch through `useApi` hook wrapper (no ad-hoc fetch calls).

## 11.3 Server

- Config loaded once at boot; frozen; no `process.env` after boot.
- No blocking file I/O in request handlers.
- Every outside call has an explicit timeout.
- `process.exit()` never in app code — the graceful shutdown handler owns termination.

## 11.4 Constants Over String Literals

Never write a role, status, state, or magic number as a string literal in code. Import from `constants.js`.

## 11.5 File Naming

- React component: `PascalCase.jsx`.
- Hook: `useCamelCase.js`.
- Server layer file: `feature.layer.js` (e.g., `visit.service.js`, `visits.routes.js`).
- Model: `PascalCaseSingular.js` (e.g., `Visit.js`).
- Test: mirror + `.test.js` or `.spec.js`.

## 11.6 Comments

- Explain **why**, not **what**.
- Every index carries a comment naming the query and requirement it serves.
- `TODO(name, YYYY-MM)` format — no anonymous TODOs.
- Never a comment that lies about the code.

---

# 12. Environment Setup

Owned by Doc 25 §1 and Doc 26.

## 12.1 Prerequisites

- Node.js 20 LTS.
- npm 10+.
- MongoDB 7.x (local Docker acceptable) or an Atlas free-tier cluster.
- Git.

## 12.2 First-Time Setup

```bash
git clone <repo>
cd rozvisit
npm install                                    # workspaces install
cp server/.env.example server/.env             # fill with dev values
npm run seed                                   # realistic fake data
npm run dev                                    # client + server together
```

## 12.3 Environment Variables

Codex creates `server/.env.example` with the **shape only** — no values, no defaults, no examples of real secrets. Reference Doc 26 for the full contract. The required variables at MVP:

```
# Runtime
PORT=
NODE_ENV=

# Database
MONGO_URI=

# Auth (two separate secrets, ≥32 chars each, different values)
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

# Field encryption (32-byte base64)
FIELD_ENCRYPTION_KEY=

# Media
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Push
FIREBASE_SERVICE_ACCOUNT_JSON=

# Email
EMAIL_PROVIDER_API_KEY=
EMAIL_FROM_ADDRESS=

# Optional
SENTRY_DSN=
LOG_LEVEL=
```

And `client/.env.example`:

```
VITE_API_BASE_URL=
```

**Never populate any of these values in the repository.** Real values live in developer local `.env` files (gitignored) and in Render's environment settings for production.

## 12.4 Seed Script

`scripts/seed.js` creates:
- Three role users (client, caregiver, admin) with development credentials the seed script prints once at the end.
- One parent profile with map pin coordinates in Rawalpindi.
- Three plan documents (Basic, Standard, Premium).
- One active subscription with a `planSnapshot`.
- One week of visits in mixed statuses so the feed, today-list, and admin oversight all show meaningful data on fresh checkout.

The seed script is idempotent — running it twice does not create duplicates.

---

# 13. Implementation Phases

MVP work is broken into three sub-phases. Codex completes each before moving on.

## 13.1 Sub-Phase A — Scaffolding

Everything that must exist before feature code can be written. This includes Task 0 (Section 20) and the foundational utilities.

**Exit criteria:**
- Repository structure per Section 5 is complete.
- `npm run dev` starts client + server successfully.
- `/health` endpoint returns `{ success: true, data: { status: "ok", db: "connected" } }`.
- One integration test asserting the envelope shape passes.
- CI is green on the initial PR.

## 13.2 Sub-Phase B — Feature Implementation

The 20 MVP stories, in this dependency-safe order:

1. Auth (US-AUTH-001..004) — everything else depends on identity.
2. Profile (US-PROFILE-001..003) — parents must exist before plans and visits.
3. Plan (US-PLAN-001..003) — plans gate visit scheduling.
4. Visit scheduling and execution (US-VISIT-001..006) — the core value.
5. Admin (US-ADMIN-001..003) — required for caregiver verification to unlock G-side flows.
6. Notifications (US-NOTIF-001) — cross-cuts; can be built incrementally alongside features.

## 13.3 Sub-Phase C — Acceptance and Launch Gate

- Every AC-01..AC-12 Playwright test passes.
- The 12-check acceptance script executes green in a production-shaped environment.
- The launch gate (Doc 18 §38) is walked and evidence recorded in `docs/launch/`.

---

# 14. Task Breakdown

Each task carries: ID, sub-phase, dependencies, files to create or modify, tests that must pass, and the definition of done for that task.

**Task ID format:** `T-<sub-phase-letter><nn>` — e.g., `T-A01`.

## Sub-Phase A — Scaffolding

- **T-A01** — Repository scaffolding: workspaces, folder tree from Section 5, `.gitignore`, `README.md` header.
- **T-A02** — `server/src/config/env.js`: env loading + validation + boot-refusal + frozen export.
- **T-A03** — `server/src/utils/AppError.js`: full class hierarchy from Doc 20 §2.
- **T-A04** — `server/src/utils/respond.js`: `ok`, `created`, `error` methods enforcing the envelope.
- **T-A05** — `server/src/utils/logger.js`: structured JSON, correlation ID field, redaction driven by `sensitiveFields.js`.
- **T-A06** — `server/src/utils/crypto.js`: AES-256-GCM utility for field encryption.
- **T-A07** — `server/src/config/constants.js`: all enums from Section 6.2.
- **T-A08** — `server/src/config/sensitiveFields.js`: list from Section 9.1.
- **T-A09** — `server/src/middleware/`: `requireAuth`, `requireRole`, `validate`, `errorHandler`, `correlationId`.
- **T-A10** — `server/src/app.js`: middleware chain assembly in the fixed order.
- **T-A11** — `server/server.js`: entry point — env → DB connect → listen → graceful shutdown handler.
- **T-A12** — `/health` endpoint + its integration test.
- **T-A13** — Oxlint config (`.oxlintrc.json`) with rules from Doc 23 §28.
- **T-A14** — Prettier config (`.prettierrc`).
- **T-A15** — Husky + lint-staged pre-commit hooks.
- **T-A16** — GitHub Actions `ci.yml` per Doc 25 §17.
- **T-A17** — `client/` Vite scaffold with portal-split routing and design tokens.
- **T-A18** — Design-system components skeleton (Button, Card, StatusBadge, FormInput).
- **T-A19** — `scripts/seed.js` skeleton.
- **T-A20** — Sub-phase A PR ready for review.

## Sub-Phase B — Features

Grouped by module. Each module's tasks include: model + repository + service + validators + controller + routes + tests + client screens.

- **T-B01..T-B08** — Auth module (US-AUTH-001..004).
- **T-B09..T-B14** — Profile module (US-PROFILE-001..003).
- **T-B15..T-B20** — Plan/Subscription module (US-PLAN-001..003).
- **T-B21..T-B32** — Visit module (US-VISIT-001..006 including offline flow).
- **T-B33..T-B38** — Admin module (US-ADMIN-001..003).
- **T-B39..T-B42** — Notification module (US-NOTIF-001).

Codex may batch tasks per PR but each PR must satisfy the definition of done (Section 16).

## Sub-Phase C — Acceptance and Launch Gate

- **T-C01..T-C12** — Playwright tests for AC-01..AC-12.
- **T-C13** — 3G + 2 GB Android real-device pass (manual — Codex prepares the test plan; a human executes and records).
- **T-C14** — Adversarial auth pass documented (Doc 18 §38 launch gate).
- **T-C15** — Restore drill documented (BCK-003).
- **T-C16** — Launch gate signed in `docs/launch/`.

---

# 15. Dependencies

## 15.1 Task Dependencies

Every task inherits: all of Sub-Phase A must be complete before Sub-Phase B begins.

Within Sub-Phase B, the module order in Section 13.2 is a dependency graph — Auth precedes Profile precedes Plan precedes Visit. Notifications cross-cut and are built incrementally.

## 15.2 External Service Dependencies

Codex marks a task as `(BLOCKED: external)` and adds an entry to `CLARIFICATIONS_NEEDED.md` when it needs:

- Cloudinary credentials — for the media upload path.
- Firebase service account JSON — for push notifications.
- Email provider credentials — for verification and reset emails.
- Sentry DSN — for error tracking (optional at Phase 1 but recommended before real users).

At MVP, missing outside-service credentials do not block feature development — the local no-op implementations (Section 4.4) keep development working. They only block acceptance testing that specifically requires the outside service.

## 15.3 Human Approval Dependencies

Certain tasks require founder approval before they can be marked done:

- Any task that promotes a *(Recommendation)* value to canonical.
- Any task that changes a business rule or requirement (BR, FR, NFR).
- Any task that adds an ADR to Doc 29.
- Any task that changes the palette or design tokens.

Codex opens a PR, notes the approval requirement in the PR description, and does not merge until approval is recorded.

---

# 16. Definition of Done

Owned by Doc 24 §20. Codex treats a PR as done when **all** of the following are true:

## 16.1 Per-Task DoD

- [ ] Code implements exactly the specified scope. No extras, no shortcuts.
- [ ] Unit tests exist for every service, repository, and utility touched.
- [ ] Integration tests exist for every new endpoint, covering success + at least one error path.
- [ ] E2E test exists if the task delivers a user-visible flow.
- [ ] Doc 23 §27 review checklist is satisfied (import direction, middleware order, validators, envelope, indexes, `AppError`, no `console.log`, no `dangerouslySetInnerHTML`, no arbitrary Tailwind colors).
- [ ] Sensitive fields flow through `crypto.js` and `sensitiveFields.js`.
- [ ] Correlation IDs appear on any new log lines and error paths.
- [ ] Constants pulled from `config/constants.js` — no string literals for roles/statuses.
- [ ] Rule 4 respected — no invention that cannot be traced to a source or is unlabeled.
- [ ] The PR description explains **why**, not only **what**.
- [ ] A revert plan is stated (usually "revert the merge").

## 16.2 Per-PR DoD

- [ ] All CI checks green: lint, unit + integration tests, build, bundle budget, `npm audit`.
- [ ] Docs updated per Rule 8 (Doc 00) — canonical fact changes land in the same PR.
- [ ] `CLARIFICATIONS_NEEDED.md` updated if any new ambiguity was encountered.

## 16.3 Per-Sub-Phase DoD

- [ ] Every task in the sub-phase is complete.
- [ ] The relevant acceptance criteria (AC-01..AC-12) pass for that sub-phase's scope.
- [ ] A short summary appended to `docs/sub-phase-<letter>-summary.md` naming what was delivered, what was deferred, and what technical debt was taken on.

---

# 17. Files Codex Must Not Modify Without Approval

The following are canonical facts. Changing them is a founder-level decision, not an implementation choice.

## 17.1 Never Modify

- **Doc 00 §16 (Palette table)** — the 11 approved colors. Immutable unless the founder approves a new palette explicitly (Doc 00 Rule 3).
- **Doc 01 (Decision Log D-01..D-11)** — the founder-approved decisions.
- **Doc 29 (ADRs AD-1..AD-27)** — historical technical decisions. New ADRs are added (AD-28+); existing ones are marked Superseded, never rewritten.
- **Business Requirements (BR-001..BR-032)** in Doc 03 — the business contract.
- **Software Requirements (FR-, NFR-, SEC-, PRV-, DATA-, ACC-, AVL-, PERF-, LOC-, AUD-, NOT-, INT-, ERR-, BCK-, OBS-, SCL-)** in Doc 07 — the system contract.
- **Enum values** in Doc 11 + Doc 31 Part E — the wire contract.
- **API error codes** in Doc 20 §13 — the client contract. New codes are added with founder approval; existing codes never renamed.
- **API endpoint paths** in Doc 12 — the client contract. Renaming or removal requires an ADR.

## 17.2 Modify Only With Rule 8 Discipline

- Any recommendation value that becomes canonical — update the source document in the same PR.
- Any new dependency added — add an ADR to Doc 29.
- Any performance or scaling change — update Doc 21 with the reason.
- Any security-relevant change — update Doc 18 checklists.

## 17.3 Codex-Owned Files

Codex owns the code. Codex may freely create and modify code files under `client/src/`, `server/src/`, `scripts/`, `e2e/`, and CI configuration — subject to the discipline in Sections 4–11.

---

# 18. Documentation Update Requirements

**Rule 8 (Doc 00) restated for implementation:**

> If a PR changes a canonical fact — a decision, a numeric threshold, an architectural boundary, an enum value, an API path, an error code — the documentation change lands in the same PR.

Concretely:

| Change type | Doc(s) to update in the same PR |
|---|---|
| Adding a new environment variable | Doc 26; `server/.env.example`; Doc 25 §5 if it affects deployment |
| Adding a new API endpoint | Doc 12; Doc 14 (module spec); OpenAPI outline |
| Adding a new error code | Doc 20 §13; add integration test |
| Adding a new sensitive field | Doc 18 §22; `sensitiveFields.js`; add crypto round-trip test |
| Changing a middleware order | Doc 09 §7; Doc 10 §7; Doc 23 §5; add boot smoke test |
| Adding a dependency | Doc 29 new ADR; update Section 3 of this doc |
| Promoting a recommendation to canonical | The source document; Doc 01 if it's a decision |
| Changing a palette color | REJECTED unless the founder approves a new palette |

**Failure to update docs alongside code is a review-blocking defect.** The Doc 32 index tracks which documents each PR touched.

---

# 19. Quality Gates

## 19.1 Per-Commit

Pre-commit hooks (Husky + lint-staged):
- Prettier formats staged files.
- Oxlint checks staged files.
- Any failure blocks the commit.

Bypass with `--no-verify` is allowed only for genuine emergencies; CI still catches everything.

## 19.2 Per-PR

CI must be green:
- Lint (Oxlint + Prettier check).
- Unit + integration tests.
- Client build succeeds.
- Bundle budget: first-payload ≤ 300 KB compressed.
- `npm audit`: no unresolved high/critical.

## 19.3 Per-Phase

- **Sub-Phase A exit:** T-A20 checklist complete; `/health` reachable in a deployed environment.
- **Sub-Phase B exit:** all 20 stories implemented; all integration tests green.
- **Sub-Phase C exit / MVP launch gate:** Doc 18 §38's four evidence items — airplane-mode acceptance test, adversarial auth pass, restore drill within 30 days, on-call arrangement — all in `docs/launch/`.

## 19.4 Continuous Gate

The three top rules of the whole project (from Section 0):
- Never lose user work.
- Never leak sensitive data.
- Never break the palette.

Any PR that risks any of these is rejected regardless of other quality signals.

---

# 20. First Implementation Task

## T-A01 through T-A12 — Sub-Phase A Foundation (Combined Task)

**Objective:** Establish the repository scaffolding, the environment contract, the utility layer, the middleware chain, and one working health endpoint with a passing integration test. This proves the entire pattern on which every future task builds.

**Duration:** One focused work session.

**No secrets are hardcoded anywhere.** The `.env.example` files document shape only. Local development values (developer-chosen fakes) go in local `.env` files that are gitignored.

### Steps

**Step 1 — Repository scaffolding (T-A01)**

Create the folder structure from Section 5. The `sockets/` folder gets only a `README.md`:

```markdown
# sockets/ (empty at MVP)

Socket.io joins at Phase 2 per AD-8 (Doc 29). No files here until the Phase 2 build begins.
```

Create root `package.json` with npm workspaces:

```json
{
  "name": "rozvisit",
  "private": true,
  "type": "module",
  "workspaces": ["client", "server"],
  "engines": { "node": "20.x" },
  "scripts": {
    "dev": "npm run dev -w server & npm run dev -w client",
    "build": "npm run build -w client",
    "test": "npm run test -w server",
    "lint": "oxlint client server",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
  "devDependencies": {
    "oxlint": "*",
    "prettier": "*",
    "husky": "*",
    "lint-staged": "*"
  }
}
```

*(Codex chooses specific dependency versions at install time; no versions are pinned in this document.)*

**Step 2 — Server package (T-A02..T-A11)**

Create `server/package.json`:

```json
{
  "name": "@rozvisit/server",
  "type": "module",
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "express": "*",
    "mongoose": "*",
    "bcrypt": "*",
    "jsonwebtoken": "*",
    "cookie-parser": "*",
    "dotenv": "*"
  },
  "devDependencies": {
    "jest": "*",
    "supertest": "*",
    "mongodb-memory-server": "*",
    "nodemon": "*"
  }
}
```

**T-A02 — `server/src/config/env.js`:**

```javascript
import 'dotenv/config';

const REQUIRED = [
  'NODE_ENV',
  'MONGO_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'FIELD_ENCRYPTION_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'FIREBASE_SERVICE_ACCOUNT_JSON',
  'EMAIL_PROVIDER_API_KEY',
  'EMAIL_FROM_ADDRESS',
];

// Optional variables that permit absence in development.
const OPTIONAL = ['PORT', 'LOG_LEVEL', 'SENTRY_DSN'];

const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length > 0) {
  // Deliberately loud: fail at boot, not at first login.
  console.error(`FATAL: missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

if (process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET) {
  console.error('FATAL: JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must differ');
  process.exit(1);
}

if (process.env.JWT_ACCESS_SECRET.length < 32 || process.env.JWT_REFRESH_SECRET.length < 32) {
  console.error('FATAL: JWT secrets must be at least 32 characters');
  process.exit(1);
}

export const env = Object.freeze({
  port: Number(process.env.PORT ?? 5000),
  nodeEnv: process.env.NODE_ENV,
  mongoUri: process.env.MONGO_URI,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
  },
  fieldEncryptionKey: process.env.FIELD_ENCRYPTION_KEY,
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  firebase: { serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON },
  email: { apiKey: process.env.EMAIL_PROVIDER_API_KEY, fromAddress: process.env.EMAIL_FROM_ADDRESS },
  sentryDsn: process.env.SENTRY_DSN ?? null,
  logLevel: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
});
```

**T-A03 — `server/src/utils/AppError.js`:** implement the class hierarchy exactly per Doc 20 §2.

**T-A04 — `server/src/utils/respond.js`:** enforce the envelope from Doc 12 §7 and Section 7.2 above.

**T-A05 — `server/src/utils/logger.js`:** structured JSON logger with correlation ID field and redaction driven by `sensitiveFields.js`.

**T-A06 — `server/src/utils/crypto.js`:** AES-256-GCM encrypt/decrypt utility using `FIELD_ENCRYPTION_KEY`. Per-record IVs. Base64 output. Round-trip tested.

**T-A07 — `server/src/config/constants.js`:** all enums from Section 6.2.

**T-A08 — `server/src/config/sensitiveFields.js`:** the list from Section 9.1 as a frozen array.

**T-A09 — Middleware files:** `correlationId`, `requireAuth`, `requireRole`, `validate`, `errorHandler`. Owners: Doc 09 §7, Doc 13, Doc 20.

**T-A10 — `server/src/app.js`:**

```javascript
import express from 'express';
import cookieParser from 'cookie-parser';
import { correlationId } from './middleware/correlationId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { healthRouter } from './routes/health.routes.js';

export function createApp() {
  const app = express();

  // Middleware order is fixed. See Doc 09 §7. Reordering is a review-blocking defect.
  app.use(correlationId);
  // Rate limit on auth routes only — added when auth routes exist.
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  // Routes.
  app.use('/health', healthRouter);
  // Additional route mounts under /api/v1 land here.

  // Error handler is registered LAST.
  app.use(errorHandler);

  return app;
}
```

**T-A11 — `server/server.js`:**

```javascript
import mongoose from 'mongoose';
import { env } from './src/config/env.js';
import { logger } from './src/utils/logger.js';
import { createApp } from './src/app.js';

const app = createApp();

async function start() {
  try {
    await mongoose.connect(env.mongoUri);
    logger.info('database.connected');

    const server = app.listen(env.port, () => {
      logger.info('server.listening', { port: env.port, env: env.nodeEnv });
    });

    // Graceful shutdown per Doc 21 §24.
    const shutdown = async (signal) => {
      logger.info('server.shutdown_start', { signal });
      server.close();
      await mongoose.connection.close();
      logger.info('server.shutdown_complete');
      process.exit(0);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error('server.start_failed', { error: err.message });
    process.exit(1);
  }
}

start();
```

**T-A12 — `/health` endpoint and its test:**

`server/src/routes/health.routes.js`:

```javascript
import express from 'express';
import mongoose from 'mongoose';
import { respond } from '../utils/respond.js';

export const healthRouter = express.Router();

healthRouter.get('/', (req, res) => {
  const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  respond.ok(res, { status: 'ok', db: dbState });
});
```

`server/tests/health.integration.test.js`:

```javascript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';

describe('GET /health', () => {
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it('returns the envelope shape with status ok and db connected', async () => {
    const app = createApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: { status: 'ok', db: 'connected' },
    });
  });
});
```

**Step 3 — Client package (T-A17..T-A18)**

Create `client/package.json`, `vite.config.js`, `tailwind.config.js` (with the palette tokens from Section 8.1 mapped exactly), and the Vite scaffold with three portal routes (client, caregiver, admin — all with placeholder pages for now).

**Step 4 — Tooling (T-A13..T-A15)**

Create `.oxlintrc.json` with rules from Doc 23 §28. Create `.prettierrc` per Doc 23 §29. Configure Husky + lint-staged.

**Step 5 — CI (T-A16)**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run format:check
      - run: npm run lint
      - run: npm run test
      - run: npm run build
      - run: npm audit --audit-level=high
```

**Step 6 — `.env.example` and `.gitignore`**

Create `server/.env.example` and `client/.env.example` per Section 12.3 — shape only, no values.

Create `.gitignore`:

```
node_modules/
.env
.env.local
dist/
coverage/
*.log
.DS_Store
```

**Step 7 — Seed skeleton (T-A19)**

`scripts/seed.js` prints "TODO — Sub-Phase B populates this" and exits 0. Filled in as models arrive.

### Acceptance for the First Task

The first PR is done when all of the following are true:

- [ ] `npm install` runs without errors.
- [ ] `npm run dev` starts client and server on `localhost:5173` and `localhost:5000` respectively.
- [ ] `curl http://localhost:5000/health` returns the envelope shape from Section 7.2 with `status: "ok"` and `db: "connected"`.
- [ ] The health integration test passes locally (`npm run test`).
- [ ] `npm run lint` passes with no errors.
- [ ] `npm run format:check` passes with no changes suggested.
- [ ] CI is green on the PR.
- [ ] `env.js` refuses to boot when `JWT_ACCESS_SECRET` is missing, too short, or equal to `JWT_REFRESH_SECRET` — verified by running the server with a broken `.env`.
- [ ] `sockets/` folder exists with only its README.
- [ ] `.env` files are gitignored; neither `server/.env` nor `client/.env` is committed.
- [ ] No `console.log` in application code.
- [ ] No hardcoded palette hex outside `tailwind.config.js`.
- [ ] The PR description explains why (per Section 16.2).

Once the first PR merges to `main`, Sub-Phase A continues with the remaining scaffolding tasks (design-system component skeletons, additional middleware, additional utilities). Then Sub-Phase B begins with Auth.

---

## Codex Working Style

A few final rules for how Codex approaches every task:

1. **Read the source documents first.** Every task references specific documents. Codex reads the referenced sections before writing code.
2. **Small, atomic PRs.** One task per PR where possible. Doc 24 §9 caps size guidance at ~400 lines changed.
3. **Copy the pattern, don't invent one.** When implementing the third service, look at how the first two services are structured and match them. Consistency is a feature.
4. **When surprised, stop and check.** If a piece of code seems weird or missing, it may be because Codex missed a rule. Search the docs before rewriting.
5. **Never suppress a warning or an error.** A red squiggle is a message. Silencing it is not fixing it.
6. **Write the test first when the requirement is testable.** For each of AC-01..AC-12, the Playwright test can exist before the implementation is complete — it fails initially, and passing it is the definition of done.
7. **Log the correlation ID on every meaningful action.** Debugging without correlation IDs is guesswork.
8. **Prefer duplication to a bad abstraction.** Doc 23 §26.

---

*End of Document 33 — RozVisit Codex Implementation Handoff*
