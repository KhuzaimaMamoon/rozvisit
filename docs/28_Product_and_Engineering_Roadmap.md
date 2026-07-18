# RozVisit — Product and Engineering Roadmap
### Document 28

**Sources:** Documents 00–27, especially the confirmed six-phase roadmap (Doc 00 §11–12), the strategy horizon (Doc 02 §14, §19), the scaling stages (Doc 21 §32), and the launch gate (Doc 18 §38).
**Labels:** Everything here is confirmed unless marked *(Assumption)*, *(Recommendation)*, or *(Open)*.

**Terminology reconciliation (stated up front so nothing goes silent):**

The canonical brief defines six phases (0–6). This prompt asks for a seven-stage framing (Foundation → Scale). The two views map cleanly:

| Prompt stage (this document) | Confirmed phase(s) (Doc 00) |
|---|---|
| Foundation | Phase 0 — manual validation |
| MVP | Phase 1 — core software |
| Private beta | tail of Phase 1 + early Phase 2 |
| Public beta | rest of Phase 2 + Phase 3 |
| Version 1 | Phase 4 — revenue maturity |
| Growth stage | Phase 5 |
| Scale stage | Phase 6 |

**The phase numbers remain authoritative** (Rule 1). This document names both consistently so a reader coming from earlier documents can navigate.

**Effort language.** No hours, no story points, no sprint counts — false precision is worse than none for a solo student-founder building part-time. Each item carries an **effort shape** on a 1–4 scale:

- **Small (S)** — a focused piece of work, days of thought and change.
- **Medium (M)** — a feature-scoped effort, weeks of iteration.
- **Large (L)** — a multi-week campaign that touches many parts of the system.
- **Very Large (XL)** — a phase-level program spanning months.

**Time to each stage** is a function of Phase 0 evidence, not a promise. When the calendar matters (staged launches, business gates), the milestone that gates the transition is named — not a date.

---

## Priority Framework

RozVisit uses **MoSCoW** for prioritization within each phase, restated so the rules are clear:

| Level | Meaning | Rule |
|---|---|---|
| **Must** | Required to close the phase | If a Must slips, the phase does not close |
| **Should** | Adds real value; missed with a real cost | If a Should slips, we accept the cost and document it |
| **Could** | Nice; adds polish or reach | If a Could slips, nothing important is lost |
| **Won't (this phase)** | Explicitly deferred | Not a "no forever" — a "no now, revisit at the named later phase" |

**One rule that overrides the framework** (Business Rule and Product Principle 6, Doc 03 §10, Doc 15 §1): the emergency path (once introduced) is always **Must**. Never a Should. This is the sanctioned exception to phase-gated flexibility.

---

## Master Must/Should/Could/Won't Table

The one-page overview. Section 1–7 walk each phase in detail.

| Phase | Must | Should | Could | Won't |
|---|---|---|---|---|
| Foundation (Phase 0) | 5 paying families onboarded via WhatsApp; 3–5 vetted caregivers; manual visits happening | A basic operations spreadsheet; a rough onboarding script | Early Cloudinary sandbox for photo evidence | Any code; any hosting |
| MVP (Phase 1) | The 20 stories; the 12 acceptance checks; the launch gate | Common-password screen; bundle-budget CI check | Emergency stub UI (visible but disabled) | Payment automation; live video; Urdu; second city |
| Private beta | AD-12 hosting move; the emergency system live; Twilio + WhatsApp; admin dashboard; staging environment | Basic APM/metrics; incident runbook drill | Beta feedback capture form | Split billing; wallet; native mobile |
| Public beta | Live video (Phase 3); selfie identity match; ratings maturity; more caregivers; second admin | Family group access UI (D-02 pays off) | Dark mode for admin/ops | Any AI features; second city |
| Version 1 | In-app Payoneer checkout; wallet; split billing; automatic refunds | LTV baseline; simple experimentation framework | Corporate/NGO partnership discovery calls | Multi-language beyond Urdu; Stripe |
| Growth stage | Urdu language toggle; voice notes; simple vitals; family group access at scale | Team-scale documentation practices; two-admin operational shift | Native app spike | Multi-country; open-source |
| Scale stage | Second city (Lahore); foreign entity + Stripe; caregiver certification program | Multi-region considerations; enterprise sales tools | Corridor expansion R&D | Anything that dilutes the trust brand |

---

## 1. Foundation (Phase 0 — Manual Validation)

**One-sentence description:** Prove five real families will pay in foreign currency for verified visits, using nothing but WhatsApp, a spreadsheet, and hand-sent Payoneer links.

**Goals:**
- Onboard 5 paying diaspora families (O-1 in Doc 03).
- Vet 3–5 caregivers under the confirmed verification process (BR-010).
- Perform real visits with real proof — photos, checklists — captured however works: even a shared WhatsApp album counts here.
- Learn what breaks the assumption that the model works.

**Features:** none in code. The "features" are operational patterns: caregiver interview format, consent-taking conversation, family-onboarding call script, payment-link email template.

**Technical work (S–M total):**
- Domain registration and DNS setup (Doc 25 §13) — *(Open)*.
- Cloudinary sandbox for storing evidence (evaluation).
- No production code yet.

**Design work:** the visual language is already defined (Doc 15). Foundation reuses the approved palette in social-media templates and WhatsApp copy — no new design work.

**Testing:** the whole phase is testing. The tests are conversations with families and caregivers, and the metric is willingness to pay (O-1).

**Security:** the operational discipline is set now: consent conversations are recorded (BR-025 in spirit); CNIC copies are stored in a locked personal drive, not in WhatsApp threads; caregiver interview recordings are held privately.

**Deployment:** none. Nothing to deploy.

**Documentation:** the confirmed 27-document series exists (00–27). Rule 8 keeps them current if any canonical fact moves.

**Dependencies:**
- WhatsApp Business account or personal number *(Open — approach chosen at build)*.
- Payoneer receiving account active.
- A shared spreadsheet system (Google Sheets or Airtable, developer's choice).

**Risks:**
- **Cannot find 5 paying families.** This is what the phase is for. Failure here says "stop and rethink," not "start building."
- **Cannot recruit 3+ verifiable caregivers.** Recruitment channel needs adjustment; the founder's network is the first channel.
- **A single early failure (theft, harm) in a parent's home.** Insurance *(Open)* is needed before Phase 2 growth; at Foundation the mitigations are strong verification, founder-in-loop dispatch, and honest crisis communication.

**Success criteria:**
- 5 subscriptions active for at least one full billing cycle.
- ≥ 90% of scheduled visits completed with proof in that cycle.
- Zero unverified caregivers ever active (a Must, always).
- Founder can articulate what the next 5 families would want that these 5 didn't.

**Excluded from this phase (Won't):**
- Writing production code.
- Any hosting spend.
- Marketing beyond the founder's warm network.
- Anything that assumes the model works before evidence exists.

**Team requirements:** the founder alone, part-time. Any operations lead hire is a Phase 1 conversation.

**Effort shape:** M (weeks of real-world outreach, patience, and honest conversation).

**Gate to MVP:** the success criteria above, and only those.

---

## 2. MVP (Phase 1 — Core Software)

**One-sentence description:** Ship the 20 stories and pass the 12 acceptance checks, honestly, on the phone Bilal actually uses.

**Goals (O-2 in Doc 03):**
- Deliver the confirmed MVP surface — the 27 screens across three portals (Doc 14 §Cross-Module Summary).
- Meet the launch gate (Doc 18 §38).
- Onboard the Foundation families to the software without regressions in service quality.

**Features (Must, all traced):**
- **Auth:** registration, verification, login, silent refresh, password reset (US-AUTH-001–004).
- **Profiles + consent:** parent profile with map pin; consent step at first visit (US-PROFILE-001–003).
- **Plans + manual payment tracking:** in-app plan selection; admin activation with reference; grace and cancel (US-PLAN-001–003).
- **Scheduling + visit execution:** weekly slots with allowance; the offline-first caregiver visit flow with camera-only proof (US-VISIT-001–006).
- **Client proof feed:** the core moment (Journey C7).
- **Admin basics:** verification pipeline; assignment; visit oversight; audit trail (US-ADMIN-001–003).
- **Notifications:** in-app + push + email; calm by default (US-NOTIF-001).

**Features (Should):**
- **Common-password screen** at registration (Doc 13 §8, §27).
- **Bundle-budget CI check** (Doc 21 §3, Doc 25 §17).
- **Correlation-ID surface in error boundary** (Doc 20 §26).
- **Support-case creation** for a client to report a problem (US S-19 basic form).

**Features (Could):**
- **Emergency stub UI** (button visible but disabled with "coming in a later release") — mostly for design continuity so the caregiver portal doesn't reshape when the button lands.

**Features (Won't at MVP):**
- Payment automation, wallet, split billing (Phase 4).
- Live video, selfie match (Phase 3).
- GPS check-in, errands, emergency system, admin dashboard (Phase 2).
- Urdu (Phase 5).
- Second city (Phase 6).

**Technical work (XL — the largest solo effort of the whole roadmap):**
- The repository scaffold from Doc 10 (server workspaces, client workspaces, tests, CI). *(Partly begun.)*
- The `sensitiveFields.js` list + `crypto.js` utility (Doc 10 §3).
- The env contract + boot-refusal (Doc 25 §5.3).
- The middleware chain + one response formatter (Doc 09 §7, Doc 10 §7).
- The eight services with their state machines (Doc 09 §9).
- The database indexes from day one (Doc 11 §9).
- Offline-first caregiver flow (Doc 09 §9, Doc 10 §2, Saima persona) — this is the highest-risk MVP code.
- Signed direct upload to Cloudinary (Doc 09 §17).
- The in-process scheduler with boot catch-up (Doc 09 §16).
- Sentry + uptime monitor wiring (Doc 25 §26, §23).

**Design work (M):**
- Any final component tweaks in the design system (Doc 15).
- The 15 essential-screen mockups from Doc 17 rendered as clickable prototypes and cross-checked against the built portals.
- The logo regenerated in the final palette (D-08).

**Testing:**
- **Unit:** service rules; offline queue (highest coverage per Doc 10 §26); crypto utility; scheduler date-math.
- **Integration:** every route through the middleware chain; role refusals; standard error shape; idempotent visit sync.
- **E2E (Playwright):** the 12 acceptance checks (Doc 07 §28) — especially airplane-mode and consent-declined.
- **Device:** the 3G + 2 GB Android real-hardware test (NFR-002).
- **Manual:** the adversarial auth pass (Doc 18 §38 launch gate).
- **Chaos:** force Cloudinary and email failures (Doc 20 §28).

**Security:**
- The MVP security checklist (Doc 18 §37.1) — walked before launch.
- Field encryption enabled everywhere the list names.
- `dangerouslySetInnerHTML` and `console.log` banned in code (Doc 23 §31).
- All screens use only design-system tokens.

**Deployment:**
- Render Web Service + Atlas M0 + Cloudinary + Firebase + email + Sentry + UptimeRobot — the free-tier estate (Doc 25 §4).
- CI on every PR; auto-deploy on green main to production (Doc 24 §21).
- Cold-start message active (NFR-008); the free tier accepted as a known limitation.

**Documentation:**
- Docs 00–27 exist and are canonical.
- README and quickstart current (Doc 25 §1).
- The 12-check test suite is documented and runnable.
- Any recommendation values confirmed during MVP move to canonical in the same PR (Rule 8).

**Dependencies:**
- Payoneer receiving account (already true from Foundation).
- Chosen email provider (Recommendation lands at build).
- Firebase project + service account.
- Cloudinary account.
- Sentry account.
- Domain registration (still Open — target: registered before MVP launch).

**Risks (from Doc 08 §28, restated for this phase):**
- **Offline sync bugs** — the highest-value, highest-risk MVP code; mitigated by heavy unit testing and the `clientVisitId` unique index.
- **Free-tier limits bite** — documented; limits made visible where users can feel them (NFR-008).
- **Emergency system pressure** — the Could stub is deliberate; the real emergency system is Phase 2 and requires AD-12.
- **Founder burnout on a solo XL** — phase gating and the deliberate scope are the answer; anything not on the Must list is genuinely optional.

**Success criteria:**
- The 12 acceptance checks all pass in a real production environment.
- The launch gate signed (Doc 18 §38).
- The Foundation families migrated to the software without service degradation.
- North-star metric (verified visits per week) begins to be counted from real data.

**Excluded (Won't) — restated for emphasis:** all Phase 2–6 features. If a Phase 2+ item feels urgent during MVP, the answer is "note it, ship MVP, revisit in phase."

**Team requirements:** the founder, still solo. An operations lead becomes urgent as soon as the software launches — pilot-scale operations move from Foundation's spreadsheet to the software's admin surface, and Nasreen's role becomes real.

**Effort shape:** XL (multi-month, the plateau of the whole roadmap).

**Gate to Private beta:** launch gate passed; ≥ 10 active subscriptions running smoothly for at least one full month.

---

## 3. Private Beta (Tail of Phase 1 + Early Phase 2)

**One-sentence description:** Turn the MVP into a real service by adding the emergency system, the admin dashboard, GPS, and errands — with the confirmed hosting upgrade so the emergency deadline can be met.

**Goals:**
- Serve ~20–30 families across the pilot city, with the operational trust features that make the service provably reliable (O-3).
- Cross the AD-12 gate: leave the sleeping free tier before the emergency system goes live.
- Bring the operations lead into a real, in-app workflow.

**Features (Must):**
- **AD-12 hosting move** — Render paid tier (Doc 08 §30, Doc 21 §32.2).
- **The emergency system** — the four-channel broadcast; live timeline; ownership rooms; the 10-second deadline (FR-070–074, Doc 19 §17–22).
- **Twilio + WhatsApp integrations** for SMS and WhatsApp fan-out.
- **GPS check-in / check-out** (FR-049; SEC-011 flag-not-reject posture).
- **Errands with receipt proof** (FR-060–063).
- **Admin dashboard** — SLA flags, dispute queue, subscription workbench (Doc 16 S-34/S-35).
- **Ratings** — one skippable request per period, feeding caregiver quality (BR-022, FR-093).
- **Staging environment** — release-branch workflow becomes real (Doc 24 §15, §21).
- **Docker image** for environment parity (Doc 25 §16).

**Features (Should):**
- **APM / metrics dashboard** — basic Grafana-adjacent view; the alerts from Doc 20 §27 backed by real data.
- **Incident runbook drill** — the "always-works" lever (revoke tokens + reset) rehearsed once (Doc 18 §34).
- **Common-password screen** rolls forward if it didn't land at MVP.
- **Phone OTP verification** — the D-07 second half arrives with Twilio.

**Features (Could):**
- **A basic beta-feedback capture form** — one screen, one text field, one send button.
- **A public status page** (`status.rozvisit.com`) — a small manual page at first (Doc 21 §26).

**Features (Won't):**
- Live video (Public beta).
- Payment automation (V1).
- Native app (later).
- Any AI feature.

**Technical work (L):**
- The emergency service and its append-only timeline (Doc 09 §9, Doc 11 §Reserved).
- Socket.io on the same process; ownership rooms (Doc 19 §17–19).
- Twilio + WhatsApp channel implementations of the NotificationChannel interface (INT-004 pays off).
- GPS fields activated on visits (already reserved in Doc 11).
- Docker + staging Render service.
- Alert rules on the emergency deadline (OBS-005).

**Design work (M):**
- Emergency screens — the guided caregiver flow (S-24 expansion); the client alert screen; the admin timeline (S-36).
- Admin dashboard density polish; the flag list Nasreen actually uses.
- The one sanctioned pulse animation on active alarms (Doc 15 §18).

**Testing:**
- Emergency deadline tests measured in production hosting (moving off free tier makes the numbers meaningful).
- Ownership refusal tests for socket rooms (Doc 19 §30).
- GPS anomaly flag path unit + integration tests.
- The Playwright suite grows to include the emergency ack path.

**Security:**
- The Production tier checklist (Doc 18 §37.2) — walked before Private beta launch.
- HSTS enabled after a stable production week.
- CSP enforced; Dependabot alerts on.
- Admin MFA lands here if a second admin exists (Doc 13 §25).

**Deployment:**
- Render paid tier active (AD-12).
- Staging → production release-branch flow (Doc 24 §15).
- Docker image published in CI; production runs the image.
- Per-PR E2E in CI (was pre-release-only at MVP).

**Documentation:**
- The emergency runbook (already sketched in Doc 18 §34) is exercised; any drift updated.
- The staging environment's setup captured in Doc 25 § additions.
- Incident write-ups (`docs/incidents/`) exist — even a "went well" drill entry.

**Dependencies:**
- Twilio account with a caregiver-country phone number.
- WhatsApp Business API approval — this can be slow *(Assumption — apply well before the phase)*.
- Insurance provider chosen — the pre-Phase 2 growth gate from BR-023 (Open at Doc 03).
- Operations lead in place — Nasreen's role staffed.

**Risks:**
- **WhatsApp approval slow** — mitigated by ensuring SMS + email + push already meet the 10-second deadline on the three channels.
- **Emergency false positives** — mitigated by the one-confirm design (FR-070) and the "resolve with reason, no caregiver fault by default" rule (Doc 14 §Emergency edge cases).
- **Docker learning curve** — mitigated by the deliberate deferral (Doc 10 §23); it arrives when staging arrives, together.

**Success criteria:**
- Emergency broadcast reliably under 10 s in production (NFR-006).
- 95%+ on-time completion rate over 30 days.
- One resolved emergency (drill or real) with a complete honest timeline.
- Admin operations run entirely inside the app.

**Excluded:** live video, in-app payment, wallet, split billing.

**Team requirements:** the founder + operations lead. A part-time developer may join as scope grows.

**Effort shape:** L.

**Gate to Public beta:** the production checklist all green; 30 days of stable operations at 95%+; no unresolved emergency-path bugs.

---

## 4. Public Beta (Rest of Phase 2 + Phase 3)

**One-sentence description:** Open the doors carefully. Add live trust — video and identity — and scale caregiver recruitment while the service holds its promises.

**Goals:**
- Serve 100–500 families in the pilot city with sustained reliability.
- Live video moves the service from "verified" to "present" (Doc 03 Phase 3 language).
- Broaden the caregiver network to sustain that volume.

**Features (Must):**
- **Live video check-ins** — Daily.co WebRTC integration (Doc 00 §13, §19).
- **On-demand live view** for premium clients.
- **Live selfie identity match** at caregiver arrival (FR-017).
- **Ratings maturity** — the caregiver quality signal drives real assignment decisions.
- **More caregivers** — the recruitment funnel yields ~30–50 verified caregivers.
- **Second admin (or team assist)** — MFA becomes mandatory the day this happens (Doc 13 §25).

**Features (Should):**
- **Family group access UI (linked family members)** — the D-02 database field pays off (Doc 03 BR-002).
- **In-app support-case triage** by admin — the dispute queue moves from Private-beta-basic to fluid workflow.

**Features (Could):**
- **Dark mode for admin/ops** — long-session eye comfort (Doc 15 §43).
- **Post-visit voice notes from the caregiver** — early Phase 5 taste.

**Features (Won't):**
- Payment automation (V1).
- Wallet / split billing (V1).
- Urdu (Growth stage).
- Any AI feature.
- Second city (Scale stage).

**Technical work (L):**
- Daily.co rooms created by the backend; live streams do not pass through our server (Doc 09 §14).
- Selfie-match module — comparison against the verified profile photo *(Open — approach chosen at Phase 3 design; ranges from "human review" to a face-comparison SDK)*.
- Rating aggregation service and its assignment-influence rules.
- The support-case flow's data model finalization (was Open in Doc 14).

**Design work (M):**
- Live video screens — a small, respectful presence, not "surveillance camera" styling.
- Family group access — the permissions story visible in the account screen.
- Rating request UI — one prompt, always skippable, never nagging.

**Testing:**
- Live video quality tests across the target device matrix.
- Selfie match accuracy testing — including honest failure-mode logging.
- Rating manipulation resistance — one visit, one rating; anonymity between client and caregiver preserved.

**Security:**
- Daily.co DPA on file; the live video is a new sensitive data class — the privacy policy expands to name it explicitly.
- Consent language extended to cover live video and selfie match (Doc 18 §31).
- Family group permissions — clear roles (paying owner vs viewer).

**Deployment:**
- Auto-scaling on Render if request volume justifies.
- Redis appears if scaling produces a second instance (Doc 21 §32.2).
- Continuous deployment through staging still holds.

**Documentation:**
- The live video and selfie-match sections in the SRAD and API docs get their proper writeup (they were named but not specified — Doc 09 §14, Doc 12 Part D).
- Family group permission rules formalized in Doc 13's authorization matrix (was Open at MVP).

**Dependencies:**
- Daily.co account and quota chosen.
- Face-comparison SDK vendor (if chosen).
- Growing caregiver recruitment channels — the founder's network is no longer enough.

**Risks:**
- **Live video load** on the free-tier equivalents — mitigated because Daily.co carries the media, not us.
- **Selfie match false negatives** — the flag-not-reject rule (SEC-011) protects caregivers.
- **Ratings weaponized in disputes** — mitigated by admin oversight and honest dispute resolution.
- **Family group ambiguity** — clearly defined roles avoid the "sibling drama" case.

**Success criteria:**
- ≥ 100 active subscriptions with stable retention.
- Live video is used by ≥ 30% of premium clients monthly.
- Selfie match runs on ≥ 90% of visits without disputed failures.
- Caregiver network across 30+ verified people with sustained ratings.

**Excluded:** everything on the Won't row.

**Team requirements:** founder + 1–2 operations staff + possibly a part-time developer for the live-video work.

**Effort shape:** L.

**Gate to V1:** sustained volume; retention baselined; no unresolved public-beta bugs on live video or selfie.

---

## 5. Version 1 (Phase 4 — Revenue Maturity)

**One-sentence description:** The business becomes self-serve. Payment moves in-app, wallets exist, siblings split bills, refunds are automatic.

**Goals (O-4 in Doc 03):**
- Remove manual payment friction — the biggest operations cost of MVP and beta.
- Fair, automatic refunds for missed visits (BR-008).
- Split billing on linkedFamilyMembers realized (BR-007).

**Features (Must):**
- **In-app Payoneer checkout** — the Payoneer implementation of the PaymentProvider interface (Doc 09 §17).
- **Wallet credit** for prepaid balance.
- **Split billing** — pay-per-share across linked family members.
- **Automatic refunds** for missed visits (BR-008).
- **Auto-renewal** — subscriptions renew inside the app.

**Features (Should):**
- **LTV baseline** — six months of retention data now exists.
- **Simple experimentation framework** for non-safety-critical A/B tests (Doc 27 §22 — but never on emergency, consent, or billing state).

**Features (Could):**
- **Corporate/NGO partnership discovery calls** (BR-031 — a Phase 6 revenue stream that can start warming up).
- **Better caregiver payouts UX** — clearer breakdowns; historical earnings graphs.

**Features (Won't):**
- Stripe (still requires foreign entity — Scale stage).
- Urdu (Growth stage).
- Second city (Scale stage).

**Technical work (L):**
- Payoneer API integration behind the PaymentProvider interface — the whole point of INT-003 finally shipping (Doc 09 §17).
- Wallet ledger data model — every credit/debit is append-only, auditable (extending Doc 11's evidence rule to money).
- Split-billing logic — the linkedFamilyMembers field gets its UI (Doc 11 §Section 4 rule).
- Refund automation — the state machine gains new transitions on missed visits.
- BullMQ + Redis for payment jobs (Doc 21 §32.2 — the queue-backed events graduate here).

**Design work (M):**
- Checkout flow — calm, honest, no upsell manipulation.
- Wallet balance and history screens.
- Split-billing invitations — clear, respectful language.
- Missed-visit refund notifications — extra-honest wording.

**Testing:**
- Payment flow tests — heavy, because money math is the most unforgiving domain.
- Wallet ledger consistency tests — the append-only guard extended to money.
- Refund idempotency — a refund never doubles.

**Security:**
- Payment integration adds new sensitive fields to `sensitiveFields.js` (payment references, wallet balances).
- PCI-DSS scope discussion — mostly avoided because Payoneer handles card data, but the boundary needs documenting.
- Full-scope security review with an outside reviewer *(Recommendation — first outside security review of the codebase)*.

**Deployment:**
- Redis + BullMQ live in production.
- Multiple instances behind Render's load balancing.

**Documentation:**
- Doc 03 §14 (post-MVP strategy) gets its Phase 4 addendum with real numbers.
- Doc 11 gets the wallet and refund tables.

**Dependencies:**
- Payoneer API access confirmed and tested.
- Six months of real retention data for LTV.

**Risks:**
- **Payment automation bugs** — the highest-consequence code in the whole product; testing is proportional.
- **Split-billing family conflicts** — mitigated by the paying-owner-decides rule; the linked members are viewers/payers, not editors of family decisions.

**Success criteria:**
- In-app checkout succeeds ≥ 95% first-attempt.
- Zero missed-visit refunds that require manual reconciliation.
- Split billing used by ≥ 20% of eligible households.
- Operations team's payment-processing workload drops ≥ 80%.

**Excluded:** Stripe, Urdu, second city.

**Team requirements:** founder + 2–4 operations + 1–2 developers.

**Effort shape:** L.

**Gate to Growth stage:** self-serve revenue proven; unit economics validated at real volume.

---

## 6. Growth Stage (Phase 5)

**One-sentence description:** Widen the product's reach into more families' lives — Urdu, voice notes, health readings, family group access at scale.

**Goals:**
- Serve non-English-comfortable clients (a real user segment previously served only by the caregiver's translation).
- Deepen the daily-value story: voice notes and simple vitals make the proof feed richer.
- Family group access at scale — the D-02 investment pays off fully.

**Features (Must):**
- **Urdu language toggle** (D-09's second half; LOC-002 pays off).
- **Voice notes** on the caregiver checklist — richer proof (Doc 08 §31 Phase 5).
- **Simple vitals** — blood pressure, sugar readings — captured by the caregiver where consented.
- **Family group access at scale** — the paying-owner-plus-viewers model refined.

**Features (Should):**
- **Team-scale documentation practices** — RFCs for architectural changes (Doc 24 §26).
- **Two-admin operational shift** — always-covered operations hours.

**Features (Could):**
- **Native mobile app spike** — a small evaluation, not a commitment.

**Features (Won't):**
- Second city (Scale).
- Stripe (Scale).
- Any AI feature yet — data hygiene comes first.

**Technical work (M–L):**
- The i18n layer finally sees its Urdu translation file — the design's LOC-002 promise realized.
- Voice note storage and moderation — same interfaces, new media type.
- Vitals data model — with clear "wellbeing signal, not medical diagnosis" framing.
- Cache invalidation infrastructure if scaling demands (Doc 21 §32.3).

**Design work (M):**
- The Urdu type ramp — Noto Nastaliq Urdu (already named in Doc 15 §6) becomes real.
- RTL considerations — some Urdu presentations prefer RTL; a design decision here *(Open — approach settled at Phase 5 design)*.
- Voice-note recorder UI.
- Vitals input UI — simple, respectful, clearly non-diagnostic.

**Testing:**
- Bilingual (Urdu/English) tests through the whole client and caregiver journeys.
- Voice-note storage cost tests at scale.

**Security:**
- Vitals are new sensitive data — added to `sensitiveFields.js`; encryption confirmed.
- Language toggle audited for consistent enforcement across templates (Doc 19 §10).

**Deployment:**
- Growth-stage architecture (Doc 21 §32.2) fully realized.

**Documentation:**
- The Urdu content vocabulary formalized.
- Vitals disclaimer language reviewed by the founder's medical contact *(Recommendation — before launch)*.

**Dependencies:**
- Professional Urdu translation of every string in `i18n/en.json` — the LOC-002 payoff moment.
- Speech-to-text (if voice notes need transcription) *(Open)* — or the raw audio stays as evidence.

**Risks:**
- **Vitals miscategorized as medical advice** — mitigated by clear labeling and privacy policy alignment.
- **RTL breakage** — mitigated by testing all critical flows in Urdu view before enabling the toggle.

**Success criteria:**
- Urdu toggle usage above 30% of active clients within 90 days.
- Voice notes attached to ≥ 40% of Standard/Premium visits.
- No vitals-related complaints requiring policy clarification.

**Excluded:** everything on the Won't row.

**Team requirements:** founder + 3–5 operations + 2–3 developers.

**Effort shape:** L.

**Gate to Scale:** the product now serves a wider audience with stable retention.

---

## 7. Scale Stage (Phase 6)

**One-sentence description:** The pilot playbook becomes the multi-city playbook. Lahore joins; a foreign entity finally makes Stripe possible; caregivers become a certified profession.

**Goals (O-5 in Doc 03):**
- Establish Lahore operations.
- Register the foreign entity (US/UK) that unblocks Stripe and adjacent international payment rails.
- Launch a caregiver certification program that becomes a real credential.

**Features (Must):**
- **Second city — Lahore** — the confirmed first expansion (Doc 00 §5).
- **Foreign entity registration** — US LLC or UK Ltd, informed by the founder's tax context.
- **Stripe integration** — behind the same PaymentProvider interface as Payoneer.
- **Caregiver certification program** — training, exam, credential (BR-024).

**Features (Should):**
- **Multi-region hosting considerations** — Doc 21 §32.3 evidence-driven decision.
- **Enterprise sales tools** for corporate/NGO partnerships (BR-031).

**Features (Could):**
- **Corridor expansion R&D** — India, Bangladesh diasporas (Doc 02 §19 Year 3).
- **AI-assisted anomaly detection in visit checklists** (Doc 03 §12) — the first AI feature, and only after the data hygiene has held.

**Features (Won't):**
- Anything that dilutes the trust brand.
- Rapid multi-country expansion — one corridor at a time.

**Technical work (XL — a program spanning quarters, not weeks):**
- Multi-city configuration — the confirmed no-hardcoded-city rule (SCL-003) pays off.
- Stripe implementation of PaymentProvider — swap-in, keep the Payoneer alternative live for existing subscriptions.
- Reporting and BI tools for a larger operations team.
- The caregiver certification LMS-adjacent surface *(Open — approach: partner with an existing platform vs build)*.

**Design work (M):**
- Certification credential — a badge caregivers can share.
- Enterprise sales one-pagers using the design system.

**Testing:**
- Multi-tenant tests where the tenant is the city, not the customer.
- Stripe payment tests without breaking Payoneer subscriptions.

**Security:**
- Regulatory: elder-care rules if Pakistan introduces them; DPA reviews per country.
- Certification data considered sensitive; the caregiver credential is publicly displayable but the underlying assessment is not.

**Deployment:**
- Large-scale architecture (Doc 21 §32.3) realized.
- Multi-region considered based on Growth-stage evidence.

**Documentation:**
- A new documentation chapter for multi-city operations.
- Regulatory posture per country served, updated when reality demands.

**Dependencies:**
- Foreign entity paperwork — legal, banking, tax setup (months-scale in practice).
- Stripe approval on the new entity.
- Lahore caregiver recruitment network (harder than expanding software).

**Risks:**
- **Trust brand dilution** with multi-city expansion — mitigated by treating each city as a Phase 0 re-run (5 families, hand-verified caregivers, then software).
- **Regulatory arrival** as scale attracts attention — mitigated by the "own standards early" posture from Doc 03 §18.

**Success criteria:**
- Lahore operational with the same quality bars as pilot Islamabad/Rawalpindi.
- Stripe active for new entity-based subscriptions.
- Certification program with meaningful graduate numbers.

**Excluded:** anything that trades trust for scale.

**Team requirements:** founder + operations lead per city + engineering team + finance/legal advisory.

**Effort shape:** XL (multi-quarter).

**Gate:** the market decides.

---

## Cross-Cutting Sections

### Technical Debt Plan

Every phase carries **explicit debt items** — the deliberate deferrals we know we'll pay for later. Tracking them openly keeps them from festering.

| Phase where taken on | Debt | When it comes due |
|---|---|---|
| MVP | No staging environment | Private beta (paid with the Docker + staging arrival) |
| MVP | In-process event bus (not queue) | V1 (paid with BullMQ + Redis) |
| MVP | IndexedDB queue unencrypted | Private beta (evaluate; may formally defer to V1) |
| MVP | Free-tier Atlas M0 backup limits | Private beta (paid with paid Atlas tier) |
| Private beta | Manual APM (Atlas + Render dashboards + Sentry) | V1 (paid with a proper metrics stack if measurement demands) |
| Private beta | Simple support-case data model | Public beta (paid with the fluid dispute queue) |
| Public beta | Selfie match approach TBD at design | Public beta (paid within phase, decided by evidence) |
| V1 | LTV models are early | Growth (paid with real cohort data) |
| Growth | Native app decision deferred | Scale (paid with real usage data) |

**The debt rule** *(Recommendation — added here explicitly)*: every phase's exit review names which debt items were paid, which were deferred, and why. No silent decay.

### Future AI Opportunities

RozVisit does not build AI at MVP, Private beta, Public beta, or V1. Not because AI is bad, but because trust is the product, and AI-in-a-trust-product without data hygiene at scale is a landmine.

**When AI becomes eligible (Growth stage or later):**

| Idea | Why it might help | Guardrails |
|---|---|---|
| **Anomaly detection on visit checklist trends** (Doc 03 §12) | A rising mood-decline pattern or missed-medication trend across weeks may be a real wellbeing signal | Framed as a wellbeing signal, never medical diagnosis. Client sees a soft prompt to consider a doctor visit — no automatic action |
| **Caregiver route optimization for multi-visit days** | Genuinely useful when caregivers do 4+ visits | The caregiver overrides freely; the system suggests, doesn't dispatch |
| **Emergency triage assistance for operations** | Sorting simultaneous emergencies fairly | Never used to auto-close an emergency; only to help operations focus |
| **Content moderation on voice notes** | Only if voice notes reach significant volume | Human review remains the final call on flagged content |
| **Fraud detection on offline sync patterns** | Suspicious sync patterns as one of many signals in the flag pipeline | The flag-for-review rule holds; AI signals do not auto-reject |

**Explicitly NOT considered:**
- AI-generated proof "photos" — the sourceFlag would break, and the whole trust chain would collapse.
- AI-driven caregiver hiring decisions — verification is a human judgment, forever.
- AI voice for the emergency system — the human handles emergencies.

**One rule for any AI ever added:** if a human could not audit the same decision, the AI is not making it.

### Future Mobile App

**Status:** deliberately deferred from MVP through V1 (Doc 03 §22). Web-only serves everyone's device.

**When to reconsider:**
- Real usage data shows offline reliability issues that browser tech cannot solve (Growth stage evidence).
- Caregiver retention shows an "install experience" would materially help (unlikely, but possible).
- Native APIs (better camera control, background sync) become materially better than browser equivalents.

**When to actually build:**
- Growth stage spike as a Could (Section 6).
- Green light only if the spike shows clear, measurable improvement vs the mobile web.

**Approach:**
- React Native is the natural choice given the JavaScript codebase — code sharing with the portals is meaningful.
- The API is the contract; portals already portal-split, so a native client is just another portal (Doc 09 §26).
- Native app does not replace the web app — the client and admin portals stay web.

### Future Integrations

Beyond the confirmed Phase-mapped integrations (Twilio, WhatsApp, Daily.co, Payoneer → Stripe), a menu of possibilities:

| Integration | Phase eligibility | Value |
|---|---|---|
| Pharmacy chains for errand fulfillment | V1+ | Faster medicine delivery in errand flow |
| Diaspora banking partners | V1+ | Deeper payment options for specific corridors |
| Elder-focused telemedicine providers | Growth+ | A referral integration when a doctor visit is warranted |
| Home health-monitoring devices | Growth+ | Vitals arrive via device, not just caregiver typing |
| Ride-hailing (for doctor escorts) | Public beta+ | Coordinate the transportation leg of a doctor visit |
| Government elder registries (Pakistan, if they exist) | Scale+ | Compliance with any future regulation |

**Rule for every integration:** it must sit behind an interface (INT-002/003/004 pattern) — swappable, tested locally in a mocked mode, never a hard dependency.

### Team Requirements Over Time

| Stage | Founder | Ops | Eng | Other |
|---|---|---|---|---|
| Foundation | 1 (full attention) | — | — | — |
| MVP | 1 | — (still founder) | — | Part-time developer *(Recommendation, budget permitting)* |
| Private beta | 1 | 1 (Nasreen role) | 0–1 part-time | — |
| Public beta | 1 | 1–2 | 1–2 | Part-time designer |
| V1 | 1 | 2–4 | 2–3 | Legal / finance advisory |
| Growth | 1 | 3–5 | 3–5 | Content / translation |
| Scale | 1 | Ops per city | Engineering team | Finance, legal, sales |

**One team rule that never changes**: the documentation series is the source of truth; a hire that does not read Docs 00–27 in their first week is not effective (Doc 24 §26 team-workflow rule).

### Effort Ranges (Restated)

Not hours, not sprints — shapes:

| Shape | What it means |
|---|---|
| **S (Small)** | Focused piece; days of thought and change |
| **M (Medium)** | Feature-scoped; weeks of iteration |
| **L (Large)** | Multi-week campaign touching many parts |
| **XL (Very Large)** | Phase-level program spanning months |

**Why no numbers:** a solo student-founder building part-time cannot quote velocities honestly. When the team grows (V1+), effort estimates become tractable per team, and this table adapts.

**What the shapes trigger:**
- Anything **L** or **XL** gets an explicit exit review (what was delivered, what was deferred, what the debt is).
- Anything **S** should not need one — if it does, it was probably an **M**.

---

*End of Document 28 — RozVisit Product and Engineering Roadmap*
