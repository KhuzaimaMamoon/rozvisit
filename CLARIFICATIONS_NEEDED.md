# Clarifications Needed

## Caregiver verification gate-recording contract — Resolved

- **Question:** The caregiver profile defines three verification gates, but Doc 12 previously
  defined no endpoint or body for independently recording CNIC, interview, and reference outcomes.
- **Searched:** Doc 07 FR-080–082; Doc 11 `caregiverProfiles.verification`; Doc 12 Admin
  endpoints; Doc 13 §§16–17 and 23; Doc 14 Module 7; Docs 16–17 S-28/S-29; Doc 18 §§7 and 24.
- **Resolution:** Founder approved independent `PATCH` endpoints for CNIC, interview, and
  reference gates. Each records its own result, acting admin, timestamp, and optional sensitive
  note. Approval stays on the existing decision endpoint and is refused until all three gate
  booleans are true. Doc 11 and Doc 12 are updated in the Admin verification PR.

## Cloudinary signed-upload permit contract — Resolved

- **Resolution:** Approved for the Visit offline-media task: 10-minute TTL, 50 MB maximum,
  image/video-only formats, visit-folder scope, and `clientMediaId`-scoped direct-upload permits.
  Recorded in Doc 12 and AD-30.
- **Searched:** Doc 12 §§14–15 and the `POST /visits/:id/media-permit` contract; Doc 18 §25;
  Doc 29 AD-7; Doc 08 §15; Doc 09 §§17 and 19; Doc 07 FR-042–045, SEC-012, DATA-005 and
  INT-002; Doc 20 Cloudinary outage handling; Doc 21 §10 (15-minute **view-link** expiry only).
- **What is needed:** The permit TTL (for example, an approved number of minutes), plus the
  approved Cloudinary parameters that enforce the permitted resource types, 50 MB limit, and
  folder/public-ID behavior. This determines the MediaStorage contract, backend response,
  client upload request, retry behavior, and the security tests.

## Media-permit capture-time input — Resolved

- **Resolution:** `items` contains one to five `{ clientMediaId, capturedAt, mediaType }` records.
  The public ID is `<visitId>*<clientMediaId>*<compact capturedAt>`; the device-generated media
  ID and device capture time are preserved through retries. Recorded in Doc 12 and AD-30.
- **Searched:** Doc 12 §Visits (`media-permit` body and completion body); the approved
  signed-upload-permit resolution; Doc 08 §15 (capture time is recorded at capture); Doc 07
  FR-043/044; Doc 11 `visits.media`; and Doc 29 AD-7.
- **What is needed:** The approved request shape for one to five captured files. The server must
  use the device time in the folder-scoped public ID; substituting server time would violate
  FR-044 and weaken offline-record integrity.

## Visit caregiver-assignment dependency — Resolved

- **Question:** How should T-B21..T-B32 create scheduled visits and verify the caregiver for
  first-visit consent when every `visits` record requires `caregiverId`, but caregiver assignment
  is documented as `POST /admin/visits/:id/assign` in the later Admin module and no assignment
  repository/service exists yet?
- **Searched:** Doc 11 §6 (`visits.caregiverId` is required), Doc 12 Visits scheduling and
  consent endpoints (caregiver must be assigned to the parent’s first visit), Doc 13 permission
  matrix (assigned caregiver only), Doc 14 Module 4 (caregiver assigned visits), Doc 07
  FR-034/FR-040, and Doc 33 §13.2 (Visit precedes Admin).
- **Resolution:** Founder authorized the minimal documented `POST /admin/visits/:id/assign`
  capability inside the Visit module. It assigns only a `CAREGIVER_STATUS.VERIFIED` caregiver
  and stores the documented `caregiverId` on the visit. Verification workflows, admin oversight,
  disputes, and flag resolution remain in the later Admin module. A verified caregiver may be
  created only as seed/manual-test setup until the real verification flow exists.

## Visit scheduling before caregiver assignment — Resolved

- **Question:** What documented value should a newly scheduled visit use for required
  `caregiverId` before `POST /admin/visits/:id/assign` is called? The scheduling endpoint creates
  visits (`POST /visits/schedule`), while assignment is explicitly by already-created visit id;
  however, Doc 11 declares `visits.caregiverId` required.
- **Searched:** Doc 11 §6 (`caregiverId` required), Doc 12 `POST /visits/schedule` and
  `POST /admin/visits/:id/assign`, Doc 07 FR-030 and FR-034, Doc 14 Module 4 scheduling and
  assignment rules, and the approved minimal-assignment resolution above.
- **Resolution:** Founder approved `caregiverId: null` only while a visit is scheduled and awaiting
  assignment. Only `POST /admin/visits/:id/assign` may set a verified caregiver. Unassigned visits
  stay off caregiver Today lists and reject every caregiver action with `STATE_INVALID`. Client
  scheduling confirmation must state that caregiver assignment is pending. Doc 11 is updated in
  the same PR.

## Vite security-gate conflict — Resolved

- **Resolution:** Founder approved the upgrade to the latest stable Vite. Vite 8.1.5 is
  installed, and AD-28 records the build-tooling version policy.
- **Searched:** Doc 00 §13 (confirmed Vite 5 stack), Doc 33 §§3.3 and 19.2 (Vite 5 and
  mandatory high/critical audit gate), Doc 23 §28 (lint/tooling), and Doc 25 §17 (CI
  audit gate).
- **PR:** Pending — no pull request has been opened, per founder instruction. Its link
  will be added here when the PR is created.

## Full seed-data implementation before models exist — Open

- **Question:** Should a full idempotent “realistic fake data” seed implementation be
  delivered now, even though the required Mongoose models have not yet been assigned to a
  Sub-Phase A task, or should it remain the T-A19 skeleton until the relevant model tasks
  are implemented?
- **Searched:** Doc 33 §12.4 (full seed-data outcome), §14 T-A19 (seed skeleton), §13.1
  (Sub-Phase A), and Doc 11 §4–6 (model-owned data shapes).
- **What is needed:** Confirmation whether creating the feature data models solely to seed
  them is authorized before the Auth, Profile, Plan, Visit, and Admin module tasks. Without
  that approval, the seed cannot truthfully create or idempotently query the documented
  collections.

## Auth email-link token persistence and delivery — Resolved

- **Question:** What canonical collection/schema should persist the hashed, single-use email
  verification and password-reset tokens, and which email-provider implementation should send
  those links at MVP?
- **Searched:** Doc 11 §§7–11 and 23 (tokens have separate lifecycles; only
  `refreshTokens` is named and indexed), Doc 13 §§6, 9–10 (hash + expiry + `usedAt`, email
  delivery), Doc 12 Auth endpoints, Doc 10 §3 (a `NotificationChannel` and email channel are
  listed but their contract is not specified), and Doc 26 (provider credentials only).
- **Resolution:** Founder directed `authTokens` with `userId`, SHA-256 `tokenHash`, `type`,
  `expiresAt`, `usedAt`, and `createdAt`; TTL on `expiresAt` and lookup index on `tokenHash`.
  The approved NotificationChannel email implementation remains a no-op local logger. `APP_BASE_URL`
  builds email links and is documented in Doc 26 and `server/.env.example`.

## Unverified-login response conflict — Resolved

- **Question:** Should an unverified account receive the distinct `403 VERIFY_EMAIL_FIRST`
  response in Doc 13 and Doc 12, or the uniform unauthorized response required by Doc 33 §9.4
  and the Auth task wording?
- **Searched:** Doc 13 §2 and §4 (unverified accounts receive `403 VERIFY_EMAIL_FIRST`), Doc
  12 Auth `POST /auth/login` (same), Doc 20 error-code ownership, Doc 33 §9.4 and §20
  adversarial-auth wording (uniform response includes unverified), and Doc 31 Part F (Doc 13
  is the higher-ranked owner for auth mechanics).
- **Resolution:** Founder selected uniform `401 UNAUTHENTICATED` responses for wrong email,
  wrong password, and unverified accounts. AD-29 records the security decision; Docs 12 and 13
  now align. `VERIFY_EMAIL_FIRST` is reserved for authenticated verification-gated actions.

## Client registration currency mapping — Resolved

- **Question:** What currency should `clientProfiles.currency` receive from the registration
  `countryCode` when the profile schema requires a currency but the registration API only accepts
  country?
- **Resolution:** Founder approved AE→AED, GB→GBP, US→USD, SA→SAR, with USD for all other ISO
  alpha-2 country codes. The mapping lives in `config/constants.js` and BR-033 records it.

## Parent emergency-contact priority contract — Resolved

- **Question:** What type, allowed range, and uniqueness/order rule should
  `emergencyContacts[].priority` use?
- **Searched:** Doc 11 §§4–6 (the field is listed only as `priority` in an ordered embedded
  array), Doc 12 Parents `POST /parents` (the field is required in the request shape but has no
  validation rule), Doc 14 Module 2, Doc 07 FR-010, and Doc 23 §11 (naming only).
- **Resolution:** Founder approved a required, positive, 1-indexed integer. Lower is called
  first, and priorities must be unique within the parent's embedded contact array; there is no
  fixed maximum or contact-count cap beyond the existing minimum of one.

## Consent capture before the Visit module exists — Resolved

- **Question:** Should the Profile module implement `POST /parents/:id/consent` now despite the
  documented requirement to verify the caregiver is assigned to that parent's first visit, when
  the Visit model/repository and assignment data are scheduled for the later Visit/Admin modules?
- **Searched:** Doc 12 Parents consent endpoint (assigned caregiver + `byVisitId`), Doc 14 Module
  2 permissions specifics, Doc 07 FR-013–015, Doc 11 visits/consent schemas, and Doc 33 §13.2
  dependency order.
- **Resolution:** Founder directed that consent capture is deferred to the Visit module task,
  where assignment data exists. The Profile task excludes `POST /parents/:id/consent`; this is
  tracked explicitly for the Visit module scope and preserves the caregiver-assignment safeguard.

## Care-plan price representation before Phase 0 evidence — Resolved

- **Question:** What exact persisted/API representation should `carePlans.prices` and
  `subscriptions.planSnapshot.price` use while D-03/BR-004 require ranges rather than final
  figures? Doc 11 declares `prices: { USD, GBP, AED, SAR: Number }` and the subscription
  snapshot `price` as a number, while Doc 03 §15 supplies only USD ranges and requires every
  concrete figure to be labelled an example.
- **Searched:** Doc 01 D-03, Doc 03 BR-004/BR-032 and §15, Doc 07 FR-020–025, Doc 11
  `carePlans`/`subscriptions` schemas, Doc 12 Plans endpoints, Doc 14 Module 3, Doc 17 Brief 6,
  Doc 29 AD-14, and Doc 31 Part E.
- **Resolution:** Founder approved currency-specific display ranges in `carePlans.prices`:
  `{ USD|GBP|AED|SAR: { min, max } }`. At activation, operations records the actual agreed
  positive amount and currency with the payment reference; only then are the immutable numeric
  `planSnapshot.price` and `planSnapshot.currency` set. Reference ranges are recommendations
  pending Phase 0 evidence: Basic USD 25–35 / GBP 20–28 / AED 90–130 / SAR 95–135; Standard USD
  45–60 / GBP 35–48 / AED 165–220 / SAR 170–230; Premium USD 75–95 / GBP 60–75 / AED 275–350 /
  SAR 285–360. Docs 03, 11, and 12 were updated with the lifecycle contract.

## Development seed personas needed for live end-to-end verification — Resolved

- **Question:** What approved development-only credentials and creation flow should be used for
  the documented Ayesha client and Nasreen admin personas when a live browser end-to-end test
  needs scheduling and assignment?
- **Searched:** Doc 11 §23 (idempotent seed requires one admin, one verified caregiver, one
  client, a consented Rawalpindi parent, active subscription, and mixed-state visits), Doc 25
  §§1–2 (fresh checkout reaches a working feed through the seed), README Local Setup (states
  seeded credentials are printed), `scripts/seed.js` (currently seeds care plans only), and Doc
  04 personas.
- **Resolution:** Founder approved idempotent development-only fixtures in `scripts/seed.js`:
  Nasreen Shah (`nasreen-admin@example.com` / `adminPass123`), Ayesha Khan
  (`ayesha-client@example.com` / `safePass123`), and verified Bilal Ahmed
  (`bilal-caregiver@example.com` / `caregiverPass123`), plus consented Amina Bibi in Rawalpindi,
  an active Standard subscription at AED 195, and scheduled/completed/missed visits. The script
  refuses production and README now records the values printed by the seed command.

## S-24 consent recording upload contract — Resolved

- **Question:** What approved upload/storage path produces the required encrypted
  `consent.recordingRef` when a caregiver records the parent’s agreement with the in-app
  microphone/camera?
- **Searched:** Doc 16 S-24 (record button uses in-app mic/camera), Doc 14 Modules 2 and 4
  (caregiver consent step), Doc 12 `POST /parents/:id/consent` (a `given` state requires
  `recordingRef`) and `POST /visits/:id/media-permit` (visit-photo-only permit), Doc 11
  `parentProfiles.consent.recordingRef`, and Doc 18 §22 (consent recordings are sensitive).
- **Resolution:** Founder approved `POST /parents/:id/consent-permit`: a 10-minute, parent-folder-scoped permit for audio or video consent recordings. The caregiver uploads directly, then sends the returned reference through the existing consent endpoint. Doc 12 and AD-31 record the decision.

## S-24 consent-state read field — Resolved

- **Question:** May the caregiver’s visit-detail/today response expose the parent’s embedded
  consent state as a derived field (for example, `consentState`) so S-24 can truthfully decide
  whether to render its first-visit consent panel?
- **Searched:** Doc 16 S-24 (panel is conditional when consent is pending), Doc 12
  `GET /visits/today` (lists `consentChoices` but not consent state) and `GET /parents/:id`
  (client/admin only), Doc 11 parentProfiles consent schema, and Doc 14 Module 4.
- **Resolution:** Founder approved `consentState` on caregiver visit context responses, using the existing `pending | given | declined | withdrawn` parent-consent enum. S-24 renders its consent panel only for `pending`; Doc 12 records the response contract.

## S-24 checklist concern-chip enum — Resolved

- **Question:** Which exact string values and user-facing labels are allowed for the documented
  checklist `concerns` chip set?
- **Searched:** Doc 07 FR-041 ("concern options"), Doc 11 visits.checklist (`concerns:
[String]`), Doc 12 checklist body (`concerns: [enum strings]`), Doc 15 ChecklistForm,
  Doc 16 S-24, Doc 17 Visit Flow brief, Doc 27 analytics (pre-defined chip ids), and
  `server/src/config/constants.js`.
- **Resolution:** Founder approved the non-diagnostic enum `appetite`, `mobility`, `medication`, `mood_change`, `home_condition`, and `other`, with the labels supplied in the resolution. Doc 07, Doc 11, and `config/constants.js` record it.
