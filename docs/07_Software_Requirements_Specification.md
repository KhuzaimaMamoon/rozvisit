# RozVisit — Software Requirements Specification (SRS)
### Document 07

**Sources:** Documents 00–06. Every requirement traces back to a business requirement (BR-xxx, Document 03) or a user story (US-xxx, Document 06). The traceability matrix is in Section 29.
**Labels:** Everything here is confirmed unless marked *(Assumption)*, *(Recommendation)*, or *(Open)*.
**Style note:** This follows the modern IEEE SRS structure, written in plain English per Source of Truth Rule 9.

---

## 1. Introduction

This document describes what the RozVisit software must do and how well it must do it. It is the contract between the product documents (00–06) and the technical design and code that follow. Developers build from this document; testers test against it.

---

## 2. Purpose

The purpose of this SRS is to:
1. Define every software requirement for the Phase 1 MVP precisely, each with a unique ID.
2. Define the known requirements for Phases 2–3 where earlier documents confirm them, marked by phase.
3. Give testers a clear basis for acceptance (Section 28).
4. Connect every requirement back to its business reason (Section 29).

---

## 3. Scope

**In scope (this document):**
- The Phase 1 MVP in full: accounts, parent profiles, plans with manual payment tracking, visit scheduling, camera-only proof, the client proof feed, basic admin views, core notifications.
- Phase 2 requirements that are already confirmed (GPS check-in, errands, emergency system, admin dashboard), marked "Phase 2."
- Cross-cutting requirements: security, privacy, performance, and the rest of Sections 15–27.

**Out of scope (per the confirmed phase plan):**
- Payment integration code (Phase 4). Live video (Phase 3 — named but not specified here; specified when the phase approaches). Urdu interface (Phase 5). Multi-city logic (Phase 6).

---

## 4. Definitions

| Term | Meaning |
|---|---|
| Client | The diaspora customer who pays and manages care |
| Caregiver | The verified local person who performs visits |
| Parent | The person visited; a profile, not a login |
| Admin | Internal operations staff |
| Visit | One scheduled caregiver attendance at a parent's home |
| Proof | Photos/video captured through the app camera, plus a completed checklist |
| Verified visit | A completed visit with full proof attached — the unit of the north-star metric |
| Allowance | The number of visits per week a plan includes |
| Consent record | The parent's recorded agreement to visits and photo capture, with their stated choices |
| Flag | A record marked for human review — never automatic punishment |
| JWT | The login token format used for sessions |
| MVP | The Phase 1 build |

---

## 5. Product Perspective

RozVisit is a new, standalone web platform. It does not replace or plug into an existing system. It has three faces on one platform: the client portal, the caregiver portal (mobile-first), and the admin portal. One backend serves all three.

It depends on outside services (Section 11): Cloudinary (media), Firebase (push), email delivery, map/geocoding, Payoneer (payment links handled outside the software in Phase 1), and — from Phase 2 — Twilio and WhatsApp.

---

## 6. Product Functions (Summary)

1. Register and verify users in three roles.
2. Hold parent profiles with locations, care notes, contacts, and consent records.
3. Sell plans: selection in-app, payment tracked manually (Phase 1).
4. Schedule visits within plan allowances; support reschedule and cancel rules.
5. Guide caregivers through visits: checklist, camera-only proof, offline tolerance.
6. Show clients a proof feed of completed visits.
7. Give admins verification, assignment, and oversight tools.
8. Send calm, reliable notifications; loud only for emergencies (Phase 2).
9. From Phase 2: GPS check-in/out, errands with receipts, the emergency system.

---

## 7. User Classes

| Class | Description | Technical reality (from personas, Document 04) |
|---|---|---|
| Client | Pays, schedules, watches the feed | Modern phone, good internet, high app literacy (Ayesha, Kevin) |
| Caregiver | Performs visits | Cheap Android (2–3 GB RAM), weak/absent signal, moderate literacy, simple English + icons (Bilal, Saima) |
| Admin | Verifies, assigns, oversees | Laptop, dashboard-literate, handles the most sensitive data (Nasreen) |

---

## 8. Operating Environment

| Item | Requirement |
|---|---|
| Client/admin browsers | Latest two versions of Chrome, Safari, Firefox, Edge |
| Caregiver devices | Android 8.0+, 2 GB RAM baseline, mobile browser (no native app at MVP) |
| Caregiver network | Must function on 3G; must tolerate full offline periods during visits |
| Server runtime | Node.js 20 LTS |
| Database | MongoDB 7.x, hosted on Atlas (free M0 at MVP), Asia-Pacific (Mumbai) region |
| Hosting | Render free tier at MVP; cold starts accepted and documented |
| Frontend | React 18 (Vite), Tailwind CSS |

---

## 9. Constraints

1. Zero upfront tool costs until revenue exists (business constraint BR-002).
2. No payment integration code before Phase 4; Phase 1 payment is manual Payoneer links with system state tracking.
3. Stripe is unavailable to the business; nothing may assume it.
4. Solo developer capacity for Phases 0–1; the design must not require a team to build or run.
5. The caregiver experience must work on the weakest confirmed device and network profile.
6. English-only interface at Phase 1 (Decision D-09), with the simple-words-and-icons rule for caregiver screens.
7. All colors and UI patterns follow the mandatory palette and design rules (Document 00, Sections 15–16).

---

## 10. Assumptions

- Outside services (Cloudinary, Firebase, Atlas, Render, email) stay within their free tiers at MVP volume. *(Assumption)*
- Clients allow browser push notifications often enough for push to be useful; email is the fallback. *(Assumption)*
- Caregiver phones have working cameras and GPS hardware. *(Assumption)*
- Pilot volume: tens of users, hundreds of visits per month — free tiers and a single server are enough. *(Assumption, matches the confirmed scaling plan)*

---

## 11. External Interfaces

| ID | Interface | Direction | Phase | Purpose |
|---|---|---|---|---|
| EXT-001 | Cloudinary API | Out | 1 | Store and serve visit media |
| EXT-002 | Firebase Cloud Messaging | Out | 1 | Push notifications |
| EXT-003 | Email delivery service | Out | 1 | Verification, resets, key notices *(Recommendation — provider chosen at build; must have a free tier)* |
| EXT-004 | Map/geocoding service | Out | 1 | Address to coordinates; map pins *(Recommendation — provider chosen at build; must have a free tier)* |
| EXT-005 | Payoneer | Manual | 1 | Payment links handled by operations outside the software; the system stores state and references only |
| EXT-006 | Twilio SMS | Out | 2 | Emergency SMS; caregiver messages |
| EXT-007 | WhatsApp Business API | Out | 2 | Emergency and update messages |
| EXT-008 | Daily.co (WebRTC) | Out | 3 | Live video (named here; specified at Phase 3) |

**Interface rules:** every outside call has a timeout and a defined failure behavior (Section 25). No outside service failure may corrupt visit records — records save first, side effects follow.

---

## 12. Functional Requirements

Grouped by module. Each requirement: unique ID, phase, statement, and trace.

### 12.1 Accounts and Authentication

| ID | Phase | Requirement | Trace |
|---|---|---|---|
| FR-001 | 1 | The system shall let a person register as a client with name, email, phone, country, and password. | US-AUTH-001 |
| FR-002 | 1 | The system shall send an email verification link on registration and block login until the email is verified. | US-AUTH-001, D-07 |
| FR-003 | 1 | The system shall let a person apply as a caregiver, creating an account in "applied" state with no access to visit features. | US-AUTH-002 |
| FR-004 | 1 | The system shall let users log in with email and password, issuing a 15-minute access token and a 7-day refresh token in a secure httpOnly cookie. | US-AUTH-003 |
| FR-005 | 1 | The system shall slow repeated failed logins with rate limiting. | US-AUTH-003, SEC-005 |
| FR-006 | 1 | The system shall provide password reset by a single-use, time-limited email link (1 hour), and shall log out all other sessions on reset. | US-AUTH-004 |
| FR-007 | 1 | The system shall enforce exactly three roles — client, caregiver, admin — and check the role on the server for every protected action. | Document 00 §7, §17 |

### 12.2 Parent Profiles and Consent

| ID | Phase | Requirement | Trace |
|---|---|---|---|
| FR-010 | 1 | The system shall let a client create a parent profile: name, age, phone, address text, map location (adjustable pin), care notes, and at least one emergency contact. | US-PROFILE-001 |
| FR-011 | 1 | The system shall keep an unsaved profile as a draft so no entered data is lost. | US-PROFILE-001 |
| FR-012 | 1 | The system shall store an empty linked-family-members list on every parent profile, hidden from all MVP screens. | US-PROFILE-002, D-02 |
| FR-013 | 1 | The system shall require a consent step at the first visit, capturing the parent's recorded agreement and their stated choices (visit times, photo boundaries), before any normal checklist can run. | US-PROFILE-003, BR-025 |
| FR-014 | 1 | The system shall block visit completion on any parent profile without consent, and shall pause future visits if consent is withdrawn. | US-PROFILE-003 |
| FR-015 | 1 | The system shall show the parent's consent choices to the caregiver inside every visit's checklist. | US-VISIT-004 |

**FR-010 validation note:** Every parent has at least one emergency contact. Each contact priority
is a required positive 1-indexed integer, unique within that parent's emergency-contact list;
lower numbers are contacted first.

### 12.3 Plans and Subscription State

| ID | Phase | Requirement | Trace |
|---|---|---|---|
| FR-020 | 1 | The system shall show the three plans with visit counts, errand allowance, and prices in the client's own currency from a fixed price table (no live conversion). | US-PLAN-001 |
| FR-021 | 1 | The system shall save the client's selected plan and enforce its weekly visit allowance from that moment. | US-PLAN-001, BR-012 |
| FR-022 | 1 | The system shall track subscription states — selected, payment link sent, active, grace, paused, cancelled — with every change recording who made it and when. | US-PLAN-002 |
| FR-023 | 1 | The system shall let an admin activate a subscription only with a payment reference, and shall notify the client and unlock scheduling on activation. | US-PLAN-002 |
| FR-024 | 1 | The system shall let a client cancel with one confirmation, run the plan to the end of the paid period, then lock scheduling while keeping history viewable. | US-PLAN-003 |
| FR-025 | 1 | The system shall apply a grace period (5 days *(Recommendation)*) at renewal before pausing, notifying the client at each state change. | US-PLAN-002 |
| FR-026 | 4 | The system shall credit the client's wallet the per-visit share of the plan price within 24 hours *(Recommendation)* of a visit being marked missed with no make-up scheduled. Phase 1–3 use a manual reconciliation credit; automatic crediting arrives with wallet infrastructure at Phase 4. | BR-008, Doc 28 §V1 |

### 12.4 Visit Scheduling

| ID | Phase | Requirement | Trace |
|---|---|---|---|
| FR-030 | 1 | The system shall let a client set weekly recurring visit slots up to the plan allowance, and shall refuse slots beyond it with the limit and upgrade path shown. | US-VISIT-001 |
| FR-031 | 1 | The system shall attach the client's standing note to every generated visit's checklist. | US-VISIT-001 |
| FR-032 | 1 | The system shall let a client reschedule a visit to an open slot in the same week, notifying the caregiver automatically. | US-VISIT-002 |
| FR-033 | 1 | The system shall return a cancelled visit to the allowance if cancelled before the cutoff (12 hours *(Recommendation)*), and count it with an on-screen explanation if after. | US-VISIT-002 |
| FR-034 | 1 | The system shall let an admin assign a verified caregiver to a schedule, suggesting the parent's previous caregiver first (continuity preference). | US-ADMIN-002 |
| FR-035 | 1 | The system shall support visit statuses: scheduled, in progress, completed, missed, parent declined, flagged. | US-VISIT-004, Document 05 |
| FR-036 | 1 | The system shall treat "parent declined" as a no-fault outcome for the caregiver and inform the client honestly. | US-VISIT-004, Tariq persona |

### 12.5 Visit Execution and Proof

| ID | Phase | Requirement | Trace |
|---|---|---|---|
| FR-040 | 1 | The system shall show a caregiver today's assigned visits — time, address, map link — loading from local cache when offline, marked with sync time. | US-VISIT-003 |
| FR-041 | 1 | The system shall provide a tap-based checklist (medication yes/no, mood 1–5, concern options, optional short note) completable in under two minutes. | US-VISIT-004 |
| FR-042 | 1 | The system shall accept visit media only from the live in-app camera — never from the gallery or file picker. | US-VISIT-005, BR-011 |
| FR-043 | 1 | The system shall work fully offline during a visit: checklist and photos save locally with device capture time, then sync automatically with visible states (saved / waiting to send / sent). | US-VISIT-004/005, Saima |
| FR-044 | 1 | The system shall store both capture time and upload time on every media file. | US-VISIT-005 |
| FR-045 | 1 | The system shall refuse to mark a visit complete without a finished checklist and at least one media file. | BR-011 (hard rule) |
| FR-046 | 1 | The system shall flag (not reject) visits whose media has not uploaded within 24 hours *(Recommendation)* for admin review. | US-VISIT-005 |
| FR-047 | 1 | The system shall preserve an interrupted checklist as a local draft that reopens where the caregiver left off. | US-VISIT-004 |
| FR-048 | 1 | The system shall show the caregiver each visit's earning once verified. | US-VISIT-004, Bilal persona |
| FR-049 | 2 | The system shall record GPS check-in and check-out at the parent's address, flagging (not rejecting) implausible locations for admin review. | BR-013, confirmed GPS rule |

### 12.6 Client Proof Feed

| ID | Phase | Requirement | Trace |
|---|---|---|---|
| FR-050 | 1 | The system shall show the client a feed of their parents' visits, newest first: photos, checklist summary, time, caregiver name. | US-VISIT-006 |
| FR-051 | 1 | The system shall show "visit complete — photos uploading" while media is queued, never an empty record. | US-VISIT-006 |
| FR-052 | 1 | The system shall show missed visits honestly in the feed with the reason and make-up plan. | US-VISIT-006 |
| FR-053 | 1 | The system shall serve all media through access-controlled links only — no public URLs. | US-VISIT-006, SEC-008 |

### 12.7 Errands (Phase 2)

| ID | Phase | Requirement | Trace |
|---|---|---|---|
| FR-060 | 2 | The system shall let a client request an errand (type, note, cost limit) routed to the assigned caregiver. | US-ERRAND-001, BR-014 |
| FR-061 | 2 | The system shall show pay-per-errand pricing before confirming requests beyond the plan's included errands. | US-ERRAND-001, BR-009 |
| FR-062 | 2 | The system shall require an in-app camera receipt photo to complete an errand, and shall add cost-plus-fee to the caregiver's earnings on completion. | US-ERRAND-002 |
| FR-063 | 2 | The system shall route over-limit costs to the client for approval before purchase. | US-ERRAND-001 |

### 12.8 Emergency (Phase 2)

| ID | Phase | Requirement | Trace |
|---|---|---|---|
| FR-070 | 2 | The system shall show a large, always-visible emergency button during active visits, opening a tap-only guided flow (situation, conscious, ambulance) with one confirm step. | US-EMERG-001 |
| FR-071 | 2 | The system shall broadcast an emergency to the client and admins within 10 seconds on four channels: in-app, push, SMS, WhatsApp. | BR-018, BR-019 |
| FR-072 | 2 | The system shall track delivery per channel, repeat unacknowledged alerts after 60 seconds *(Recommendation)*, and escalate to the next emergency contact in order. | US-NOTIF-002 |
| FR-073 | 2 | The system shall keep a live, append-only timeline of every emergency from raised to resolved, recording every actor and action. | BR-020 |
| FR-074 | 2 | The system shall let a client raise a remote emergency that alerts operations the same way. | US-EMERG-001 |

### 12.9 Admin Operations

| ID | Phase | Requirement | Trace |
|---|---|---|---|
| FR-080 | 1 | The system shall present caregiver applications with CNIC record, interview recording, and reference status in one view. | US-ADMIN-001 |
| FR-081 | 1 | The system shall make approval impossible while any verification gate is incomplete. | US-ADMIN-001 (hard rule) |
| FR-082 | 1 | The system shall log every admin action — decision, activation, reassignment, flag resolution — with the admin's identity and time. | Confirmed rule, US-ADMIN-001 |
| FR-083 | 1 | The system shall give admins a visit list filterable by status, opening any record with its full evidence. | US-ADMIN-003 |
| FR-084 | 2 | The system shall flag exceptions to admins — late check-ins, missed visits, low ratings, stuck uploads — so they work flags, not full lists. | Journey A2 |
| FR-085 | 2 | The system shall attach a visit's full evidence automatically when a client opens a dispute on it. | Journey C10/A4, BR-027 |

### 12.10 Notifications

| ID | Phase | Requirement | Trace |
|---|---|---|---|
| FR-090 | 1 | The system shall send the MVP notification set (registration, activation, visit assigned/changed/completed/missed/declined) per the notification map, on in-app, push, and email. | US-NOTIF-001, Document 05 Part D |
| FR-091 | 1 | The system shall retry failed notifications and flag repeated failures to admins — no silent drops. | US-NOTIF-001 |
| FR-092 | 1 | The system shall use calm wording and normal tones for all non-emergency notifications; loud treatment is reserved for emergencies. | Confirmed design rule |
| FR-093 | 2 | The system shall send ratings requests once per period, always skippable, attaching ratings to the caregiver record. | US-VISIT/C9, BR-022 |

---

## 13. Non-Functional Requirements

| ID | Requirement | Target |
|---|---|---|
| NFR-001 | Standard read responses (lists, feeds) shall answer quickly under normal load. | Under 300 ms at the 95th percentile (excluding free-tier cold starts, which are documented separately — NFR-008) |
| NFR-002 | The caregiver portal shall become usable fast on a 3G connection and a 2 GB RAM Android phone. | Interactive in under 3 seconds |
| NFR-003 | The client portal shall stay light. | Initial load under a defined budget *(Recommendation — 300 KB compressed for the first screen; confirm at build)* |
| NFR-004 | The system shall run correctly on the confirmed browser and device matrix (Section 8). | 100% of listed environments |
| NFR-005 | The caregiver visit flow shall work with zero connectivity for the entire visit. | Full offline capture; sync on reconnect |
| NFR-006 | Emergency broadcast shall meet its hard deadline. | Under 10 seconds from trigger to first channel send (Phase 2) |
| NFR-007 | The system shall be buildable and runnable by one developer. | Single-command local start; no required team-scale tooling |
| NFR-008 | Free-tier cold starts are accepted at MVP and shall be visible, not hidden. | A friendly loading state appears if the first response is slow |

---

## 14. Data Requirements

| ID | Requirement |
|---|---|
| DATA-001 | The system shall store data in the confirmed collections: users, client profiles, parent profiles, caregiver profiles, care plans, subscriptions, visits, errands (Phase 2), emergency alerts (Phase 2). |
| DATA-002 | Parent locations and caregiver service areas shall be stored as geographic coordinates with geospatial indexes, ready for Phase 2 GPS features. |
| DATA-003 | Every parent profile shall include the linked-family-members list from day one (FR-012). |
| DATA-004 | Visit records shall permanently keep: schedule data, status history, checklist content, media references with capture and upload times, and (Phase 2) GPS points. |
| DATA-005 | Media files shall live in Cloudinary; the database stores references only, never file contents. |
| DATA-006 | Records needed for complaints and future insurance claims (visits, errands, emergencies, consent) shall be kept whole and unedited; corrections are added as new entries, never overwrites. |
| DATA-007 | Deletion requests (privacy policy right) shall remove personal data while keeping the anonymous facts needed for accounts and legal records. *(Recommendation — exact anonymization rules set in the technical design document.)* |
| DATA-008 | All data shall live in the Asia-Pacific (Mumbai) region (Decision D-11). |

---

## 15. Security Requirements

| ID | Requirement |
|---|---|
| SEC-001 | Passwords shall be hashed with bcrypt (cost 10+); never stored, logged, or transmitted as plain text. |
| SEC-002 | Sessions shall use short-lived access tokens (15 minutes) and 7-day refresh tokens in secure httpOnly cookies; refresh tokens shall be revocable. |
| SEC-003 | Every protected action shall check the user's role on the server; interface hiding is never the security boundary. |
| SEC-004 | Sensitive fields — care notes, addresses, consent recordings, CNIC data, media — shall be encrypted at rest (AES-256). |
| SEC-005 | Authentication endpoints shall be rate-limited. |
| SEC-006 | All connections shall use TLS 1.2 or higher; plain HTTP shall redirect. |
| SEC-007 | All input shall be cleaned against database injection; output escaping shall guard against script injection. |
| SEC-008 | Media shall be served only through access-controlled links tied to the viewer's rights; no public URLs. |
| SEC-009 | CNIC and verification documents shall be visible only to admins, with each access logged; other users see only the Verified badge. |
| SEC-010 | Admin permissions shall be role-scoped from the start, ready for least-privilege splitting as the team grows. |
| SEC-011 | GPS anomalies (Phase 2) shall flag for review, never auto-reject — the confirmed fairness rule. |
| SEC-012 | Media shall carry a capture-source flag proving in-app camera origin (FR-042). |

---

## 16. Privacy Requirements

| ID | Requirement |
|---|---|
| PRV-001 | A privacy policy and terms shall be published and linked in the app before Phase 1 launch (BR-026), stating what is collected, the consent model, media retention, deletion rights, and the hosting region. |
| PRV-002 | The parent's recorded consent (FR-013) shall exist before any visit completes; withdrawal shall pause visits immediately (FR-014). |
| PRV-003 | Logs shall never contain passwords, tokens, full care notes, or media contents; sensitive fields are redacted by rule. |
| PRV-004 | Data access follows need: clients see their own family only; caregivers see assigned visits only, with addresses limited to a short window after assignment (48 hours *(Recommendation)*); admins see what their role requires, logged. |
| PRV-005 | Deletion requests shall be honored per DATA-007 within a stated time. *(Recommendation — 30 days, stated in the policy.)* |
| PRV-006 | UK/EU client rights (GDPR) shall be met through these controls regardless of hosting region (Decision D-11 basis). |

---

## 17. Performance Requirements

Covered by NFR-001, NFR-002, NFR-003, NFR-006. Additional:

| ID | Requirement |
|---|---|
| PERF-001 | The proof feed shall load its first screen of visits in one request; older visits load as the client scrolls. |
| PERF-002 | Media shall be served in compressed, size-appropriate forms (Cloudinary transformations), never raw originals to phones. |
| PERF-003 | Caregiver-portal pages shall keep payloads minimal: no client-portal or admin-portal code is ever downloaded by a caregiver device. |

---

## 18. Availability Requirements

| ID | Requirement |
|---|---|
| AVL-001 | Target uptime is 99.5% monthly from Phase 2 onward. At MVP on free tiers, availability is best-effort and honestly communicated (NFR-008). |
| AVL-002 | The emergency path (Phase 2) is the highest-availability subsystem: redundant channels mean one provider failure never silently drops an alarm (FR-071/072). |
| AVL-003 | Visit records shall save before side effects run; a notification failure never loses a visit (Section 11 interface rule). |

---

## 19. Scalability Requirements

| ID | Requirement |
|---|---|
| SCL-001 | The API shall be stateless (JWT sessions) so more servers can be added behind a load balancer without code change — the confirmed staged scaling plan. |
| SCL-002 | The design shall not require Redis, queues, or extra servers at MVP; it shall allow adding them at their planned phases without redesign. |
| SCL-003 | Data and code shall avoid city-specific hardcoding; the pilot is one city by policy (BR-029), not by technical limitation, so Phase 6 expansion is configuration, not rework. |

---

## 20. Accessibility Requirements

| ID | Requirement |
|---|---|
| ACC-001 | Status shall always pair color with a text label (the confirmed colorblind-safe rule). |
| ACC-002 | Every interactive element shall have a visible focus state; the palette's contrast pairs (Primary on Surface, Text on Background) shall meet WCAG AA. |
| ACC-003 | Caregiver screens shall use large touch targets, minimal text, and icons with labels (Decision D-09 mitigation). |
| ACC-004 | Client-facing text shall be readable by someone with no Pakistani cultural context (Kevin persona rule). |

---

## 21. Localization Requirements

| ID | Requirement |
|---|---|
| LOC-001 | Phase 1 is English-only (Decision D-09). |
| LOC-002 | All user-facing text shall live in a single text layer (not scattered in code) so the Phase 5 Urdu toggle is a translation task, not a rebuild. *(Recommendation — standard i18n structure from day one.)* |
| LOC-003 | Prices display in the client's currency from the fixed price table (FR-020); dates and times display in each user's local time zone. |

---

## 22. Audit Requirements

| ID | Requirement |
|---|---|
| AUD-001 | Every admin action shall be logged with identity and time (FR-082). |
| AUD-002 | Subscription state changes shall record who and when (FR-022). |
| AUD-003 | Emergency timelines shall be append-only (FR-073). |
| AUD-004 | Access to CNIC/verification documents shall itself be logged (SEC-009). |
| AUD-005 | Evidence records (DATA-006) shall never be edited in place. |

---

## 23. Notification Requirements

Covered by FR-090 to FR-093 and the Document 05 Part D map. Additional:

| ID | Requirement |
|---|---|
| NOT-001 | Every notification type shall have a defined channel set, wording tone (calm/loud), and retry rule before build — no ad-hoc notifications. |
| NOT-002 | Users shall be able to control non-essential notifications; essential ones (visit missed, emergency, payment state) cannot be switched off. *(Recommendation — the exact essential list is fixed at build.)* |

---

## 24. Integration Requirements

| ID | Requirement |
|---|---|
| INT-001 | Every outside service call shall have a timeout and a defined failure path (Section 25); no outside failure corrupts core records. |
| INT-002 | The media layer shall sit behind an internal interface so Cloudinary can be swapped for S3 at Phase 5 without touching visit logic (the confirmed swap-ready rule, D-05). |
| INT-003 | The payment layer shall sit behind an internal interface from day one, even while Phase 1 is manual, so Phase 4 (in-app Payoneer) and the eventual Stripe switch change one layer only (the confirmed Strategy-pattern rule). |
| INT-004 | Notification channels shall share one dispatch interface so adding SMS and WhatsApp at Phase 2 adds channels, not rewrites (the confirmed Factory rule). |

---

## 25. Error Handling

| ID | Requirement |
|---|---|
| ERR-001 | All API errors shall use one consistent response shape; in production, internal details (stack traces, database errors) never reach users. |
| ERR-002 | Expected errors (allowance exceeded, slot full, not found) shall return clear, human messages that the interface can show as-is. |
| ERR-003 | Unexpected errors shall be logged with full detail server-side and shown to users as a calm, generic message with a support path. |
| ERR-004 | The caregiver portal shall treat network failure as normal, not exceptional: every write queues and retries; nothing is lost and nothing fails silently (FR-043). |
| ERR-005 | Form errors shall highlight inline and never destroy entered data (FR-011, FR-047). |

---

## 26. Backup and Recovery

| ID | Requirement |
|---|---|
| BCK-001 | The database shall be backed up daily with 30-day retention (per the confirmed plan; Atlas M0 limits at MVP are accepted and documented *(Assumption — M0 backup limits; verified at setup)*). |
| BCK-002 | Recovery targets: back up and running within 4 hours (RTO); at most 24 hours of data loss (RPO), tightening after MVP per the confirmed plan. |
| BCK-003 | A backup restore shall be tested before each major release — an untested backup counts as no backup (confirmed rule). |
| BCK-004 | Media in Cloudinary relies on provider redundancy; the database keeps enough reference data to detect any missing media. |

---

## 27. Observability

| ID | Requirement |
|---|---|
| OBS-001 | Logs shall be structured (JSON), leveled (error/warn/info/debug), and redacted per PRV-003. |
| OBS-002 | A health endpoint shall report system status for uptime monitoring. |
| OBS-003 | Unhandled errors shall be captured and grouped by an error-tracking service from Phase 1. *(Recommendation — a free-tier service such as Sentry; chosen at build.)* |
| OBS-004 | The business measures that define success — verified visits per week, on-time rate, proof attach rate, feed opens — shall be countable from stored data without manual work (the analytics events of Document 06). |
| OBS-005 | From Phase 2, alert rules shall watch the emergency deadline (10 seconds) and error rates, notifying operations when breached. |

---

## 28. Acceptance Criteria (System Level)

The MVP passes acceptance when all of the following are demonstrated together, matching Document 03 Section 21. Each check has a stable ID (AC-01 through AC-12) so tests and other documents can reference them without restating the criteria.

| ID | Criterion | Traces to |
|---|---|---|
| **AC-01** | A client registers, verifies email, creates a parent profile with a map pin, selects a plan, and — after admin activation with a payment reference — schedules visits within the allowance. | FR-001–002, FR-010, FR-020–023, FR-030 |
| **AC-02** | Attempting to exceed the allowance is refused with the limit shown. | FR-030 |
| **AC-03** | A caregiver applies, is verified through the pipeline (approval impossible with an incomplete gate), and sees today's visits. | FR-003, FR-080–081, FR-040 |
| **AC-04** | The first visit runs the consent step; a declined consent closes the visit no-fault and pauses the profile. | FR-013–014, FR-036 |
| **AC-05** | A visit completes only with a finished checklist and at least one in-app camera photo; gallery upload is impossible. | FR-042, FR-045, SEC-012 |
| **AC-06** | The same visit, performed with airplane mode on, saves fully offline and syncs later with correct capture and upload times. | FR-043–044 |
| **AC-07** | The client's feed shows the completed visit with photos and summary; media links are access-controlled. | FR-050, FR-053, SEC-008 |
| **AC-08** | A missed visit appears honestly in the feed with a reason. | FR-052 |
| **AC-09** | All admin actions taken during the test appear in the audit log with identity and time. | FR-082, AUD-004 |
| **AC-10** | The caregiver portal passes the device test: usable in under 3 seconds on a 2 GB RAM Android over throttled 3G. | NFR-002 |
| **AC-11** | The published privacy policy is linked in the app. | PRV-001 |
| **AC-12** | All screens use the mandatory palette and status color+label rule. | Section 9 constraint 7, ACC-001 |

Document 22 (Testing and QA Strategy) references these IDs directly rather than restating the criteria — this prevents drift.

---

## 29. Requirement Traceability Matrix

How requirements chain back to business requirements and stories (representative rows; the pattern covers all):

| Business need (BR) | Story (US) | Requirements here |
|---|---|---|
| BR-001 foreign-currency customers | US-AUTH-001 | FR-001, FR-002 |
| BR-010 caregiver verification | US-AUTH-002, US-ADMIN-001 | FR-003, FR-080, FR-081, SEC-009 |
| BR-011 proof or it did not happen | US-VISIT-004/005 | FR-042, FR-044, FR-045, SEC-012 |
| BR-012 plan allowances enforced | US-VISIT-001 | FR-021, FR-030 |
| BR-013 GPS confirmation (Phase 2) | — | FR-049, SEC-011 |
| BR-014 errands with receipts (Phase 2) | US-ERRAND-001/002 | FR-060–063 |
| BR-018/019 emergency speed and redundancy (Phase 2) | US-EMERG-001, US-NOTIF-002 | FR-070–074, NFR-006, AVL-002 |
| BR-020 emergency timelines | US-EMERG-001 | FR-073, AUD-003 |
| BR-025 parent consent | US-PROFILE-003 | FR-013–015, PRV-002 |
| BR-026 privacy policy | — | PRV-001 |
| BR-027 evidence records | US-ADMIN-003 | DATA-004, DATA-006, FR-085 |
| BR-028 / D-11 data region | — | DATA-008 |
| BR-015 backup caregivers | US-ADMIN-002 | FR-034 (reassignment) |
| BR-022 ratings govern quality (Phase 2) | C9 journey | FR-093 |
| D-02 linked family future-proofing | US-PROFILE-002 | FR-012, DATA-003 |
| D-04 in-app plan choice, manual payment | US-PLAN-001/002 | FR-020–023, INT-003 |
| D-05 swappable media storage | — | INT-002, DATA-005 |
| D-07 email verification first | US-AUTH-001 | FR-002 |
| D-09 English + simple caregiver screens | — | LOC-001, ACC-003 |
| Saima edge case (offline) | US-VISIT-004/005 | FR-043, NFR-005, ERR-004 |
| Tariq edge case (declined, no fault) | US-VISIT-004 | FR-036, FR-013 |

Rule going forward: any new requirement added to this SRS must name its BR or US source, or be labeled *(Recommendation)* until the founder approves it (Source of Truth Rule 4).

---

*End of Document 07 — RozVisit Software Requirements Specification*
