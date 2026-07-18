# RozVisit — Testing and Quality Assurance Strategy
### Document 22

**Sources:** Documents 00–20. Testing was touched on in Doc 07 §28 (the 12-check acceptance script), Doc 08 §27 (the pyramid mapping), Doc 09 §27 (the test placement in the folder tree), and Doc 20 §28 (test cases per error code). This document consolidates them and completes what was missing.
**Labels:** Everything here is confirmed unless marked *(Assumption)*, *(Recommendation)*, or *(Open)*.

---

## 1. Testing Philosophy

Six principles. Every rule below serves one of these.

1. **Test the promises, not the plumbing.** The tests that matter most are the ones that prove the requirements — the airplane-mode visit, the consent-declined path, the completion rule, the 10-second emergency deadline. These are the promises the product makes.
2. **Fast enough to run every commit.** A test suite that developers avoid running is a suite that catches nothing. Unit tests are milliseconds; integration seconds; end-to-end minutes. If any layer gets slow, we cut it, not compromise its passing.
3. **Real behavior over mocked behavior.** Repositories are mocked in unit tests because that is what makes services testable. Everything else runs against real code — real Mongoose (in memory), real Express routes, real React DOM.
4. **The highest-risk code gets the heaviest tests.** The offline queue and the field-encryption utility get more test attention than any single feature (Doc 08 §28, Doc 10 §26).
5. **Tests are documentation.** A test file for `VisitService` reads like a specification of what visits do; a new developer learns the module by reading its tests.
6. **Green means safe to ship.** If tests are flaky, we fix the flake or delete the test — a "just re-run it" culture is how bugs escape.

---

## 2. Test Pyramid

The confirmed pyramid (Doc 08 §27), with concrete tools now attached:

```
                       ▲
                       │
                   E2E (Playwright)
              (~30 tests, minutes, pre-release + main branch)
                       │
              Integration (Supertest + in-memory MongoDB)
                (~80–120 tests, ~30 seconds, every commit)
                       │
                Unit (Jest + fake repos, React Testing Library)
              (~300–500 tests, ~10 seconds, every commit)
                       │
                       ▼
```

**Distribution rule:** roughly 70% unit / 20% integration / 10% E2E by count. E2E carries the acceptance script (Doc 07 §28); it does not try to cover every branch.

---

## 3. Unit Testing

**Tools:** Jest (server + client), `@testing-library/react` for React components, `mongodb-memory-server` used at the integration layer only (repositories are faked in unit tests, per Doc 10 §Service layer rules).

**What we unit-test:**
- **Services** — every business rule (allowance math, completion gating, consent gating, subscription state machine, grace transitions). Fake repositories injected; no database.
- **The scheduler** with fake clocks — visit generation and grace transitions produce the right output for a given date, with boot catch-up covered.
- **Utilities** — `crypto.js` round-trips, `AppError` subclasses, response formatter, logger redaction.
- **Client hooks** — `useOfflineQueue`, `useOnlineStatus`, `useCamera` (with browser APIs mocked).
- **The offline queue and sync worker** — the heaviest coverage in the client: append, dedupe by `clientVisitId`, retry states, sync order, failure paths.
- **Design system components** — StatusBadge maps every status to color + label (Doc 15 §28); FormInput preserves value on error.

**What we do not unit-test:**
- Routes (integration tests cover them end-to-end through middleware).
- Mongoose models directly (their strict validation runs during integration).
- Third-party SDKs.

**Speed target:** the full server unit suite runs under 10 seconds locally.

---

## 4. Integration Testing

**Tools:** Supertest against the Express `app`, `mongodb-memory-server` for a real MongoDB, real Mongoose schemas, real middleware chain. External services (Cloudinary, Firebase, email) are mocked at the interface layer (`interfaces/*.impl.js` swapped for test doubles).

**What we integration-test — organized by the requirement it proves:**

| Requirement | Integration test |
|---|---|
| The middleware order (Doc 09 §7) | A test that hits a protected route with wrong role → 403 before validation runs; with a bad body but wrong role → still 403, not 422 (order preserved) |
| Ownership ring (PRV-004) | A client cannot read another client's parent — 403, not 404 |
| Response envelope (Doc 12 §7–8) | Every route returns the correct `{ success, data }` or error shape; correlation id present |
| Rate limits (SEC-005) | Auth routes reject the N+1 attempt with 429 and `Retry-After` |
| Consent gating (FR-014) | Visit completion refused with `CONSENT_REQUIRED` on an unconsented profile |
| Allowance enforcement (FR-030) | Fourth weekly visit rejected with `ALLOWANCE_EXCEEDED` on Standard |
| Completion rule (FR-045) | Completion without media rejected; with a gallery-sourced media rejected; with valid `in_app_camera` media accepted |
| Offline dedupe (Doc 11 §21) | Same `clientVisitId` synced twice returns 200 with the existing record |
| Approval gate (FR-081) | Admin approval refused with `STATE_INVALID` when any gate is incomplete |
| Audit events (FR-082, AUD-004) | Every admin mutation writes a matching `auditEvents` row; opening an application writes `cnic.viewed` |
| Notification path (FR-090–093) | Firing `visit.completed` triggers the right channels; a failing channel moves to `retrying` then `failed`; the admin flag surfaces |

**Speed target:** the full integration suite runs under 30 seconds locally.

---

## 5. API Testing

Handled by the integration layer above (Supertest hits the routes exactly as a client would). What's specific to "API testing" as a discipline:

- **Schema drift check** *(Recommendation)*: at build, generate `openapi.yaml` from the validators (Doc 12 §Part E) and fail CI if it disagrees with a checked-in copy — spec and code cannot drift.
- **Every code in the catalogue is produced by a test** (Doc 20 §13). If a code exists in the catalogue but no test elicits it, the code is either dead or untested — both are review-blocking.
- **Pagination invariants:** every list endpoint returns at most `LIMITS.PAGE_MAX`; without a `before` cursor, returns the first page; with a `before`, returns strictly older items.

---

## 6. Database Testing

- **Schema tests** run at the integration layer against real Mongoose: strict mode rejects unknown fields; enums enforced; required fields enforced.
- **Index tests** — every list query in a repository is `explain()`-checked to confirm an index is used and no collection scan occurs. *(Recommendation — a small utility that walks the repos in test mode and asserts index usage; wins a lot of long-term safety.)*
- **Append-only guard** — a test that tries to update a history array element in place fails at the schema save-guard (Doc 11 §26).
- **Geospatial** — a caregiver assignment query with the 2dsphere index returns candidates within the area.
- **TTL** — the refresh token TTL logic tested with fake clocks in the unit layer (MongoDB's actual TTL sweeper is not tested — it is the DB's job).

---

## 7. Authentication Testing

Owned by Doc 13; the test set:

- **Uniform response rule (Doc 13 §2):** wrong email vs wrong password vs unverified email — same message text and shape, timing within 20 ms of each other on a warm process.
- **Token flow:** login issues 15-min access + 7-day refresh; refresh renews access; logout revokes; reset revokes all sessions.
- **Rotation** (if adopted at build): a used refresh token cannot be replayed; the old one dies on the first refresh.
- **Verification gates:** login on unverified account → `VERIFY_EMAIL_FIRST`; caregiver `applied` account can log in but cannot reach visit routes (403).
- **Rate limit and progressive delay:** brute-force protection kicks in per Doc 13 §20–21.
- **Reset link:** single-use; expires at 30 minutes; expired link → `STATE_EXPIRED` (410).

---

## 8. Authorization Testing

- **Role ring:** every protected route has a "wrong role → 403" integration test.
- **Ownership ring:** every route that returns family-scoped data has an "another user's id → 403" test.
- **Permission ring:** an admin without a scoped permission → 403 with the permission name in the message.
- **Audit ring:** each admin mutation writes the expected audit row; opening an application writes `cnic.viewed`.

---

## 9. Socket Testing (Phase 2)

Owned by Doc 19 §30; consolidated here:

- **Handshake auth:** invalid token → connection refused.
- **Room join rules:** attempting to join `parent:<not-owned-id>` is refused; correct rooms are joined server-side on connect.
- **Emit fan-out:** an emergency raised in the service fires `emergency.raised` to `client:<owner>`, `parent:<parentId>`, and `admin:ops` — and to none of the wrong rooms.
- **Reconnect + missed-event fetch:** disconnect for 60 s; on reconnect, missed emergencies are fetched via the API (Doc 19 §23).
- **10-second deadline (NFR-006):** end-to-end measurement of `emergency.raised` from service call to socket delivery, run on the paid production tier (AD-12 in force).

---

## 10. Frontend Component Testing

**Tools:** `@testing-library/react`, `@testing-library/user-event`, Jest.

**What we test:**
- **Design system components** — StatusBadge/status coverage; FormInput error-preserves-value; Modal focus trap and Escape close; Toast auto-dismiss.
- **Visit family components** — CameraCapture: no gallery affordance is ever rendered (a test that walks the DOM asserts no `<input type="file">` exists in that tree); ChecklistForm: keyboard reaches all mood targets with correct accessible labels; SyncStateBar: displays every state.
- **The api.js wrapper** — silent refresh happens once on TOKEN_EXPIRED; response envelope decoded correctly; correlation id surfaced in error paths.
- **Guarded routes** — a caregiver in `applied` state routes to `/care/status`, not `/care/today` (FR-003).

---

## 11. End-to-End Testing

**Tool:** Playwright (confirmed).

The E2E suite is the **12-check acceptance script from Doc 07 §28** as executable tests — each carries the stable ID (AC-01..AC-12) so this document and Doc 07 never drift. Plus a small set of high-value flows.

| ID | E2E scenario | Proves |
|---|---|---|
| **AC-01** | Client registers → verifies email → creates parent with map pin → selects plan → admin activates with paymentRef → client schedules visits within allowance | FR-001/002, FR-010, FR-020–023, FR-030 |
| **AC-02** | Allowance exceeded rejects the extra slot with the limit shown | FR-030 |
| **AC-03** | Caregiver applies → admin verification pipeline completes → caregiver sees Today | FR-003, FR-080/081, FR-040 |
| **AC-04** | First visit runs consent step; declined path closes visit no-fault, pauses the profile | FR-013/014, FR-036 (Tariq) |
| **AC-05** | Completion refused without media; gallery upload impossible; camera capture proceeds | FR-042, FR-045, SEC-012 |
| **AC-06** | **Airplane-mode visit** — the Saima path end-to-end; late sync retains correct capture/upload times | FR-043/044, NFR-005 |
| **AC-07** | Feed shows completed visit with media and summary; access-controlled URLs | FR-050, FR-053, SEC-008 |
| **AC-08** | Missed visit appears honestly with reason | FR-052 |
| **AC-09** | Admin audit log accumulates every admin action taken during the test | FR-082, AUD-004 |
| **AC-10** | Caregiver portal usable in under 3 s on 2 GB / throttled 3G | NFR-002 (manual device pass) |
| **AC-11** | Privacy policy is linked in the app | PRV-001 |
| **AC-12** | All screens use the mandatory palette and status color+label pairing | ACC-001, Doc 15 |

Additional E2E scenarios worth writing:
- The uniform auth response (wrong email / wrong password / unverified) — same UI message.
- Form recovery — submit → error → values preserved and first error focused.
- Correlation id appears on the Unexpected Error panel (test-only route triggers a controlled crash).

**Speed target:** full E2E suite under 5 minutes on the main branch.

---

## 12. Accessibility Testing

**Tools:** `@axe-core/playwright` for automated checks; keyboard-only manual pass on release branches.

- Every E2E scenario has automated axe rules checked at key screens (Feed, Visit Flow, Application Detail, Login).
- One full E2E run is executed keyboard-only *(Recommendation)* — every action reachable without a mouse.
- Contrast rules from Doc 15 §5 are structurally enforced (the accent-is-not-for-text rule), not just tested — the design system prevents the failure.

---

## 13. Responsive Testing

- Playwright runs the acceptance suite at three viewports:
  - **360×740** (Bilal's phone — caregiver-portal primary target)
  - **768×1024** (tablet)
  - **1440×900** (desktop admin)
- Visual regression snapshots at each viewport for the core screens (Feed, Today, Visit Flow, Applications Queue, Admin Overview) *(Recommendation — snapshot tests where they add value; if flaky, we cut them without regret)*.

---

## 14. Security Testing

The security-specific tests, mapped to Doc 18:

- **Injection prevention** — a payload with MongoDB operators in a string field is treated as a string, not an operator (mongo-sanitize behavior).
- **XSS** — any string that reaches a rendered element with script content is escaped by React; a test tries `<script>alert(1)</script>` in a note field and asserts it appears as text.
- **CSP** — the served portals include the CSP header with the expected directives.
- **Same-message rule** — as in §7 above.
- **Media source flag** — a request to complete a visit with `sourceFlag: "gallery"` is rejected.
- **Audit for CNIC** — opening an application always writes `cnic.viewed`, even if the underlying media load fails.
- **npm audit** — CI gate; no unresolved high/critical.

---

## 15. Performance Testing

- **Micro-benchmarks in unit tests** — the allowance computation and the feed query stay within a stated budget on a representative dataset (100 visits per parent).
- **Feed load** — an integration test asserts one query for the first page (PERF-001).
- **NFR-001 target** (read responses under 300 ms p95) — measured at production launch on real infrastructure, not simulated locally.
- **NFR-002 target** (caregiver portal interactive under 3 s on 3G) — Playwright's network throttling emulation as a signal in CI; a real device pass is the authoritative check.

---

## 16. Load Testing

**Not at MVP.** Pilot volume (tens of users, hundreds of visits per month) does not justify the ceremony. Load testing joins at **Phase 2** with the AD-12 hosting move:

- **Tool** *(Recommendation)*: k6 — Node-friendly, scriptable, free.
- **Scenarios:** feed reads at 50 concurrent clients; simultaneous emergency broadcasts (5 in a minute); the admin dashboard under a burst of flag events.
- **Pass criteria at Phase 2:** feed p95 stays under 500 ms; emergency deadline stays under 10 s under load; no error-rate spike above 2%.

---

## 17. Cross-Browser Testing

Per Doc 07 §8 the target matrix is the latest two versions of Chrome, Safari, Firefox, Edge. Playwright runs the acceptance suite on all four browser engines (Chromium, WebKit, Firefox — Edge shares Chromium's engine, so Chromium coverage is enough for Edge). Manual smoke on iOS Safari and Android Chrome on a real device before every release.

## 18. Mobile Testing

- **Playwright device emulation** for iPhone 12 and Pixel 5 in the E2E suite — decent proxy, not a full substitute.
- **Real-device smoke on a budget Android** (the Bilal test, 2 GB RAM) before every production release. This is the check that catches what emulation misses (real weak-signal behavior, real camera differences).
- **The offline set** — airplane mode on a real device is the definitive check for FR-043.

---

## 19. Regression Testing

- The E2E acceptance suite runs on every push to `main` (Doc 10 §22).
- On a bug fix, a test proving the bug — written before the fix — becomes a permanent regression test. This is a policy, not just a habit: no bug fix ships without a test that would have caught it.
- The unit + integration suite is fast enough to run pre-commit; developers who want a local hook get one, but the CI gate is what matters.

## 20. Smoke Testing

- **After every deploy**, a Playwright smoke script runs against the deployed URL: login as the seeded admin, seeded caregiver, seeded client; open Feed / Today / Applications; log out. *(Recommendation — a 5-check post-deploy smoke as part of the CI pipeline.)*
- **On production**, the smoke uses a dedicated smoke-only account, never a real user's data.

---

## 21. User Acceptance Testing

- **Phase 0 (before any code):** the founder does five families' worth of work manually. The learnings feed into Phase 1 acceptance criteria — this is the earliest, cheapest UAT.
- **Phase 1 UAT:** the same five families use the MVP end-to-end. UAT sign-off happens on the founder's own review, framed by the 12 acceptance checks (Doc 07 §28) executed against real data.
- **Caregiver UAT:** the pilot caregivers (Bilal-shaped) run a full day with the Visit Flow; feedback is a first-class issue-source *(Recommendation — a small weekly review in Phase 0–1)*.
- **UAT is where the human questions live** — copy tone, empathy of missed-visit messages, the "does this feel like surveillance?" question about consent copy. Test suites do not answer these.

---

## 22. Test Environments

Three environments, each with a defined test posture:

| Environment | Purpose | Test posture |
|---|---|---|
| **Local** | Developer work | Full unit + integration suites run locally; E2E as needed |
| **Production (MVP)** | Real users | Smoke script post-deploy; no test data ever touches real records |
| **Staging (Phase 2 onward)** | Pre-production checks | Full E2E on staging before promotion to production |

At MVP there is no staging (AD-9, Doc 08 §29). The named replacement: extra care with the smoke script + the ability to redeploy the last-good commit in minutes. The moment real families are live, staging is added.

---

## 23. Test Data

**Seed script** (`scripts/seed.js`, Doc 10 §9, Doc 11 §23):
- One admin, one verified caregiver, one client with known passwords **only in development** — production boot refuses these accounts (env-guard flag).
- One consented parent profile in Rawalpindi with realistic care notes.
- One active subscription with plan snapshot.
- A week of visits in mixed states (scheduled, completed with media, missed with reason, parent-declined, one flagged for upload delay).

**Factories** in `server/tests/helpers/factories.js`:
- `makeUser({ role })`, `makeParent({ withConsent })`, `makeVisit({ status })` — small functions that produce valid objects with sensible defaults, override anything.
- No hard-coded ObjectIds in tests; every id is generated per test to keep isolation.

**Test data hygiene:**
- Tests never point at production.
- The seed script is idempotent — re-running it in dev never breaks state.
- Personal data in seeded records is obviously fictional ("Amina Bibi" is a personas name, not a real one); tests use `test+<n>@rozvisit.example`-style emails, never real addresses.

---

## 24. Mocking

**Server-side:**
- **Repositories** are faked in unit tests — the seam that makes services testable (Doc 09 §10).
- **Outside services** are swapped at the interface layer: `channel.email.js` → a fake that records calls; `media.cloudinary.js` → a fake that returns a synthetic permit and reference. The tests exercise the interface's contract, not the vendor.
- **Time** is faked with Jest's fake timers for scheduler and grace-transition tests.

**Client-side:**
- **`fetch` (or the api.js wrapper)** is mocked with response fixtures in component tests.
- **Browser APIs** — `getUserMedia`, `navigator.onLine`, IndexedDB — are stubbed with lightweight fakes in the hooks that own them; the hooks themselves are the boundary, so components don't need to know.

**What we never mock:** middleware order, response formatting, Mongoose validation. Those run for real, always — bugs there are precisely what integration tests must catch.

---

## 25. Coverage Targets

Coverage is a signal, not a goal. The targets:

| Area | Target | Rationale |
|---|---|---|
| Services (business rules) | 100% of critical paths; ≥85% branch overall | The requirements live here |
| Offline queue + sync | 100% of paths | Highest risk (Doc 08 §28) |
| `crypto.js` | 100% | Security-critical (Doc 10 §26) |
| Utilities (respond, logger, AppError) | ≥90% | Small, foundational |
| Design system components | ≥90% behavior; snapshot for status coverage | The palette rule is enforced structurally |
| Controllers | ≥70% (they are thin) | Integration covers them further |
| Repositories | ≥70% via integration + explicit index checks | Real DB is the truth |
| Overall server | ≥80% | A ceiling, not a floor; branches beat lines |

A coverage drop is a review discussion, not an automatic block — the question is always "which specific line got harder to test and why?"

---

## 26. CI Quality Gates

The CI pipeline (Doc 10 §22, Doc 08 §26) gates every merge to `main`:

1. **Lint** — Oxlint + Prettier (formatting is a lint check).
2. **Unit** — Jest server + client. Zero failures.
3. **Integration** — Supertest + in-memory MongoDB. Zero failures.
4. **Build** — Vite client build succeeds; server bundle valid.
5. **npm audit** — no unresolved high/critical.
6. **OpenAPI drift** *(Recommendation)* — generated spec matches the checked-in copy.

On the main branch after merge:
7. **E2E** — Playwright suite runs; failure blocks the deploy.
8. **Deploy** to Render.
9. **Smoke** — post-deploy Playwright script hits the deployed URL.
10. **Health check** — `/health` green.

Any red step blocks the release; there is no "override and merge" convention.

---

## 27. Bug Severity

Aligned with the Doc 18 §34 incident severity so triage is consistent across "user reports" and "we noticed a bug":

| Severity | Meaning | Response window |
|---|---|---|
| **SEV-1** | Any of: sensitive data exposed; a paying family cannot use the product; the emergency system fails (Phase 2); consent recording lost | Hotfix within 24 hours; incident-response runbook engaged |
| **SEV-2** | A significant flow is broken for a specific user path; a paying family sees false or missing proof | Fix within the current release cycle (days) |
| **SEV-3** | Minor UI defect, copy issue, non-critical console error | Next planned release (weeks) |
| **SEV-4** | Cosmetic / cleanup | Batched into maintenance work |

Every bug fix at SEV-1 or SEV-2 lands with a regression test (Section 19).

---

## 28. Release Criteria

A release is ready when all of these are true:

1. All CI gates (Section 26) green on the release commit.
2. The E2E acceptance suite passes on staging (Phase 2+) or on a local preview build against a fresh seeded database (MVP).
3. A real-device smoke pass on a budget Android for anything touching the caregiver portal.
4. `docs/` reflects every canonical change in the same PR (Rule 8, Doc 00).
5. No known SEV-1 or SEV-2 open against the release scope.
6. The production security checklist (Doc 18 §37.2) is green if this is a production release.
7. The founder (or, later, the release owner) has recorded sign-off in `docs/releases/<version>.md` linking to the CI run and the E2E results.

**Release cadence:** small, frequent, boring. A release that carries dozens of unrelated changes is a release that hides bugs. Fixed weekly targets are avoided — releases go out when the release criteria are green, not on a calendar.

---

## 29. Production Verification

After a production deploy:

1. **Automated smoke** (Section 20) passes.
2. **Manual walkthrough** of the changed area on a real client, caregiver, or admin account — five minutes, real fingers.
3. **Sentry watched** for a 30-minute window after deploy: any new error type is a candidate rollback signal.
4. **Uptime monitor** green; the emergency deadline metric within budget (Phase 2+).
5. **A one-line entry** in `docs/releases/<version>.md`: what shipped, when, who verified, any follow-ups.

**Rollback posture:** at MVP, "rollback" is redeploy of the last known-good commit on Render — measured in minutes. The mental model: it is always OK to rollback; the cost is a delay, not a defeat.

---

## 30. Example Test Cases per Major Module

The catalogues below are illustrative — the definitive tests are written alongside the code. Each test names its layer.

### Auth (Module 1)

- **Unit:** password rule accepts "sundar123"; rejects "12345678" (common-password screen); bcrypt cost from constants.
- **Integration:** register → email verification → login → refresh → logout.
- **Integration:** wrong email vs wrong password → identical message and shape.
- **Integration:** reset revokes all refresh tokens for the user.
- **E2E:** the login → Feed happy path for a client.

### Profile / Consent (Module 2)

- **Unit:** ProfileService refuses to complete a visit whose parent is `pending_consent`.
- **Integration:** POST /parents/:id/consent with `state: "given"` and a recordingRef flips the profile to `active`; declined closes the visit no-fault; withdraw pauses the profile.
- **E2E:** the Tariq path — decline captured, client sees the honest message, no further visits happen.

### Plan / Subscription (Module 3)

- **Unit:** state machine — legal transitions accepted; illegal transitions throw `STATE_INVALID`.
- **Unit:** grace transitions with fake clocks; a period end 5 days ago on `active` transitions to `paused` after grace.
- **Integration:** admin activation requires `paymentRef`; double activation returns `STATE_INVALID`.
- **E2E:** client picks Standard → admin activates with a paymentRef → client can schedule three visits and no more.

### Visits (Module 4, the biggest catalogue)

- **Unit:** allowance computed from actual visits, not a counter; adding a fourth this week is refused.
- **Unit:** completion rule — no media → refused; gallery source → refused; valid → accepted.
- **Unit:** parent-declined flow closes visit, marks no-fault, notifies client honestly.
- **Unit (offline queue):** append with `clientVisitId`; re-append with same id is a no-op; states transition saved → waiting → sent.
- **Integration:** `POST /visits/:id/complete` with a captured `clientVisitId` returns 200 the first time and 200 with existing record the second time.
- **E2E (airplane mode):** the Saima path — capture offline, sync later, capture/upload times display correctly on the client feed.
- **E2E:** the Feed opens under 300 ms after first paint on a warm process (best-effort local check; NFR-001 measured on real infra).

### Errands (Module 5, Phase 2)

- **Unit:** over-limit request awaits client approval; receipt photo required to complete.
- **Integration:** the receipt photo must have `sourceFlag: "in_app_camera"`.

### Emergency (Module 6, Phase 2)

- **Unit:** the guided flow reduces to one confirm step; taps only; no free text required to raise.
- **Integration + Socket:** raising an emergency fires `emergency.raised` to the right rooms; four-channel fan-out records per-channel delivery.
- **E2E (Phase 2):** the 10-second deadline measured end-to-end on the paid production tier (AD-12).

### Admin (Module 7)

- **Unit:** approval refused unless all three gates true.
- **Integration:** every admin mutation writes an `auditEvents` row; opening an application writes `cnic.viewed`.
- **Integration:** assignment suggests the previous caregiver first (continuity).
- **E2E:** the Nasreen path — approve → visit auto-arrives on the caregiver Today list on next sync.

### Notifications (Module 8)

- **Unit:** template renders per type with `channels` and `tone`; the `loud` tone appears only on `emergencyRaised`.
- **Unit:** idempotency key dedupes the same event fired twice.
- **Integration:** a failed channel moves to `retrying` then `failed`; the admin flag view surfaces it.
- **E2E:** a completed visit's calm push reaches the client's list and does not carry sensitive detail in the title.

---

*End of Document 22 — RozVisit Testing and Quality Assurance Strategy*
