# RozVisit — User Stories and Acceptance Criteria
### Document 06

**Sources:** Documents 00–05. Every story traces to a business requirement (BR-xxx, Document 03) and a journey (Document 05).
**Labels:** Everything here is confirmed unless marked *(Assumption)*, *(Recommendation)*, or *(Open)*.

---

## How This Backlog Is Organized

**Epics** (large work areas) match the eight confirmed modules:

| Epic code | Epic | Module |
|---|---|---|
| AUTH | Accounts and login | Auth Module |
| PROFILE | Parent profiles | User & Role Module |
| PLAN | Plans and subscription | Billing & Subscription Module |
| VISIT | Visit scheduling and proof | Visit Scheduling Module |
| ERRAND | Errands | Errand Module |
| EMERG | Emergency | Emergency Module |
| ADMIN | Admin operations | Admin Operations Module |
| NOTIF | Notifications | Notification Module |

**Priority levels:** P1 (must have for the phase), P2 (should have), P3 (nice to have).
**MVP status:** MVP = Phase 1 build. Future = Phase 2+, with the phase named.

**Analytics note:** event names use the pattern `area.action` (for example `auth.signup_completed`). *(Recommendation — event naming approved as part of this document.)*

---

# Epic: AUTH — Accounts and Login

---

## US-AUTH-001 — Client registration

**Epic:** AUTH | **Role:** Client | **Priority:** P1 | **MVP status:** MVP

> As a diaspora client,
> I want to create an account with my email and phone,
> so that I can start setting up care for my parent.

**Description:** Registration form for clients: name, email, phone, country, password. Traces to BR-001 (foreign-currency customers), Journey C1.

**Preconditions:** None.

**Acceptance criteria:**
- Given I am on the registration page, When I submit valid details, Then my account is created and a verification email is sent.
- Given my email is already registered, When I submit, Then I see a clear message with links to log in or reset my password.
- Given I submit a weak password, When I type it, Then I see the password rules before submitting (8+ characters, letters and numbers).
- Given I have not verified my email, When I try to log in, Then I am shown a "verify first" screen with a resend option.

**Validation rules:** email format checked; phone in international format (E.164); country required; password rule as above.

**Error cases:** duplicate email; invalid phone; email service down (queue and retry, show honest "email may take a few minutes" message).

**Dependencies:** email sending service.

**Security:** password hashed with bcrypt (never stored as text); rate limit on the registration endpoint; no hint whether an email exists beyond the duplicate message flow. *(Recommendation — use a neutral "check your inbox" pattern if account-existence privacy is preferred; decide at build.)*

**Analytics events:** `auth.signup_started`, `auth.signup_completed`, `auth.email_verified`.

---

## US-AUTH-002 — Caregiver application signup

**Epic:** AUTH | **Role:** Caregiver | **Priority:** P1 | **MVP status:** MVP

> As a caregiver,
> I want to apply with my basic details and CNIC number,
> so that I can be verified and start earning.

**Description:** Caregiver signup creates an account in "applied" state — not active until verification passes (BR-010, Journey G1).

**Preconditions:** None.

**Acceptance criteria:**
- Given I complete the application form, When I submit, Then my account exists with status "applied" and I see what happens next.
- Given my status is "applied" or "in review," When I log in, Then I see my application status — not the visit interface.
- Given I am rejected, When I log in, Then I see the outcome and any reapplication rules.
- Given I am approved, When I log in, Then I see the caregiver home screen and my Verified badge.

**Validation rules:** CNIC number format checked (13 digits); phone required; service area required.

**Error cases:** unreadable CNIC photo (one clear retake request); duplicate application (linked to the existing one).

**Dependencies:** admin verification flow (US-ADMIN-001).

**Security:** CNIC data stored encrypted; never displayed publicly — only the Verified badge is shown (Bilal's privacy concern, Document 04).

**Analytics events:** `auth.caregiver_applied`, `auth.caregiver_verified`.

---

## US-AUTH-003 — Login

**Epic:** AUTH | **Role:** All | **Priority:** P1 | **MVP status:** MVP

> As any user,
> I want to log in quickly and stay logged in on my device,
> so that daily use has no friction.

**Acceptance criteria:**
- Given valid credentials, When I log in, Then I receive a session (15-minute access token, 7-day refresh in a secure cookie) and land on my role's home screen.
- Given wrong credentials several times, When I keep trying, Then attempts are slowed by rate limiting and I am pointed to password reset.
- Given my refresh token is valid, When I return within 7 days, Then I am not asked for my password.

**Validation rules:** standard credential checks.

**Error cases:** account not verified (route to verification); account disabled (clear message with support path).

**Security:** rate limiting (confirmed); tokens per the confirmed JWT design; sessions invalidated on password reset.

**Analytics events:** `auth.login_succeeded`, `auth.login_failed`.

---

## US-AUTH-004 — Password reset

**Epic:** AUTH | **Role:** All | **Priority:** P1 | **MVP status:** MVP

> As any user,
> I want to reset my password by email,
> so that I can recover my account safely.

**Acceptance criteria:**
- Given I request a reset, When I submit my email, Then a time-limited reset link is sent (expires in 30 minutes *(Recommendation)*).
- Given I open a valid link, When I set a new password meeting the rules, Then my password changes and all other sessions are logged out.
- Given the link is expired, When I open it, Then I see a clear message and a one-tap resend.

**Security:** reset tokens single-use; sessions invalidated after reset (Journey C2).

**Analytics events:** `auth.reset_requested`, `auth.reset_completed`.

---

# Epic: PROFILE — Parent Profiles

---

## US-PROFILE-001 — Create parent profile

**Epic:** PROFILE | **Role:** Client | **Priority:** P1 | **MVP status:** MVP

> As a client,
> I want to create a profile for my parent with their address on a map,
> so that visits go to the right place with the right context.

**Description:** Name, age, phone, address with map pin, care notes, emergency contacts. Traces to Journey C3; the map location supports future GPS check-in (Phase 2).

**Preconditions:** Verified client account.

**Acceptance criteria:**
- Given I enter an address, When the map finds it, Then a pin is placed that I can adjust by hand.
- Given the map cannot find the address, When I drop a pin manually, Then both my written address and the pin are saved.
- Given I leave the form midway, When I return, Then my draft is still there.
- Given I complete the profile, When I save, Then I am taken to plan selection.

**Validation rules:** name and address required; age must be a sensible number; at least one emergency contact required. *(Recommendation — minimum one contact; confirm at build.)*

**Error cases:** map service unavailable (manual pin still works); missing required fields (inline highlights, draft preserved).

**Dependencies:** map/geocoding service.

**Security:** the whole profile is sensitive data — encrypted at rest; visible only to the owning client and admins; care notes flagged as sensitive in logs (never logged in full).

**Analytics events:** `profile.parent_created`, `profile.parent_completed`.

---

## US-PROFILE-002 — Linked family members field (data only)

**Epic:** PROFILE | **Role:** System | **Priority:** P2 | **MVP status:** MVP (data), Future UI (Phase 5)

> As the system,
> I want every parent profile to store a list of linked family members from day one,
> so that family group access (Phase 5) needs no database rebuild.

**Description:** Decision D-02 made real. The field exists and is empty; no MVP screen uses it.

**Acceptance criteria:**
- Given a parent profile is created, When it is stored, Then it contains an empty linked-family-members list.
- Given the MVP interface, When any screen renders, Then this field is never shown or editable.

**Security:** same protection as the rest of the profile.

**Analytics events:** none (no user behavior yet).

---

## US-PROFILE-003 — Parent consent record

**Epic:** PROFILE | **Role:** Admin/Caregiver | **Priority:** P1 | **MVP status:** MVP

> As the operations team,
> I want the parent's recorded consent captured at the first visit and stored on the profile,
> so that no visits or photos happen without the parent's clear agreement.

**Description:** BR-025 and the Tariq persona made real. Consent includes the parent's own choices: visit times they prefer, photo boundaries (which rooms), and the right to stop anytime.

**Preconditions:** Parent profile exists; first visit scheduled.

**Acceptance criteria:**
- Given the first visit, When the caregiver opens it, Then a consent step appears before the normal checklist.
- Given the parent agrees, When consent is captured (recorded confirmation), Then the profile is marked "consent given" with the parent's stated choices saved.
- Given the parent declines, When the caregiver records it, Then the visit closes as "parent declined — no fault," the client is informed honestly, and no further visits run until consent exists.
- Given consent choices exist (for example: no photos in the bedroom), When any later visit runs, Then those choices are shown to the caregiver in the checklist.

**Validation rules:** consent cannot be skipped; a visit cannot complete on an unconsented profile.

**Error cases:** parent asks to withdraw consent later (a withdraw action exists; visits pause; client informed).

**Security:** the consent recording is sensitive evidence — stored encrypted, access-logged.

**Analytics events:** `consent.given`, `consent.declined`, `consent.withdrawn`.

---

# Epic: PLAN — Plans and Subscription

---

## US-PLAN-001 — View and select a plan

**Epic:** PLAN | **Role:** Client | **Priority:** P1 | **MVP status:** MVP

> As a client,
> I want to compare the three plans in my own currency and pick one,
> so that I know exactly what I am buying.

**Description:** Decision D-04 and Journey C4. Plans show visit counts, errand allowance, and prices in the client's currency. Prices displayed are within the confirmed ranges and marked as introductory/subject to confirmation until Phase 0 evidence locks them (BR-004).

**Preconditions:** Completed parent profile.

**Acceptance criteria:**
- Given my country is the UAE, When I view plans, Then prices show in AED.
- Given I select Standard, When I confirm, Then my chosen plan is saved and my weekly visit allowance (3) is now enforced by the system.
- Given I have selected a plan but not paid, When I view my dashboard, Then I see "payment pending" with clear instructions and the expected time for my payment link.

**Validation rules:** one active plan per parent; currency follows the client's country.

**Error cases:** currency not supported (fallback to USD with a note).

**Dependencies:** exchange-rate display source. *(Recommendation — fixed price table per currency, not live conversion, for billing clarity.)*

**Security:** plan changes logged.

**Analytics events:** `plan.viewed`, `plan.selected`.

---

## US-PLAN-002 — Manual payment activation (operations)

**Epic:** PLAN | **Role:** Admin | **Priority:** P1 | **MVP status:** MVP

> As the operations team,
> I want to record that a client's Payoneer payment was received and activate their subscription,
> so that manual payment still produces a correct, trackable subscription state.

**Description:** The Phase 1 confirmed payment model: link sent by hand, payment confirmed by hand, state tracked by the system (Journey C4, BR-005).

**Acceptance criteria:**
- Given a client has selected a plan, When operations marks "payment link sent," Then the client sees the pending state with the sent date.
- Given payment arrives, When operations marks it received with a reference, Then the subscription becomes Active, the client is notified, and scheduling unlocks.
- Given a paid period ends, When renewal payment is not yet confirmed, Then the subscription enters a grace state *(Recommendation — 5 days)* before pausing, and the client is notified honestly at each step.

**Validation rules:** activation requires a payment reference; every state change stores who did it and when.

**Error cases:** client claims payment but no record (dispute path, Journey C10); double activation prevented.

**Security:** payment references are not card data — no card or bank details are ever stored (Payoneer holds those).

**Analytics events:** `plan.payment_link_sent`, `plan.activated`, `plan.grace_entered`, `plan.paused`.

---

## US-PLAN-003 — Cancel subscription

**Epic:** PLAN | **Role:** Client | **Priority:** P1 | **MVP status:** MVP

> As a client,
> I want to cancel my plan honestly and simply,
> so that I stay in control and trust the service even when leaving.

**Acceptance criteria:**
- Given an active plan, When I choose Cancel and confirm once, Then the plan runs to the end of the paid period and then stops — no hidden steps, no guilt screens.
- Given I cancel, When the paid period ends, Then scheduling locks and my data remains viewable (history is mine to see).
- Given I cancelled, When I want to return, Then reactivating is one step back through plan selection.

**Error cases:** cancel during an open dispute (allowed; dispute continues independently).

**Security:** cancellation logged; no dark patterns (an explicit design rule from Journey C6).

**Analytics events:** `plan.cancel_started`, `plan.cancelled`, `plan.reactivated`.

---

# Epic: VISIT — Visit Scheduling and Proof

---

## US-VISIT-001 — Schedule recurring visits

**Epic:** VISIT | **Role:** Client | **Priority:** P1 | **MVP status:** MVP

> As a client,
> I want to set my parent's visits on a weekly schedule within my plan,
> so that visits happen at times that suit my parent's life.

**Description:** Journey C5. The system enforces the plan allowance (BR-012).

**Preconditions:** Active subscription; consented or first-visit-pending parent profile.

**Acceptance criteria:**
- Given a Standard plan (3 visits/week), When I pick 3 weekly slots, Then the schedule saves and shows on my dashboard.
- Given my allowance is used, When I try to add a fourth weekly visit, Then I see my plan limit and the upgrade path — the visit is not created.
- Given I add a note ("check the medicine box every visit"), When visits are created, Then the note appears in every visit's checklist for the caregiver.

**Validation rules:** visits only within the plan allowance; time slots within service hours. *(Recommendation — service hours 8:00–20:00; confirm at Phase 1 launch.)*

**Error cases:** no caregiver available for a slot (operations contacts the client with alternatives — the system never silently drops a visit, Journey C5).

**Dependencies:** US-PLAN-002 (active subscription); caregiver assignment (US-ADMIN-002).

**Security:** schedule visible only to the owning client, assigned caregiver, and admins.

**Analytics events:** `visit.scheduled`, `visit.allowance_blocked`.

---

## US-VISIT-002 — Reschedule or cancel a single visit

**Epic:** VISIT | **Role:** Client | **Priority:** P1 | **MVP status:** MVP

> As a client,
> I want to move or cancel one visit when life changes,
> so that the schedule bends without breaking.

**Acceptance criteria:**
- Given an upcoming visit, When I reschedule to an open slot in the same week, Then the visit moves and the caregiver is notified automatically.
- Given I cancel before the cutoff (12 hours *(Recommendation)*), When the cancellation saves, Then the visit returns to my weekly allowance.
- Given I cancel after the cutoff, When it saves, Then the visit counts against my allowance and the reason why is explained on screen.

**Error cases:** target slot full (alternatives shown).

**Analytics events:** `visit.rescheduled`, `visit.cancelled_before_cutoff`, `visit.cancelled_after_cutoff`.

---

## US-VISIT-003 — Caregiver daily visit list

**Epic:** VISIT | **Role:** Caregiver | **Priority:** P1 | **MVP status:** MVP

> As a caregiver,
> I want to see today's visits with times, addresses, and map links the moment I open the app,
> so that I know my day at a glance.

**Description:** Journey G2 step 1. Built weak-network-first: the list loads from cache when offline.

**Acceptance criteria:**
- Given I have visits today, When I open the app, Then I see them ordered by time with address and a map link.
- Given I am offline, When I open the app, Then the last-synced list still shows, marked with its sync time.
- Given a visit was rescheduled, When I next sync, Then the list updates and the change is highlighted.

**Validation rules:** caregivers see only their own assignments.

**Error cases:** stale cache conflicts (server state wins on sync; changes highlighted, never silent).

**Security:** parent addresses shown only for assigned, upcoming visits — not for past assignments beyond a short window. *(Recommendation — 48 hours; confirm at build.)*

**Analytics events:** `visit.list_opened`, `visit.list_opened_offline`.

---

## US-VISIT-004 — Complete the visit checklist

**Epic:** VISIT | **Role:** Caregiver | **Priority:** P1 | **MVP status:** MVP

> As a caregiver,
> I want a tap-based checklist I can finish in under two minutes,
> so that recording the visit never gets in the way of the visit itself.

**Description:** Journey G2 steps 3–5. Tap-based by design (Bilal persona); respectful wording (Amina Bibi persona); works fully offline (Saima persona).

**Preconditions:** Assigned visit; consented parent (or the consent step for a first visit — US-PROFILE-003).

**Acceptance criteria:**
- Given an active visit, When I open the checklist, Then I can complete it by taps: medication taken (yes/no), mood (1–5), concerns (tap options plus an optional short note).
- Given the parent's consent choices exist, When the checklist opens, Then those choices are shown to me (for example: photos in the sitting room only).
- Given I am offline, When I complete the checklist, Then it saves on my phone instantly with the capture time, and syncs automatically later, showing "saved / waiting to send / sent" states.
- Given the parent declines the visit (Tariq case), When I mark "parent declined," Then the visit closes with no fault to me, and the client is informed honestly.

**Validation rules:** a visit cannot be marked complete without a finished checklist AND at least one proof photo (BR-011 — the hard rule).

**Error cases:** app crash mid-checklist (local draft survives, reopens where left off).

**Security:** checklist content is sensitive; encrypted at rest.

**Analytics events:** `visit.checklist_completed`, `visit.parent_declined`, `visit.completed_offline`.

---

## US-VISIT-005 — Camera-only proof capture

**Epic:** VISIT | **Role:** Caregiver | **Priority:** P1 | **MVP status:** MVP

> As a caregiver,
> I want to take visit photos through the app camera with an upload queue that survives bad signal,
> so that honest proof gets through and I never lose finished work.

**Description:** The anti-fraud core (BR-011): capture only through the in-app camera; no gallery uploads. Offline queue per the Saima edge case. Capture time from the device is stored alongside upload time so late syncs stay honest.

**Acceptance criteria:**
- Given an active visit, When I take photos, Then only the in-app camera can be used — no gallery, no file picker.
- Given weak or no signal, When I capture photos, Then they store locally with capture time and upload automatically later, with visible queue states.
- Given uploads succeed, When the visit record updates, Then both capture time and upload time are stored on each photo.
- Given uploads fail past a time limit *(Recommendation — 24 hours)*, When the limit passes, Then the visit is flagged for operations review — not auto-rejected, not silently lost.

**Validation rules:** photo/video only from the live camera stream; file size limits per the confirmed rules (up to 50MB per file).

**Error cases:** camera permission denied (clear fix instructions); storage full on device (warn before capture).

**Dependencies:** Cloudinary (Decision D-05).

**Security:** media encrypted at rest; capture-source flag stored with each file; media links access-controlled (only the owning client, assigned caregiver, admins).

**Analytics events:** `visit.photo_captured`, `visit.upload_queued`, `visit.upload_completed`, `visit.upload_flagged`.

---

## US-VISIT-006 — Client proof feed

**Epic:** VISIT | **Role:** Client | **Priority:** P1 | **MVP status:** MVP

> As a client,
> I want a feed of completed visits with photos and checklist summaries,
> so that I can see with my own eyes that my parent is okay.

**Description:** The core product moment (Journey C7). The dashboard leads with this feed (Ayesha persona decision).

**Acceptance criteria:**
- Given a visit completes, When I open the app, Then the newest visit appears first with photos, checklist summary, visit time, and the caregiver's name.
- Given photos are still uploading (weak-signal caregiver), When I open the visit, Then I see "Visit complete — photos uploading" instead of an empty record.
- Given a visit was missed, When I open the feed, Then I see an honest entry with the reason and the make-up plan — never a silent gap.
- Given the summary text, When I read it as someone with no Pakistani context (Kevin persona), Then it makes sense without translation or cultural guesswork.

**Validation rules:** feed shows only my own parents' visits.

**Error cases:** none beyond upload-pending states.

**Security:** media served through access-controlled links; no public URLs.

**Analytics events:** `feed.opened`, `feed.visit_viewed` (the 24-hour open rate feeds the north-star quality measure).

---

# Epic: ERRAND — Errands (Phase 2)

---

## US-ERRAND-001 — Request an errand

**Epic:** ERRAND | **Role:** Client | **Priority:** P1 | **MVP status:** Future (Phase 2)

> As a client,
> I want to request an errand (medicine, bills, doctor escort) with a cost limit,
> so that real tasks get done for my parent even though I am abroad.

**Acceptance criteria:**
- Given my plan includes errands, When I request one with a type, note, and cost limit, Then the assigned caregiver is notified and the errand shows "requested."
- Given my included errands are used, When I request another, Then I see the pay-per-errand price (BR-009) before confirming.
- Given the cost will exceed my limit, When the caregiver reports it, Then I approve or adjust before purchase.

**Validation rules:** cost limit is a positive number; errand types from the confirmed list (medicine, bill payment, doctor escort, other).

**Error cases:** item unavailable (caregiver messages options through the app).

**Dependencies:** Phase 2 build; US-VISIT assignments.

**Security:** errand costs and receipts are financial records — retained per BR-027.

**Analytics events:** `errand.requested`, `errand.over_limit_approved`.

---

## US-ERRAND-002 — Complete an errand with receipt proof

**Epic:** ERRAND | **Role:** Caregiver | **Priority:** P1 | **MVP status:** Future (Phase 2)

> As a caregiver,
> I want to photograph the receipt in-app and mark the errand done,
> so that I am repaid the cost plus my errand fee without argument.

**Acceptance criteria:**
- Given an accepted errand, When I photograph the receipt through the app camera and mark it complete, Then the client sees completion with the receipt, and my repayment (cost + fee) appears in my earnings.
- Given the receipt photo is unreadable, When operations flags it, Then I get one clear retake request.

**Validation rules:** receipt photo required for completion (100% attach rate — Journey G4).

**Analytics events:** `errand.completed`, `errand.receipt_flagged`.

---

# Epic: EMERG — Emergency (Phase 2)

---

## US-EMERG-001 — Raise an emergency

**Epic:** EMERG | **Role:** Caregiver (also Client) | **Priority:** P1 | **MVP status:** Future (Phase 2)

> As a caregiver during a visit,
> I want one large, always-visible emergency button with a short guided flow,
> so that in a frightening moment I cannot get lost or make it worse.

**Description:** Journeys G3 and C8. The most protected flow in the product.

**Acceptance criteria:**
- Given an active visit, When I press the emergency button, Then a guided flow opens: what is happening (tap options), conscious yes/no, ambulance needed yes/no — no typing required.
- Given I complete the flow, When the alarm fires, Then the client and operations are alerted within 10 seconds on four channels (BR-018, BR-019).
- Given the alarm is live, When anything changes, Then every action (mine, operations', system) is logged to a live timeline automatically.
- Given a client raises an emergency remotely (worried after a call), When they press their emergency action, Then operations is alerted the same way and coordinates a check.

**Validation rules:** the button cannot be hidden by other UI during an active visit; accidental-press protection by one confirm step — never more.

**Error cases:** caregiver offline at the moment of pressing (the flow works locally; alerts fire through SMS from the device as fallback *(Recommendation — confirm technical approach at Phase 2 design)*).

**Dependencies:** notification channels (US-NOTIF-002); Twilio and WhatsApp (Phase 2 integrations).

**Security:** emergency records are evidence — complete, tamper-resistant timelines (BR-020).

**Analytics events:** `emergency.raised`, `emergency.broadcast_sent`, `emergency.resolved` (with time-to-resolution).

---

# Epic: ADMIN — Admin Operations

---

## US-ADMIN-001 — Caregiver verification pipeline

**Epic:** ADMIN | **Role:** Admin | **Priority:** P1 | **MVP status:** MVP (basic), Phase 2 (full dashboard)

> As the operations lead,
> I want a verification pipeline where every application moves through ID check, interview, and reference stages,
> so that no caregiver is ever active without passing every gate.

**Description:** BR-010 and Journey A1. In the MVP this is a simple admin view; Phase 2 makes it a full dashboard pipeline.

**Acceptance criteria:**
- Given a new application, When I open it, Then I see the CNIC record, interview recording, and reference status in one place.
- Given all gates pass, When I approve, Then the caregiver's status flips to Verified and they see it on next login.
- Given any gate fails, When I reject or request more info, Then the applicant sees the outcome and next steps.
- Given any decision, When it saves, Then my name and the time are logged on the record — every admin action is logged (confirmed rule).

**Validation rules:** approval impossible with any gate incomplete (a hard rule: zero unverified caregivers ever active).

**Security:** verification documents encrypted; access limited to admin role; access itself logged.

**Analytics events:** `admin.application_opened`, `admin.caregiver_approved`, `admin.caregiver_rejected`.

---

## US-ADMIN-002 — Assign caregivers to visits

**Epic:** ADMIN | **Role:** Admin | **Priority:** P1 | **MVP status:** MVP (manual)

> As the operations lead,
> I want to assign a verified caregiver to each client's visit schedule,
> so that the right person, ideally the same person every time, serves each parent.

**Description:** Phase 1 assignment is manual by design (Journey C5). The system prefers continuity: the same caregiver for the same parent (Amina Bibi persona decision).

**Acceptance criteria:**
- Given a new schedule, When I assign a verified caregiver in the right area, Then all the schedule's visits attach to them and they are notified.
- Given the parent has a previous caregiver, When I open assignment, Then that caregiver is suggested first (continuity preference).
- Given a caregiver becomes unavailable, When I reassign, Then affected visits move to the backup and both client and caregivers are notified (BR-015).

**Validation rules:** only Verified caregivers are assignable; area match required.

**Analytics events:** `admin.visit_assigned`, `admin.visit_reassigned`.

---

## US-ADMIN-003 — Visit oversight (MVP basic view)

**Epic:** ADMIN | **Role:** Admin | **Priority:** P1 | **MVP status:** MVP

> As the operations lead,
> I want to see all visits and their proof records,
> so that I can confirm the service is really happening and handle problems with evidence.

**Acceptance criteria:**
- Given the admin view, When I open visits, Then I can filter by status (scheduled, completed, missed, declined, flagged) and open any record with its full evidence.
- Given a visit is flagged (late upload, GPS mismatch in Phase 2), When I review it, Then I can resolve with a note or open a case — flag-for-review, never auto-punish (confirmed rule).

**Analytics events:** `admin.visit_reviewed`, `admin.flag_resolved`.

---

# Epic: NOTIF — Notifications

---

## US-NOTIF-001 — Core notification delivery (MVP)

**Epic:** NOTIF | **Role:** All | **Priority:** P1 | **MVP status:** MVP

> As any user,
> I want the right notification at the right moment — calm by default,
> so that the app informs me without training me to dread it.

**Description:** The Part D notification map (Document 05) made real. MVP channels: in-app, push (Firebase), email. SMS and WhatsApp arrive in Phase 2.

**Acceptance criteria:**
- Given a visit completes, When the record closes, Then the client receives a calm push and the feed updates (no alarm tones for good news).
- Given a visit is missed, When operations records the reason, Then the client is notified honestly with the make-up plan — never silence.
- Given a caregiver's visit is rescheduled, When it changes, Then they are notified and the change is highlighted in their list.
- Given any notification fails to send, When the failure is detected, Then it retries; repeated failure is flagged to operations — no silent drops.

**Validation rules:** notification wording follows the calm-by-default rule; loud treatment is reserved for emergencies only.

**Dependencies:** Firebase (MVP); Twilio/WhatsApp (Phase 2, feeding US-EMERG-001).

**Analytics events:** `notif.sent`, `notif.opened`, `notif.failed`.

---

## US-NOTIF-002 — Emergency multi-channel broadcast (Phase 2)

**Epic:** NOTIF | **Role:** System | **Priority:** P1 | **MVP status:** Future (Phase 2)

> As the system,
> I want emergencies broadcast on four channels at once with delivery tracking,
> so that one channel failure never silently drops an alarm.

**Acceptance criteria:**
- Given an emergency fires, When broadcast starts, Then in-app, push, SMS, and WhatsApp all send within 10 seconds, and each delivery attempt is tracked.
- Given the client does not acknowledge, When the first wave passes *(Recommendation — 60 seconds)*, Then repeats fire and the next emergency contact is alerted in order.
- Given all channels fail for a contact, When detected, Then operations is alerted to call directly — the system never concludes "delivered" without evidence.

**Analytics events:** `emergency.channel_delivered`, `emergency.escalated_to_contact`.

---

# Backlog Summary

| Epic | MVP stories | Future stories | Key BR trace |
|---|---|---|---|
| AUTH | 4 | — | BR-001, BR-010 |
| PROFILE | 3 | (Phase 5 UI for D-02) | BR-025 |
| PLAN | 3 | Phase 4: in-app checkout, split billing, auto-refunds (BR-006/007/008) | BR-003/004/005 |
| VISIT | 6 | Phase 2: GPS check-in (BR-013); Phase 3: live video, selfie match (BR-016/017) | BR-011, BR-012 |
| ERRAND | — | 2 (Phase 2) | BR-014 |
| EMERG | — | 1 (+ notif) (Phase 2) | BR-018/019/020 |
| ADMIN | 3 | Phase 2: SLA dashboard, dispute queue | BR-010, BR-015, BR-022 |
| NOTIF | 1 | 1 (Phase 2) | BR-019 |
| **Total** | **20 MVP** | **8+ named future** | — |

**Stories deliberately not written yet** (their phases are far, and details would be guesses): Phase 3 live video stories, Phase 4 payment automation stories, Phase 5 language/family-access stories, Phase 6 growth stories. They will be written when their phase approaches, traced to BR-006/007/008, BR-016/017, BR-024, BR-031.

---

*End of Document 06 — RozVisit User Stories and Acceptance Criteria*
