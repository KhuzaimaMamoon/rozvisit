# RozVisit — Engineering and Coding Standards
### Document 23

**Sources:** Documents 00–21. This document is the operating manual a developer opens *before* writing code — the concrete rules that carry the architecture's discipline into everyday work.
**Labels:** Everything here is confirmed unless marked *(Assumption)*, *(Recommendation)*, or *(Open)*.

**Linter/formatter resolution:** the pre-series SRAD said ESLint; setup work chose Oxlint (Doc 00 §22, Doc 10 §7). Per Source of Truth Rule 2, the newest confirmed decision wins — **Oxlint is the linter, Prettier is the formatter, ESLint is retired.** Reason recorded in Section 28.

**Module system:** ES modules everywhere. `import` / `export`. No `require`. (Doc 10 §1.)

---

## 1. General Principles

Six principles. Every rule below serves at least one of these.

1. **The architecture is the source of quality.** The layer boundaries (Doc 09), the seams (Doc 10 §12–19), the honesty rules (Doc 15), the sensitive-field list (Doc 18 §22) — the code exists to make these visible and safe. Style is service, not fashion.
2. **Boring, uniform, obvious.** A new developer should be able to guess where something lives, what it does, and how to change it — from the folder name alone.
3. **Small units, one job each.** A function with a name that needs "and" in it is at least two functions.
4. **The compiler is not the tester.** JavaScript won't catch a wrong ObjectId being passed where a string is expected. Explicit checks and tests do.
5. **Errors are answers, not shame.** Doc 20's philosophy applies to code, not only to responses: throw the right typed error, let the handler format it, keep moving.
6. **Never lose user work.** Every code path that could touch data the user just created (drafts, offline queue, uploaded media) treats it as sacred.

---

## 2. JavaScript Standards

**Language level:** Node 20 LTS on the server, modern evergreen browsers on the client. Target the runtime; do not transpile down.

**The rules:**
- Use `const`. Use `let` when reassignment is real. Never `var`.
- Prefer named exports. `export default` is allowed for React components, Mongoose models, and Express routers — not for utilities or services (avoids the "default is anything" import ambiguity).
- Prefer `for…of` and array methods over index loops.
- Prefer template literals over string concatenation.
- Use optional chaining (`?.`) and nullish coalescing (`??`) — treat `null` and `undefined` the same unless the code has a real reason not to.
- Never mutate function arguments. Never mutate module-level state after boot (config is loaded once, then frozen).
- Compare with `===` and `!==`. `==` is reserved for `== null` if the developer explicitly wants "null or undefined" — otherwise never used.
- Async is `async/await`. Do not chain `.then()` in application code — top-level fire-and-forget listeners are the one exception, and they always end in `.catch(logger.error)`.
- No TypeScript at MVP *(recorded in Doc 00 §13 as a stack choice)*. Types are enforced by validators, schemas, and tests.

**Prohibited:**
- `eval`, `Function()` constructor, `with`.
- Bit tricks for boolean flags — use boolean fields.
- Function-scoped hoisting reliance — declare before use.
- Chaining `Promise.all` on an unbounded array without a concurrency cap.

---

## 3. React Standards

**Version and style:**
- React 18 with Vite 8.1.5, function components only, hooks only. No class components in application code.
- Files that export a component: `PascalCase.jsx`. Files that export hooks/utilities: `camelCase.js`.

**The rules:**
- One component per file at the top level; small helper components in the same file are fine if they are used only there.
- Props are destructured at the top of the component: `function Feed({ parentId }) { ... }`.
- Every list `map` has a stable, meaningful `key` — never the array index unless the array is truly static and immutable.
- Every side effect goes in a `useEffect` with a defined dependency list; the dependency list is complete and honest (the linter will catch missing deps).
- Do not compute in render what should be memoized — but do not memoize what does not measurably help.
- Do not use `dangerouslySetInnerHTML`. Ever. (Doc 18 §12.) Enforced by review; a lint rule *(Recommendation)* fails the build on any occurrence.
- Do not fetch inside components except through the `useApi` hook wrapper — this centralises the loading/error/refresh pattern.
- Never hit a browser API without checking the environment (`typeof window`) if the code could ever run in a non-browser context — at MVP it can't, but this is the future-proof habit.
- The design system is the only source of colors and spacing (Doc 15 §44). No arbitrary Tailwind values (`bg-[#...]`) — a lint rule fails these *(Recommendation, Doc 15 §44)*.

**State discipline:**
- Local component state via `useState`.
- Cross-portal-slice state via a small context (Auth, OfflineStatus). No Redux at MVP; the app does not need it.
- Server state is not client state — the API response is the source; components display it and refresh it. No duplicating server records into local reducers.

---

## 4. Node.js Standards

**Runtime:**
- Node 20 LTS. `package.json` sets `"engines": { "node": "20.x" }` and `"type": "module"`.
- Entry point: `server/server.js` — imports `app.js`, connects to MongoDB, starts listening. Nothing else at the top level.

**Async and concurrency:**
- Every outside call (DB, HTTP, filesystem, timer) has an explicit timeout.
- No `process.exit()` in application code — the graceful shutdown handler (Doc 21 §24) owns termination.
- Unhandled promise rejections are captured at boot (`process.on('unhandledRejection', ...)`) and treated as programmer errors (Doc 20 §23).
- No blocking file I/O in a request handler — everything async.

**Configuration:**
- Config loaded once at boot from `env.js`; the exported object is `Object.freeze`d.
- No `process.env` access outside `config/env.js`. Ever. Enforced by review — the reason is centralised validation and redaction, per Doc 18 §19–20.

---

## 5. Express Standards

**The middleware order is fixed** (Doc 10 §7). It is the security perimeter. Reordering is a review-blocking defect:

```
request logging → rate limit (auth routes) → body parsing → requireAuth → requireRole → validate → controller → errorHandler
```

**Routes:**
- Live under `/api/v1` (Doc 12 §3).
- One route file per module (`visits.routes.js`, `admin.routes.js`, etc.). No cross-module routes in one file.
- Each route names its middleware chain **inline**, on the route definition. A route with implicit middleware is a review defect.
- No business logic in routes. Routes wire URLs to controllers.

**Controllers:**
- **Thin by rule.** Read the request, call **one** service, format the response.
- Never touch Mongoose. Never touch outside SDKs. If a controller feels like it needs a helper, the helper is a service method.

**Response formatting:**
- One helper: `respond.js`. `respond.ok(res, data)`, `respond.created(res, data)`, `respond.error(res, appError)`. No handwritten JSON shapes in controllers.
- All errors thrown as typed `AppError` (Doc 20 §2); the `errorHandler` middleware is the only place that shapes error responses.

---

## 6. MongoDB and Mongoose Standards

The full data design is Doc 11. Coding rules that make it hold:

**Models (`models/`):**
- `strict: true` on every schema. `timestamps: true` on every schema.
- Every enum is imported from `config/constants.js`. Never a string literal for a role, status, or state.
- Every ciphertext field and the `passwordHash` set `select: false`.
- Every index declared on the schema, with a comment naming the query and requirement it serves.
- No business logic in hooks. The one exception: the save-guard that refuses in-place edits to history arrays (Doc 11 §26, Doc 18 §9).
- GeoJSON fields use the `[lng, lat]` order with the comment stating so (Doc 11 §26).

**Repositories (`repositories/`):**
- The **only** files that import Mongoose. Enforced by the import-direction rule (Doc 10 §25).
- Repository functions take plain args and return plain data. Services never see a Mongoose document.
- Every list query has an index and a limit. No exceptions.
- Append-only collections expose only append functions. Update-in-place functions do not exist — Doc 11 §11 makes this structural.
- Prefer `.lean()` on read-heavy queries where no Mongoose instance methods are needed (Doc 21 §7).

**Services (`services/`):**
- All business rules live here. Never in schemas, never in controllers.
- Never import Mongoose directly. Never touch `req` / `res`. If a service knew about HTTP, its logic could not be tested alone.

---

## 7. REST API Standards

The API design is Doc 12. Coding rules that keep it stable:

- **The envelope is enforced by `respond.js`** — no handwritten JSON shape (Doc 12 §7).
- **Error codes are stable and centralised** in `AppError` subclasses (Doc 20 §2, §13). Adding a code is a documented change; renaming one is a breaking change.
- **Validation schemas live in `validators/`**, one file per module (`visits.schemas.js`). A route with no `validate(schema)` middleware is a defect.
- **Pagination is mandatory** on lists. Schema-level: `before` and `limit` are validated; missing limits default to 20, max 100 (Doc 12 §9).
- **Idempotency lives structurally** — `clientVisitId` unique index for offline sync (Doc 11 §21). No generic idempotency-key header at MVP.
- **No REST verbs shoehorned into POST.** Reads are `GET`; state transitions use the specific action route (`POST /visits/:id/complete`) — the API design already encodes this (Doc 12).
- **Reserved Phase 2 paths** return `404`, not a stub. Doc 12 §Part D.

---

## 8. Socket.IO Standards

Phase 2 (Doc 09 §12, Doc 19 §17). The rules exist now so the seam is guarded:

- The `sockets/` folder stays empty until Phase 2 formally starts — the folder has a `README.md` refusing early content (Doc 10 §26).
- One shared JWT verification function used by both HTTP `requireAuth` and the socket handshake (Doc 19 §18). Two verifications = two bugs.
- Rooms are joined **server-side, from the authenticated identity** (Doc 19 §19). Client-driven room joins never exist.
- Event payloads are lean by rule — identifiers and states, not sensitive content (Doc 19 §21, Doc 18 §28).
- Every handler is wrapped in a try/catch that logs at `warn` (transient) or `error` (repeated) — a throwing handler never crashes the process.

---

## 9. Folder Conventions

Fully specified in Doc 10 (server tree, client tree, docs, tests, scripts). The two rules the code review enforces:

1. A file's location tells you its layer and feature at a glance — `visit.service.js`, `visits.routes.js`, `Visit.js`.
2. Files that could logically live in two places live in exactly one, and the doc says which.

---

## 10. File Naming

The table in Doc 10 §24 is authoritative:

| Kind | Rule | Example |
|---|---|---|
| React component | `PascalCase.jsx` | `StatusBadge.jsx` |
| Hook | `useCamelCase.js` | `useOfflineQueue.js` |
| Server layer file | `feature.layer.js` | `visit.service.js` |
| Model | `PascalCaseSingular.js` | `Visit.js` |
| Interface implementation | `area.vendor.js` | `media.cloudinary.js` |
| Test | mirror + `.test.js` / `.spec.js` | `visit.service.test.js` |
| Constants | one file | `constants.js` |
| Env vars | UPPER_SNAKE | `JWT_ACCESS_SECRET` |

---

## 11. Variable Naming

- `camelCase` for variables and functions.
- `UPPER_SNAKE_CASE` only in `constants.js` (enums, limits) and env var names.
- Booleans are questions: `isVerified`, `hasConsent`, `canApprove`. Never bare `active` or `flag`.
- Arrays are plural: `visits`, `emergencyContacts`. Singular for single items: `visit`.
- IDs are named for what they identify: `visitId`, `caregiverId`, `subscriptionId`. Never `id` in an ambiguous context.
- No abbreviations for domain terms. `caregiver`, not `cg`. `subscription`, not `sub` (which could be a subject or a sublist). The one exception: `id`, `url`, `db` — universally understood.

---

## 12. Function Naming

- Verbs. `scheduleVisit`, `completeVisit`, `approveApplication`.
- The function's name is a promise: what it does, not how.
- Return `Promise` if `async`, `boolean` if a question (`isAllowedToComplete`), a value if a factual answer.
- Never `getXOrY` (branches in a name signal branches in the code that need to be two functions).
- Repositories: `findX`, `findXBy`, `listX`, `appendX`, `updateX`, `deleteX` (delete is rare and only where DATA-006 does not forbid it).
- Services: names describe the business action, not the data operation (`activateSubscription`, not `updateSubscriptionToActive`).

---

## 13. Component Naming

- One noun that names the thing. `Feed`, `VisitCard`, `SyncStateBar`, `ChecklistForm`.
- Never a name that ends in "Component" or "Container".
- Design-system components use plain nouns: `Button`, `Card`, `Modal`. Product components carry the domain: `VisitCard`, `EmergencyBanner` (Phase 2), `ConsentPanel`.
- Story-scoped components are named for the story: `PlanSelectionPage`, not `PricingScreen`.

---

## 14. Route Naming

- Plural nouns for resources, action verbs for state changes (Doc 12).
- The MVP surface is complete in Doc 12 §18; new routes justify themselves against Doc 12's shape.
- Version prefix is not repeated inside route files — `/api/v1` mounts once in `routes/index.js`.
- Reserved Phase 2 paths are listed in Doc 12 Part D — no code exists for them yet.

---

## 15. Model Naming

- PascalCase singular file names and export names: `Visit`, `ParentProfile`, `AuditEvent`.
- Mongoose collection name is derived by Mongoose's default from the model — do not override without a reason.
- Every model exports the schema and the model:

```javascript
// server/src/models/Visit.js
import mongoose from "mongoose";
import { VISIT_STATUS } from "../config/constants.js";

const visitSchema = new mongoose.Schema({ /* ... */ }, { timestamps: true, strict: true });
// Indexes live here, next to their fields, with comments.

const Visit = mongoose.model("Visit", visitSchema);
export default Visit;
export { visitSchema };
```

---

## 16. Error Naming

Owned by Doc 20 §2 and §13:

- **Codes** are UPPER_SNAKE strings: `ALLOWANCE_EXCEEDED`, `STATE_INVALID`, `CONSENT_REQUIRED`.
- **Classes** are the `AppError` hierarchy: `ValidationError`, `ForbiddenError`, `ConflictError`, `UpstreamError`, `InternalError`.
- **Messages** are the plain-English versions ready to render (when `expose: true`) — never with an exclamation mark.

Never throw a bare `Error` in application code. If a library throws one, wrap it: `throw new UpstreamError("UPSTREAM_FAILED", { cause: err })`.

---

## 17. Constants

- One file: `server/src/config/constants.js` (Doc 10 §20).
- Enums, limits, and any magic number with an SRS ID (recommended values with FR IDs — `CANCEL_CUTOFF_HOURS`, `GRACE_DAYS`, etc.).
- Never a string literal for a role, status, or state anywhere in the code.
- The client mirrors only what it renders (Doc 10 §4).

---

## 18. Comments

Rules to keep comments useful:

1. Comments explain **why**, not **what**. The code is the "what."
2. A comment that restates the function name is deleted.
3. Comments that lie are worse than none — outdated comments must be updated in the same commit as the code.
4. Every index carries a comment naming the query and requirement it serves (Doc 11).
5. Every `// P2`, `// P3`, `// P5` marker names the phase and the FR it prepares for (Doc 11 §26).
6. TODOs carry a name and a date: `// TODO(khuzaima, 2026-08): remove after Phase 2`.
7. Comments never contain secrets, keys, or personal data (Doc 18 §23).

---

## 19. Documentation

- **The documentation series is the source** — `docs/00_...` through `docs/23_...`.
- **Rule 8** (Doc 00): a code change that alters a canonical fact updates the relevant doc in the same PR.
- **JSDoc for public service functions** *(Recommendation)* — a short comment above each exported service method describing inputs, outputs, and errors it throws.
- **README.md** in the repo root covers how to run and where the docs are (Doc 10 §1).

---

## 20. Logging

Owned by Doc 18 §23 and Doc 20 §15:

- Structured JSON, one utility (`utils/logger.js`).
- Levels: `error` (programmer errors), `warn` (operational errors, retries, expected refusals), `info` (business events), `debug` (development only).
- **Every log line carries the correlation id** (Doc 20 §26). No exceptions.
- Redaction is driven by `sensitiveFields.js` — a developer cannot log a `careNotes` value by mistake.
- No `console.log` in application code, ever. Enforced by lint *(Recommendation — Oxlint rule at build)*.
- No PII in analytics events (Doc 18 §30).

---

## 21. Async Code

- `async` / `await`. No mixed `.then()` chains inside `async` functions.
- **Every `await` on an outside call is inside a try/catch** or is called by code that has one.
- **`Promise.all` only with a known-small array**. For an unbounded array, use a bounded concurrency helper *(Recommendation — `p-limit` or hand-rolled; use when the case actually appears)*.
- **`await` in a loop is the honest choice** when order matters or backpressure matters. Do not "optimise" to parallel unless the semantics allow it.
- **Never** hold a request handler open on a background job that could fail — fire the event, respond, let the listener retry (Doc 09 §16, AVL-003).

---

## 22. Error Handling

Owned by Doc 20. The coding rules the review enforces:

1. Throw typed `AppError`s. Never throw a string or a plain `Error` in application code.
2. Never swallow errors. `try { ... } catch (e) {}` is a review-blocking defect.
3. Never rewrap an `AppError` — it already carries its `code`, `status`, and `expose`. Rewrap only genuine outside errors as `UpstreamError` with `cause`.
4. Never send an error body from a controller. `throw`, let the handler shape it.
5. The `errorHandler` middleware is registered **last** on `app.js` — this is asserted by the boot smoke test *(Recommendation)*.

---

## 23. Validation

Owned by Doc 20 §5 and Doc 12 §16:

- Every endpoint names a schema in `validators/`. Missing schema = defect.
- Schemas reject unknown fields (strict). No optional wildcards.
- Business rules (allowance, consent gating, completion) throw in services with `ConflictError` — they are not schema errors (Doc 20 §5).
- Client-side validation mirrors messages from the server *(Recommendation — a small shared strings map to avoid drift; if that adds friction, integration tests catch drift instead — Doc 20 §19)*.

---

## 24. Security

Owned by Doc 18. Concrete coding rules:

- Every route names an authorization ring: role, ownership, and — for admin mutations — the audit ring writes automatically via the listener (Doc 18 §7).
- `passwordHash` and every ciphertext field are `select: false`. If a query needs them, it explicitly selects them.
- No secret ever appears in code, in logs, in URLs, in error messages (Doc 18 §20).
- Field encryption goes through the one utility (`utils/crypto.js`, Doc 10 §3). No hand-rolled crypto anywhere else.
- Media uploads use the signed-permit endpoint; the backend never accepts a raw file body (Doc 09 §17).
- `dangerouslySetInnerHTML` is banned (Doc 18 §12).
- No third-party scripts in portals (Doc 13 §27, Doc 18 §12).
- `express-mongo-sanitize`-equivalent middleware is enabled *(Recommendation, Doc 18 §11)*.

---

## 25. Performance

Owned by Doc 21. Coding rules:

- Every list query is indexed and bounded (Doc 21 §6).
- Every outside call has a timeout (INT-001).
- Records save before side effects fire (AVL-003, Doc 21 §5).
- No cache layer at MVP by default; do not add one without a Section 30 signal (Doc 21 §9–10).
- Bundle budgets checked in CI *(Recommendation, Doc 21 §3)*.
- Do not memoize what does not measurably help — measurement first, `useMemo` second.

---

## 26. Reusability

- Prefer duplication to a bad abstraction. Two similar-looking functions are cheap; a wrong shared abstraction is expensive.
- Extract a shared helper only after the third occurrence, or when a rule the review already cares about is at stake (encryption, response shape, audit writes).
- No "utils" dumping ground beyond `utils/crypto.js`, `utils/logger.js`, `utils/AppError.js`, `utils/respond.js` — each with a stated single purpose.
- The design system is the one shared client vocabulary. Screens compose it; they do not extend it in place.

---

## 27. Code Review Checklist

A reviewer walks this list before approving a PR.

**Architecture:**
- [ ] Import direction is respected — no service imports a controller; no util imports a service (Doc 10 §25).
- [ ] Middleware order in `app.js` is unchanged (or the change is documented and reasoned).
- [ ] New route names its middleware chain inline.
- [ ] New endpoint uses `validate(schema)` from `validators/`.
- [ ] New endpoint uses `respond.ok` / `respond.created` — no handwritten JSON shape.

**Data:**
- [ ] Any new list query has an index; the comment names the query.
- [ ] Any new query has a `limit` and, on time-ordered lists, a cursor.
- [ ] Any new field that is sensitive is in `sensitiveFields.js`.
- [ ] Any new evidence collection is append-only (no update-in-place path).

**Errors:**
- [ ] Every thrown error is an `AppError` subclass.
- [ ] Expected errors have `expose: true` and warm messages.
- [ ] Programmer errors are `InternalError` or wrapped `UpstreamError` with `cause`.

**Security:**
- [ ] Any read of sensitive documents writes to `auditEvents`.
- [ ] Any admin mutation writes to `auditEvents`.
- [ ] No `dangerouslySetInnerHTML`, no `console.log`, no secret in code.

**Client:**
- [ ] No arbitrary Tailwind colors (`bg-[#...]`); tokens only.
- [ ] Portal splitting respected — no cross-portal imports.
- [ ] Forms preserve drafts (ERR-005); errors highlight inline; first error focused.

**Tests:**
- [ ] Business-rule changes have unit tests.
- [ ] New error codes have integration tests.
- [ ] Offline queue changes have unit tests (Doc 10 §26 rule of engagement).

**Docs:**
- [ ] Rule 8 respected — any canonical fact change updates the doc in the same PR.

**Trivial-change fast lane:** a formatting-only or comment-only PR skips the sub-lists above; only the "Docs" and "Tests: nothing broken" checks apply.

---

## 28. Linting

**Tool: Oxlint** (`.oxlintrc.json` at repo root, Doc 10 §7).

**Why Oxlint over ESLint** (recording the reason per Rule 8): Oxlint is dramatically faster on the same repo, has a smaller configuration surface, and is compatible with common React and modern-JS rules for our stack. The pre-series SRAD assumed ESLint; setup work found Oxlint suitable and cheaper on developer time. The trade-off — Oxlint's rule ecosystem is narrower than ESLint's — is acceptable because our required rule set is small and named below.

**Required Oxlint rules (targets — adopted at build within Oxlint's supported rule set):**
- Unused variables and imports flagged.
- No `console` (except explicit allowlisted uses in scripts).
- No `var`.
- Prefer `const`.
- React hook rules (dependency lists complete and honest).
- No `dangerouslySetInnerHTML`.
- No arbitrary Tailwind colors (`bg-[#...]`), by a repo-level pattern check *(Recommendation — a small check outside the linter if the linter cannot express it; fails the CI check job)*.

**How CI uses it (Doc 10 §22):** `npm run lint` — no merge without green.

---

## 29. Formatting

**Tool: Prettier** (`.prettierrc` at repo root, Doc 10 §7).

Config *(Recommendation, standard values fixed at build)*:
- Print width 100.
- Single quotes for JS, double quotes for JSX attributes.
- Trailing commas everywhere valid.
- Semicolons on.
- Two-space indentation.

Formatting is not stylistic debate — it is a machine choice. Anyone disagreeing with a Prettier rule reconfigures it once and lives with it.

---

## 30. Pre-Commit Hooks

*(Recommendation — added at build; not previously specified explicitly.)*

Husky + lint-staged run on `git commit`:
- Prettier formats staged files.
- Oxlint checks staged files.
- Any failure blocks the commit.

Bypass with `--no-verify` is allowed only for real emergencies; the CI will still refuse the merge.

Commit message convention: Conventional Commits (Doc 10 §24). `feat`, `fix`, `docs`, `chore`, `refactor`, `test`. Scope is the module: `feat(visits): enforce completion rule`.

---

## 31. Prohibited Patterns

A list of things review always catches. Not exhaustive — the principles catch the rest.

1. `console.log` in application code.
2. `dangerouslySetInnerHTML` anywhere.
3. `process.env` access outside `config/env.js`.
4. Mongoose import outside `repositories/` and `models/`.
5. Express types (`req`, `res`) inside `services/`.
6. Business rules inside routes or controllers.
7. Business rules inside Mongoose hooks (the append-only guard is the sole exception).
8. Bare `throw new Error("...")` in application code.
9. Swallowed errors: `catch (e) {}`.
10. Handwritten JSON error shapes.
11. Hard-coded palette hex or arbitrary Tailwind colors.
12. String literals for roles, statuses, states (use constants).
13. Unindexed list queries; unbounded `find({})`.
14. Update-in-place on evidence collections.
15. Access to the file body of an upload (uploads go direct to Cloudinary).
16. Secrets in code, in comments, in logs, in URLs.
17. Cross-portal imports on the client.
18. `TODO` without a name and a date.
19. Third-party scripts loaded from CDNs into portals.
20. Any pattern the design system replaces (custom color values, custom shadows, custom border radii).

---

## 32. Example Good and Bad Code

Concrete pairs, one per key rule.

### 32.1 Controllers are thin

**Bad:**
```javascript
// visits.controller.js
export async function complete(req, res) {
  const visit = await Visit.findById(req.params.id);           // Mongoose in controller ❌
  if (!visit) return res.status(404).json({ error: "not found" }); // handwritten shape ❌
  if (!visit.checklist) return res.status(400).json({ error: "no checklist" }); // rule in controller ❌
  visit.status = "completed";
  await visit.save();
  res.json({ visit });
}
```

**Good:**
```javascript
// visits.controller.js
export async function complete(req, res) {
  const visit = await visitService.complete({
    visitId: req.params.id,
    caregiverId: req.user.userId,
    payload: req.body,
  });
  respond.ok(res, { visit });
}
```

### 32.2 Services throw typed errors

**Bad:**
```javascript
if (!hasChecklist || !hasMedia) throw new Error("Cannot complete"); // ❌
```

**Good:**
```javascript
if (!hasChecklist || !hasMedia) {
  throw new ConflictError("VALIDATION_FAILED", "Checklist and at least one photo are required to complete a visit.");
}
```

### 32.3 Repositories only, for Mongoose

**Bad:**
```javascript
// visit.service.js
import Visit from "../models/Visit.js"; // ❌ direct model import in service
const v = await Visit.findOne({ /* ... */ });
```

**Good:**
```javascript
// visit.service.js
import * as visitRepo from "../repositories/visit.repo.js";
const visit = await visitRepo.findByIdForCaregiver(visitId, caregiverId);
```

### 32.4 Constants over string literals

**Bad:**
```javascript
if (user.role === "admin") { ... }
if (visit.status === "completed") { ... }
```

**Good:**
```javascript
import { ROLES, VISIT_STATUS } from "../config/constants.js";
if (user.role === ROLES.ADMIN) { ... }
if (visit.status === VISIT_STATUS.COMPLETED) { ... }
```

### 32.5 Never lose user work (forms)

**Bad:**
```javascript
function onSubmit(values) {
  api.post("/parents", values).catch(() => setForm({})); // clears the form on error ❌
}
```

**Good:**
```javascript
async function onSubmit(values) {
  try {
    await api.post("/parents", values);
    toast.confirm("Parent added");
  } catch (err) {
    setFieldErrors(err.fields); // keep the form; highlight fields
  }
}
```

### 32.6 Palette discipline

**Bad:**
```jsx
<button style={{ backgroundColor: "#315A67" }}>Save</button>
<div className="bg-[#E7F0F2]">…</div>
```

**Good:**
```jsx
<Button variant="primary">Save</Button>
<div className="bg-primary-soft">…</div>
```

### 32.7 Correlation ID discipline (logs)

**Bad:**
```javascript
logger.warn("subscription activated"); // no context, no correlation id ❌
```

**Good:**
```javascript
logger.info("subscription.activated", {
  correlationId: req.correlationId,
  subscriptionId: sub._id,
  actorId: req.user.userId,
});
```

### 32.8 Sensitive fields, once

**Bad:**
```javascript
// scattered per-controller redaction
res.json({ ...user, careNotes: "***" });
```

**Good:**
```javascript
// crypto and log redaction driven by config/sensitiveFields.js
// The user endpoint just returns the record; select:false and the response formatter do the rest.
respond.ok(res, { user });
```

### 32.9 Async discipline

**Bad:**
```javascript
async function activateAll(ids) {
  await Promise.all(ids.map(activate)); // unbounded concurrency on an outside call ❌
}
```

**Good:**
```javascript
async function activateAll(ids) {
  for (const id of ids) {
    await activate(id); // ordered; backpressure honest; safe at MVP volume
  }
}
```

### 32.10 Testing the offline queue

**Bad:**
```javascript
test("visit dedup", () => {
  expect(true).toBe(true); // ❌ placeholder
});
```

**Good:**
```javascript
test("second sync of the same clientVisitId returns the existing visit", async () => {
  const first  = await api.completeVisit(payload);          // clientVisitId: X
  const second = await api.completeVisit(payload);          // clientVisitId: X
  expect(second.data.visit._id).toEqual(first.data.visit._id);
  expect(second.status).toBe(200); // not 201
});
```

---

*End of Document 23 — RozVisit Engineering and Coding Standards*
