# RozVisit — API Specification
### Document 12

**Sources:** Documents 00–11, especially the route surface (Document 08 §18), the architecture rules (Document 09 §8), and the database design (Document 11).
**Labels:** Everything here is confirmed unless marked *(Assumption)*, *(Recommendation)*, or *(Open)*.
**Scope:** The complete Phase 1 (MVP) API. Phase 2 endpoints are listed by name at the end so their reserved paths are known, and are specified fully when Phase 2 begins.

---

# Part A — Conventions

## 1. API Principles

1. **One shape everywhere.** Every response uses the same envelope; every error uses the same format (ERR-001). Clients decode once.
2. **The server is the law.** Role, ownership, and validation are enforced server-side on every call (SEC-003); the UI hiding a button means nothing here.
3. **Honest states.** The API never pretends: uploads report queue states, missed visits carry reasons, payment states are explicit.
4. **Boring is correct.** Plural nouns, standard verbs, standard status codes. No cleverness a new developer must learn.
5. **Phase-gated surface.** Endpoints exist when their phase does. Reserved Phase 2 paths return `404` until then, not stubs.

## 2. Base URL Structure

```
Production:   https://<app-domain>/api/v1
Development:  http://localhost:5000/api/v1
```

One host serves the API and the portals (Doc 09 §8). Everything under `/api` is the API; everything else falls through to the SPA.

## 3. Versioning

- The version lives in the path: `/api/v1`.
- Breaking changes require `/api/v2`; `v1` keeps working during a stated overlap (Section 18). Additive changes (new optional fields, new endpoints) do not bump the version.

## 4. Authentication

- **Login** returns a short-lived access token (15 minutes) in the response body and sets a refresh token (7 days) as a `Secure; HttpOnly; SameSite=Strict` cookie (SEC-002).
- **Every protected call** sends `Authorization: Bearer <accessToken>`.
- **Refresh** (`POST /auth/refresh`) uses the cookie automatically; the client wrapper retries a `401 TOKEN_EXPIRED` once through refresh, silently (Doc 10 client `api.js`).
- Access tokens carry `{ sub: userId, role }` only — no personal data in the token (Doc 09 §13).

## 5. Authorization

Three rings, applied in order (Doc 09 §14):

1. **Role ring:** each endpoint names its allowed roles; wrong role → `403 FORBIDDEN`.
2. **Ownership ring:** clients reach only their own family's records; caregivers only assigned visits — enforced in services; violations also return `403` (never `404`-masking *(Recommendation — `403` chosen for honesty over obscurity; the resource ids are not guessable ObjectIds anyway)*).
3. **Audit ring:** admin mutations write audit events automatically; no header or flag needed.

## 6. Request Conventions

- JSON bodies, `Content-Type: application/json`. Dates in ISO 8601 UTC (`2026-07-21T05:00:00Z`).
- Field names camelCase, matching the data dictionary (Document 11).
- Unknown body fields are rejected by validation (strict schemas end-to-end).
- Ids are MongoDB ObjectId strings; the offline visit id (`clientVisitId`) is a client-generated string (Doc 11).

## 7. Response Conventions

Success:

```json
{ "success": true, "data": { ... } }
```

Lists add pagination info:

```json
{ "success": true, "data": { "items": [ ... ], "nextCursor": "2026-07-14T10:02:11Z" } }
```

`nextCursor` is absent when there is no further page.

## 8. Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ALLOWANCE_EXCEEDED",
    "message": "Your Standard plan includes 3 visits per week. Upgrade to add more.",
    "fields": { "scheduledAt": "Must be at least 12 hours from now" }
  }
}
```

- `code` is a stable UPPER_SNAKE machine string; `message` is the human sentence the UI may show as-is (ERR-002); `fields` appears only on validation errors.
- Production `500`s carry only `{ code: "INTERNAL", message: "Something went wrong on our side." }` (ERR-003).

**Common codes:** `VALIDATION_FAILED`, `UNAUTHENTICATED`, `TOKEN_EXPIRED`, `FORBIDDEN`, `NOT_FOUND`, `DUPLICATE`, `STATE_INVALID`, `ALLOWANCE_EXCEEDED`, `CONSENT_REQUIRED`, `RATE_LIMITED`, `INTERNAL`.

## 9. Pagination

Cursor pagination on time-ordered lists (Doc 11 §17): `?before=<ISO date>&limit=<n>`; default 20, max 100 (LIMITS). Admin tables may use `?page=&limit=` at MVP volume.

## 10. Filtering

Explicit whitelisted query parameters per endpoint (documented below). Unknown filter parameters are rejected — no generic query language.

## 11. Sorting

Fixed per endpoint (feed: newest first; today-list: by time ascending). No client-chosen sort at MVP — every allowed sort must map to an index (Doc 11 rule), so sorts are design decisions, not query options.

## 12. Searching

MVP has no text search (Doc 11 §18). Admin lookups filter by exact/prefix email via `?email=` on the admin lists.

## 13. Rate Limiting

- Auth endpoints (`/auth/login`, `/auth/register`, `/auth/forgot`): limited per IP+email (SEC-005). *(Recommendation — 10 attempts / 15 minutes; tuned at build.)*
- Exceeded → `429 RATE_LIMITED` with `Retry-After` header.
- General API limiting joins at Phase 2 with Redis; at MVP volume it is not needed beyond auth.

## 14. Idempotency

- **Offline visit sync is idempotent by design:** `clientVisitId` (unique index) makes re-sending the same completion safe — the second attempt returns the existing result with `200` instead of creating a duplicate (Doc 11 §21).
- State transitions are idempotent-safe by guards: activating an already-active subscription returns `409 STATE_INVALID`, cleanly.
- No generic idempotency-key header at MVP — the two places that need idempotency have it structurally.

## 15. File Uploads

Files never pass through the API server (Doc 09 §17):

1. `POST /visits/:id/media-permit` → checks the caregiver is assigned → returns a short-lived signed upload permit (Cloudinary).
2. The device uploads directly to Cloudinary with that permit.
3. `POST /visits/:id/complete` includes the returned media references with capture times.
Limits: 50 MB per file; images/video only; the permit encodes the folder and constraints (SEC-008, LIMITS).

## 16. Validation

Every endpoint names its schema (validators/, Doc 10). Validation runs in middleware before controllers; failures return `422 VALIDATION_FAILED` with per-field messages. Formats follow Document 11's dictionary (E.164 phones, ISO dates, enum values from constants).

## 17. API Security

The ring model (Section 5) plus: TLS-only (SEC-006), rate limits (Section 13), sanitized inputs (SEC-007), minted media links (SEC-008), `passwordHash`/ciphertext never serialized (`select: false`, Doc 11 §26), CNIC endpoints admin-only with access audited (SEC-009, AUD-004), and boot-checked secrets (Doc 09 §13).

## 18. Deprecation Policy

An endpoint being replaced gains a `Deprecation: true` header and a `Sunset: <date>` header at least one phase before removal; the replacement is named in the docs. Nothing disappears silently. *(Recommendation — adopted as policy now; first use whenever v2 exists.)*

---

# Part B — Endpoints by Module

Format per endpoint: purpose, role, request, validation, success, errors. Shared conventions above are not repeated. All paths are relative to `/api/v1`.

---

## Module: Auth

### POST /auth/register — Create a client account

- **Role:** public
- **Body:** `{ name, email, phone, countryCode, password }`
- **Validation:** name 2–100; email format; phone E.164; countryCode ISO-2; password ≥8 with letters and numbers (FR-001)
- **Success `201`:** `{ data: { userId } }` — verification email sent (FR-002)
- **Errors:** `422 VALIDATION_FAILED`; `409 DUPLICATE` (email exists, with login/reset hints in message); `429`
- **Security:** rate-limited; password hashed before storage; no session issued until verified

Example:

```http
POST /api/v1/auth/register
{ "name": "Ayesha Khan", "email": "ayesha@example.com",
  "phone": "+971501234567", "countryCode": "AE", "password": "sundar123" }
```

```json
{ "success": true, "data": { "userId": "662f00a1b2c3d4e5f6a7b8c9" } }
```

### POST /auth/verify-email — Confirm the emailed link

- **Role:** public
- **Body:** `{ token }`
- **Success `200`:** `{ data: { verified: true } }`
- **Errors:** `410 STATE_INVALID` (expired — resend offered); `422`

### POST /auth/resend-verification

- **Role:** public — **Body:** `{ email }` — **Success `200`** always with the same generic response whether the email is unknown, already verified, or awaiting verification; it sends only for an existing unverified account — rate-limited and non-enumerating

### POST /auth/apply — Caregiver application

- **Role:** public
- **Body:** `{ name, email, phone, password, cnicNumber, serviceArea: { lng, lat, radiusKm } }`
- **Validation:** CNIC 13 digits; coordinates valid; rest as register (FR-003)
- **Success `201`:** account in `applied` state; next-steps message
- **Security:** CNIC encrypted at rest immediately; never echoed back (SEC-009)

### POST /auth/login

- **Role:** public
- **Body:** `{ email, password }`
- **Success `200`:** `{ data: { accessToken, user: { id, name, role, status } } }` + refresh cookie set
- **Errors:** `401 UNAUTHENTICATED` with the same status, message, shape, and approximate timing for wrong email, wrong password, and unverified email; `403 ACCOUNT_DISABLED`; `429`
- **Note:** caregiver in `applied`/`in_review` logs in successfully but the portal routes them to status-only (FR-003) — the API reflects it in `user.status`

### POST /auth/refresh

- **Role:** cookie-bearing — **Success `200`:** new `accessToken` — **Errors:** `401` (missing/revoked/expired → full re-login)

### POST /auth/logout

- **Role:** any authenticated — revokes the refresh token, clears the cookie — **Success `200`**

### POST /auth/forgot

- **Role:** public — **Body:** `{ email }` — **Success `200`** always; reset link emailed if the account exists (1-hour expiry) — rate-limited

### POST /auth/reset

- **Role:** public — **Body:** `{ token, newPassword }`
- **Success `200`:** password changed; **all refresh tokens revoked** (FR-006)
- **Errors:** `410` expired link; `422` weak password

---

## Module: Parents

### POST /parents — Create a parent profile

- **Role:** client
- **Body:** `{ name, age, phone?, addressText, location: { lng, lat }, careNotes?, emergencyContacts: [{ name, phone, relation, priority }] }`
- **Validation:** per the data dictionary (Doc 11); min 1 emergency contact; age 40–120 (FR-010)
- **Success `201`:** the profile, `status: "pending_consent"`
- **Errors:** `422`; `403` wrong role
- **Security:** addressText and careNotes encrypted at rest (E fields)

### GET /parents — My parents

- **Role:** client — **Success `200`:** `{ items: [profiles] }` (ownership ring: own only)

### GET /parents/:id

- **Role:** client (owner), admin — **Errors:** `403` not owner; `404` unknown id

### PATCH /parents/:id — Edit profile

- **Role:** client (owner) — **Body:** any editable subset (not consent, not status) — audit-relevant fields keep history via updatedAt; consent has its own endpoints

### POST /parents/:id/consent — Record the first-visit consent

- **Role:** caregiver (assigned to that parent's first visit)
- **Body:** `{ state: "given" | "declined", recordingRef?, choices?: { preferredTimes?, photoBoundaries?, other? }, byVisitId }`
- **Validation:** `given` requires recordingRef (FR-013); choices free-form short strings
- **Success `200`:** profile status → `active` (given) or stays `pending_consent` with the declined event appended; the visit closes accordingly (no-fault path, FR-036)
- **Errors:** `403` not the assigned caregiver; `409 STATE_INVALID` if consent already given

### POST /parents/:id/consent-permit — Signed consent-recording upload permit

- **Role:** caregiver assigned to the parent's pending-consent first visit
- **Body:** `{ mediaType: "audio" | "video" }`
- **Success `200`:** `{ cloudName, apiKey, timestamp, signature, folder: "rozvisit/consent/<parentId>/", publicId: "<parentId>_<compact ISO timestamp>", resourceType: "auto", maxFileSize: 52428800, allowedFormats: ["mp3", "m4a", "wav", "mp4", "mov"], expiresAt }`. The permit expires after 10 minutes (AD-31).
- **Behavior:** audio is a first-class consent option. After direct upload, the caregiver sends the returned Cloudinary `secure_url` or `public_id` as `recordingRef` to `POST /parents/:id/consent`.
- **Errors:** `403` unless the caregiver is assigned to that parent's pending-consent first visit; `422` invalid media type.

### POST /parents/:id/consent/withdraw

- **Role:** client (owner), admin
- **Success `200`:** consent → `withdrawn`; profile → `paused`; future visits pause (FR-014); event appended

---

## Module: Plans and Subscriptions

### GET /plans — The three plans in my currency

- **Role:** client
- **Success `200`:** `{ items: [{ key, visitsPerWeek, errandsPerWeek, price: { min, max }, currency }] }` — display range from the fixed table for the client's currency (FR-020); marked introductory until D-03 locks pricing
- **Errors:** none beyond auth; unsupported currency falls back to USD with `"currencyFallback": true` in data

### POST /subscriptions — Select a plan

- **Role:** client
- **Body:** `{ parentId, planKey }`
- **Validation:** planKey in enum; parent owned by caller; no existing active subscription for that parent (partial unique index, Doc 11)
- **Success `201`:** subscription in `selected` state with the plan terms copied into its snapshot; the actual agreed price and currency are set only when operations activates the manual payment. Allowance enforcement begins (FR-021); operations is notified to send the payment link
- **Errors:** `409 DUPLICATE` (active subscription exists); `403`; `422`

Example response:

```json
{ "success": true, "data": {
  "id": "6650cc...", "state": "selected",
  "planSnapshot": { "visitsPerWeek": 3, "errandsPerWeek": 1, "price": null, "currency": null },
  "nextStep": "We will send your secure Payoneer payment link within 24 hours."
} }
```

### GET /subscriptions/:id

- **Role:** client (owner), admin — includes `state`, `stateHistory`, `currentPeriodEnd`

### POST /subscriptions/:id/cancel

- **Role:** client (owner)
- **Success `200`:** state → `cancelled`; runs to `currentPeriodEnd`; honest confirmation copy, one step (FR-024, no dark patterns)
- **Errors:** `409 STATE_INVALID` if already cancelled

### PATCH /admin/subscriptions/:id/state — Operations state changes

- **Role:** admin
- **Body:** `{ state: "link_sent" | "active" | "paused", paymentRef?, price?, currency? }`
- **Validation:** legal transitions only (state machine, Doc 09 §9); `active` requires `paymentRef`, a positive agreed `price`, and a `currency` of `USD`, `GBP`, `AED`, or `SAR` (FR-023). The agreed amount and currency are copied to the immutable plan snapshot.
- **Success `200`:** state changed; history appended with actor; client notified; scheduling unlocks on `active`
- **Errors:** `409 STATE_INVALID` (illegal arrow — e.g. activating twice); `422` missing paymentRef
- **Security:** audit event written automatically (AUD-002)

---

## Module: Visits

### POST /visits/schedule — Set weekly recurring slots

- **Role:** client
- **Body:** `{ parentId, slots: [{ dayOfWeek: 0-6, time: "HH:mm" }], standingNote? }`
- **Validation:** slots within service hours (08:00–20:00 *(Recommendation)*); slot count ≤ plan allowance (FR-030); active subscription required; consented or first-visit-pending parent
- **Success `201`:** generated visits for the coming period; `{ items: [visits] }`
- **Errors:** `409 ALLOWANCE_EXCEEDED` with limit and upgrade path in message; `409 CONSENT_REQUIRED` if profile paused by withdrawal; `403`

### PATCH /visits/:id/reschedule

- **Role:** client (owner)
- **Body:** `{ scheduledAt }`
- **Validation:** same-week slot; target within service hours
- **Success `200`:** visit moved; caregiver notified (FR-032)
- **Errors:** `409 STATE_INVALID` (visit already started/completed); `422`

### POST /visits/:id/cancel

- **Role:** client (owner)
- **Success `200`:** before cutoff (12h *(Recommendation)*) → allowance returned; after → counted, explained in response message (FR-033)

### GET /visits/today — Caregiver's day

- **Role:** caregiver
- **Success `200`:** `{ items: [{ id, scheduledAt, parentName, addressText, location, standingNote, consentChoices, consentState, status }] }` ordered by time (FR-040). `consentState` is the parent's existing `pending | given | declined | withdrawn` value; S-24 displays its consent panel only when it is `pending`.
- **Security:** assigned visits only; address visible within the confirmed window (PRV-004)
- **Note:** the portal caches this response for offline display; the API sets no-store on nothing here — cacheable by design

### GET /visits/:id — Caregiver visit context

- **Role:** caregiver assigned to the visit
- **Success `200`:** the S-24 visit context: `{ id, clientVisitId, parentId, parentName, addressText, location, scheduledAt, standingNote, consentChoices, consentState, status, checklist, media }`.
- **Security:** the response is caregiver-scoped; it does not grant access to the general parent-profile endpoint. It exposes only the address, location, standing note, and consent context required to perform the assigned visit.
- **Errors:** `403` unassigned caregiver; `409 STATE_INVALID` unassigned visit; `404` unknown id.

### POST /visits/:id/checklist — Save checklist (syncable)

- **Role:** caregiver (assigned)
- **Body:** `{ medicationTaken, mood: 1-5, concerns: [enum strings], note?, capturedAt }`
- **Validation:** mood 1–5; capturedAt required (offline honesty, FR-043/044)
- **Success `200`:** stored against the visit
- **Errors:** `409 CONSENT_REQUIRED` on unconsented profile (FR-014); `403` not assigned

### POST /visits/:id/media-permit — Signed upload permit

- **Role:** caregiver (assigned)
- **Body:** `{ items: [{ clientMediaId, capturedAt, mediaType }] }`, one to five entries. `clientMediaId` is generated on-device at capture time; `capturedAt` is the device's ISO-8601 capture time; `mediaType` is `photo` or `video`.
- **Success `200`:** `{ permits: [{ clientMediaId, cloudName, apiKey, timestamp, signature, folder, publicId, resourceType: "auto", maxFileSize: 52428800, allowedFormats: ["jpg", "jpeg", "png", "heic", "mp4", "mov"], expiresAt }] }`. Each permit is keyed to its submitted `clientMediaId`, folder-scoped to `rozvisit/visits/<visitId>/`, and expires after 10 minutes (AD-30). `publicId` is `<visitId>*<clientMediaId>*<compact capturedAt>`.
- **Direct-upload signature:** the client sends `file`, `api_key`, `timestamp`, `signature`, `folder`, and `public_id`. The signature covers exactly `timestamp`, `folder`, and `public_id`; `resourceType` selects the `/auto/upload` URL path, while `maxFileSize` and `allowedFormats` are permit-policy metadata rather than Cloudinary signed form fields.
- **Errors:** `403`; `409 STATE_INVALID` on closed visits

### POST /visits/:id/complete — Close the visit

- **Role:** caregiver (assigned)
- **Body:** `{ clientVisitId, media: [{ clientMediaId, ref, capturedAt, uploadedAt, sourceFlag }], completedAt }`. `capturedAt` is device time; `uploadedAt` records the successful Cloudinary upload time, so offline delay remains visible.
- **Validation:** checklist present (FR-045); ≥1 media ref; sourceFlag must be `in_app_camera` (SEC-012)
- **Success `200`:** status → `completed`; history appended; earning recorded (FR-048); `visit.completed` event fires (feed + notification)
- **Idempotent:** same `clientVisitId` re-sent → `200` with the existing record (Section 14)
- **Errors:** `422 VALIDATION_FAILED` "Checklist and at least one photo are required to complete a visit"; `409 CONSENT_REQUIRED`

### POST /visits/:id/parent-declined — Parent declined (no fault)

- **Role:** caregiver (assigned)
- **Body:** `{ reason?, capturedAt }`
- **Success `200`:** status → `parent_declined`; no fault recorded; client informed honestly (FR-036)
- **Naming note:** endpoint path matches the resulting status enum value verbatim — the earlier shorter form `/declined` was renamed for consistency with `VISIT_STATUS.parent_declined` (Doc 11 §6, Doc 31 AF-08).

---

## Module: Feed

### GET /feed — The proof feed

- **Role:** client
- **Query:** `parentId` (required, owned), `before?` (cursor), `limit?` (≤100)
- **Success `200`:**

```json
{ "success": true, "data": {
  "items": [{
    "visitId": "665f1a...", "scheduledAt": "2026-07-21T05:00:00Z",
    "status": "completed", "caregiverName": "Bilal Ahmed",
    "checklistSummary": { "medicationTaken": true, "mood": 4, "concerns": [] },
    "media": [{ "thumbUrl": "<minted, expiring>", "fullUrl": "<minted>", "uploading": false }],
    "missedReason": null
  }],
  "nextCursor": "2026-07-14T10:02:11Z"
} }
```

- **Behavior:** one indexed query for the first page (PERF-001); `uploading: true` items show the honest pending state (FR-051); missed visits appear with `missedReason` (FR-052); media URLs are minted per request after the ownership check (SEC-008)

---

## Module: Admin

All endpoints: **Role admin**, all mutations audited automatically (FR-082).

### GET /admin/applications — Verification queue

- **Query:** `status?` (`applied` | `in_review`), `page?`, `limit?`
- **Success:** applicant list with gate summaries (FR-080)

### GET /admin/applications/:id — Full application

- Includes CNIC data and recording references — **this read itself writes an audit event** (`cnic.viewed`, AUD-004)

### POST /admin/applications/:id/decision

- **Body:** `{ decision: "approve" | "reject" | "request_info", note? }`
- **Validation:** approve refused unless all gates true — `409 STATE_INVALID` "Verification gates incomplete" (FR-081)
- **Success:** status flips; applicant notified with next steps

### POST /admin/visits/:id/assign

- **Body:** `{ caregiverId }`
- **Validation:** caregiver `verified` and area-matched (FR-034); previous caregiver suggested by `GET /admin/visits/:id/assignment-suggestions` (continuity)
- **Success:** visits attached; caregiver notified; reassignment moves future visits and notifies all parties (BR-15 backup flow)

### GET /admin/visits — Oversight list

- **Query:** `status?`, `from?`, `to?`, `caregiverId?`, `page?`, `limit?` (FR-083)

### POST /admin/flags/:id/resolve

- **Body:** `{ note }` — flag closed with the resolving admin recorded (FR-046 path)

### GET /admin/subscriptions — Payment operations list

- **Query:** `state?` — the manual-payment workbench (link_sent queue, grace watch)

---

## Module: Notifications

### GET /notifications — My list

- **Role:** any authenticated — **Query:** `before?`, `limit?` — unread count included in data

### POST /notifications/:id/read

- **Role:** owner — **Success `200`:** `readAt` set

---

## Module: Health

### GET /health

- **Role:** public — `{ status: "ok", db: "connected" }` — used by uptime monitoring and deploy checks (OBS-002); no secrets, no versions leaked

---

# Part C — Status Code Summary

| Code | Used for |
|---|---|
| 200 | Success on reads and state changes |
| 201 | Resource created |
| 401 | Missing/invalid/expired token (`UNAUTHENTICATED`, `TOKEN_EXPIRED`) |
| 403 | Wrong role, not owner, not verified (`FORBIDDEN`, `VERIFY_EMAIL_FIRST`) |
| 404 | Unknown resource id or reserved future path |
| 409 | State machine and uniqueness conflicts (`STATE_INVALID`, `DUPLICATE`, `ALLOWANCE_EXCEEDED`, `CONSENT_REQUIRED`) |
| 410 | Expired one-time links (verification, reset) |
| 422 | Validation failures with field details |
| 429 | Rate limited, with Retry-After |
| 500 | `INTERNAL` — generic in production (ERR-003) |

---

# Part D — Reserved Phase 2 Paths

Named now so nothing squats on them; specified when Phase 2 begins (phase rule):

```
POST   /errands                     POST /errands/:id/accept
POST   /errands/:id/complete       POST /errands/:id/over-limit-approve
POST   /emergencies                 PATCH /emergencies/:id
GET    /emergencies/:id/timeline
POST   /visits/:id/checkin          POST /visits/:id/checkout     (GPS)
POST   /visits/:id/rating
GET    /admin/dashboard             GET /admin/flags
```

---

# Part E — OpenAPI-Compatible Structural Outline

The skeleton an `openapi.yaml` follows when generated at build *(Recommendation — generated from the validators so spec and code cannot drift)*:

```yaml
openapi: 3.1.0
info:
  title: RozVisit API
  version: 1.0.0
servers:
  - url: /api/v1
components:
  securitySchemes:
    bearerAuth: { type: http, scheme: bearer, bearerFormat: JWT }
  schemas:
    # Generated from validators/ + Document 11 dictionary:
    Envelope: { success, data }
    Error: { success: false, error: { code, message, fields? } }
    User, ParentProfile, Consent, Plan, Subscription, Visit,
    ChecklistInput, MediaRef, FeedItem, Notification
  responses:
    Unauthenticated: { $ref Error }   # 401
    Forbidden: { }                    # 403
    Validation: { }                   # 422
    Conflict: { }                     # 409
security:
  - bearerAuth: []
paths:
  /auth/register: { post }
  /auth/verify-email: { post }
  /auth/resend-verification: { post }
  /auth/apply: { post }
  /auth/login: { post }
  /auth/refresh: { post }
  /auth/logout: { post }
  /auth/forgot: { post }
  /auth/reset: { post }
  /parents: { get, post }
  /parents/{id}: { get, patch }
  /parents/{id}/consent: { post }
  /parents/{id}/consent-permit: { post }
  /parents/{id}/consent/withdraw: { post }
  /plans: { get }
  /subscriptions: { post }
  /subscriptions/{id}: { get }
  /subscriptions/{id}/cancel: { post }
  /visits/schedule: { post }
  /visits/{id}/reschedule: { patch }
  /visits/{id}/cancel: { post }
  /visits/today: { get }
  /visits/{id}: { get }
  /visits/{id}/checklist: { post }
  /visits/{id}/media-permit: { post }
  /visits/{id}/complete: { post }
  /visits/{id}/parent-declined: { post }
  /feed: { get }
  /admin/applications: { get }
  /admin/applications/{id}: { get }
  /admin/applications/{id}/decision: { post }
  /admin/visits: { get }
  /admin/visits/{id}/assign: { post }
  /admin/visits/{id}/assignment-suggestions: { get }
  /admin/subscriptions: { get }
  /admin/subscriptions/{id}/state: { patch }
  /admin/flags/{id}/resolve: { post }
  /notifications: { get }
  /notifications/{id}/read: { post }
  /health: { get }
```

---

*End of Document 12 — RozVisit API Specification*
