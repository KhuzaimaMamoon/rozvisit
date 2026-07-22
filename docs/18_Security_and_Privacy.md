# RozVisit — Security and Privacy Specification
### Document 18

**Sources:** Documents 00–17, especially the SRS security/privacy sets (Document 07 §15–16), the architecture (Document 09 §22), the auth spec (Document 13), the database design (Document 11), and the folder ownership rules (Document 10).
**Labels:** Everything here is confirmed unless marked *(Assumption)*, *(Recommendation)*, or *(Open)*.
**Boundary with Document 13:** Document 13 owns the mechanics of identity and access. This document owns threats, controls, data handling, encryption, dependencies, incident response, and the go-live gate.

**Phase separation used throughout:**
- **MVP** — must be true on Phase 1 launch.
- **Production** — must be true when real users are paying and the emergency system is live (from Phase 2, gated by AD-12).
- **Future compliance** — needs a specific event to trigger (foreign entity, meaningful UK/EU client share, regulation).

---

## 1. Security Objectives

Ranked. Higher wins when they conflict.

1. **Never leak sensitive elder data.** Home addresses, care notes, photos inside homes, CNICs. A single breach here is worse than a year of downtime — that is the honest calibration.
2. **Keep the emergency path trustworthy.** Alerts arrive, timelines are honest, evidence is preserved.
3. **Prove every action.** Every admin action, every access to sensitive data, every state change of every subscription and visit — recorded as queryable evidence, not just log lines.
4. **Protect availability at MVP-appropriate cost.** Zero-cost free tiers are accepted; the emergency system moves off them before it goes live.
5. **Make the honest thing the easy thing.** The design system's honesty rules (proof states, missed-visit copy, no dark patterns) are part of the security posture: a product that trains users to trust it must never surprise them.

---

## 2. Threat Model

**Who we defend against:**

| Actor | Motivation |
|---|---|
| External opportunist | Credential stuffing, low-effort exploits, scraping |
| Targeted attacker | Access to a specific parent's data (a stalker, an estranged relative) |
| Insider curiosity or abuse | An admin viewing records they shouldn't |
| Vendor compromise | Cloudinary, Atlas, Render, email provider |
| Physical access | A stolen caregiver phone |
| Regulatory investigator | Legal request for user data |

**Method of thinking:** STRIDE at MVP is more than we need; the practical framing that fits this product is *"what could betray a family's trust?"*. The threats above are ordered by that lens, not by cost or frequency. A single stalker succeeding is more devastating here than a million routine scrapes.

---

## 3. Assets to Protect

| Rank | Asset | Why it matters |
|---|---|---|
| A1 | Parent addresses and locations | The most direct path to real-world harm |
| A2 | Care notes and medical context | Sensitive medical-adjacent data |
| A3 | Visit media (photos and video inside homes) | Photos inside a home are inherently intimate |
| A4 | Consent recordings | Evidence of the parent's own words |
| A5 | Emergency timelines | Truth in a crisis |
| A6 | Caregiver CNICs and verification documents | Government ID data |
| A7 | Client payment references | Payment identifiers (not card data — we never hold that) |
| A8 | Auth credentials and tokens | Standard, but standard |
| A9 | Audit records | The evidence of evidence |

Everything else — non-sensitive UI text, aggregate counts — is standard business data.

Parent map-share URLs are classified with A1: the original `locationShareUrl` is encrypted at rest and mechanically redacted from logs. Caregiver-scoped responses receive only the parsed pin needed for an assigned visit; the UI turns that point into an outbound Google Maps directions link.

---

## 4. Trust Boundaries

Drawn concretely on the deployment picture (Document 09 §23):

| Boundary | Between |
|---|---|
| B1 | The public internet ↔ the backend |
| B2 | The backend ↔ MongoDB Atlas |
| B3 | The backend ↔ each outside service (Cloudinary, Firebase, email, Twilio, WhatsApp) |
| B4 | User devices ↔ Cloudinary (direct media upload) |
| B5 | The Express request pipeline: unauthenticated ↔ authenticated |
| B6 | Client/caregiver roles ↔ admin role |
| B7 | Admin baseline ↔ scoped admin permissions |
| B8 | The application ↔ evidence collections (append-only, not editable) |

Every boundary has an enforcement (Section 8+) and, where relevant, an audit (Section 24).

---

## 5. Attack Surfaces

| Surface | Notes |
|---|---|
| Auth endpoints | The most-attacked surface — see §16 |
| The API in general | Every route is a surface — see §8 |
| The signed media upload path | Custom permits — see §25 |
| Cookies (refresh only) | Path-scoped, HttpOnly, SameSite=Strict — see §18 |
| Admin routes | Elevated blast radius — see §7 and §28 |
| Third-party service consoles | Cloudinary, Atlas, Render, GitHub, Firebase — see §19–20 |
| Caregiver device (offline queue on IndexedDB) | Physical/device threat — see §22 |
| Email delivery | Verification and reset links — see §16 and §17 |
| Dependency chain | npm supply chain — see §26 |

---

## 6. Authentication Security

Owned by Document 13; the highlights this document cares about:

- **Uniform responses and timing** on login, forgot, and resend so account existence cannot be probed (§16 here refers to Document 13 §2).
- **No account lockout** — hard lockout is a denial-of-service lever; rate limits + progressive delay + reset-revokes-everything do the job (Document 13 §22).
- **No admin impersonation** — disallowed as a feature (Document 13 §24).
- **Phone OTP arrives at Phase 2** (Document 13 §11) and *(Recommendation)* MFA is mandatory for admins the day a second admin exists (Document 13 §25).

---

## 7. Authorization Security

Three enforcement rings (Document 09 §14; Document 13 §17):

1. **Role ring** — middleware refuses wrong-role requests before any logic (SEC-003).
2. **Ownership ring** — clients see own families only; caregivers see assigned visits only, with address visibility windowed (PRV-004).
3. **Audit ring** — admin mutations and sensitive-document reads write to `auditEvents` automatically (FR-082, AUD-004).

**Ownership violations return `403`, not `404`** (Document 12 §5) — deliberate honesty over obscurity, since ids are not guessable.

**Admin permissions are scoped from day one** (SEC-010): even with one admin, the permission list exists (Document 13 §16), so least-privilege at team growth is data entry, not development. The current permission set is `applications.review`, `subscriptions.manage`, `visits.oversee`, `visits.archive`, `flags.resolve`, `caregivers.directory.view`, `caregivers.cnic.view`, `caregivers.manage`, `clients.directory.view`, and `clients.manage`. New admin accounts receive this set by default; an explicitly scoped admin may be granted a narrower set.

The caregiver directory requires `caregivers.directory.view` and returns only non-sensitive operational fields. CNIC is absent from all bulk responses. An explicit CNIC reveal additionally requires `caregivers.cnic.view` and writes the `cnic.viewed` audit event. The client directory requires `clients.directory.view`.

The same directory/oversight permissions gate administrative archive and reactivate actions for their entity. These actions are soft lifecycle changes only: evidence is never hard-deleted, archive reasons are audit context, archived records are excluded from active operational lists, and every mutation writes a dedicated `*.archived` or `*.reactivated` audit event.

---

## 8. API Security

Every endpoint passes the fixed middleware order (Document 09 §7): request logging → rate limit (auth routes) → body parsing → requireAuth → requireRole → validate → controller → errorHandler. Reordering is a review-blocking defect (Document 10 ownership).

Additional API rules:
- All routes JSON-only; unknown fields rejected by strict validation.
- Every list endpoint enforces pagination (default 20, max 100) — no accidental data dumps.
- Every mutation runs through the service layer; nothing writes to Mongoose from controllers (Document 10 layer table).
- Error responses use one shape, and production 500s hide internals (ERR-001, ERR-003).

---

## 9. Database Security

- **Connection secrets** live only in Render's environment settings and local `.env` (never in code, never in the repo).
- **Least-privileged database user** — the connection string uses a role with rights to the app's collections only (no cluster-admin privileges from the app). *(Recommendation — verified at Atlas setup.)*
- **IP allowlist on Atlas** — Render's outbound IPs allowlisted; open access rejected. *(Recommendation — enabled at setup; where Render's IPs aren't static on the free tier, wildcard is accepted at MVP with a documented limitation and revisited at Phase 2 alongside the AD-12 hosting move.)*
- **`select: false`** on password hashes and every ciphertext field (Document 11 §26) — sensitive values are never returned by accident.
- **Strict schemas** everywhere — unknown fields rejected (Document 11 §1).
- **Append-only evidence collections** enforced at the schema layer by a save-guard that refuses in-place edits to history arrays (Document 11 §26). Structural, not disciplinary.
- **Backups** are encrypted by Atlas at rest by default *(Assumption — verified at setup, per BCK-001)*.

---

## 10. Input Validation

Two layers (Document 09 §11):

1. **Request validation** in middleware, using named schemas per endpoint (Document 12), rejects bad input with `422 VALIDATION_FAILED` and per-field messages.
2. **Schema validation** in Mongoose (strict mode) is the last line — enums, types, and required fields are enforced at write.

Business rules (allowance limits, completion requirements, consent gating) live in services, not schemas — schemas guard shape, services guard meaning.

Special validation rules:
- Every visit's media entries must carry `sourceFlag: "in_app_camera"` (SEC-012).
- Every visit completion requires a checklist and ≥1 media (FR-045) — refused with a human message.
- GPS coordinates are numeric with plausible ranges; anomalies flag, not reject (SEC-011, deliberate).

---

## 11. Injection Prevention

- **Database injection:** requests are parsed by Express, validated to strict schemas, then converted to Mongoose queries by the repository layer — there is no raw query construction from user strings anywhere. *(Recommendation — an `express-mongo-sanitize`-equivalent middleware layer as belt-and-braces; adopted at build.)*
- **Command injection:** the backend never shells out with user input at MVP. If any future feature does (image processing scripts, for example), it uses argument arrays, never string concatenation.
- **Server-side template injection:** no server-side HTML templating at MVP — React renders on the client; emails use a small allowlist of substitutions in typed templates.
- **Open redirect:** the only redirects at MVP are `HTTP → HTTPS` at the platform layer. Any future in-app redirect target must be validated against an allowlist.

---

## 12. XSS Prevention

- **React's JSX escaping** blocks the common script-injection paths by default (SEC-007).
- **`dangerouslySetInnerHTML` is banned** in application code by a review rule; the design system never needs it. Any exception requires a comment naming the reason.
- **Access token in memory only, not localStorage** (Document 09 §13) — an XSS bug cannot exfiltrate a session by reading storage.
- **Content-Security-Policy** header at the edge:
  - `default-src 'self'`
  - `img-src 'self' data: https://res.cloudinary.com`
  - `connect-src 'self' https://res.cloudinary.com https://api.cloudinary.com` (upload path)
  - `script-src 'self'` — no third-party scripts in portals (a stated build rule from Document 13 §27)
  - `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`.
  - *(Recommendation — final CSP finalized at build; the shape above is the target.)*

---

## 13. CSRF Considerations

- The only cookie is the refresh cookie: production uses `HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`. Local HTTP development omits only `Secure` so refresh-based session restoration can be tested; deployed environments always retain it. `SameSite=Strict` blocks cross-site sending; `Path` scoping limits it further (Document 13 §5).
- All state-changing endpoints require the `Authorization: Bearer` header, which cross-site forms cannot set — the practical CSRF answer for a token-header SPA (Document 13 §27).
- No traditional session cookies used for state changes → no need for CSRF tokens at MVP.

---

## 14. CORS Policy

- Production browser traffic is same-origin at the portal boundary: Vercel serves the portals and rewrites `/api/v1/*` to Render. Access tokens remain memory-only and travel in `Authorization: Bearer`; the role-scoped refresh cookie remains `HttpOnly; Secure; SameSite=Strict` and path-scoped to `/api/v1/auth`.
- Render retains an exact `APP_BASE_URL` origin allowlist as defense in depth and for controlled diagnostics. Wildcard CORS is never permitted.
- Cloudinary uploads happen from the browser directly to Cloudinary's domain; the CORS policy needed is the one at Cloudinary's end, configured to allow the app's origin.

---

## 15. Rate Limiting

- **MVP:** in-memory per-IP+email limiter on auth routes (SEC-005, Document 13 §21) — 10 attempts / 15 minutes *(Recommendation value)*, `429` with `Retry-After`.
- **Production:** general API limiting via Redis when the Phase 4–5 Redis migration lands; the limiter middleware is the seam and does not change.
- **What we do not rate-limit at MVP:** the feed and detail reads (unnecessary at pilot volume; would harm real users under bursts).

---

## 16. Brute-Force Prevention

- Same-message login responses in the same time (Document 13 §2).
- Rate limits (§15).
- Progressive per-account delay after 5 consecutive failures — a small server-side pause on each further attempt (Document 13 §20). Invisible to a human, real cost to a script.
- No lockout (deliberate — §6 above).
- Failed logins are counted in structured logs and feed OBS alerting; they are not written as `auditEvents` — they are noise with volume, not evidence (Document 13 §23).

---

## 17. Password Security

Owned by Document 13 §7–10. In summary: bcrypt cost ≥10 via one AuthService; `passwordHash` is `select: false`; rules shown before submit; no forced periodic rotation; reset revokes all sessions; common-password screening *(Recommendation)*.

The one thing this document adds:

- **A yearly cost-factor review** as a maintenance-calendar item (Document 13 §7 recommendation): bcrypt transparently re-hashes on login if the stored cost is below the current setting, so raising the factor is a background migration.

---

## 18. Token Security

Full spec in Document 13 §3–5. Highlights:
- Access tokens in memory only (Document 09 §13).
- Refresh tokens in `HttpOnly; Secure; SameSite=Strict` path-scoped cookies, hashed server-side in `refreshTokens`, individually revocable.
- Rotation on refresh *(Recommendation)* with the documented plain-refresh fallback for MVP simplicity.
- Verification and reset tokens are random (not JWT), stored hashed with expiries, single-use.

---

## 19. Secrets Management

- **The env contract lives in `env.example`** (Document 10 §8): required variables named, no values.
- **`env.js` refuses to boot** if any required variable is missing — a missing-secret deploy fails loudly at boot, not quietly at first login.
- **Production secrets live in Render's environment settings** and Atlas — never in the repo, never in Docker images (when Docker arrives at Phase 2).
- **Development secrets live in a local `.env`** that `.gitignore` catches; every developer machine has its own, per-environment.
- **Rotation:** JWT secrets and encryption keys are rotatable behind interfaces — `crypto.js` can hold a "key id" alongside the ciphertext so a key rotation adds a new key and rewrites-on-write, without a stop-the-world migration. *(Recommendation — key id field on encrypted values; adopted from build if simple, else added when key rotation is first needed.)*
- **The client has no secrets at all** — anything the browser holds is public by definition.

---

## 20. Environment Variable Rules

Concrete rules for the file listed in Document 10 §8:

- `PORT`, `NODE_ENV` — non-secret; may appear in logs.
- `MONGO_URI` — secret; never logged; connection error messages redact its password portion.
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — two separate secrets; a leaked access secret must not forge refresh tokens.
- `FIELD_ENCRYPTION_KEY` — 32-byte random key material, base64-encoded; used only via `crypto.js`.
- `CLOUDINARY_*`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `BREVO_API_KEY` — active vendor credentials; scoped to the least privileges needed. `RESEND_API_KEY` remains a dormant secret reference and receives the same handling.
- **No secret appears in URLs, in error messages, in analytics events, or in support tickets.** The logger's redaction list (see §23) includes every secret name mechanically.

---

## 21. Encryption in Transit

- **TLS 1.2 or higher** on every endpoint (SEC-006). Render manages certificates; HTTP requests redirect to HTTPS at the platform layer.
- **HSTS** header at the edge: `max-age=15552000; includeSubDomains` after a stable production period *(Recommendation — enable after a stable week to avoid an accidental lock-in during MVP tuning)*.
- **No mixed content** ever: media URLs from Cloudinary are HTTPS-only; the CSP `img-src` allowlist enforces this.
- **Between backend and outside services**: Cloudinary, Firebase, Atlas, email — all HTTPS/TLS by their SDKs' defaults; no code overrides.

---

## 22. Encryption at Rest

- **Database disk encryption** at Atlas by default *(Assumption — verified at setup)*.
- **Field-level encryption** for the sensitive-field list (SEC-004, PRV-003/004): care notes, addresses text, CNIC data, consent recording references, and any note fields on visits and errands. Implementation via one `crypto.js` utility — AES-256-GCM, key from `FIELD_ENCRYPTION_KEY`, per-record IVs. Ciphertext stored `select: false` (Document 11 §26).
- **Media encryption at rest** relies on Cloudinary's provider-level encryption *(Assumption — verified in Cloudinary settings)*. Access control (SEC-008) is the primary defense here; encryption is depth.
- **Caregiver device (IndexedDB queue):** browser storage is not encrypted at rest by the browser. This is a real trust gap for the highest-risk field (a stolen unlocked phone can read the queue). Mitigation posture: the queue holds visit data for a short window only (hours to a couple of days); the design's flag-past-24h behavior naturally bounds it. *(Recommendation — evaluate the Web Cryptography API for queue-side encryption at Phase 2; the deferral is honest, not silent.)*

---

## 23. Logging Restrictions

- **Structured JSON logs** to stdout (OBS-001) — Render captures them; Sentry captures errors (OBS-003).
- **The sensitive-field list drives redaction mechanically** (Document 10 §7): the logger consults `sensitiveFields.js` and never emits values for those field names. This means a developer cannot log a `careNotes` or `locationShareUrl` value by mistake — the field is redacted by its name, wherever it appears in a log call.
- **Passwords, tokens, secrets, and media contents never appear in any log line**, ever.
- **Payment references are logged** (they are not card data) — needed for reconciliation.
- **Consent recording references are logged only when necessary for admin diagnosis** (e.g., following up on a specific support case that mentions the consent event) — routine notification, subscription, and visit-completion logging omits them. The reference identifier alone is not sensitive content, but treating it as *"log only when needed"* keeps the honesty rule intact: consent belongs to the parent, and the audit trail (Section 24) is the appropriate primary record for consent access.
- **Consent-recording playback** is available only to the owning client and an authorized admin.
  Playback links are minted per request with a short lifetime after an ownership check, and each
  request writes a `consent.recording_played` audit event. Audit detail never includes the
  recording reference or the signed URL.
- **Failed logins log the email attempted** (a security signal), but never the password attempted; success/failure booleans and rate-limit counters feed the alert rules.

---

## 24. Audit Logs

`auditEvents` documents (Document 11), not log lines — queryable evidence, per Document 09 §14.

Events written at MVP:
- Every admin decision (approve, reject, request info) — action, target, note (redacted per §23).
- Every subscription state change — actor, from-state, to-state, paymentRef where relevant.
- Every read of CNIC/verification documents (`cnic.viewed`, AUD-004).
- Enable/disable of any user account.
- Password reset completion (no token material, ever).
- All-session revocation with cause (reset / disable).

Access rule: audit is read-only through the admin surface at MVP (a query view is enough); production adds a proper audit report screen. Nothing has a UI to delete audit entries; the schema-level append-only guard applies.

---

## 25. File Upload Security

The signed direct-upload chain (Document 09 §17, Document 12 §15):

1. **`POST /visits/:id/media-permit`** verifies the caregiver is assigned to that visit → mints a short-lived Cloudinary signed permit, folder-scoped to `rozvisit/visits/<visitId>/`.
2. **The device uploads directly to Cloudinary** with that permit — files never touch the backend.
3. **The backend records references and times** on visit completion; `sourceFlag` must be `in_app_camera` (SEC-012) — gallery-uploaded content cannot pass validation.
4. **Serve via minted, access-controlled links** (SEC-008) with short lifetimes; the backend re-checks ownership before minting a view link.

Constraints: 50 MB per file (LIMITS), image/video only, max 5 files per visit *(Recommendation)*. Cloudinary transformations serve phone-sized versions to viewers (PERF-002); originals stay stored for evidence.

**MVP note on the queue side:** offline captures live briefly in IndexedDB before upload (§22) — the queue's contents inherit the same visit-scoped access model as the eventual upload.

---

## 26. Dependency Security

- **`npm audit` on every CI run**, high/critical findings fail the build. *(Recommendation — accepted as policy; adopted at build.)*
- **Monthly dependency review** as a maintenance-calendar item (Document 08 §54), prioritizing security patches immediately rather than batching.
- **Small, boring dependencies preferred** — the stack is deliberately mainstream (Express, Mongoose, React, Tailwind, Vite, Jest, Playwright, lucide, Recharts). No trendy micro-libraries chosen for style.
- **Lockfile committed** (`package-lock.json`); CI installs with `npm ci` for deterministic builds.
- **Supply-chain hygiene:** *(Recommendation)* enable Dependabot's security alerts on the repo from day one; consider signed commits when the workflow matures.

---

## 27. Socket Security

Applies only from Phase 2 (Socket.io joins the same process, Document 09 §12):

- The socket handshake verifies the same JWT access token; a socket without a valid token is refused.
- Rooms follow ownership — a client's socket joins rooms for their own parents only; caregiver sockets for their assigned visits; admins for the operations room.
- Message payloads are validated on receipt like any other input — a socket is not a shortcut around validation.
- Rate-limit socket messages per connection *(Recommendation — set at Phase 2 design).*
- Socket.io is not a general chat system; only the two confirmed jobs (emergency in-app broadcast, live admin views) send events (Document 09 §12).

---

## 28. Admin Security

The blast radius of an admin account is the largest in the system. Controls:

- Scoped permissions per admin from day one (§7), so no admin holds more than they need.
- Every admin action is audited (§24) — every read of sensitive documents included.
- The first admin exists via the seed script; subsequent admins are created only by an existing admin.
- **Impersonation disallowed** as a feature (Document 13 §24) — support diagnosis uses the admin's own oversight views on the user's data, with the same audit trail applying.
- **MFA for admins**: mandatory the day a second admin exists (Document 13 §25) *(Recommendation)*.
- **Admin sessions**: same JWT design, no special elevation — an admin is subject to the same reset-revokes-everything lever.
- **Admin device hygiene** *(Recommendation)*: an operations runbook line that admins do not sign in from shared devices, and always sign out on public networks.

---

## 29. Privacy Principles

Six principles, followed by every screen and every schema:

1. **Consent is a moment, not a checkbox.** The parent's own words, recorded, with their own choices captured (BR-025, FR-013).
2. **Dignity for the parent.** The interface, the copy, the caregiver's behavior — never "surveillance," always "help and company" (Document 15 §1).
3. **Least data by default.** A field exists only if a specific requirement names it.
4. **The parent may withdraw anytime.** Withdrawal pauses visits immediately (FR-014).
5. **Every access has a purpose.** Support "just looking around" is not a purpose; oversight of a specific case is.
6. **Truth in error.** Missed visits appear honestly, disputes are answered with evidence — the design system's honesty rule is a privacy control, not just a UX rule.

---

## 30. Data Minimization

- The linked-family-members field is stored but hidden until Phase 5 (FR-012) — reserved data, unused capability, and it stays that way.
- The access token carries `{ sub, role }` only — no personal data (Document 13 §3).
- The caregiver's `Today` list shows the parent's full name and address only inside the visit-visibility window (48h *(Recommendation)*, PRV-004).
- The client's proof feed shows the caregiver's first name only (privacy for the caregiver too — a subtle mutuality).
- Admin lists show emails and status, never care notes; opening a record is a distinct, audited action.
- Analytics events never include PII: `feed.opened` records that it opened, not by whom in the payload (userId is separate infrastructure).

## 31. Consent

Beyond FR-013 mechanics, this document adds:

- The privacy policy (PRV-001) states plainly what is collected, why, and who can see it (Document 03 §18).
- Consent choices are honored in downstream systems: if the parent said "no photos in the bedroom," the caregiver's checklist repeats the choice on every visit (FR-015).
- Consent withdrawal is a single, honest action for the client or admin — no friction beyond one confirmation (Document 16 S-14).
- **A second consent line for the caregiver's live selfie identity match arrives at Phase 3** (Document 08 §31); the parent-consent language expands to cover it then.

## 32. Data Retention

- **Evidence classes** (visits, consent recordings, audit, subscription history) kept whole for the life of the account and beyond anonymization (BR-027; Document 11 §16).
- **Media** kept for the duration of the account plus a defined period stated in the privacy policy *(Recommendation — 24 months post-cancellation; confirmed with the D-10 policy draft)*.
- **Notifications** prunable after 12 months *(Recommendation)* — convenience, not evidence.
- **Refresh tokens** self-delete via TTL when they expire.
- **Verification and reset tokens** delete on use or expiry.
- **Logs** rotate at the platform (Render/Sentry) per their tiers; nothing sensitive lands there in the first place.

## 33. Account Deletion

- The user's account-deletion request runs the privacy anonymization path (DATA-007, Document 11 §15): personal fields anonymized, evidence skeleton retained, all sessions revoked, login permanently impossible.
- The field-by-field anonymization map is authored in a small pre-launch addendum *(Open — carried from Document 11)*.
- **Response time to a deletion request:** 30 days maximum, stated in the privacy policy *(Recommendation)*.
- Cancellation of a subscription is **not** deletion — the account remains, evidence remains, the client can return.

---

## 34. Incident Response

A short, honest runbook — because a runbook that is too big is a runbook that is not followed.

**Roles at MVP:** the founder is the incident owner. Post-hire, the operations lead shares the role.

**Severity levels:**
- **SEV-1** — sensitive data possibly exposed; the emergency system failed; a hostile actor is inside.
- **SEV-2** — user-visible outage or a persistent bug that impairs a paying family.
- **SEV-3** — routine issues fixable at next release.

**The lever that always works** (Document 13 §27, footer): revoke all refresh tokens + force a password reset for the affected user or the whole population. Documented as a first response when in doubt.

**Steps (kept short on purpose):**
1. **Contain** — apply the lever above if credentials could be compromised; take the affected surface offline if that limits harm (a Render pause is one click).
2. **Preserve** — audit records, logs, Sentry events are frozen — do not clean up until Step 4.
3. **Communicate** — affected users are told, honestly, within 72 hours *(Recommendation)*; the language matches the design system's honesty rule.
4. **Investigate and fix** — the timeline (like an emergency timeline) is written as it happens.
5. **Learn** — a short written note (one page) after every SEV-1 or SEV-2, added to `docs/incidents/`. Not a blameless postmortem theater; a real record.

**External notification:** if the incident involves personal data of UK/EU users, notify per GDPR posture (Document 03 §18) even without a foreign entity — because we operate globally and the policy says so.

---

## 35. Backup Security

- Atlas backups are encrypted at rest by the provider *(Assumption — verified at setup)*.
- A restore test is run before every major release (BCK-003) — an untested backup is no backup.
- The restore procedure targets a temporary cluster, never overwrites production during a test.
- Access to restore controls is a distinct Atlas permission; only the founder holds it at MVP; a documented buddy holds it from Phase 2 *(Recommendation)*.
- Media in Cloudinary relies on provider redundancy; the database's media reference list is the completeness check — a small script (`scripts/verify-media.js` *(Recommendation)*) can walk references and confirm all resolve.

---

## 36. OWASP Top 10 — Where Each Risk Is Handled

The current OWASP list, mapped to sections here:

| OWASP risk | Handled by |
|---|---|
| A01 Broken Access Control | §7 (three rings), §8 (middleware order), tests exercise role refusals |
| A02 Cryptographic Failures | §21, §22, §17 (bcrypt), §18 (token discipline) |
| A03 Injection | §11 (Mongoose ORM, sanitize middleware, strict schemas) |
| A04 Insecure Design | The whole documentation series is the design record; §29 privacy principles are the ranked "insecure design → secure design" bridge |
| A05 Security Misconfiguration | §19–20 (secrets), §9 (Atlas config), §21 (HSTS/CSP), §14 (CORS) |
| A06 Vulnerable and Outdated Components | §26 (dependency policy, `npm audit` CI gate, monthly review) |
| A07 Identification and Authentication Failures | Document 13 in full; §16 brute-force; §17 password rules |
| A08 Software and Data Integrity Failures | §26 (lockfile, `npm ci`), §24 (audit as evidence), §35 (backup integrity checks) |
| A09 Security Logging and Monitoring Failures | §23–24 (structured logs + audit data), OBS-x, incident runbook §34 |
| A10 Server-Side Request Forgery | The backend does not fetch arbitrary URLs from user input at MVP; any future feature that does uses an allowlist |

---

## 37. Security Checklist

The concrete list a reviewer walks before approving a release.

### 37.1 MVP Checklist (must be true on Phase 1 launch)

- [ ] `env.js` refuses to boot without every required secret (§19).
- [ ] `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are separate, ≥32 bytes.
- [ ] `FIELD_ENCRYPTION_KEY` is set and used by `crypto.js` for every sensitive field named in `sensitiveFields.js`.
- [ ] `passwordHash` and all ciphertext fields are `select: false` in schemas.
- [ ] bcrypt cost ≥10 in the AuthService constant.
- [ ] Middleware order is exactly: rate limit (auth) → parse → auth → role → validate → controller → error handler.
- [ ] `dangerouslySetInnerHTML` is not used anywhere in the client.
- [ ] The one-shape response envelope is enforced by the response formatter.
- [ ] Access tokens are held in memory only; localStorage is not used for tokens.
- [ ] The refresh cookie is `HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`.
- [ ] The auth rate limiter is active on the four confirmed routes.
- [ ] All list endpoints require and enforce pagination limits.
- [ ] Camera capture UI has no gallery affordance; `sourceFlag` is set at capture; the validator refuses non-`in_app_camera` sources.
- [ ] Media upload permits are short-lived and folder-scoped per visit.
- [ ] Media serve endpoints re-check ownership before minting a link.
- [ ] Admin decision endpoint refuses approval when any gate is incomplete.
- [ ] Every admin mutation writes an `auditEvents` entry.
- [ ] The CNIC read endpoint writes `cnic.viewed`.
- [ ] The privacy policy and terms are published, linked in the app, and match §29–33.
- [ ] The 12 acceptance checks (Document 07 §28) pass, including the airplane-mode visit and the consent-declined path.
- [ ] `npm audit` in CI has no unresolved high or critical findings.
- [ ] A restore test has been performed at least once and documented.

### 37.2 Production Checklist (must be true before real users arrive)

- [ ] Hosting has left the sleeping free tier before the emergency system activates (AD-12).
- [ ] HSTS enabled after a stable production period.
- [ ] Sentry (or equivalent) is capturing unhandled errors and grouping them.
- [ ] Uptime monitoring hits `/health` on a defined interval; alerts route to a real inbox.
- [ ] Alert rules exist for the 10-second emergency deadline breach and >2% error rate over 5 minutes.
- [ ] CSP enforced on the served portals; no `unsafe-inline` scripts.
- [ ] Atlas backup schedule verified and retention set to 30 days.
- [ ] Dependabot security alerts enabled on the repo.
- [ ] The account-deletion anonymization map addendum has been authored and merged.
- [ ] The incident runbook lists the current incident owner and their backup.
- [ ] Admin MFA is active — mandatory from the day a second admin exists.

### 37.3 Future Compliance Checklist (triggered by named events)

- [ ] **Foreign entity registered** (Phase 4+): re-check Stripe onboarding requirements; register data-processor addenda with cloud providers; update the privacy policy owner.
- [ ] **Meaningful UK/EU client share**: formalize the GDPR posture (data protection officer designated or explained; SAR process documented; representative appointed if required); consider EU-region data residency (Decision D-11's revisit trigger).
- [ ] **Elder-care regulation appears in Pakistan**: legal review of the SOP set; verification and consent standards revalidated; caregiver classification revisited.
- [ ] **Second admin, third admin**: least-privilege permission sets checked against real duties; MFA enforced; access reviews scheduled.
- [ ] **Live video (Phase 3)**: Daily.co (or replacement) DPA on file; the parent-consent language extended to live selfie match; media retention re-stated.

---

## 38. Production Launch Security Gate

Launch is not a date — it is the moment every MVP checklist item (§37.1) is green *and* the four launch conditions below are met. Anything else is a soft launch to test users, not the production launch.

1. **The airplane-mode visit passes end-to-end** in the actual production environment on a real budget Android phone (the Bilal test, NFR-002 + FR-043–045).
2. **The uniform error responses are verified** by an adversarial pass against the auth endpoints (wrong email vs wrong password vs unverified account — same message, same shape, same timing).
3. **A restore drill** has run on a copy of production data within the last 30 days.
4. **The incident owner is contactable within one hour**, day or night — documented, with a backup.

Sign-off: the founder records the gate as passed in `docs/launch/` with the four evidence items linked (test run, adversarial pass notes, restore drill log, on-call arrangement).

---

*End of Document 18 — RozVisit Security and Privacy Specification*
