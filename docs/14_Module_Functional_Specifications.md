# RozVisit — Module Functional Specifications
### Document 14

**Sources:** Documents 00–13. This document gathers everything each module must do into one place per module — the build-and-review reference for a developer working on one area.
**Labels:** Everything here is confirmed unless marked *(Assumption)*, *(Recommendation)*, or *(Open)*.

**Module coverage note (per the prompt's rule):** The eight confirmed modules (Document 00 §8) are specified below. From the prompt's suggested list: *Discovery/search* is not applicable — clients never browse caregivers; caregivers are assigned after verification (documented in Document 05's coverage checklist). *Clinic/organization management* is not supported by the canonical brief. *Reviews* exists as the confirmed Phase 2 ratings feature (BR-022) and is specified inside the Visits module. *Payments* is the Billing & Subscription module (manual at Phase 1 by decision D-04). *Reports* at MVP is the admin oversight views plus countable metrics (OBS-004); a dedicated reports module would be a future recommendation only. *Support* is the confirmed dispute flow (Journeys C10/A4), specified inside the Admin module.

**Shared behavior (applies to every module, not repeated below):**
- **Loading states:** every screen shows a calm skeleton/spinner; the free-tier cold start shows the friendly loading message (NFR-008).
- **Error states:** expected errors show the API's human message as-is (ERR-002); unexpected errors show the calm generic message with a support path (ERR-003); forms never lose input (ERR-005).
- **Empty states:** icon + one sentence + one action (the EmptyState component, Doc 10).
- **Permissions:** the authorization matrix (Document 13 §17) governs; each module lists only its specifics.

---

# Module 1 — Authentication

**Purpose:** Prove who each user is, gate access by verification state, and keep sessions safe. (Full security spec: Document 13.)

**User roles:** all three, plus the public (registration/application).

**Main features:** client registration with email verification; caregiver application; login; silent refresh; password reset; logout.

**User workflows:** Journeys C1, C2, G1 (Document 05).

**Screens:**
| Screen | Portal | Content |
|---|---|---|
| Landing | public | How it works, trust explanation, register/login |
| Register | public | Client form, inline password rules |
| Apply | public | Caregiver form (CNIC, area) |
| Verify prompt | public | "Check your inbox" + resend |
| Login | public | Email/password, forgot link |
| Reset | public | New password form from email link |
| Application status | caregiver | For applied/in_review/rejected accounts (FR-003) |

**Functional requirements:** FR-001–007. **Business rules:** verification gates login (clients) and service access (caregivers); admin accounts never self-register; same-message responses for wrong credentials. **Validation:** Document 12 Auth module.

**Data entities:** users, refreshTokens, authTokens (Document 11). **API dependencies:** the 9 Auth endpoints (Document 12); email service (EXT-003).

**Notifications:** verification email; reset email; caregiver decision outcome (in-app + email).

**Empty states:** none meaningful. **Edge cases:** duplicate email (link to login/reset); expired links (`410` + one-tap resend); caregiver logs in while unverified (status screen, never a dead end); resend flood (rate limit with honest Retry-After).

**Analytics events:** `auth.signup_started/completed`, `auth.email_verified`, `auth.caregiver_applied/verified`, `auth.login_succeeded/failed`, `auth.reset_requested/completed`.

**Acceptance criteria:** Document 07 §28 checks 1 and 3 (auth parts); US-AUTH-001–004 criteria.

**MVP scope:** all of the above. **Future scope:** phone OTP (Phase 2, D-07), admin MFA (Phase 2 *(Recommendation)*), sessions screen and logout-everywhere button (Phase 2), TOTP with wallet (Phase 4–5).

---

# Module 2 — User & Profile

**Purpose:** Hold who everyone is: client details, the parent profiles at the heart of the product, caregiver profiles with verification, and the consent record that gates everything.

**User roles:** client (own profiles), caregiver (consent capture, own profile view), admin (all, audited).

**Main features:** parent profile creation with map pin; care notes and emergency contacts; the consent record with the parent's own choices; consent withdrawal; caregiver profile with verification state and Verified badge; client account settings.

**User workflows:** Journey C3 (profile completion); the consent step inside G2's first visit; Tariq's refusal path (Document 04).

**Screens:**
| Screen | Portal | Content |
|---|---|---|
| Parent profile create/edit | client | Form + adjustable map pin, draft-preserving |
| Parent overview | client | Profile, consent status, linked subscription |
| Consent step | caregiver | Inside first VisitFlow: explain, record, capture choices, or record decline |
| Account | client | Own details, currency display, cancel plan entry point |
| Caregiver profile | caregiver | Own status, Verified badge, service area |

**Functional requirements:** FR-010–015. **Business rules:** consent gates visit completion (FR-014); parent status machine (`pending_consent → active → paused/archived`); one paying client per parent with linkedFamilyMembers stored hidden (D-02, FR-012); parent is a profile, never a login.

**Validation:** data dictionary rules (Doc 11): min 1 emergency contact, age range, E.164 phones; consent `given` requires a recording reference.

**Data entities:** clientProfiles, parentProfiles (with embedded consent), caregiverProfiles. **API dependencies:** Parents endpoints (Document 12); maps service (EXT-004).

**Notifications:** consent declined → client informed honestly; consent withdrawn → client + operations.

**Permissions specifics:** consent recording only by the assigned caregiver of the first visit; withdrawal by owner or admin (audited).

**Empty states:** no parents yet → "Add your parent to begin" + create action. **Edge cases:** map cannot find the address (manual pin, both saved); parent declines consent (no-fault close, honest client message, profile stays pending — the Tariq path); consent withdrawn mid-subscription (visits pause, subscription untouched, client chooses next step); two parents at one address (allowed; profiles are per person).

**Analytics events:** `profile.parent_created/completed`, `consent.given/declined/withdrawn`.

**Acceptance criteria:** Document 07 §28 checks 1 and 4; US-PROFILE-001–003.

**MVP scope:** all above. **Future scope:** family group access UI on linkedFamilyMembers (Phase 5); Urdu consent materials (Phase 5); parent profile photo *(Recommendation — small trust improvement, any phase)*.

---

# Module 3 — Billing & Subscription

**Purpose:** Sell the three plans, track every subscription's state honestly, and enforce what each plan includes — with payment itself manual at Phase 1 by decision.

**User roles:** client (select, cancel), admin (state changes with references).

**Main features:** plan comparison in the client's currency; in-app selection (D-04); the subscription state machine with full history; manual activation workbench for operations; grace handling; honest cancellation.

**User workflows:** Journey C4 (selection and first payment); C6's cancellation; A-side activation (Document 05 blueprint's backstage).

**Screens:**
| Screen | Portal | Content |
|---|---|---|
| Plan selection | client | Three plans side by side, own currency, introductory-price note (D-03) |
| Payment pending | client | Chosen plan, "link within 24h" expectation, support path |
| Subscription status | client | State, period end, history, cancel action |
| Subscriptions workbench | admin | link_sent queue, activation with paymentRef, grace watch |

**Functional requirements:** FR-020–025. **Business rules:** the state machine (`selected → link_sent → active → grace → paused`; `active → cancelled` running to period end) with no other arrows; activation requires a payment reference; allowance enforcement begins at selection; prices come from the fixed table, never live conversion; one active subscription per parent; no dark patterns in cancellation.

**Validation:** planKey enum; legal transitions only (`409 STATE_INVALID` otherwise); paymentRef required for `active`.

**Data entities:** carePlans (seeded reference), subscriptions with planSnapshot and stateHistory (Doc 11). **API dependencies:** Plans/Subscriptions endpoints; the admin state endpoint.

**Notifications:** plan selected (operations task); link sent; activated (client, unlocks scheduling); grace entered/paused (honest, each step); cancelled confirmation.

**Permissions specifics:** state mutations admin-only, audited (AUD-002); `subscriptions.manage` permission.

**Empty states:** no subscription → plan selection is the empty state. **Edge cases:** client claims payment, no record (dispute path, operations reconciles — US-PLAN-002); double activation attempt (`409`, clean); renewal unconfirmed (grace 5 days *(Recommendation value)* → paused, notified at each step); cancel during open dispute (allowed, independent); currency unsupported (USD fallback, flagged in response).

**Analytics events:** `plan.viewed/selected`, `plan.payment_link_sent/activated/grace_entered/paused`, `plan.cancel_started/cancelled/reactivated`.

**Acceptance criteria:** Document 07 §28 check 1 (plan and activation parts); US-PLAN-001–003.

**MVP scope:** all above, payment manual. **Future scope (confirmed phases):** in-app Payoneer checkout, wallet, split billing on linkedFamilyMembers, auto-refunds for missed visits (Phase 4, BR-006/007/008); Stripe via foreign entity (post-6).

---

# Module 4 — Visits (Scheduling, Execution, Proof, Feed)

**Purpose:** The core of the product: schedule visits within the plan, guide the caregiver through an honest, offline-tolerant visit, produce proof, and show it to the client.

**User roles:** client (schedule, watch), caregiver (perform), admin (assign, oversee — specified in Module 7).

**Main features:** one-week scheduling cycles with allowance enforcement; a two-day next-week
rescheduling window and automatic carry-forward when the client does not act; individual
reschedule/cancel with cutoff; the caregiver today-list (offline-capable); the tap-based checklist
with consent choices shown; camera-only capture with the sync queue; completion gating; the
no-fault declined path; per-visit earnings; the client proof feed with honest states; (Phase 2)
GPS check-in/out and ratings.

**User workflows:** Journeys C5, C6, C7 (the core moment), G2 (the core caregiver journey); Saima's offline path; Tariq's declined path.

**Screens:**
| Screen | Portal | Content |
|---|---|---|
| Schedule | client | Calendar slots, allowance counter, standing note |
| Feed | client | Newest-first proof: photos, summary, honest states (the lead screen) |
| Visit detail | client | Full checklist, media, times, caregiver |
| Today | caregiver | Ordered visits, map links, offline cache notice |
| VisitFlow | caregiver | Consent step (first visit) → checklist → camera → complete; SyncStateBar throughout |
| Earnings | caregiver | Per-visit verified earnings list |

**Functional requirements:** FR-030–053. **Business rules:** allowance computed from actual visits, never a counter (Doc 11 §20); a visit without checklist + ≥1 in-app photo cannot complete (the hard rule, FR-045); parent-declined is no-fault (FR-036); late media flags, never rejects (FR-046); capture time and upload time both stored and shown where relevant (FR-044); same-caregiver continuity preferred at assignment (FR-034); missed visits appear honestly, never as gaps (FR-052).

**Validation:** slots within service hours (08:00–20:00 *(Recommendation)*); cutoff 12h *(Recommendation)*; mood 1–5; media limits (≤5 files *(Recommendation)*, ≤50 MB each); sourceFlag must be `in_app_camera`.

**Data entities:** visits (the evidence record, Doc 11), with clientVisitId dedupe. **API dependencies:** Visits + Feed endpoints; media permits → Cloudinary (EXT-001).

**Notifications:** visit assigned/changed (caregiver); completed (client, calm); missed with reason (client); declined (client, honest); flag raised (admin).

**Permissions specifics:** caregivers see assigned only, addresses within the window (PRV-004); feed is own-family only; media links minted per request (SEC-008).

**Empty states:** feed before first visit → "Your first visit is scheduled for [date]"; today-list with no visits → "No visits today". **Edge cases:** the full offline set (dead-zone visit, device death mid-visit, duplicate sync, stuck upload — the Doc 09 §20 failure table rows 1–3 and 7); reschedule into a full slot (alternatives); app crash mid-checklist (draft survives); caregiver at the wrong house (Phase 2 GPS flags for review, never auto-rejects — SEC-011); parent asleep/not answering (caregiver marks declined-variant reason; operations sees patterns).

**Analytics events:** `visit.scheduled/allowance_blocked/rescheduled/cancelled_*`, `visit.list_opened(_offline)`, `visit.checklist_completed/parent_declined/completed_offline`, `visit.photo_captured/upload_queued/upload_completed/upload_flagged`, `feed.opened/visit_viewed`.

**Acceptance criteria:** Document 07 §28 checks 2, 4–8, 10; US-VISIT-001–006.

**MVP scope:** everything except GPS and ratings. **Future scope (confirmed):** GPS check-in/out (Phase 2, FR-049); ratings — one skippable request per period, feeding caregiver quality (Phase 2, FR-093/BR-022); live video check-ins, on-demand view, selfie match (Phase 3, BR-016/017); auto-refund hooks for missed visits (Phase 4, BR-008).

---

# Module 5 — Errands (Phase 2)

**Purpose:** Let clients get real tasks done for their parent — medicine, bills, doctor escort — with receipt proof and fair caregiver repayment.

**User roles:** client (request, approve over-limit), caregiver (accept, complete), admin (exception flags).

**Main features:** errand request with type, note, and cost limit; included-allowance accounting with pay-per-errand beyond it (BR-009); over-limit approval loop; in-app camera receipt proof; cost-plus-fee repayment into caregiver earnings.

**User workflows:** Journeys G4 and the errand rows of Part D (Document 05).

**Screens:** request form + errand status (client); errand card inside Today/VisitFlow with receipt capture (caregiver); exception flags only (admin).

**Functional requirements:** FR-060–063. **Business rules:** receipt photo required for completion (100% attach — the errand mirror of FR-045); over-limit purchases blocked until client approval; errand types from the confirmed list; caregiver repayment = cost + fee, visible like visit earnings.

**Validation:** positive cost limit; type enum; receipt via in-app camera only, same sourceFlag rule.

**Data entities:** errands (reserved in Doc 11, fully specified at Phase 2). **API dependencies:** the reserved errand paths (Document 12 Part D).

**Notifications:** requested (caregiver); over-limit ask (client); completed with receipt (client); receipt unreadable (caregiver retake, one clear request).

**Empty states:** "No errands yet — request one from your parent's page." **Edge cases:** item unavailable (in-app options to the client); receipt lost/unreadable (retake flow); errand outside a visit vs during one (both allowed; scheduling rules at Phase 2 design *(Open — detail at Phase 2)*).

**Analytics events:** `errand.requested/over_limit_approved/completed/receipt_flagged`.

**Acceptance criteria:** US-ERRAND-001/002 (Document 06).

**MVP scope:** none — Phase 2 entirely. **Future scope:** recurring errands, pharmacy partnerships *(Recommendation — future ideas only)*.

---

# Module 6 — Emergency (Phase 2)

**Purpose:** The sacred path: detect, alert, and manage urgent situations within seconds, with an honest permanent record.

**User roles:** caregiver (raise, guided flow), client (receive, act, raise remotely), admin (coordinate, resolve).

**Main features:** the always-visible emergency button in active visits; the tap-only guided flow; four-channel broadcast under 10 seconds; delivery tracking with repeat and contact escalation; the live append-only timeline; remote client-raised checks.

**User workflows:** Journeys C8, G3, A3.

**Screens:** emergency flow (caregiver — big choices, no typing, no dead ends); emergency live screen (client — what/when/status, one-tap calls, live timeline); emergency management (admin — timeline, coordination, resolution).

**Functional requirements:** FR-070–074. **Business rules:** emergency handling outranks every other operational task (Business Rule 6, Doc 03); one confirm step against accidental presses — never more; every action logs to the timeline automatically; the timeline is the honest account for the family and evidence if ever needed (BR-020).

**Validation:** tap options only; escalation order from emergencyContacts priority.

**Data entities:** emergencyAlerts (append-only, reserved in Doc 11). **API dependencies:** reserved emergency paths; Twilio (EXT-006), WhatsApp (EXT-007), Socket.io (Doc 09 §12).

**Notifications:** the loud exception to the calm rule (FR-092): four channels, repeats at 60s *(Recommendation)*, contact escalation, operations paging (OBS-005).

**Permissions specifics:** timeline visible to the involved client, assigned caregiver, and admins; append-only for everyone.

**Empty states:** none — this module hopes to be empty. **Edge cases:** caregiver offline at the press (local flow + device SMS fallback *(Recommendation — approach confirmed at Phase 2 design)*); false alarm (resolve with reason, no caregiver fault by default); client unreachable on all channels (operations calls directly — the system never concludes delivered without evidence); simultaneous emergencies (operations queue by raise time; the dashboard shows all open).

**Analytics events:** `emergency.raised/broadcast_sent/channel_delivered/escalated_to_contact/resolved` (with time-to-resolution).

**Acceptance criteria:** US-EMERG-001, US-NOTIF-002; the Phase 2 gate includes AD-12 (no sleeping host under the emergency system).

**Parent-dignity acceptance (Doc 04 Amina Bibi, Persona 3):** the emergency flow — even at peak urgency — never removes the parent's dignity. No screen shows a photo of the parent in the emergency alert unless the caregiver captured it as evidence of the specific emergency (a fall, an injury); no location detail is broadcast beyond the address; the timeline records what happened, not what the parent looked like. Operations SOPs *(Recommendation)* cover face-to-face contact with the parent when possible.

**MVP scope:** none — Phase 2 entirely, gated by AD-12. **Future scope:** emergency live streaming (Phase 3, confirmed).

---

# Module 7 — Admin Operations

**Purpose:** The trust factory: verify every caregiver, assign the right person to every family, watch the service actually happen, and settle problems with evidence.

**User roles:** admin only (permission-scoped, Section 16 of Document 13).

**Main features (MVP):** the verification pipeline with hard gates; continuity-first assignment; the visit oversight list with evidence access; flag resolution; the subscriptions workbench (Module 3); every action audited. **(Phase 2):** the SLA dashboard working flags not lists; the dispute queue with auto-attached evidence; emergency management (Module 6).

**User workflows:** Journeys A1–A4.

**Screens:**
| Screen | Phase | Content |
|---|---|---|
| Applications queue + detail | 1 | Gates view, recordings, decision actions (approve disabled until gates complete) |
| Assignment | 1 | Suggestions with previous-caregiver first, area match |
| Visits oversight | 1 | Filterable list, full evidence per record, flag resolution |
| Subscriptions workbench | 1 | (Module 3) |
| SLA dashboard | 2 | Exception flags: late, missed, low-rated, stuck uploads |
| Dispute queue | 2 | Cases with evidence bundles, both-sides notes, rule-based outcomes |

**Functional requirements:** FR-080–085. **Business rules:** zero unverified caregivers ever active — structural, not aspirational (FR-081); flag-for-review never auto-punish (SEC-011 posture everywhere); viewing CNIC data is itself an audited event (AUD-004); dispute outcomes follow the business rules (refund/credit per rules), closing on client confirmation or timeout.

**Validation:** decision enum; assignment requires verified + area match; flag resolution requires a note. Assignment suggestions put the parent's previous caregiver first when present; remaining verified, in-area caregivers sort by today's assigned `scheduled`-visit count (ascending), then caregiver name alphabetically. A flag stores the pre-flag status; resolution retains the flag evidence and restores that status with an append-only `flag_resolved` history entry.

**Administrative archival:** active and archived records are separated by an explicit list filter. Client archival disables login, archives parent profiles, pauses non-terminal subscriptions, and archives open visits; reactivation restores the client/parents but leaves subscriptions paused and open visits archived for operational review. Caregiver archival disables login and changes the profile to `deactivated`, which structurally blocks assignment; reactivation restores the prior verification state. Visit archival uses separate metadata rather than changing the operational visit status, and never removes evidence. Every archive/reactivate mutation requires a reason where applicable and writes an audit event.

**Data entities:** caregiverProfiles.verification, visits.flag, auditEvents; (Phase 2) disputes shape at Phase 2 design *(Open)*. **API dependencies:** Admin endpoints (Document 12).

**Notifications:** applicant outcomes; reassignment fan-out; flag alerts; (Phase 2) SLA and dispute updates.

**Empty states:** "No pending applications" / "No flags — a good day." **Edge cases:** incomplete application (one clear request back, not ping-pong); approve attempted with an open gate (`409`, button disabled anyway); reassignment cascade when a caregiver deactivates (backup pool, all parties notified — BR-015); a dispute where evidence contradicts the client (explain with evidence, honestly — trust cuts both ways).

**Analytics events:** `admin.application_opened/caregiver_approved/caregiver_rejected`, `admin.visit_assigned/reassigned/visit_reviewed/flag_resolved`.

**Acceptance criteria:** Document 07 §28 checks 3 and 9; US-ADMIN-001–003.

**MVP scope:** pipeline, assignment, oversight, workbench. **Future scope (confirmed):** SLA dashboard and dispute queue (Phase 2); caregiver certification program surfaces (Phase 6).

---

# Module 8 — Notifications

**Purpose:** Tell the right person the right thing at the right moment — calm by default, loud only for emergencies, honest about delivery.

**User roles:** all (recipients); the system (dispatch); admin (failure flags).

**Main features:** the in-app list with unread count; push (Firebase) and email channels; the message-definition table driving every send (NOT-001); retry-then-flag delivery honesty (FR-091); user controls over non-essential types (NOT-002); (Phase 2) SMS + WhatsApp channels and the emergency broadcast (Module 6).

**User workflows:** the Part D map (Document 05) is this module's contract.

**Screens:** notifications list (every portal); notification preferences inside account settings *(the essential list fixed at build — NOT-002)*.

**Functional requirements:** FR-090–093. **Business rules:** calm wording rule (FR-092); no ad-hoc sends — every message type exists in the definition table first; a wellbeing product must never train its users to dread its buzz (the Document 05 design rule, restated as this module's law).

**Validation:** type from the definition table; channel set per type.

**Data entities:** notifications with per-channel delivery states (Doc 11). **API dependencies:** Notifications endpoints; Firebase (EXT-002), email (EXT-003); Phase 2: Twilio, WhatsApp.

**Permissions specifics:** own notifications only; admin sees failure flags, not other users' content.

**Empty states:** "You're all caught up." **Edge cases:** push permission denied (in-app + email carry on, no nagging — one gentle ask, then respect the answer *(Recommendation)*); stale device tokens (pruned on failure); notification for a deleted/archived entity (renders safely with a generic target); a flood of events in one sync (batch into one digest-style push *(Recommendation — build detail)*).

**Analytics events:** `notif.sent/opened/failed`.

**Acceptance criteria:** US-NOTIF-001; Part D behaviors demonstrated in E2E.

**MVP scope:** in-app + push + email, the MVP event set. **Future scope (confirmed):** SMS + WhatsApp channels, emergency broadcast, ratings request (Phase 2); WhatsApp visit updates as a high-trust channel (Phases 2–3, Document 00 §19).

---

# Cross-Module Summary

| Module | MVP screens | MVP FRs | Phase 2+ core |
|---|---|---|---|
| 1 Authentication | 7 | FR-001–007 | OTP, MFA, sessions screen |
| 2 User & Profile | 5 | FR-010–015 | Family access UI (P5) |
| 3 Billing & Subscription | 4 | FR-020–025 | Checkout, wallet, split billing (P4) |
| 4 Visits | 6 | FR-030–053 | GPS, ratings (P2); live video (P3) |
| 5 Errands | 0 | — | All (P2) |
| 6 Emergency | 0 | — | All (P2, AD-12 gated) |
| 7 Admin Operations | 4 | FR-080–083 (085 P2) | SLA dashboard, disputes (P2) |
| 8 Notifications | 1 + settings | FR-090–092 | SMS/WhatsApp, broadcast (P2) |

Total MVP surface: **27 screens** across three portals, delivering the 20 MVP stories and the 12 acceptance checks.

---

*End of Document 14 — RozVisit Module Functional Specifications*
