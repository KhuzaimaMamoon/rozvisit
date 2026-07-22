# RozVisit — Error Handling and Validation
### Document 20

**Sources:** Documents 00–19. This document consolidates error handling and validation into one operating manual; where earlier documents own a detail, it cross-references rather than restates.
**Labels:** Everything here is confirmed unless marked *(Assumption)*, *(Recommendation)*, or *(Open)*.

---

## 1. Error-Handling Philosophy

Six principles. Every rule below serves one of these.

1. **Errors are data, not shame.** A missed visit, a failed upload, a validation refusal — these are facts the system records honestly and shows plainly. The design system's honesty rule (Doc 15 §1) is the error philosophy in one line.
2. **Never lose user work.** Forms preserve drafts; the caregiver's offline queue survives crashes; retries are automatic; nothing that took effort is deleted by an error (ERR-005, FR-011, FR-043, FR-047).
3. **Expected vs unexpected are treated differently, on purpose.** An allowance-exceeded refusal is a real answer the user sees in their own words. A null-pointer bug is a red flag the user should never see the details of (ERR-002 vs ERR-003).
4. **Loud only for emergencies.** No red toast for a validation error; no alarm sound for a retry. Emergency is the one sanctioned alarm (Doc 15 §26, Doc 19).
5. **Retry, then flag — never silently drop.** The notification dispatcher, the media upload path, and the sync worker all obey this pattern (FR-091, FR-046).
6. **Boring shapes on the wire.** One envelope, one error format, standard HTTP codes, stable error codes. Clients decode once and never guess (Doc 12 §7–8).

---

## 2. Backend Error Classes

One small class hierarchy in `server/src/utils/AppError.js`. Every thrown error is one of these — never a bare `Error` in application code.

```javascript
// server/src/utils/AppError.js  (shape only)
class AppError extends Error {
  constructor(code, message, { status = 500, fields, cause, expose = false } = {}) {
    super(message);
    this.code = code;          // stable UPPER_SNAKE (Section 13)
    this.status = status;      // HTTP status (Section 14)
    this.fields = fields;      // per-field messages, only on validation
    this.cause = cause;        // original error for logging (never sent to users)
    this.expose = expose;      // whether the message may be shown to users as-is
  }
}

// Expected-error subclasses (expose: true, human messages)
class ValidationError    extends AppError { /* 422 VALIDATION_FAILED,  fields */ }
class UnauthenticatedError extends AppError { /* 401 UNAUTHENTICATED */ }
class TokenExpiredError  extends AppError { /* 401 TOKEN_EXPIRED */ }
class ForbiddenError     extends AppError { /* 403 FORBIDDEN */ }
class NotFoundError      extends AppError { /* 404 NOT_FOUND */ }
class ConflictError      extends AppError { /* 409 DUPLICATE | STATE_INVALID | ALLOWANCE_EXCEEDED | CONSENT_REQUIRED */ }
class GoneError          extends AppError { /* 410 STATE_INVALID for expired links */ }
class RateLimitedError   extends AppError { /* 429 RATE_LIMITED, retryAfter */ }
class UpstreamError      extends AppError { /* 502/503 UPSTREAM_FAILED / MAINTENANCE */ }
class InternalError      extends AppError { /* 500 INTERNAL — never exposed */ }
```

Two rules the classes enforce structurally:
- `expose: true` on expected errors means the human `message` is safe to render as-is to the user. `expose: false` (the default on `InternalError` and anything derived from an outside failure) means the user sees the generic message, never the detail.
- `cause` is for logging only. It never appears in the API response — the response formatter (`utils/respond.js`) drops it.

## 3. Operational Errors

Things that will happen in a healthy system — expected refusals and transient failures the code was designed for:

| Situation | Class + code | HTTP |
|---|---|---|
| Weekly slot count exceeds plan | `ConflictError("ALLOWANCE_EXCEEDED")` | 409 |
| Second attempt to activate a subscription | `ConflictError("STATE_INVALID")` | 409 |
| Registration email already exists | `ConflictError("DUPLICATE")` | 409 |
| Consent not yet given on the parent profile | `ConflictError("CONSENT_REQUIRED")` | 409 |
| Verification link expired | `GoneError("STATE_INVALID")` | 410 |
| Rate limit exceeded on auth routes | `RateLimitedError("RATE_LIMITED")` | 429 |
| Cloudinary upload permit request while Cloudinary is down | `UpstreamError("UPSTREAM_FAILED", { cause })` | 502 |
| Planned downtime (Phase 2+) | `UpstreamError("MAINTENANCE")` | 503 |

All operational errors log at `warn` level with structured context, not `error`.

## 4. Programmer Errors

Bugs — the class of thing users should never see the details of:

- Null references, unhandled promise rejections, type mismatches, wrong arguments passed to services.
- Handled by the global error handler as `InternalError`: `500 INTERNAL`, generic user message, full stack trace logged at `error` level and captured by Sentry (OBS-003).
- **Deployment discipline:** a spike of programmer errors after a deploy is a rollback signal, not a "just watch it" signal.

## 5. Validation Errors

The API validation flow (Doc 12 §16): every endpoint names a schema in `validators/`; the `validate` middleware runs it before the controller. Failures throw `ValidationError` with per-field messages:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Please fix the highlighted fields.",
    "fields": {
      "email": "Please enter a valid email address.",
      "phone": "Include your country code, for example +971 50 123 4567."
    }
  }
}
```

Rules for validation error messages: written in the same warm plain English as the rest of the UI (Doc 15 §2), showing an example when the format is ambiguous, never "invalid input!" — never with an exclamation mark.

Every interactive form uses the same recovery pattern. On submit, the form shows a sticky/in-view summary naming each problem field (for example, “Please fix: Phone, Password.”), highlights every invalid control, and places an actionable requirement directly beneath it. The first invalid control is scrolled into view and focused automatically. Format messages state how to correct the value (country-code phone example, 13-digit CNIC, letter-and-number password, and so on). A generic top banner is reserved for server/network failures; it does not replace field-specific guidance.

Two layers, as Doc 09 §11: request validation catches shape and format; schema validation (Mongoose strict mode) catches anything that slipped past. Business rules (allowance, consent gating, completion requirements) live in services and throw `ConflictError`, not `ValidationError` — they are not shape errors.

## 6. Authentication Errors

Owned by Doc 13; consolidated here for the codes:

- Wrong email or password → `UnauthenticatedError("UNAUTHENTICATED")`, 401, with the deliberate uniform message across wrong-email and wrong-password (Doc 13 §2).
- Access token expired → `TokenExpiredError("TOKEN_EXPIRED")`, 401 — the client wrapper retries once through refresh silently (Doc 12 §4).
- Invalid or missing token → `UnauthenticatedError("UNAUTHENTICATED")`.
- Verification email not yet confirmed → `ForbiddenError("VERIFY_EMAIL_FIRST")`, 403.
- Account disabled → `ForbiddenError("ACCOUNT_DISABLED")`, 403 with a support-path message.

## 7. Authorization Errors

- Wrong role → `ForbiddenError("FORBIDDEN")`, 403.
- Not the owner of the resource → `ForbiddenError("FORBIDDEN")` (deliberately not 404 — Doc 12 §5's honesty-over-obscurity rule).
- Admin missing a scoped permission → `ForbiddenError("PERMISSION_REQUIRED")` with the permission name in the message.

## 8. Database Errors

- Connection lost at boot → the app refuses to start (Doc 09 §11); the incident owner is paged by the uptime monitor.
- Connection lost mid-flight → `UpstreamError("DB_UNAVAILABLE")`, 502; retries at the platform-connection layer, not per-request.
- Duplicate key on a unique index (e.g., email, `clientVisitId`) → mapped to the right operational code: registration duplicate → `DUPLICATE`; visit dedupe → `200` with the existing record (Doc 12 §14).
- Validation error from Mongoose strict mode → `InternalError` (this means our validators missed something — treat it as a bug, not a user problem).
- Timeout on a slow query → `UpstreamError("DB_TIMEOUT")`, 504.

## 9. External Service Errors

Every outside call has a timeout and a defined failure path (INT-001):

| Service down | Effect |
|---|---|
| Cloudinary | Upload permit call returns `UPSTREAM_FAILED`; the caregiver's queue retries automatically; the visit is not marked complete until at least one media reference exists |
| Firebase (push) | Push retries per the schedule (Doc 19 §13); in-app and email carry on; failure eventually flags to admin (FR-091) |
| Email provider | Same as push |
| Twilio, WhatsApp (Phase 2) | Same as push; for the emergency broadcast, the other three channels continue independently (FR-071) |
| Maps / geocoding | The manual pin drop works without it (FR-010); no user-visible error unless the user tries to search an address |

The pattern: **the core record is never blocked by an outside failure**. Records save first; side effects retry; failures become data.

## 10. Socket Errors (Phase 2)

Owned by Doc 19 §25. Highlights:
- Connection errors do not surface as user alerts. The UI shows durable data.
- On the emergency screen only, a small "reconnecting" chip appears during a socket blip *(Recommendation)*.
- Server-side socket errors log at `warn` (transient) or `error` (repeated) and never crash the process (a handler that throws is caught by a socket-level try wrapper).

## 11. File Errors

The camera and upload path (FR-042–046):

| Failure | Behavior |
|---|---|
| Camera permission denied | Clear inline instructions with a link to system settings; no lost work — the checklist can still be completed and the visit closed via the "Parent declined" or "missed" paths only if applicable, otherwise the visit remains in progress until permission granted |
| Camera hardware unavailable | Same as denied |
| Device storage full | Warned before capture; capture blocked until space frees |
| Upload permit request fails (Cloudinary down) | Queued locally; the caregiver sees "waiting to send" state; automatic retry when service returns |
| Upload past the 24-hour flag limit | Visit gains `flagged` status with reason `UPLOAD_DELAYED`; admin queue surfaces it; the caregiver is NOT punished (SEC-011 posture, FR-046) |
| Wrong content type (someone crafting a request) | Rejected by validation — media must be image/video with `sourceFlag: "in_app_camera"` (SEC-012) |

## 12. API Error Response Schema

The one shape (Doc 12 §7–8), formalized:

```json
{
  "success": false,
  "error": {
    "code": "STABLE_MACHINE_STRING",
    "message": "Human sentence, safe to show as-is when code is expose:true.",
    "fields": { "fieldName": "Per-field message." },
    "correlationId": "req_2026-07-21_a3b7c9d1"
  }
}
```

- `code` never changes for a given semantic reason — it is the contract.
- `message` is UI-ready English for `expose:true` codes; a generic sentence for others.
- `fields` appears only on `VALIDATION_FAILED`.
- `correlationId` appears on every error response — see Section 26.

**Programmer-error production body (never shows detail):**

```json
{ "success": false, "error": {
  "code": "INTERNAL",
  "message": "Something went wrong on our side.",
  "correlationId": "req_2026-07-21_a3b7c9d1"
}}
```

## 13. Error Codes

The full stable catalogue. Codes here are the contract — adding a code is a documented change; renaming one is a breaking change.

### 13.1 Auth codes

| Code | HTTP | Meaning |
|---|---|---|
| `UNAUTHENTICATED` | 401 | Missing/invalid credentials or token |
| `TOKEN_EXPIRED` | 401 | Access token expired — client refreshes silently |
| `VERIFY_EMAIL_FIRST` | 403 | Account exists but email not yet verified |
| `ACCOUNT_DISABLED` | 403 | Admin has disabled this account |
| `FORBIDDEN` | 403 | Wrong role, or not the owner of the resource |
| `PERMISSION_REQUIRED` | 403 | Admin lacks a scoped permission |

### 13.2 Validation and shape

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_FAILED` | 422 | Input shape/format wrong — `fields` populated |
| `UNSUPPORTED_MEDIA` | 415 | Wrong `Content-Type` |
| `PAYLOAD_TOO_LARGE` | 413 | Body over the platform limit *(mostly relevant for media permit misuse)* |

### 13.3 Resource state

| Code | HTTP | Meaning |
|---|---|---|
| `NOT_FOUND` | 404 | Unknown id (or reserved future path) |
| `STATE_INVALID` | 409 | Illegal state machine transition (or expired link at 410 variant) |
| `DUPLICATE` | 409 | Uniqueness conflict (email, active subscription per parent, etc.) |
| `ALLOWANCE_EXCEEDED` | 409 | Weekly plan limit reached — the message shows the limit + upgrade path |
| `CONSENT_REQUIRED` | 409 | Parent profile paused/pending consent; visit cannot complete |
| `STATE_EXPIRED` | 410 | Verification or reset link past its window |

### 13.4 Rate limiting and abuse

| Code | HTTP | Meaning |
|---|---|---|
| `RATE_LIMITED` | 429 | Too many attempts — `Retry-After` header set |

### 13.5 Upstream and infrastructure

| Code | HTTP | Meaning |
|---|---|---|
| `UPSTREAM_FAILED` | 502 | An outside service failed — retry-safe |
| `DB_UNAVAILABLE` | 502 | Database not reachable |
| `DB_TIMEOUT` | 504 | Query took too long |
| `MAINTENANCE` | 503 | Planned downtime (Phase 2+) |

### 13.6 Generic

| Code | HTTP | Meaning |
|---|---|---|
| `INTERNAL` | 500 | Unhandled — the user sees only the generic message |

**Adding a code:** must be paired with a service or middleware change and a test. The mapping code → HTTP is a table in `utils/respond.js` — one place to review.

## 14. HTTP Status Usage

Summary of when each status appears:

| Code | Used for |
|---|---|
| 200 | Success on reads and state changes |
| 201 | Resource created |
| 400 | Not used at MVP — malformed JSON caught by the parser as 400 by Express default; considered a client-side bug, standard message |
| 401 | Missing/invalid/expired token — `UNAUTHENTICATED`, `TOKEN_EXPIRED` |
| 403 | Wrong role, not owner, not verified, disabled, missing permission |
| 404 | Unknown resource, reserved Phase 2 path |
| 409 | State/uniqueness conflicts |
| 410 | Expired one-time links |
| 413 / 415 | Payload too large / unsupported media |
| 422 | `VALIDATION_FAILED` |
| 429 | Rate limited |
| 500 | Unhandled (`INTERNAL`) |
| 502 / 503 / 504 | Upstream / maintenance / timeout |

## 15. Logging Rules

- Structured JSON logs to stdout (OBS-001, Doc 18 §23).
- **`error`** for programmer errors (`InternalError`, `500`); **`warn`** for operational errors that are answers, not bugs (401/403/409/410/422/429); **`info`** for successful business events (visit completed, subscription activated); **`debug`** for development only.
- **Every log line carries the correlation id** (Section 26) — grep-friendly root cause tracing.
- Redaction is driven by `sensitiveFields.js`: passwords, tokens, secrets, care notes, CNIC data, addresses, and media contents never appear in any log line (Doc 18 §23).
- Failed logins are logged (`warn`) but not written as `auditEvents` (Doc 13 §23).

## 16. User-Safe Messages

The `expose: true` messages ready for direct display. Copy rules (Doc 15 §2 voice):

- Plain and warm — "Please check your email" not "Verification pending."
- Never blame — "That email and password don't match" not "You entered the wrong password."
- Show the example on format-ambiguous fields — "Include your country code, for example +971 50 123 4567."
- Show the limit and next step — "Your Standard plan includes 3 visits per week. Upgrade to add more."
- Honest gaps — "Your photos are still uploading" not silence.
- Never an exclamation mark, never all caps.

## 17. Developer Diagnostics

Not shown to users. Available in logs and Sentry:

- Full stack trace.
- The correlation id — the link between what the user experienced and what the logs show.
- Request context: userId (if authenticated), route, method, chosen validator.
- The `cause` chain on wrapped upstream errors.
- The exact `AppError` code and status.
- No PII beyond internal userId (analytics/logging privacy, Doc 18 §30).

## 18. Frontend Error Boundaries

- One top-level React error boundary per portal, plus one at the app root as final safety.
- Behavior on unhandled render errors: show the Unexpected Error panel (Doc 16 S-41, Doc 17 Brief 15 — calm, retry, contact-support), and report to Sentry with the same correlation id if the error originated from an API call.
- **The caregiver portal's Visit Flow** has its own boundary that preserves the local draft: if VisitFlow crashes, the checklist and camera captures survive in IndexedDB; on reload the caregiver reopens exactly where they left off (ERR-004, FR-047).

## 19. Form Validation

- Inline on blur, full pass on submit (Doc 15 §21).
- First error scrolled into view and focused.
- Field keeps its value on error (ERR-005).
- Client validation shows the same messages the API would — the schemas are defined server-side and the client copies the messages *(Recommendation — a small shared strings map to avoid drift; if that adds too much friction, an integration test catches drift instead)*.
- Client validation is a convenience; the server is the law (Doc 09 §1). No client-only rule exists.

## 20. Field-Level Feedback

- Error state (Doc 15 §20): input border in Emergency, message below in Emergency at `text-xs`.
- Helper text vs error text share the slot — the error replaces the helper on failure, restores it on fix.
- Required fields are unmarked (Doc 15 §21) — optional fields say "(optional)".
- Multi-field errors (e.g. slot conflict) show as an alert band above the form when they're not attributable to a single field.

## 21. Retry Behavior

- **API calls (client):** the `api.js` wrapper retries once on `TOKEN_EXPIRED` via silent refresh (Doc 12 §4). It does not retry on other 4xx — those are answers. It retries once on network errors with a small backoff, then surfaces the error.
- **Notifications:** the dispatcher's channel retry schedule (Doc 19 §13).
- **Media upload:** the caregiver sync worker retries with backoff until the 24-hour flag threshold.
- **Outside service SDKs:** the SDK's own retries are usually sufficient; explicit timeouts wrap them.
- **What we do not retry:** anything with side effects and no idempotency key (Doc 12 §14 explains why the two places that need it have it structurally).

## 22. Offline Behavior

Owned by Doc 09 §9 and Doc 19 §24. The error angle: offline is not an error state in the caregiver portal — the SyncStateBar treats it as a normal working mode (ERR-004). Client and admin portals show a muted offline banner (Doc 16 S-42), but the app continues to render cached content.

The offline invariants:
- No queued write is ever lost.
- Every queued item shows its state.
- `clientVisitId` uniqueness makes re-sends idempotent (Doc 11 §21).
- Capture and upload times are both stored (FR-044) so late syncs remain verifiable.

## 23. Global Error Handling

The Express chain (Doc 10 §7):

```
request logging → rate limit (auth routes) → body parsing → requireAuth → requireRole → validate → controller → errorHandler
```

- Any thrown `AppError` reaches the error handler and is formatted per Section 12.
- Any non-`AppError` becomes `InternalError` with the original as `cause`.
- Unhandled promise rejections are captured process-wide by a boot handler and treated as programmer errors (Sentry, `error` log, no user impact).
- The process does not crash on caught errors; only unrecoverable startup failures (config, secrets, DB) terminate the process — deliberate, so Render's restart is used only when it should be.

## 24. Empty States

Not errors — the absence of data. Handled by the EmptyState component (Doc 15 §37). Every list and screen defines its empty copy in Doc 16. The one rule the error catalogue enforces: **a failure to load is not an empty state.** If a request failed, the screen shows a retry chip, not "no results."

## 25. Recovery Actions

Every error the user sees offers a way forward:

| Error class | Recovery action |
|---|---|
| Validation | Fix the highlighted fields |
| Auth (wrong credentials) | Try again; Forgot password |
| Expired verification/reset link | One-tap resend |
| Duplicate email at registration | Log in; Reset password |
| Allowance exceeded | See plan limit; Upgrade plan (a link, never a hard sell) |
| State invalid | The screen shows what the current state actually is |
| Rate limited | Try again after `Retry-After` |
| Upstream / DB | Retry; contact support if it persists |
| Unexpected (500) | Retry; contact support |
| Offline (caregiver) | Not an error — continue working; sync will happen automatically |
| Offline (client/admin) | Retry chip when the network returns |

**Never a dead end** — every screen leads somewhere.

## 26. Correlation IDs

The single most useful diagnostic addition to this spec:

- Every incoming request gets a correlation id at the request-logging middleware: `req_<yyyy-mm-dd>_<random8>`, human-eyeballable.
- It flows through: log lines, error responses, Sentry events, notification records (as a field), audit events.
- The client displays it in the Unexpected Error panel — a support message that includes it lets the incident owner find the trace in seconds.
- **How it helps:** a user says "I got an error at 3:15" → search logs by their correlation id → the exact request, its middleware chain, the service call, the DB query, and the outside call are all visible together.
- No PII is embedded in the id; it is opaque.

## 27. Monitoring Alerts

Alert rules (OBS-005, extended here):

| Signal | Threshold | Alert channel |
|---|---|---|
| Error rate (5xx) | > 2% over 5 minutes | Email + push to incident owner |
| Programmer errors (`InternalError`) | > 10/hour | Sentry summary |
| Emergency deadline breach (Phase 2) | Any breach of 10 seconds | Loud alert to the incident owner |
| Notification `failed` state | > 5/hour of the same type | Admin flag view + email |
| `RATE_LIMITED` spike on auth routes | > 100/hour | Possible attack; email to incident owner |
| Health endpoint failing | 2 consecutive failures | Uptime monitor pages incident owner |
| Backup restore drift | Restore test not run in 45 days | Calendar reminder |

At MVP, "incident owner" is the founder. Post-hire, the operations lead shares.

## 28. Testing Requirements

**Unit (Jest):**
- Every `AppError` subclass: shape, status, expose flag, code.
- The response formatter: every code → correct HTTP status + shape.
- Validators: each schema's required rules, format checks, per-field messages.
- Service business-rule errors: allowance math throws `ALLOWANCE_EXCEEDED`; completion without media throws the right `ConflictError`; consent gating throws `CONSENT_REQUIRED`; state machine guards throw `STATE_INVALID`.
- Log redaction: sensitive field values do not appear in any log call.

**Integration (Supertest + in-memory MongoDB):**
- Every error code above returned end-to-end from a real request through the middleware chain.
- Middleware order: role check before validation before controller; error handler catches everything and formats.
- Duplicate handling: the same offline visit sync twice returns 200 with the existing record (Doc 12 §14 idempotency).
- Rate limits: exceeding the auth limiter returns 429 with `Retry-After`.
- Correlation id appears on every error response and matches the log line for that request.

**End-to-end (Playwright):**
- **The 12 acceptance checks** (Doc 07 §28) — especially the airplane-mode visit and the consent-declined path, which prove ERR-004 and FR-036 as user journeys.
- Form recovery: submit with an error → the entered values remain, first error is focused (ERR-005).
- Offline banner appears in the client portal and disappears on reconnect; the caregiver portal does not show it.
- The Unexpected Error boundary shows on a forced render error (a test-only route) and includes a correlation id.
- The uniform auth response: wrong email vs wrong password vs unverified account — same message text (Doc 13 §2).

**Chaos-style spot checks (manual, pre-release):**
- Kill the Cloudinary permit endpoint mid-visit → queue continues, retries, resumes.
- Kill the email provider → subscription-activated email goes to `retrying` → `failed` → admin flag surfaces.
- Deploy with a missing env var → `env.js` refuses to boot; the deploy fails loudly (Doc 18 §19).

---

*End of Document 20 — RozVisit Error Handling and Validation*
