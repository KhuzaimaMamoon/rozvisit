# Clarifications Needed

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
