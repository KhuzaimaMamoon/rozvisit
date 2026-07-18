# RozVisit — Screen Inventory and UI Specifications
### Document 16

**Sources:** Documents 00–15, especially the 27-screen count in Document 14, the design system (Document 15), and the API map (Document 12).
**Labels:** Everything here is confirmed unless marked *(Assumption)*, *(Recommendation)*, or *(Open)*.
**Category mapping (per the prompt's structure, applied to RozVisit's real shape):** the *user/patient interface* is the **Client Portal**; the *provider/professional interface* is the **Caregiver Portal**; the *clinic/organization interface* is **not applicable** (the canonical brief has no clinic entity — Document 04 confirms). The parent is a profile, not a login role, and therefore has no screens of their own.

**Design system rule for every screen below:** only Document 15's tokens and components are used. The 20 specification fields per screen from the prompt are consolidated for readability — where a field is standard across the product (loading skeleton, calm error, focus rings), the shared behavior is stated once at the top of each part and not repeated per screen.

---

## Shared Behavior (applies to every screen; not repeated below)

- **Loading:** the design system skeletons (Document 15 §39) match layout geometry; buttons show inline spinners on submit; cold-start message after 2s (NFR-008).
- **Error:** the API's human message renders in-place for expected errors (ERR-002); calm generic panel for unexpected (ERR-003); forms never lose input (ERR-005).
- **Success feedback:** state updates arrive via toast (Document 15 §26) with a one-sentence confirmation ("Visit scheduled") or by the record itself changing on the page.
- **Accessibility:** color+label pairing on every status, visible focus everywhere, ≥44px targets on the caregiver portal, keyboard-completable, labels associated with fields, images of proof get factual alt text.
- **Responsive baseline:** client and caregiver mobile-first; admin desktop-first, degrading (tables → cards §23; sidebar → icon rail §31).
- **Design system components implied throughout:** Button, StatusBadge, Card, Modal, Toast, EmptyState, FormInput, SyncStateBar, and the visit family (§35).

---

# Part A — Public Pages

## S-01. Landing

- **Route:** `/`
- **Role:** public
- **Purpose:** Explain how RozVisit works and earn a first click to register.
- **Entry points:** direct URL, community WhatsApp/Facebook links, search.
- **Sections:** hero (headline + one-sentence value + primary CTA), how-it-works (3 steps, illustrated), trust panel (verification explanation + real proof example), pricing preview (three plans, "introductory pricing" note), FAQ (short), footer (privacy, terms, contact).
- **Components:** Header (public variant, logo + Login + Register), primary CTA button, Card × 3 for steps, illustration (line, primary/accent), StatusBadge showing "Verified" as an example.
- **Actions:** Register (client), I'm a caregiver → Apply, Login.
- **Data displayed:** static marketing content; the pricing preview reads from the API `/plans` in the visitor's likely currency by IP hint *(Recommendation — soft geo hint; falls back to USD)*.
- **Form fields:** none.
- **Responsive:** hero stacks below `md`; steps become vertical.
- **Empty/error:** if the plan preview call fails, show the ranges from Document 03 §15 as static content — never a broken price.
- **Permissions:** none.
- **APIs:** `GET /plans` (best-effort).
- **Analytics:** `landing.viewed`, `landing.cta_register`, `landing.cta_apply`, `landing.cta_login`.

## S-02. Privacy Policy · S-03. Terms of Service

- **Route:** `/privacy`, `/terms`
- **Role:** public
- **Purpose:** Publish and link the mandatory policies (PRV-001).
- **Sections:** long-form content, `text-base`/1.6 (Document 15 §9), table-of-contents anchor list on the side at `lg`.
- **Data:** static, versioned in the repo.
- **Responsive:** ToC becomes an accordion below `md`.
- **Analytics:** `policy.viewed` with `page` param.

---

# Part B — Authentication

*(Full auth flows: Document 13; API: Document 12.)*

## S-04. Register (Client)

- **Route:** `/register`
- **Role:** public
- **Purpose:** Create a client account (FR-001).
- **Sections:** form card, "already have an account? Login" link, brand-side quiet trust column at `lg` (short trust bullets, no distraction).
- **Fields:** name (2–100), email, phone (E.164, country selector prefill), country, password (inline rules, common-password warning per Document 13 §8).
- **Validation:** shown before submit; inline on blur; on submit any first error is scrolled to and focused.
- **Actions:** Register (primary).
- **Loading:** button spinner, submit disabled.
- **Empty state:** N/A.
- **Error state:** field-level for validation; alert band above form for duplicate email (with links to Login and Reset).
- **Success:** navigation to S-06 with the entered email pre-filled.
- **Responsive:** single column below `md`.
- **Permissions:** public; rate-limited.
- **APIs:** `POST /auth/register`.
- **Analytics:** `auth.signup_started`, `auth.signup_completed`.

## S-05. Caregiver Apply

- **Route:** `/apply`
- **Role:** public
- **Purpose:** Start a caregiver application (FR-003).
- **Sections:** intro copy ("this is a verified role — here's what to expect"), form.
- **Fields:** name, email, phone, password, CNIC number (13 digits), service area (map pin + radius km).
- **Validation:** CNIC format, map coordinates present.
- **Success:** navigation to S-19 (application status) — even before email verification, so the applicant sees "we've got you."
- **APIs:** `POST /auth/apply`.
- **Analytics:** `auth.caregiver_applied`.

## S-06. Verify Prompt

- **Route:** `/verify-email` (also reached after Register)
- **Purpose:** Direct the new user to their inbox and offer resend.
- **Sections:** message with the email address partially masked, Resend button (rate-limited, silent-success), Change email link → back to Register.
- **Success:** the verification link (S-07) is used elsewhere; this screen offers a "I've verified — sign in" nudge that just goes to Login.
- **APIs:** `POST /auth/resend-verification`.

## S-07. Verify Email (link target)

- **Route:** `/verify?token=…`
- **Purpose:** Handle the emailed link and confirm.
- **States:** loading (verifying), success (single sentence + "Continue to login"), expired (`410` — one-tap resend).
- **APIs:** `POST /auth/verify-email`.

## S-08. Login

- **Route:** `/login`
- **Purpose:** Get returning users in.
- **Fields:** email, password, "Remember me" is not offered (refresh cookie already does that quietly — Document 13 §5).
- **Actions:** Login (primary), Forgot password.
- **Error handling:** the same-message rule (Section 2 of Document 13) — never leak which of email/password was wrong.
- **Success:** navigation to the role's home (Client → S-11 Feed; Caregiver verified → S-20 Today; Caregiver applied/in_review/rejected → S-19; Admin → S-27).
- **APIs:** `POST /auth/login`; the wrapper handles silent refresh (Document 12 §4).
- **Analytics:** `auth.login_succeeded/failed`.

## S-09. Forgot Password · S-10. Reset Password

- **Routes:** `/forgot`, `/reset?token=…`
- **Purpose:** Recovery via email (FR-006).
- **S-09 fields:** email; always-success message ("If that email exists, a reset link is on its way — check your inbox").
- **S-10 fields:** new password (rules shown); on success: confirmation + "you've been signed out of other devices" note (Document 13 §10).
- **APIs:** `POST /auth/forgot`, `POST /auth/reset`.

---

# Part C — User/Patient Interface (Client Portal)

Routes under `/app/*`. Layout: sidebar (desktop) / bottom tab bar (mobile 4 items: Feed, Parents, Schedule, Account). The Feed is home.

## S-11. Feed — Home

- **Route:** `/app/feed`
- **Role:** client (verified)
- **Purpose:** The core moment: see today's proof at a glance (Journey C7).
- **Entry points:** post-login default; visit-completed push notification; bottom tab.
- **Sections:** parent selector (dropdown when >1 parent, hidden with 1), the feed stream, quick-actions row (Schedule visit · Request errand [Phase 2]).
- **Components:** VisitCard × N (§35), StatusBadge, EmptyState.
- **Actions:** open a visit card → S-12; tap photo → lightbox.
- **Data displayed:** newest visits first — photos (compressed), StatusBadge, one-line checklist summary, caregiver name, capture-relative + absolute time.
- **Empty state:** "Your first visit is scheduled for [date]" + View schedule (never a bare empty).
- **Loading:** skeleton cards match VisitCard geometry.
- **Special states:** photos still uploading → "Visit complete — photos uploading" state on the card (FR-051); missed visits → StatusBadge in emergency-soft, `missedReason` shown, make-up plan line (FR-052).
- **Responsive:** single column; ≥`lg` shows a second column of visit thumbnails to skim.
- **Accessibility:** each proof photo has factual alt text ("Photo from visit, 21 July").
- **Permissions:** own parents only (ownership ring).
- **APIs:** `GET /feed?parentId&before&limit` (cursor pagination).
- **Analytics:** `feed.opened`, `feed.visit_viewed` (24h open rate is a north-star quality signal).

## S-12. Visit Detail

- **Route:** `/app/visits/:id`
- **Purpose:** Full evidence of one visit.
- **Sections:** header (parent, caregiver avatar+name, StatusBadge, scheduledAt + times with ProofTimestamp for the capture/upload gap when they differ), checklist details, media gallery, standing note if any, "Report a problem" (link into S-18 pre-filled).
- **Data:** the full visit record via visit-scoped feed API or a dedicated detail endpoint *(Recommendation — expose a detail endpoint if the feed shape gets crowded; both are viable)*.
- **Actions:** Report a problem (S-18), download photo *(Recommendation — original resolution allowed for the owner; via a signed link)*.
- **APIs:** `GET /feed?visitId=` (or the dedicated route above).
- **Analytics:** `visit.detail_viewed`, `visit.report_started`.

## S-13. My Parents (list) · S-14. Parent Overview

- **Routes:** `/app/parents`, `/app/parents/:id`
- **S-13 sections:** list of parents (name, status badge, subscription state); primary action Add parent → S-15.
- **S-14 sections:** tabs — Profile / Visits / Plan (Document 15 §29). Header carries StatusBadge for parent status (pending consent / active / paused).
- **Data:** parent profile, active subscription snapshot, recent visits.
- **Actions:** Edit → S-15 edit mode; Cancel plan → S-17; Withdraw consent → confirm modal → PATCH consent.
- **Empty state (S-13):** "Add your parent to begin" + Add parent.
- **APIs:** `GET /parents`, `GET /parents/:id`.

## S-15. Add / Edit Parent

- **Route:** `/app/parents/new`, `/app/parents/:id/edit`
- **Purpose:** Create or update the parent profile (FR-010).
- **Fields:** name, age (40–120), phone (optional), address text, map pin (adjustable, both saved), care notes (encrypted, marked "sensitive" microcopy), emergency contacts (≥1; each: name, phone, relation, priority).
- **Validation:** per Document 11 dictionary; friendly error if map service is unreachable → manual pin.
- **Draft preservation:** local draft as the user types (ERR-005).
- **Success:** navigation to S-14; if a plan isn't yet chosen, a gentle next-step nudge to S-16.
- **APIs:** `POST /parents`, `PATCH /parents/:id`.
- **Analytics:** `profile.parent_created/completed`.

## S-16. Plan Selection · S-17. Subscription Status

- **Routes:** `/app/parents/:id/plan`, `/app/subscriptions/:id`
- **S-16 sections:** three plan cards side by side (Basic / Standard / Premium), each with visits/week, errand allowance, price in the client's currency and an "introductory pricing" note (BR-004).
- **S-16 actions:** Select → creates the subscription in `selected` state, moves to "payment pending" panel with expectation copy ("we will send your secure Payoneer link within 24 hours").
- **S-17 sections:** state header (StatusBadge — pending/active/grace/paused/cancelled), history list (states with timestamps and who changed them), currentPeriodEnd, Cancel action (one confirm, no dark patterns — FR-024).
- **Empty state (S-16):** N/A — this screen is itself the empty state for "no plan yet."
- **APIs:** `GET /plans`, `POST /subscriptions`, `GET /subscriptions/:id`, `POST /subscriptions/:id/cancel`.
- **Analytics:** `plan.viewed/selected/cancel_started/cancelled/reactivated`.

## S-18. Schedule Visits

- **Route:** `/app/parents/:id/schedule`
- **Purpose:** Set the weekly recurring slots (FR-030) and see upcoming visits.
- **Sections:** allowance counter (used/total for the week), slot picker (day-of-week chips + time dropdown within service hours — Document 15 §34), standing note field, upcoming visits list with per-visit Reschedule / Cancel.
- **Validation:** slots ≤ allowance; over the limit → an inline message with the plan limit and upgrade path; before-cutoff-vs-after cancel messaging.
- **Actions:** Add slot, Save schedule, Reschedule visit, Cancel visit.
- **Empty state:** "Choose your first slot" + illustration.
- **APIs:** `POST /visits/schedule`, `PATCH /visits/:id/reschedule`, `POST /visits/:id/cancel`.
- **Analytics:** `visit.scheduled/allowance_blocked/rescheduled/cancelled_before_cutoff/cancelled_after_cutoff`.

## S-19. Report a Problem (support/dispute entry)

- **Route:** `/app/visits/:id/report` (also `/app/support` general)
- **Purpose:** Client-side of the dispute flow (Journey C10, BR-085).
- **Sections:** problem-type chips (visit didn't happen, wrong service, safety concern, billing, other), description, the visit's evidence auto-attached (read-only preview so the client sees what admin will see).
- **Success:** case created; message: "Nasreen from operations will respond within 24 hours"; toast confirmation.
- **APIs:** *(reserved — support endpoint set at Phase 2 formalization; at MVP a simpler create-case endpoint is enough)* *(Open — endpoint finalized at build)*.
- **Analytics:** `support.case_created`.

## S-20. Notifications (client)

- **Route:** `/app/notifications`
- **Purpose:** The full notification list + read state.
- **Components:** notification list rows (icon by type, title, body, calm timestamp, unread dot in `primary`).
- **Actions:** mark read (auto on open), Preferences link → S-21.
- **APIs:** `GET /notifications`, `POST /notifications/:id/read`.
- **Analytics:** `notif.opened`.

## S-21. Account & Preferences

- **Route:** `/app/account`
- **Sections:** name/email/phone (edit), currency (display only, from country), language (English at MVP, Urdu greyed with "Coming in a later release" — LOC-001/002), notification preferences (essential list disabled with tooltip explaining why, non-essential toggleable — NOT-002), Log out.
- **Actions:** Save changes, Log out.
- **APIs:** `PATCH /users/me` *(Recommendation — a minimal me-endpoint at build)*, `POST /auth/logout`.

---

# Part D — Provider/Professional Interface (Caregiver Portal)

Routes under `/care/*`. Layout per Document 15 §30: no sidebar — a simple top bar; the Today list *is* the navigation; visit flow is full-screen focused. Designed at 360px width first, 44px minimum touch targets, `text-sm`/`text-base` minimums.

## S-22. Application Status (pre-verified)

- **Route:** `/care/status`
- **Role:** caregiver (applied / in_review / rejected)
- **Purpose:** The only screen a not-yet-verified caregiver can reach (FR-003) — no visit features, no dead ends.
- **Sections:** current status with StatusBadge, plain-language explanation of the current gate (ID check / interview / reference / decision), estimated timeline, contact-support link.
- **APIs:** `GET /users/me` returns status + caregiver profile summary.
- **Analytics:** `care.status_viewed`.

## S-23. Today

- **Route:** `/care/today`
- **Role:** caregiver (verified)
- **Purpose:** Day at a glance (FR-040).
- **Sections:** date header ("Tuesday, 21 Jul"), online/offline chip (SyncStateBar collapsed when queue is empty), visit rows ordered by time, per-visit map link, sticky Earnings link → S-27.
- **Components:** VisitRow (§35), SyncStateBar.
- **Actions:** Tap a visit → S-24.
- **Data:** the today-list; loaded from local cache when offline, marked with sync time.
- **Empty state:** "No visits today. Enjoy the break." (kept short — resolute calm).
- **Special behavior:** service worker caches the app shell so this screen opens fast offline.
- **Responsive:** already 360px-first; grows to two-column at `md` for tablets.
- **APIs:** `GET /visits/today`.
- **Analytics:** `visit.list_opened`, `visit.list_opened_offline`.

## S-24. Visit Flow (multi-step, one screen)

- **Route:** `/care/visits/:id`
- **Role:** caregiver (assigned to this visit)
- **Purpose:** The complete visit: consent (first visit only) → checklist → camera → complete, with honest sync throughout (FR-041–048).
- **Sections (progressive within one screen):**
  1. Visit header: parent name, time, address, standing note, consent choices reminder (photo boundaries, preferred times).
  2. Consent panel (first visit only): explain → capture agreement (record button uses in-app mic/camera) or record decline (Tariq path — closes the visit no-fault, FR-036).
  3. Checklist (§35 ChecklistForm): medication yes/no, mood 1–5 (five 44px targets), concern chips, optional short note.
  4. Camera (CameraCapture §35): live viewfinder, shutter, thumbnail strip; no gallery affordance anywhere (FR-042).
  5. Complete: summary review → Complete visit (primary).
- **Actions:** Save (auto per step), Take photo, Complete visit, Parent declined.
- **Validation:** completion refused without checklist + ≥1 photo (FR-045); consent required if profile is `pending_consent`.
- **Offline behavior:** everything works offline; the SyncStateBar shows per-item state; completion queued when offline (FR-043) and dedupes on retry via `clientVisitId`.
- **Empty/error:** low storage → warn before capture; camera denied → clear instructions; upload flagged past 24h → visible to the caregiver ("photos flagged for review", not a failure) (FR-046).
- **Success:** toast "Visit completed — well done", the visit turns Verified with earning visible (FR-048), return to Today.
- **Accessibility:** every step keyboard-reachable; the shutter button has aria-label "Take proof photo"; mood targets have accessible names 1–5.
- **APIs:** `POST /parents/:id/consent`, `POST /visits/:id/checklist`, `POST /visits/:id/media-permit` → direct upload to Cloudinary, `POST /visits/:id/complete`, `POST /visits/:id/parent-declined`.
- **Analytics:** `visit.checklist_completed`, `visit.parent_declined`, `visit.completed_offline`, `visit.photo_captured/upload_queued/upload_completed/upload_flagged`.

## S-25. Earnings

- **Route:** `/care/earnings`
- **Purpose:** Per-visit verified earnings list (FR-048, Bilal persona core need).
- **Sections:** total this month (tabular numerals), by-visit rows with date, parent (initials for privacy — full name only inside a visit context *(Recommendation)*), amount PKR, verified state.
- **Empty state:** "Your first earning shows here after your first verified visit."
- **APIs:** *(Recommendation — a minimal earnings query; derives from verified visits)*.

## S-26. Caregiver Account

- **Route:** `/care/account`
- **Sections:** name, phone, service area (view-only — updates go through admin), Verified badge, availability (edit later — Phase 2), Log out.
- **APIs:** `GET /users/me`.

---

# Part E — Clinic/Organization Interface

**Not applicable.** The canonical brief has no clinic/organization entity. Companies and NGOs appear only as partners in the confirmed Phase 6 revenue stream (BR-031) — that is a business relationship, not a portal.

---

# Part F — Admin Interface

Routes under `/admin/*`. Layout: full sidebar always (Document 15 §30/31). Designed at `lg` first, degrades to stacked cards. Every admin mutation writes an audit event (FR-082); this is invisible in the UI but true throughout.

## S-27. Admin Home / Overview (MVP simple)

- **Route:** `/admin`
- **Role:** admin
- **Purpose:** Signposts and today's workload — the workbench entry.
- **Sections:** four count cards (Pending applications, Active subscriptions, Completed visits today, Open flags — StatCard-lite at MVP), links to each area.
- **Phase 2:** replaced by the SLA dashboard (S-33).
- **APIs:** small count endpoints or piggybacked list metadata *(Recommendation — a small dashboard-counts endpoint at MVP)*.
- **Analytics:** `admin.overview_viewed`.

## S-28. Applications Queue · S-29. Application Detail

- **Routes:** `/admin/applications`, `/admin/applications/:id`
- **S-28 sections:** filter chips (Applied / In review / Rejected), table (name, area, applied at, gate summary — small dots for CNIC/Interview/Reference).
- **S-29 sections:** applicant identity, gate cards (CNIC upload preview [access is audited — visible microcopy], interview recording player, reference outcome/notes), decision panel (Approve / Reject / Request info + note).
- **Validation:** Approve button disabled unless all three gates true (FR-081); attempting via API returns `409` with the reason.
- **Success:** decision toast; applicant status flips; applicant notified.
- **APIs:** `GET /admin/applications`, `GET /admin/applications/:id` (this read writes `cnic.viewed`), `POST /admin/applications/:id/decision`.
- **Analytics:** `admin.application_opened`, `admin.caregiver_approved/rejected`.

## S-30. Visits Oversight · S-31. Visit Evidence (admin detail)

- **Routes:** `/admin/visits`, `/admin/visits/:id`
- **S-30 sections:** filter row (status, date range, caregiver), table (parent, caregiver, scheduledAt, StatusBadge, flag indicator).
- **S-31 sections:** full evidence — the client-side VisitCard content plus internal fields (statusHistory, upload times, flag state and note).
- **Actions:** Resolve flag → note modal; open dispute if it becomes one.
- **APIs:** `GET /admin/visits`, `POST /admin/flags/:id/resolve`.

## S-32. Assign

- **Route:** `/admin/visits/:id/assign` (also embedded in scheduling reviews)
- **Purpose:** Assign a verified caregiver, continuity-first (FR-034).
- **Sections:** suggestion list (previous caregiver first when present, then verified caregivers in-area sorted by current load), assign button per row.
- **Validation:** only verified caregivers actionable; area mismatch shown but blocked with a reason chip.
- **APIs:** `GET /admin/visits/:id/assignment-suggestions`, `POST /admin/visits/:id/assign`.
- **Analytics:** `admin.visit_assigned`, `admin.visit_reassigned`.

## S-33. Subscriptions Workbench

- **Route:** `/admin/subscriptions`
- **Purpose:** The Phase 1 manual-payment operations surface (US-PLAN-002).
- **Sections:** state filter chips (link_sent / active / grace / paused / cancelled), table (client, parent, plan, state, currentPeriodEnd, updatedAt).
- **Actions per row:** Send link (marks `link_sent` with an outgoing note), Activate (opens modal for paymentRef → marks `active`), Pause (grace-only), View history.
- **Validation:** activation requires paymentRef (FR-023); illegal transitions return `409` (button disabled preemptively).
- **APIs:** `GET /admin/subscriptions?state=`, `PATCH /admin/subscriptions/:id/state`.
- **Analytics:** `admin.subscription_state_changed` with `to`.

## Phase 2 admin (documented, not built at MVP)

- S-34 SLA Dashboard: exception flags surfaced as work-the-flags, not tables (FR-084).
- S-35 Dispute Queue: cases with auto-attached evidence bundles, closure with rule outcomes.
- S-36 Emergency Management: the live timeline and coordination surface (Module 6).

Their layouts follow the design system without new inventions; specified fully at Phase 2 start.

---

# Part G — Shared Screens

Screens available to authenticated users regardless of portal.

## S-37. Notifications (shared component, mounted per portal)

- Route: `/app/notifications`, `/care/notifications`, `/admin/notifications`. Same list component (S-20 spec); portal-specific header only.

## S-38. Account / Profile (shared pattern)

- The client S-21, caregiver S-26, and an admin equivalent all use the same layout blocks (fields, preferences, log out) with role-specific fields.

## S-39. Search (admin-only at MVP)

- Not a full screen but a shared component (Document 15 §33): admin list-toolbar search on user email / applicant name. No global search bar exists at MVP.

---

# Part H — Error and System Screens

## S-40. 404 Not Found

- **Route:** `*` catch-all (SPA fallback)
- **Content:** calm panel — logo, "This page doesn't exist," link to the user's role home (or Login if unauthenticated). Never a stack trace, never a dead link.
- **Analytics:** `system.404` with the attempted path (for detecting broken links).

## S-41. 500 / Unexpected Error

- **Route:** not a route — the ErrorBoundary state on any page.
- **Content:** "Something went wrong on our side" + Retry + Contact support. Matches ERR-003 exactly. Sentry captures the underlying error server-side (OBS-003).
- **Analytics:** `system.error_boundary_shown`.

## S-42. Offline (fallback for the non-cached parts)

- Not a dedicated route — a banner that appears at the top of any online-required screen when the device is offline. The caregiver portal treats offline as normal, so it does not show this banner; the client and admin portals do.

## S-43. Maintenance (planned downtime)

- **Route:** rendered at any URL when the API returns a `503 MAINTENANCE`.
- **Content:** planned-downtime message with an ETA when known. *(Recommendation — the API contract for `503` at build; not expected before Phase 2.)*

---

# Screen Inventory Table

| ID | Screen | Portal | Route | MVP |
|---|---|---|---|---|
| S-01 | Landing | public | `/` | yes |
| S-02 | Privacy Policy | public | `/privacy` | yes |
| S-03 | Terms of Service | public | `/terms` | yes |
| S-04 | Register | public | `/register` | yes |
| S-05 | Caregiver Apply | public | `/apply` | yes |
| S-06 | Verify Prompt | public | `/verify-email` | yes |
| S-07 | Verify Email link | public | `/verify` | yes |
| S-08 | Login | public | `/login` | yes |
| S-09 | Forgot Password | public | `/forgot` | yes |
| S-10 | Reset Password | public | `/reset` | yes |
| S-11 | Feed (home) | client | `/app/feed` | yes |
| S-12 | Visit Detail | client | `/app/visits/:id` | yes |
| S-13 | My Parents | client | `/app/parents` | yes |
| S-14 | Parent Overview | client | `/app/parents/:id` | yes |
| S-15 | Add/Edit Parent | client | `/app/parents/new` | yes |
| S-16 | Plan Selection | client | `/app/parents/:id/plan` | yes |
| S-17 | Subscription Status | client | `/app/subscriptions/:id` | yes |
| S-18 | Schedule Visits | client | `/app/parents/:id/schedule` | yes |
| S-19 | Report a Problem | client | `/app/visits/:id/report` | yes (basic) |
| S-20 | Notifications | client | `/app/notifications` | yes |
| S-21 | Account | client | `/app/account` | yes |
| S-22 | Application Status | caregiver | `/care/status` | yes |
| S-23 | Today | caregiver | `/care/today` | yes |
| S-24 | Visit Flow | caregiver | `/care/visits/:id` | yes |
| S-25 | Earnings | caregiver | `/care/earnings` | yes |
| S-26 | Caregiver Account | caregiver | `/care/account` | yes |
| S-27 | Admin Overview | admin | `/admin` | yes |
| S-28 | Applications Queue | admin | `/admin/applications` | yes |
| S-29 | Application Detail | admin | `/admin/applications/:id` | yes |
| S-30 | Visits Oversight | admin | `/admin/visits` | yes |
| S-31 | Visit Evidence (admin) | admin | `/admin/visits/:id` | yes |
| S-32 | Assign | admin | `/admin/visits/:id/assign` | yes |
| S-33 | Subscriptions Workbench | admin | `/admin/subscriptions` | yes |
| S-34 | SLA Dashboard | admin | `/admin/dashboard` | Phase 2 |
| S-35 | Dispute Queue | admin | `/admin/disputes` | Phase 2 |
| S-36 | Emergency Management | admin | `/admin/emergencies` | Phase 2 |
| S-37 | Notifications (shared) | shared | `/*/notifications` | yes |
| S-38 | Account (shared pattern) | shared | `/*/account` | yes |
| S-39 | Search component | shared | admin list toolbars | yes |
| S-40 | 404 | system | catch-all | yes |
| S-41 | Unexpected Error | system | boundary | yes |
| S-42 | Offline banner | system | overlay | yes |
| S-43 | Maintenance | system | on `503` | Phase 2 |

**Totals:** 33 build-scope screens at MVP (S-01 through S-33), 3 shared patterns, 4 system screens. Consistent with the 27 module-screen count in Document 14 (which excluded public and system screens).

---

*End of Document 16 — RozVisit Screen Inventory and UI Specifications*
