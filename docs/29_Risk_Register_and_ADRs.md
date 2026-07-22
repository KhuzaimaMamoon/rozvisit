# RozVisit — Risk Register and Architecture Decision Records
### Document 29

**Sources:** Documents 00–28. This document consolidates and expands two threads that ran through the whole series: the risks named across Docs 02, 03, 08, 18, 21, and 28; and the architecture decisions listed in Doc 08 §30. Where earlier documents own the detail, this document cross-references rather than restates.
**Labels:** Everything here is confirmed unless marked *(Assumption)*, *(Recommendation)*, or *(Open)*.
**Numbering continuity:** Risk IDs are new (`R-01` upward). ADR IDs preserve the AD-1..AD-12 sequence from Doc 08 §30 (now given proper full-form entries) and continue from **AD-13** onward for decisions made in later documents that were never formalized as ADRs.

---

# Part A — Risk Register

## Scoring Method

Each risk uses two 3-point scales — deliberately coarse, so the register produces action rather than false precision.

**Likelihood:** Low (unlikely in the next 12 months) · Medium (plausible; watch it) · High (expected sometime in the pilot).

**Impact:** Low (short-term inconvenience) · Medium (real cost, recoverable in weeks) · High (existential — trust, financial, or safety-level damage).

**Risk score:** `Likelihood × Impact` on a 1–9 grid:

| | L=Low | L=Medium | L=High |
|---|---|---|---|
| **I=Low** | 1 (watch) | 2 (watch) | 3 (act if it appears) |
| **I=Medium** | 2 (watch) | 4 (act) | 6 (act) |
| **I=High** | 3 (act) | 6 (act) | 9 (top priority) |

**Review frequency** is set per-risk. Anything 6+ is reviewed monthly at MVP; anything at 4 is reviewed quarterly; anything below is refreshed whenever the phase transitions.

**Owner** at MVP is almost always the founder. As Doc 28 §Team Requirements grows the team, ownership migrates naturally; the register updates at each phase-transition review.

---

## Risk Categories

| Category | Range |
|---|---|
| Product | R-01 to R-06 |
| Market | R-07 to R-09 |
| Technical | R-10 to R-17 |
| Security | R-18 to R-22 |
| Privacy | R-23 to R-25 |
| Operational | R-26 to R-30 |
| Financial | R-31 to R-33 |
| Legal | R-34 to R-36 |
| Adoption | R-37 to R-39 |
| Dependency | R-40 to R-44 |

---

## Product Risks

### R-01 — The MVP scope creeps into Phase 2 features

| Field | Value |
|---|---|
| Category | Product |
| Description | Under the pressure of "just one more feature," the emergency system, GPS, or errands leak into MVP, delaying launch and violating phase discipline (Doc 03 Business Rule 6, Doc 15 Product Principle 6). |
| Likelihood | Medium |
| Impact | High |
| Score | 6 |
| Early warning sign | Any PR that touches Phase 2 code paths appearing while MVP acceptance checks are unfinished; conversations that treat "should we add just…" as reasonable |
| Mitigation | Phase gating is real — Doc 00 Source of Truth Rule 7. The 20 MVP stories (Doc 06) are the surface. The Won't row in Doc 28 §2 is authoritative during MVP. |
| Contingency | The scope creep gets caught in review; the offending change is closed, the story added to the Phase 2 backlog. |
| Owner | Founder |
| Review | Monthly during MVP; quarterly thereafter |

### R-02 — Offline caregiver flow has undetected data-loss bugs

| Field | Value |
|---|---|
| Category | Product |
| Description | The IndexedDB queue, capture-time preservation, and `clientVisitId` dedupe (Doc 09 §20, Doc 11 §21) contain a subtle bug that loses a visit's checklist or media under a specific network pattern. |
| Likelihood | Medium |
| Impact | High |
| Score | 6 |
| Early warning sign | Caregivers reporting "I did that visit — where did it go?"; upload_flagged rate rising; feed showing gaps clients ask about |
| Mitigation | Highest unit-test coverage per Doc 10 §26; the acceptance suite's airplane-mode test (Doc 07 §28 check 6); manual chaos-style tests (Doc 20 §28) |
| Contingency | Extract queue state from the caregiver's device via a diagnostic export tool *(Recommendation — a small debug endpoint gated by admin permission)*; reconstruct the visit from evidence in the queue |
| Owner | Founder |
| Review | Monthly during MVP and Private beta |

### R-03 — Trust fails after a single bad incident in a parent's home

| Field | Value |
|---|---|
| Category | Product |
| Description | Theft, harm, or grave miscommunication in one home damages the brand across the whole diaspora community's word-of-mouth network. |
| Likelihood | Low (per verified caregiver per year) |
| Impact | High (per incident) |
| Score | 6 (concentrated risk) |
| Early warning sign | A single low rating with a substantive complaint; any support-case involving trust; any near-miss between caregiver and family |
| Mitigation | Verification (CNIC + background + interview + references — BR-010, FR-081); insurance before Phase 2 growth *(Open — BR-023)*; caregiver ratings feed real action (BR-022); honest dispute resolution with evidence (Doc 05 A4) |
| Contingency | The incident runbook (Doc 18 §34); honest communication with the family within 72 hours; if criminal, cooperation with authorities; the incident write-up goes in `docs/incidents/` |
| Owner | Founder + operations lead once hired |
| Review | Whenever an incident occurs; otherwise quarterly |

### R-04 — Parents refuse the service repeatedly

| Field | Value |
|---|---|
| Category | Product |
| Description | The Tariq persona is more common than expected. The "parent declined" no-fault status (FR-036) becomes a dominant outcome, wasting caregiver time and eroding client subscription value. |
| Likelihood | Medium |
| Impact | Medium |
| Score | 4 |
| Early warning sign | Rising `visit.parent_declined` rate (Doc 27); support cases about "she won't let him in" |
| Mitigation | Client onboarding guidance to talk to the parent first (Doc 04 Tariq); consent capture at the first visit lets the parent set choices (FR-013); framing as help and company (Doc 15 Product Principle 3) |
| Contingency | Founder-led outreach to affected clients; onboarding language iteration; may reveal a product-market fit issue in that segment |
| Owner | Founder |
| Review | Quarterly |

### R-05 — The proof feed doesn't deliver the emotional reassurance clients paid for

| Field | Value |
|---|---|
| Category | Product |
| Description | Clients open the feed less than expected; retention starts fine but slides at 60–90 days because the daily-value story isn't quite there. |
| Likelihood | Medium |
| Impact | High |
| Score | 6 |
| Early warning sign | 24-hour feed-open rate after visit drops below 60% (Doc 27 §23); cancellation reasons cluster around "I just don't check it" |
| Mitigation | The feed IS home for the client portal (Doc 15 §30); calm and useful notifications (FR-092, Doc 19 §1); the design principles rank reassurance first |
| Contingency | Product research: interview the fading clients; possible additions — voice notes (Phase 5, Doc 28 §6), family group access (Phase 5), or a weekly summary format at Phase 3 |
| Owner | Founder |
| Review | Monthly from Private beta |

### R-06 — Caregivers churn faster than the recruitment funnel

| Field | Value |
|---|---|
| Category | Product |
| Description | Verified caregivers leave the platform faster than new ones are approved, forcing reassignments, reducing continuity (FR-034), and eventually starving the pilot. |
| Likelihood | Medium |
| Impact | High |
| Score | 6 |
| Early warning sign | Weekly caregiver retention drops below 80%; assignments-per-verified-caregiver rise; ratings fall |
| Mitigation | Fair per-visit earnings visible to caregivers (FR-048); the backup caregiver rule (BR-015); the certification program at Phase 6 makes the credential itself valuable |
| Contingency | Founder-led caregiver retention conversations; pay-per-visit adjustment; recruitment funnel widened via nursing schools and community centers |
| Owner | Operations lead (once hired) |
| Review | Weekly during Private beta; monthly thereafter |

---

## Market Risks

### R-07 — Diaspora clients won't pay the target price

| Field | Value |
|---|---|
| Category | Market |
| Description | The 5-family Foundation phase or early MVP shows that $25–150/month price ranges are wrong — clients want to pay less, or the perceived value is lower than modeled. |
| Likelihood | Medium |
| Impact | High |
| Score | 6 |
| Early warning sign | Phase 0 conversion below 5/N attempts; MVP registration but consistent non-activation at plan selection |
| Mitigation | Prices intentionally kept as ranges until Phase 0 evidence (BR-004, D-03); the Foundation phase exists precisely to test this |
| Contingency | Repricing based on evidence — including possibly a lower-tier "check-in only" plan; the 60–70% margin discipline (Business Rule 3) constrains how far down we can go before economics break |
| Owner | Founder |
| Review | Continuous during Foundation; monthly during MVP |

### R-08 — A well-funded competitor arrives

| Field | Value |
|---|---|
| Category | Market |
| Description | A larger startup or family-services company launches a similar corridor product with heavier marketing spend. |
| Likelihood | Low (in the specific Pakistan-diaspora corridor) |
| Impact | Medium |
| Score | 2 |
| Early warning sign | Community WhatsApp groups mentioning the competitor's name; caregivers reporting recruitment offers |
| Mitigation | The trust moat (Doc 02 §12) is not a moat if we don't build it; verification quality is the differentiator; word-of-mouth is our channel |
| Contingency | Focus on retention over acquisition; the incumbent (RozVisit at that point) has evidence and a caregiver network the newcomer will take months to match |
| Owner | Founder |
| Review | Quarterly |

### R-09 — Diaspora migration patterns shift

| Field | Value |
|---|---|
| Category | Market |
| Description | Gulf economic changes, UK immigration policy shifts, or PKR/USD volatility change the size or willingness-to-pay of the target segment. |
| Likelihood | Medium |
| Impact | Medium |
| Score | 4 |
| Early warning sign | Sustained macro shifts in diaspora remittance flows; visa-policy news affecting the primary payer countries |
| Mitigation | Multi-currency pricing (BR-001); the strategy's Year 3 corridor expansion (Doc 02 §19) diversifies the market |
| Contingency | Corridor rotation — the India / Bangladesh generalization is on the roadmap |
| Owner | Founder |
| Review | Semi-annually |

---

## Technical Risks

### R-10 — Free-tier limits (Render, Atlas, Cloudinary) bite before revenue

| Field | Value |
|---|---|
| Category | Technical |
| Description | Cold starts erode the user experience; storage caps hit; bandwidth quota is exceeded — before revenue justifies paid tiers. |
| Likelihood | High |
| Impact | Medium |
| Score | 6 |
| Early warning sign | The signals in Doc 21 §30 firing: cold-start rate > 20%, storage > 70%, Cloudinary bandwidth near allowance |
| Mitigation | Limits are documented where users can feel them (NFR-008); every service has a paid tier one switch away; the scaling triggers are named (Doc 21 §32.1 → §32.2) |
| Contingency | The AD-12 hosting move happens on schedule as Private beta approaches; alternate providers evaluated via the swap-ready interfaces |
| Owner | Founder |
| Review | Weekly during MVP; monthly during Private beta |

### R-11 — Emergency broadcast misses the 10-second deadline

| Field | Value |
|---|---|
| Category | Technical |
| Description | On Phase 2 launch, the emergency fan-out is slower than NFR-006 requires — either due to hosting, third-party latency, or a design bug. |
| Likelihood | Medium |
| Impact | High |
| Score | 6 |
| Early warning sign | Load tests before Phase 2 launch showing p95 approaching 8 seconds; Twilio or WhatsApp SDK anomalies |
| Mitigation | AD-12 (leave sleeping free tier) before the emergency system goes live; parallel fan-out across four channels (FR-071) so one slow channel does not gate; measurement in production before launch |
| Contingency | Reduce channels to the three fastest for emergencies while the slow one is diagnosed; loud alert to incident owner on any breach (Doc 20 §27) |
| Owner | Founder |
| Review | Weekly during Phase 2 rollout; monthly once stable |

### R-12 — Field-level encryption implementation flaw

| Field | Value |
|---|---|
| Category | Technical |
| Description | The `crypto.js` utility (Doc 10 §3, Doc 18 §22) has a subtle bug — bad IV reuse, wrong tag length, encoding drift — that weakens encryption or corrupts data. |
| Likelihood | Low |
| Impact | High |
| Score | 3 |
| Early warning sign | Decryption failures on read; migration test discrepancies; any hand-rolled crypto pattern appearing outside the utility |
| Mitigation | One shared utility (never hand-rolled per feature); heavy unit tests including round-trip for every sensitive field; the "sensitiveFields.js" list drives it (SEC-004) |
| Contingency | Rotate the key on suspicion (Doc 25 §7 key-id pattern makes this survivable); force reset for any user whose data may have been affected |
| Owner | Founder |
| Review | Yearly (Doc 18 §17 cost-factor review + Doc 25 §7 rotation) |

### R-13 — Cloudinary bandwidth quota exceeded

| Field | Value |
|---|---|
| Category | Technical |
| Description | Photo evidence bandwidth exceeds the free tier faster than expected, forcing a paid tier before revenue can justify it. |
| Likelihood | Medium |
| Impact | Medium |
| Score | 4 |
| Early warning sign | Cloudinary dashboard bandwidth trending toward the free allowance |
| Mitigation | Compressed thumbnail delivery (PERF-002); phone-sized versions served, not originals; short-lived signed URLs |
| Contingency | Move to paid tier or the S3 implementation of MediaStorage (INT-002, D-05 revisit) |
| Owner | Founder |
| Review | Monthly |

### R-14 — A subtle schema-migration corrupts existing records

| Field | Value |
|---|---|
| Category | Technical |
| Description | A Phase 2+ migration introduces a change that damages an existing collection — most dangerous on visits and consent (evidence collections). |
| Likelihood | Low |
| Impact | High |
| Score | 3 |
| Early warning sign | Migration test on a temp cluster shows unexpected shape changes; strict-mode rejections after migration |
| Mitigation | Additive changes first (Doc 21 §22); migrations are idempotent, reviewable, tested on a restored backup first (Doc 25 §20); append-only guards on evidence collections (Doc 11 §26) |
| Contingency | Restore from backup to a temporary cluster; scripted correction; never in-place hand edits |
| Owner | Founder |
| Review | Per migration |

### R-15 — Duplicate offline visit syncs land as two records

| Field | Value |
|---|---|
| Category | Technical |
| Description | Two verified visits appear for the same real visit — one at capture time, one after a retry through a flaky network. |
| Likelihood | Low |
| Impact | Medium |
| Score | 2 |
| Early warning sign | Client reports "two visits at 10 a.m."; duplicate `clientVisitId` errors trending non-zero |
| Mitigation | `clientVisitId` unique index (Doc 11 §21); idempotent complete endpoint (Doc 12 §14); "returns existing record" pattern |
| Contingency | Manual merge with admin oversight if the guard is ever bypassed; retrospective on how it happened |
| Owner | Founder |
| Review | Quarterly |

### R-16 — Payment integration bugs (Phase 4)

| Field | Value |
|---|---|
| Category | Technical |
| Description | The Payoneer integration double-charges, misses charges, or refunds twice. |
| Likelihood | Medium |
| Impact | High |
| Score | 6 |
| Early warning sign | Wallet ledger diverges from Payoneer statements; support cases about billing |
| Mitigation | Heavy tests around the payment flow (Doc 28 §5 V1 testing); refund idempotency (append-only ledger); paired reconciliation reports |
| Contingency | Manual reconciliation via founder + Payoneer support; a documented "trust but verify" pattern for the first three months of in-app payments |
| Owner | Founder + operations lead |
| Review | Weekly during V1 launch; monthly once stable |

### R-17 — Legacy code drift after team growth

| Field | Value |
|---|---|
| Category | Technical |
| Description | With multiple developers, the layer boundaries (Doc 09, Doc 23 §25) drift silently — Mongoose imports appear in services, business rules leak into controllers. |
| Likelihood | Medium (once team grows) |
| Impact | Medium |
| Score | 4 |
| Early warning sign | PRs slipping through review without checklist walk (Doc 23 §27); bug patterns crossing layers |
| Mitigation | The import-direction rule (Doc 10 §25); mandatory review at team stage (Doc 24 §26); a lint rule for the direction if the linter supports it |
| Contingency | Weekly review of imports; refactor sprint if drift is real |
| Owner | Founder → Tech lead at team stage |
| Review | Monthly at team stage |

---

## Security Risks

### R-18 — Credential stuffing or successful login attack

| Field | Value |
|---|---|
| Category | Security |
| Description | Passwords reused from other breaches are tried against RozVisit; a successful login gives an attacker access to a client's family data. |
| Likelihood | High (attempts) / Low (success) |
| Impact | High (per success) |
| Score | 6 (weighted; scoring by attack success × impact) |
| Early warning sign | `RATE_LIMITED` spikes on auth routes (Doc 18 §16); Sentry-captured auth anomalies; login failure spikes from unusual geos |
| Mitigation | Uniform login response (Doc 13 §2); rate limits (SEC-005); progressive delay (Doc 13 §20); common-password screen at registration (Doc 13 §8 Recommendation); no lockout that could be weaponized (Doc 13 §22) |
| Contingency | The "revoke everything + force reset" lever (Doc 13 §27) for affected users or the whole population |
| Owner | Founder |
| Review | Monthly during MVP; weekly if events surface |

### R-19 — XSS or code injection reaches production

| Field | Value |
|---|---|
| Category | Security |
| Description | A React path introduces `dangerouslySetInnerHTML`, or an input escape is missed, allowing scripts to run in a portal. |
| Likelihood | Low |
| Impact | High |
| Score | 3 |
| Early warning sign | A PR containing `dangerouslySetInnerHTML`; CSP violations in production |
| Mitigation | Ban on `dangerouslySetInnerHTML` (Doc 18 §12); CSP with no `unsafe-inline` scripts (Doc 18 §12); access token in memory only (Doc 13 §4) so an XSS bug cannot steal a session by reading storage |
| Contingency | Revert; rotate JWT secrets on suspicion; force reset if any evidence of exfiltration |
| Owner | Founder |
| Review | Per PR (review checklist) |

### R-20 — Refresh cookie theft via device compromise

| Field | Value |
|---|---|
| Category | Security |
| Description | An attacker with device access steals the refresh cookie and gains up to 7 days of session access. |
| Likelihood | Low |
| Impact | Medium |
| Score | 2 |
| Early warning sign | Unusual refresh patterns from geos different from the account's usual; user reports of "someone else was logged in" |
| Mitigation | `HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth` cookie (Doc 13 §5); server-side revocation store; token rotation (Recommendation, Doc 13 §5) |
| Contingency | Session revocation for the user; force reset |
| Owner | Founder |
| Review | Semi-annually |

### R-21 — Admin misuse or curiosity

| Field | Value |
|---|---|
| Category | Security |
| Description | An admin views records they shouldn't (a former friend's family) or exports data for personal reasons. |
| Likelihood | Low (with careful hiring) |
| Impact | High |
| Score | 3 |
| Early warning sign | Unusual admin access patterns; unexplained CNIC-view spikes; anonymous complaints |
| Mitigation | Scoped permissions from day one (SEC-010); every sensitive read written to auditEvents (AUD-004); admin MFA at Phase 2 recommendation; impersonation disallowed (Doc 13 §24) |
| Contingency | Access review; disable if evidence supports; incident write-up |
| Owner | Founder |
| Review | Quarterly access review |

### R-22 — A dependency introduces a supply-chain compromise

| Field | Value |
|---|---|
| Category | Security |
| Description | A third-party package on npm is compromised (malicious update, typo-squat) and lands in a build. |
| Likelihood | Medium |
| Impact | High |
| Score | 6 |
| Early warning sign | Unusual outbound traffic from a build; `npm audit` findings; industry alerts about compromised packages |
| Mitigation | Deterministic installs via `package-lock.json` and `npm ci`; `npm audit` in CI (Doc 18 §26); Dependabot alerts (Doc 18 §37.2); small preferred dependency set (Doc 18 §26) |
| Contingency | Roll back to the last known clean lockfile; rotate any secret possibly touched by the build; incident write-up |
| Owner | Founder |
| Review | Monthly (dependency review, Doc 18 §26) |

---

## Privacy Risks

### R-23 — Unauthorized disclosure of parent data

| Field | Value |
|---|---|
| Category | Privacy |
| Description | Care notes, addresses, or visit photos leak to a party who shouldn't have them — via a bug, a misconfiguration, or a breach. |
| Likelihood | Low |
| Impact | High |
| Score | 3 |
| Early warning sign | Wrong content returned to a user; media links resolving without the ownership check; Cloudinary access logs anomalies |
| Mitigation | The three authorization rings (Doc 09 §14); access-controlled media links (SEC-008); field encryption of sensitive fields (SEC-004); the CSP restricts img sources (Doc 18 §12) |
| Contingency | Contain (revoke access), preserve (audit records), communicate within 72 hours (Doc 18 §34), investigate, learn (`docs/incidents/`) |
| Owner | Founder |
| Review | Quarterly (privacy posture) |

### R-24 — Consent-recording integrity questioned

| Field | Value |
|---|---|
| Category | Privacy |
| Description | A parent's recorded consent is challenged — either as inauthentic or as insufficient in scope. |
| Likelihood | Low |
| Impact | Medium |
| Score | 2 |
| Early warning sign | Support cases mentioning consent; family member disputes about what was agreed |
| Mitigation | Consent captured on first visit with parent's own choices recorded (FR-013); consent is append-only (DATA-006); the consent's scope shown to caregivers on every subsequent visit (FR-015) |
| Contingency | Retrieve the consent record from the profile; honor withdrawal instantly if the family requests it |
| Owner | Operations lead |
| Review | Yearly |

### R-25 — GDPR complaint from a UK/EU client

| Field | Value |
|---|---|
| Category | Privacy |
| Description | A UK/EU client files a formal complaint (data subject access request, right to erasure) that must be honored within regulatory windows. |
| Likelihood | Low (small UK/EU pilot share) |
| Impact | Medium |
| Score | 2 |
| Early warning sign | UK/EU client asking about data rights; regulator inquiry (unlikely at pilot scale) |
| Mitigation | Privacy policy language (PRV-001); GDPR posture met via controls regardless of hosting region (D-11 basis); the DATA-007 anonymization path (Doc 11 §15) |
| Contingency | Honor the request within the stated window (30 days, Doc 18 §33); execute the anonymization map (Open per Doc 11 §15); log the request in `docs/incidents/privacy-requests/` |
| Owner | Founder |
| Review | Yearly; per-request when occurring |

---

## Operational Risks

### R-26 — Insurance not in place before Phase 2 growth

| Field | Value |
|---|---|
| Category | Operational |
| Description | The BR-023 insurance requirement (Open in Doc 03 §11) is still not resolved when Phase 2 scaling begins, exposing families and caregivers to uninsured incidents. |
| Likelihood | Medium |
| Impact | High |
| Score | 6 |
| Early warning sign | Phase 2 launch date approaching without an insurance provider selected |
| Mitigation | Insurance evaluation is a Phase 1 workstream, not deferred; it's called out in Doc 03 §12, §20 as a dependency |
| Contingency | Delay the growth phase until insurance is in place — the trust brand cannot survive an incident that reveals uninsured operation |
| Owner | Founder |
| Review | Quarterly during MVP; monthly approaching Phase 2 |

### R-27 — Operations lead not hired in time

| Field | Value |
|---|---|
| Category | Operational |
| Description | The Nasreen role (Doc 04, Doc 03 §16) is still filled by the founder during Private beta, causing operations bottlenecks and founder burnout. |
| Likelihood | Medium |
| Impact | High |
| Score | 6 |
| Early warning sign | Founder's hours on operations tasks growing during MVP; caregiver verification lag; admin queue depth rising |
| Mitigation | Hiring plan for the ops role (Doc 28 §Team Requirements) begins during MVP; the search precedes need |
| Contingency | Part-time interim; delay Phase 2 features to reduce operational load; extend MVP window |
| Owner | Founder |
| Review | Monthly during MVP |

### R-28 — Founder burnout

| Field | Value |
|---|---|
| Category | Operational |
| Description | A part-time solo founder building an XL-shape phase can burn out — with no meaningful backup at MVP. |
| Likelihood | Medium |
| Impact | High |
| Score | 6 |
| Early warning sign | Weeks with reduced commits and no clear progress; documentation drift; skipped reviews (Doc 24 §25 self-review discipline) |
| Mitigation | Phase gating enforces small scope (Doc 03 Business Rule 6); the Won't rows in Doc 28 are honest; the maintenance-calendar 30 minutes/week (Doc 24 §25 recommendation) prevents entropy compounding |
| Contingency | Slow the pace deliberately; skip Should items; postpone phase-gate meetings; talk to the community; take time away — the product is not worth the founder's health |
| Owner | Founder (self-monitored) + trusted advisor |
| Review | Monthly self-check |

### R-29 — Docker / staging transition delays

| Field | Value |
|---|---|
| Category | Operational |
| Description | The Phase 2 Docker + staging arrival (Doc 25 §16, §3) introduces new tooling the founder is learning under pressure, delaying Private beta features. |
| Likelihood | Medium |
| Impact | Medium |
| Score | 4 |
| Early warning sign | Phase 2 timeline slipping; Docker builds failing in CI |
| Mitigation | Docker joins alongside staging, not before; the shape is committed in Doc 10 §23; simple multi-stage pattern first |
| Contingency | Push non-Docker Private beta features to a paid Render service without Docker temporarily; add Docker in a dedicated sprint |
| Owner | Founder |
| Review | Weekly during the transition |

### R-30 — Backup restore drill missed

| Field | Value |
|---|---|
| Category | Operational |
| Description | BCK-003 ("an untested backup is no backup") gets skipped during a busy release cycle; the first time we try to restore is during a real incident. |
| Likelihood | Medium |
| Impact | High |
| Score | 6 |
| Early warning sign | The 45-day drift alert (Doc 20 §27) fires |
| Mitigation | Restore drills before every major release (BCK-003); calendar reminder if the 45-day window approaches without a drill |
| Contingency | Emergency restore drill on a temporary cluster; delay the pending release if it depends on backup integrity |
| Owner | Founder |
| Review | Per release |

---

## Financial Risks

### R-31 — Revenue stalls at low pilot volume

| Field | Value |
|---|---|
| Category | Financial |
| Description | The pilot reaches 5–10 paying families but plateaus, unable to sustain the founder or fund Phase 2 tier upgrades. |
| Likelihood | Medium |
| Impact | High |
| Score | 6 |
| Early warning sign | New client acquisition below one per month sustained; MRR flat at 3–6 months |
| Mitigation | Word-of-mouth is the primary channel (Doc 02 §11); referral rewards *(Recommendation — considered at Phase 2, gently, no cash bounties)*; corporate/NGO channel warming at V1 |
| Contingency | Founder stays part-time; runway maintained; timeline extends without panic — the model works or doesn't; forcing it doesn't help |
| Owner | Founder |
| Review | Monthly |

### R-32 — Currency volatility narrows the platform margin

| Field | Value |
|---|---|
| Category | Financial |
| Description | PKR strengthening or foreign currencies weakening squeezes the 60–70% platform share (Doc 03 §16 Business Rule 3). |
| Likelihood | Medium |
| Impact | Medium |
| Score | 4 |
| Early warning sign | Sustained currency shifts of 10%+ over a quarter |
| Mitigation | Multi-currency pricing (BR-001); the platform share is denominated in USD reporting (Doc 27 §7); pricing reviews at phase transitions |
| Contingency | Price adjustments per currency, with honest client communication; the fixed price table (FR-020) makes this straightforward |
| Owner | Founder |
| Review | Quarterly |

### R-33 — Foreign entity registration takes longer than expected

| Field | Value |
|---|---|
| Category | Financial |
| Description | Registering the US LLC or UK Ltd (Scale stage) is slower than expected, delaying Stripe availability. |
| Likelihood | Medium |
| Impact | Medium |
| Score | 4 |
| Early warning sign | Legal advisors quoting 6-month timelines; banking KYC delays |
| Mitigation | Payoneer continues to work (D-05 confirmed for Phases 1–4); registration begins well before Scale stage need |
| Contingency | Extend Payoneer-only period; Stripe joins whenever ready — the PaymentProvider interface (INT-003) accepts either |
| Owner | Founder + legal advisor |
| Review | Semi-annually leading up to Scale stage |

---

## Legal Risks

### R-34 — Elder-care regulation emerges in Pakistan

| Field | Value |
|---|---|
| Category | Legal |
| Description | Pakistan introduces licensing requirements for elder-care services during Growth or Scale stage. |
| Likelihood | Low over 12 months; Medium over 36 |
| Impact | Medium |
| Score | 3 (near-term); 4 (long-term) |
| Early warning sign | Regulatory consultations announced; industry advocacy activity |
| Mitigation | Own standards written early (Doc 03 §18 assumption); the operational discipline exceeds most likely regulatory minimums already |
| Contingency | Legal review; adapt SOPs; possibly formal licensing application; caregiver classification revisited (Doc 03 §18) |
| Owner | Founder |
| Review | Semi-annually |

### R-35 — Caregiver classification challenged

| Field | Value |
|---|---|
| Category | Legal |
| Description | Pakistan's gig-work classification rules evolve, or a caregiver challenges independent-contractor status, requiring employee-model changes. |
| Likelihood | Low |
| Impact | Medium |
| Score | 2 |
| Early warning sign | Labor-law news; caregiver requesting employee benefits |
| Mitigation | Recommendation from Doc 03 §18 for legal review at Phase 2; the platform-share model is documented and evidence-supported (Doc 27 §7) |
| Contingency | Adjust to employee model with corresponding pricing; delay expansion if the economics need reworking |
| Owner | Founder + legal advisor |
| Review | Yearly |

### R-36 — Consent recording admissibility questioned

| Field | Value |
|---|---|
| Category | Legal |
| Description | In a dispute involving a caregiver or a family incident, the consent recording's admissibility or scope is challenged. |
| Likelihood | Low |
| Impact | Medium |
| Score | 2 |
| Early warning sign | Any legal request touching consent records |
| Mitigation | The consent is a recorded moment with the parent's own words and choices (FR-013); the process is documented in the operations SOP |
| Contingency | Legal advice per case; the pre-Phase-2 lawyer review (D-10) formalizes admissibility approach |
| Owner | Founder + legal advisor |
| Review | Per incident |

---

## Adoption Risks

### R-37 — Slow pilot uptake despite validated demand

| Field | Value |
|---|---|
| Category | Adoption |
| Description | Phase 0 identifies willing families but the transition to the software pilot is slower than expected. |
| Likelihood | Medium |
| Impact | Medium |
| Score | 4 |
| Early warning sign | Foundation families reluctant to move from WhatsApp to app; new clients not activating |
| Mitigation | The plan preserves the manual-payment link (D-04) so the switch is gentle; onboarding calls remain human at MVP |
| Contingency | Extend MVP window; hybrid operations for a couple more months; iterate the client onboarding flow |
| Owner | Founder |
| Review | Monthly |

### R-38 — Diaspora clients distrust the platform

| Field | Value |
|---|---|
| Category | Adoption |
| Description | The product is real but families don't trust the brand enough to commit their aging parents to it. |
| Likelihood | Medium |
| Impact | High |
| Score | 6 |
| Early warning sign | High landing traffic, low registration; community WhatsApp groups asking about legitimacy |
| Mitigation | Verification transparency on caregiver profiles; real proof examples on landing (Doc 17 Brief 1); founder-visible in the community; testimonials from Foundation families with permission |
| Contingency | Founder-led community events; sponsoring visible community activities; extended pilot to build reputation |
| Owner | Founder |
| Review | Quarterly |

### R-39 — Caregivers refuse the rating-mediated model

| Field | Value |
|---|---|
| Category | Adoption |
| Description | Ratings become a source of anxiety or resentment for caregivers, damaging retention and workplace culture. |
| Likelihood | Low |
| Impact | Medium |
| Score | 2 |
| Early warning sign | Caregivers voicing anxiety about ratings; drop in checklist quality when ratings introduced |
| Mitigation | Ratings introduced at Phase 2 with clear rules; disputes handled with evidence (BR-022); caregivers see their earnings, not their ratings, in daily use |
| Contingency | Rating model iteration — possibly aggregate-only, longer feedback windows, or no per-visit granularity |
| Owner | Operations lead |
| Review | Quarterly |

---

## Dependency Risks

### R-40 — Payoneer discontinues service in Pakistan or the payer country

| Field | Value |
|---|---|
| Category | Dependency |
| Description | Payoneer stops accepting Pakistan-registered accounts or one of the payer countries, breaking the primary payment rail before Stripe is available. |
| Likelihood | Low |
| Impact | High |
| Score | 3 |
| Early warning sign | Policy change announcements; delayed disbursements; account restrictions |
| Mitigation | The PaymentProvider interface (INT-003) enables provider swap; alternate providers (Wise, direct bank transfer) evaluated if triggered |
| Contingency | Emergency swap to alternate provider; manual reconciliation during transition |
| Owner | Founder |
| Review | Semi-annually |

### R-41 — Cloudinary changes free-tier terms materially

| Field | Value |
|---|---|
| Category | Dependency |
| Description | Cloudinary reduces the free tier's bandwidth or storage, forcing an unexpected paid tier or migration. |
| Likelihood | Medium |
| Impact | Medium |
| Score | 4 |
| Early warning sign | Cloudinary policy update emails |
| Mitigation | MediaStorage interface (INT-002) allows S3 alternative (D-05 revisit) |
| Contingency | Migrate to S3 or paid Cloudinary tier depending on economics |
| Owner | Founder |
| Review | Semi-annually |

### R-42 — WhatsApp Business API approval slow

| Field | Value |
|---|---|
| Category | Dependency |
| Description | Meta's WhatsApp Business API approval process delays Phase 2 emergency broadcast on one of the four channels (Doc 28 §3 mitigation). |
| Likelihood | Medium |
| Impact | Medium |
| Score | 4 |
| Early warning sign | Approval taking more than 60 days from application |
| Mitigation | Apply well before Phase 2 need; SMS + email + push already meet the 10-second deadline on three channels; WhatsApp joins when ready |
| Contingency | Launch emergency system on three channels; WhatsApp added later without redesign |
| Owner | Founder |
| Review | Weekly during application |

### R-43 — Atlas M0 tier's operational limits become blockers

| Field | Value |
|---|---|
| Category | Dependency |
| Description | Atlas M0 storage, connection count, or shared-tier performance limits are hit before Private beta upgrade planned. |
| Likelihood | Medium |
| Impact | Medium |
| Score | 4 |
| Early warning sign | Atlas dashboard alerts; slow query log growing; connection cap warnings |
| Mitigation | Storage > 70% is a Section 32 trigger (Doc 21 §30); upgrade path is one-click |
| Contingency | Immediate paid-tier upgrade (Doc 21 §32.2); Phase 2 timeline compressed if needed |
| Owner | Founder |
| Review | Monthly |

### R-44 — Render pricing or terms change

| Field | Value |
|---|---|
| Category | Dependency |
| Description | Render changes free-tier terms or pricing structure, forcing a hosting review earlier than planned. |
| Likelihood | Low |
| Impact | Medium |
| Score | 2 |
| Early warning sign | Render pricing announcements; billing anomalies |
| Mitigation | The API is stateless (SCL-001); hosting is a deployment change, not a code change (Doc 09 §26); alternative platforms (Railway, Fly.io) can accept the same build |
| Contingency | Migrate to alternative platform; use the migration as the AD-12 hosting-move moment if timing aligns |
| Owner | Founder |
| Review | Semi-annually |

---

## Register Maintenance

- **New risks are added** in the same PR as the change that introduces them (extending Rule 8 to risks).
- **Risk scores are re-evaluated** at each phase transition, not just when incidents happen.
- **Retired risks** stay in the register with `Retired — <phase>` in the status line; nothing gets deleted.
- **The register is a working document**, not a compliance artifact. If it's not being read at each review, it's failing its purpose.

---

# Part B — Architecture Decision Records

## How to Read These ADRs

Each ADR uses the seven-field format from the prompt:

- **ADR ID and Title**
- **Status:** Confirmed, Recommended, Superseded, or Retired
- **Context:** the situation and problem
- **Decision:** the choice made
- **Alternatives:** what else was considered, and why not
- **Consequences:** what changes because of this decision
- **Tradeoffs:** the honest cost paid
- **Review trigger:** the signal that would cause us to revisit

**Numbering:** the AD-1..AD-12 entries in Doc 08 §30 are formalized here without renumbering. Starting at AD-13, new ADRs capture decisions made in later documents that were never formalized.

---

### AD-1 — Layered monolith, one deployable

- **Status:** Confirmed (Doc 00 §14)
- **Context:** One part-time solo developer, MVP scope is 20 stories, zero-cost hosting required. A microservices architecture would multiply operational load with no MVP-scale benefit.
- **Decision:** One Node.js/Express application, organized in strict layers (routes → controllers → services → repositories → models), deployed as a single Render service.
- **Alternatives:**
  - Microservices from day one — rejected: infrastructure and coordination overhead too high for a solo builder.
  - No layers, "just get it done" — rejected: makes future extraction impossible and testing painful.
- **Consequences:** One repo, one deploy, one log stream, one thing to debug. Layer seams cap the future cost of extraction (Doc 21 §32.3).
- **Tradeoffs:** A bug can affect all portals; scaling is coarse at first. Gained: buildability by one person.
- **Review trigger:** Sustained multi-instance load beyond a single paid Render tier's comfortable zone (Doc 21 §32.2 → §32.3).

---

### AD-2 — MERN stack as the confirmed technology

- **Status:** Confirmed (Doc 00 §13)
- **Context:** Product needs to be built by a Node.js–competent solo developer, work on a wide range of devices, and be operable on free tiers.
- **Decision:** MongoDB (Atlas) + Express (Node 20 LTS) + React 18 (Vite) + Node.js.
- **Alternatives:**
  - PostgreSQL + Node — rejected: MongoDB's document shape matches visit evidence records better; strict Mongoose schemas cover the type discipline; JSON-native at every layer reduces friction.
  - Next.js — rejected: overkill for portal-split SPAs with an API backend already chosen; keeps two mental models unnecessarily.
  - Native mobile at MVP — rejected: web reaches every device, one codebase, no app-store friction.
- **Consequences:** One JavaScript ecosystem across client and server; ES modules everywhere; Vite for fast dev.
- **Tradeoffs:** MongoDB's lack of transactions at MVP is accepted by design (Doc 11 §11 — document-per-write pattern).
- **Review trigger:** A future need for cross-document ACID guarantees that document-shape and services cannot cover.

---

### AD-3 — Stateless JWT sessions, revocable refresh

- **Status:** Confirmed (Doc 13 §3)
- **Context:** Session storage adds complexity and coupling; horizontal scaling wants stateless.
- **Decision:** JWT access tokens (15 minutes, HS256, memory-only on client) + revocable refresh tokens (7 days, hashed in `refreshTokens` collection, httpOnly SameSite=Strict cookie).
- **Alternatives:**
  - Server-side sessions (express-session with a store) — rejected: adds a dependency, complicates horizontal scaling.
  - Single long-lived JWT — rejected: no revocation, no fresh role/state.
- **Consequences:** Every API request verifies the token statelessly; the refresh cookie handles silent renewal.
- **Tradeoffs:** Access token revocation up to 15 minutes; accepted (Doc 13 §13 logout note).
- **Review trigger:** A requirement for instant global session kill without waiting the access-token lifetime.

---

### AD-4 — Interfaces for media, payments, notification channels

- **Status:** Confirmed (INT-002/003/004, Doc 09 §10)
- **Context:** Media (Cloudinary vs S3), payments (Payoneer → Stripe), and notifications (in-app/push/email/SMS/WhatsApp) will all evolve. Coupling to any vendor would make future swaps painful.
- **Decision:** Three internal interfaces: `MediaStorage`, `PaymentProvider`, `NotificationChannel`. Each has a single "current" implementation at any time, plus room for alternatives.
- **Alternatives:**
  - Direct vendor SDK use in services — rejected: contaminates business logic with vendor types; makes testing hard.
- **Consequences:** Swapping providers touches one file per interface (D-05 S3 evaluation, Phase 4 Stripe swap).
- **Tradeoffs:** A small amount of indirection; a few extra files; conceptual clarity worth much more than the small cost.
- **Review trigger:** A vendor change or a new vendor addition.

---

### AD-5 — In-process event bus at MVP; queue at Phase 4–5

- **Status:** Confirmed staging (Doc 09 §10)
- **Context:** At MVP volume, an external queue is infrastructure for a problem we don't have; but we want the event-driven pattern from day one so listeners (notifications, audit) are architecturally clean.
- **Decision:** Node.js `EventEmitter` for the event bus at MVP; transport swaps to BullMQ + Redis at V1 (Phase 4–5).
- **Alternatives:**
  - BullMQ + Redis from day one — rejected: unnecessary infrastructure at MVP volume.
  - No event bus, direct calls — rejected: contaminates services with notification and audit concerns.
- **Consequences:** Listener code doesn't change across the transition; only the bus transport swaps.
- **Tradeoffs:** In-process events can be lost if the process crashes mid-emit; the retry-and-flag pattern (FR-091) covers the notification path.
- **Review trigger:** Payment automation at V1, or notification failure rates rising to indicate lost events.

---

### AD-6 — Offline-first caregiver flow: service worker + IndexedDB

- **Status:** Behavior confirmed (FR-043); libraries chosen at build *(Recommendation)*
- **Context:** Bilal's phone (2 GB Android, 3G) and Saima's dead zones (Doc 04) are the confirmed reality. The caregiver visit flow must work fully offline.
- **Decision:** Service worker caches the caregiver app shell; IndexedDB stores drafts, photos, and the sync queue; capture time preserved with device time (FR-044); `clientVisitId` unique index for offline dedupe (Doc 11 §21).
- **Alternatives:**
  - Native mobile app with better offline APIs — deferred (Doc 28 §Future Mobile App), evaluated at Growth stage.
  - Optimistic UI without persistence — rejected: crashes lose work; caregiver retention would collapse.
- **Consequences:** The caregiver portal is the highest-risk MVP code; testing coverage prioritized accordingly (Doc 10 §26); the design system's SyncStateBar makes states honest.
- **Tradeoffs:** IndexedDB is not encrypted at rest by the browser (Doc 18 §22 gap); mitigated by short retention and the flag-past-24h behavior.
- **Review trigger:** Real usage data showing offline reliability issues browser tech cannot solve.

---

### AD-7 — Direct signed uploads to Cloudinary

- **Status:** *(Recommendation — confirm at build)*
- **Context:** Photos and videos are up to 50 MB; passing them through a free-tier Render instance would tie up capacity and hurt user experience.
- **Decision:** The backend mints a short-lived signed permit; the device uploads directly to Cloudinary; the backend stores media references only.
- **Alternatives:**
  - Proxy uploads through the backend — rejected: bandwidth cost on our small server; slower for the caregiver.
- **Consequences:** The backend is not a media pipe; the signed-permit endpoint is the security gate.
- **Tradeoffs:** Cloudinary is a required dependency in the upload path; the MediaStorage interface (AD-4) keeps this replaceable.
- **Review trigger:** A change in Cloudinary's signed-upload capability or a switch to S3.

---

### AD-8 — No real-time infrastructure at MVP; Socket.io at Phase 2

- **Status:** Confirmed scope (Doc 09 §12)
- **Context:** The MVP has no confirmed requirement for real-time push (the feed and lists update on load). Adding Socket.io at MVP would multiply moving parts.
- **Decision:** No Socket.io at MVP. Socket.io joins at Phase 2 for two confirmed jobs: emergency broadcast in-app leg (FR-071) and live admin views (FR-084).
- **Alternatives:**
  - Socket.io from day one — rejected: unnecessary infrastructure.
  - Server-sent events instead of Socket.io — considered, but Socket.io's ecosystem and multi-instance adapter (Redis) match our future path better.
- **Consequences:** The `sockets/` folder stays empty until Phase 2 (Doc 10 §26 rule of engagement).
- **Tradeoffs:** The Phase 2 addition is real work; but it's phase-appropriate.
- **Review trigger:** Any confirmed requirement for real-time push before Phase 2.

---

### AD-9 — No staging environment at MVP

- **Status:** *(Recommendation — with the named revisit trigger)*
- **Context:** Zero users at MVP; a staging environment would be ceremony without value.
- **Decision:** Local development → production directly, on green CI. Staging arrives at Phase 2 alongside Docker and the paid Render tier.
- **Alternatives:**
  - Staging from day one — rejected: cost + operational overhead without users to protect.
- **Consequences:** Any pre-production testing happens locally; the launch gate (Doc 18 §38) includes the airplane-mode test in production hosting on a real device.
- **Tradeoffs:** A production regression cannot be caught in staging first; mitigated by strong local tests and small deploys.
- **Review trigger:** Real users onboarding, or the Phase 2 approach — whichever comes first.

---

### AD-10 — Render + Atlas M0 + free tiers

- **Status:** Confirmed (D-06 in Doc 01)
- **Context:** Zero-cost hosting until revenue exists (Business Constraint 1).
- **Decision:** Render Web Service (free at MVP), MongoDB Atlas M0 (free, Mumbai), Cloudinary + Firebase + email on free tiers.
- **Alternatives:**
  - Vercel/Netlify + serverless functions — rejected: less control over background jobs (scheduler), colder cold starts at higher scale, no clean way to run Socket.io on the same host.
  - Self-managed cloud (AWS EC2/DO Droplet) — rejected: too much operations load for a solo developer.
- **Consequences:** Cold starts accepted at MVP (NFR-008); the AD-12 hosting move is planned for Phase 2.
- **Tradeoffs:** Free-tier limits are real; documented (Doc 21 §30 signals) with paid-tier switches on standby.
- **Review trigger:** Phase 2 approaching, or free-tier signals (Doc 21 §30) firing sustained.

---

### AD-11 — Oxlint + Prettier; GitHub Actions gates

- **Status:** Confirmed (Doc 00 §13, Doc 23 §28)
- **Context:** ESLint is the industry default but slower and heavier than Oxlint; a solo developer benefits from a fast linter.
- **Decision:** Oxlint for linting, Prettier for formatting, both enforced in CI.
- **Alternatives:**
  - ESLint — the initial choice in the pre-series SRAD; superseded per Doc 00 §22 (contradiction resolution). ESLint's rule ecosystem is larger, but the required rule set is small.
  - Biome — considered, still maturing; may be revisited.
- **Consequences:** Fast CI (Doc 25 §17); consistent formatting.
- **Tradeoffs:** Oxlint's ecosystem is narrower than ESLint's; the small required rule set is well-supported.
- **Review trigger:** A required rule Oxlint cannot express and the workaround is uncomfortable.

---

### AD-12 — Leave the sleeping free tier before the emergency system activates

- **Status:** *(Recommendation — accepted as a Phase 2 entry condition)*
- **Context:** The 10-second emergency deadline (NFR-006) is a hard number. A sleeping free-tier instance's cold start could consume most of the budget on the first request after quiet time.
- **Decision:** Move to Render paid tier (always-on) before the emergency system code path activates in production.
- **Alternatives:**
  - Ship emergency on the free tier — rejected: unacceptable risk on the sacred path.
  - Keep-alive pings on free tier — rejected: fragile, unreliable, and violates the free tier's terms.
- **Consequences:** A cost step (Doc 25 §30) at Phase 2; recorded as a phase-entry condition.
- **Tradeoffs:** Real dollars before real revenue at Phase 2 boundary; accepted because the emergency path is worth it.
- **Review trigger:** N/A — this is the trigger for another decision (Phase 2 launch).

---

## New ADRs (AD-13 onward) — Decisions Made in Later Documents

The following decisions were made across Documents 09–21 but never captured as formal ADRs. They are captured now with full context, alternatives, and review triggers.

---

### AD-13 — Payoneer as the payment rail; Stripe deferred to post-foreign-entity

- **Status:** Confirmed (Doc 00 §13, Doc 03 §11)
- **Context:** Stripe does not accept Pakistan-registered businesses. Payoneer does, and it works with the target payer countries.
- **Decision:** Payoneer for Phase 1 (manual links) through Phase 4 (in-app API integration). Stripe added at Scale stage after foreign entity registration, behind the same PaymentProvider interface (AD-4).
- **Alternatives:**
  - Wise — considered; less mature developer experience for the receiving side in Pakistan.
  - Bank transfer only — rejected: too much friction for diaspora clients.
- **Consequences:** All Phase 4+ payment code sits behind the PaymentProvider interface; Stripe becomes an implementation, not a rewrite.
- **Tradeoffs:** Payoneer's fee structure is what it is; the 60–70% platform share (Business Rule 3) accounts for it.
- **Review trigger:** Foreign entity registration completed, or a Payoneer service disruption (R-40).

---

### AD-14 — Plan snapshots on subscription records

- **Status:** Confirmed (Doc 11 §8)
- **Context:** Plan prices can change (BR-004 — introductory pricing may be adjusted after Phase 0 evidence). Existing subscribers must keep the terms they agreed to.
- **Decision:** Each subscription document stores a `planSnapshot` copying the plan's terms and price at purchase; the `carePlans` collection is reference data for new selections only.
- **Alternatives:**
  - Reference the plan by ID and read current terms — rejected: rewrites history for existing subscribers on any pricing change.
  - Immutable plans versioned per change — rejected: multiplies plan records for a small pilot.
- **Consequences:** Subscription state history is honest; pricing changes are safe.
- **Tradeoffs:** Small data duplication; worth the honesty.
- **Review trigger:** Phase 4 wallet math needing more complex plan semantics.

---

### AD-15 — Camera-only capture; no gallery upload path

- **Status:** Confirmed (FR-042, SEC-012)
- **Context:** Proof photos are the trust core. A gallery upload path would let anyone attach any image as "proof," breaking BR-011.
- **Decision:** The caregiver camera capture UI uses `getUserMedia` directly; no file picker exists anywhere. Every media file carries a `sourceFlag: "in_app_camera"` set at capture. Validation rejects any other source.
- **Alternatives:**
  - Allow gallery uploads for convenience — rejected: destroys the trust chain.
  - Trust EXIF data as proof — rejected: EXIF is trivially editable.
- **Consequences:** The design system's CameraCapture component (Doc 15 §35) is the only path.
- **Tradeoffs:** Caregivers cannot upload photos taken with a different app; deliberate.
- **Review trigger:** A future need for legitimate multi-source evidence (unlikely).

---

### AD-16 — Cloudinary at MVP; S3 evaluation at Phase 5

- **Status:** Confirmed (D-05 in Doc 01)
- **Context:** Cloudinary's built-in transformations, signed uploads, and free tier match MVP needs. S3 is cheaper at scale but requires more setup.
- **Decision:** Cloudinary for Phases 1–4; formally evaluate S3 at Phase 5 based on real bandwidth data.
- **Alternatives:** See AD-4 for the interface pattern that enables the future swap.
- **Consequences:** MediaStorage interface (INT-002) is exercised locally in dev with a console-logging implementation (Doc 09 §24).
- **Tradeoffs:** Cloudinary's paid tiers become expensive at Growth stage volume; the evaluation window is well before that.
- **Review trigger:** Cloudinary bandwidth trending toward the free allowance (Doc 21 §30 signal); Phase 5 evaluation.

---

### AD-17 — Correlation IDs on every request, log line, error, notification

- **Status:** Confirmed (Doc 20 §26)
- **Context:** The single most useful diagnostic addition. Without correlation IDs, log lines from a user's incident scatter across logs, Sentry, notification records, and audit events with no thread between them.
- **Decision:** Each incoming request gets `req_<yyyy-mm-dd>_<random8>` in the request-logging middleware; it flows to logs, error responses, Sentry, notification records, and audit events.
- **Alternatives:**
  - No correlation IDs; grep by timestamp — rejected: slow, error-prone under any real load.
  - Distributed tracing (OpenTelemetry) at MVP — rejected: overkill for pilot volume; the ID pattern is enough.
- **Consequences:** Support incidents are diagnosable in minutes; the ID appears in the Unexpected Error panel so users can share it.
- **Tradeoffs:** A small amount of infrastructure at boot; negligible cost.
- **Review trigger:** Growth-stage adoption of a full APM tool (Doc 21 §32.3) may extend this to a full trace ID.

---

### AD-18 — Field-level encryption driven by a single sensitive-field list

- **Status:** Confirmed (Doc 10 §3, Doc 18 §22)
- **Context:** Sensitive fields (care notes, addresses, CNIC, consent recordings) must be encrypted at rest. Doing this per feature invites drift and mistakes.
- **Decision:** One `sensitiveFields.js` list drives three enforcements — encryption at rest (via `crypto.js`), log redaction, and access rules. Field encryption is AES-256-GCM with a key from `FIELD_ENCRYPTION_KEY`; per-record IVs; ciphertext stored `select: false`.
- **Alternatives:**
  - Per-feature encryption — rejected: guaranteed to have gaps.
  - Full disk-level encryption only — rejected: doesn't help against a query returning sensitive fields to the wrong caller.
- **Consequences:** Adding a sensitive field is a one-place change; forgetting the list is caught by review (Doc 23 §24).
- **Tradeoffs:** Encrypted fields are not searchable in queries; acceptable because MVP search is admin-only and exact (Doc 11 §18).
- **Review trigger:** A future search requirement on an encrypted field (would need envelope encryption with a separate searchable hash — Doc 11 §Section 4 hasn't crossed this yet).

---

### AD-19 — Append-only evidence collections with a save-guard

- **Status:** Confirmed (Doc 11 §26, Doc 18 §9)
- **Context:** Visits, consent records, emergency timelines, and audit events are evidence. In-place edits would destroy trust.
- **Decision:** Evidence collections have `updatedAt` timestamps but no update-in-place code paths. History arrays inside documents are append-only; the schema layer's save-guard refuses in-place modifications.
- **Alternatives:**
  - Trust developers to always append — rejected: a code review miss loses evidence permanently.
  - Store history in a separate audit table only — rejected: cross-collection queries slow the feed.
- **Consequences:** The append-only pattern is structural; corrections are new entries, never overwrites.
- **Tradeoffs:** Slightly more storage for history arrays; worth the guarantee.
- **Review trigger:** N/A — this is a permanent commitment.

---

### AD-20 — MongoDB region: Asia-Pacific (Mumbai)

- **Status:** Confirmed (D-11 in Doc 01, DATA-008)
- **Context:** The primary user base is in Pakistan (caregivers) and the Gulf (many clients). Latency to Mumbai is minutes-of-milliseconds for both.
- **Decision:** Atlas M0 cluster in `ap-south-1` (Mumbai); privacy policy states the hosting region (PRV-001).
- **Alternatives:**
  - EU-central regions — rejected: worse latency for the primary users.
  - Multi-region — rejected: unnecessary at MVP; considered at Scale (Doc 21 §32.3).
- **Consequences:** Fast reads for the target audience; GDPR handled via controls, not region (D-11 basis).
- **Tradeoffs:** UK/EU clients see slightly higher latency; acceptable given the small pilot share and the CDN pattern for static assets.
- **Review trigger:** Meaningful UK/EU client concentration (Doc 21 §32.3 multi-region evaluation).

---

### AD-21 — No cache layer at MVP; Redis at growth stage

- **Status:** Confirmed (Doc 21 §9–10)
- **Context:** At pilot volume, MongoDB with correct indexes meets NFR-001 (300 ms p95). Adding cache prematurely is a source of correctness bugs.
- **Decision:** No dedicated cache layer at MVP. In-process memoization for reference data (5-minute TTL for `carePlans`). Redis joins at Growth stage for rate limiting, Socket.io adapter, and hot data — in that order of need.
- **Alternatives:**
  - Redis from day one — rejected: no confirmed requirement, complexity multiplies.
  - HTTP caching only — kept for static assets (built by Vite with content-hashed filenames).
- **Consequences:** Correctness first; caching added when measurement demands.
- **Tradeoffs:** Peak-load performance is not pre-optimized; MVP volume doesn't need it.
- **Review trigger:** The moment we run 2+ instances (rate limiting must be shared) or feed p95 > 300 ms consistently (Doc 21 §32.2).

---

### AD-22 — In-process scheduler with boot catch-up

- **Status:** *(Recommendation, Doc 09 §16, Doc 21 §20)*
- **Context:** Scheduled work at MVP is small — visit generation from weekly schedules, grace-period transitions (FR-025). On the free tier, the app may be asleep at tick time.
- **Decision:** In-process scheduler (node-cron equivalent, chosen at build) with boot catch-up logic; transitions computed from dates, not tick-dependent. Replaced by BullMQ at V1 (AD-5).
- **Alternatives:**
  - External cron (Render's cron service) — rejected: not free at MVP, more infrastructure.
  - Tick-driven state — rejected: a missed tick causes silent delays.
- **Consequences:** Correctness by date-math; a slept-through tick fires catches up on next boot.
- **Tradeoffs:** Timing precision depends on the app being awake; acceptable for the specific jobs.
- **Review trigger:** V1 payment automation, when BullMQ arrives (AD-5).

---

### AD-23 — API response envelope and error format

- **Status:** Confirmed (Doc 12 §7–8)
- **Context:** Clients decode API responses many times a day. A drift-prone shape is a source of subtle bugs.
- **Decision:** All responses use `{ success, data }` or `{ success: false, error: { code, message, fields?, correlationId } }`. Enforced by a single `respond.js` formatter; no handwritten JSON in controllers.
- **Alternatives:**
  - Bare data / bare error — rejected: no room for envelope metadata.
  - GraphQL — rejected: overkill for a small, well-known API surface.
- **Consequences:** Client `api.js` wrapper decodes once; error codes are stable and centralized (AD-24).
- **Tradeoffs:** A tiny amount of envelope overhead; negligible cost.
- **Review trigger:** A future API v2 (Doc 12 §3) — the envelope is stable across versions unless a genuine need argues otherwise.

---

### AD-24 — Typed AppError hierarchy with `expose` flag

- **Status:** Confirmed (Doc 20 §2)
- **Context:** The "never leak internals to users" rule (ERR-003) is easy to violate accidentally.
- **Decision:** A small `AppError` class hierarchy with `code`, `status`, `message`, `expose`, `fields`, `cause`. The response formatter reads `expose` to decide whether the message is safe to render to users. Adding a new code is centralized (Doc 20 §13).
- **Alternatives:**
  - Bare `Error` throws with per-controller shaping — rejected: silent leaks guaranteed.
  - Try/catch every service call in controllers — rejected: violates the thin-controller rule (Doc 09 §5).
- **Consequences:** Errors are answers, not shame (Doc 20 §1 philosophy).
- **Tradeoffs:** A small class hierarchy to learn; small cost.
- **Review trigger:** N/A — this is a permanent commitment.

---

### AD-25 — Trunk-based Git flow with squash merges

- **Status:** Confirmed (Doc 24 §2, §13)
- **Context:** One solo developer, short-lived feature branches, `main` always deployable.
- **Decision:** No `develop` branch; feature/fix/hotfix branches from `main`; squash-merge to `main`; delete branches after merge.
- **Alternatives:**
  - Git Flow with `develop` and `release` branches — rejected: doubles ceremony for solo work; release branches arrive at Phase 2 (Doc 24 §15).
  - Rebase-and-merge — rejected: rewrites hashes and complicates team scenarios.
- **Consequences:** History reads like a changelog; reverts are one revert.
- **Tradeoffs:** Squash loses in-branch commit granularity; deliberate.
- **Review trigger:** Team-stage patterns (Doc 24 §26) that argue for a longer-lived integration branch — unlikely at RozVisit's scale.

---

### AD-26 — Redis-backed Socket.io adapter for multi-instance real-time

- **Status:** *(Recommendation — Growth-stage entry condition; captured in Doc 21 §32.2)*
- **Context:** MVP has no real-time infrastructure (AD-8). Phase 2 adds Socket.io on the same process (Doc 19 §17) for the emergency broadcast leg and live admin views. At Growth stage, when the app runs 2+ instances behind Render's load balancer, socket events fired on one instance would not reach clients connected to another — silently breaking real-time delivery.
- **Decision:** Adopt the Socket.io Redis adapter as the moment we run 2+ instances. Redis becomes a first-class dependency at Growth stage per Doc 21 §10 ordering (rate limits first, then Socket.io adapter, then hot cache).
- **Alternatives:**
  - Sticky sessions at the load balancer — rejected: reduces real-time reach; a client and the emergency broadcast that concerns them can land on different instances.
  - Custom event distribution (e.g., MongoDB change streams) — rejected: reinvents a solved problem; Socket.io's official adapter is battle-tested.
  - Move sockets to a dedicated service — rejected: increases operational load; the confirmed monolith (AD-1) is easier to keep well-run.
- **Consequences:** A `REDIS_URL` env var appears (Doc 26 A.12); the Socket.io initialization gains the adapter middleware; the Growth-stage Docker/staging shape includes Redis; the notification and emergency paths retain their identical behavior across a single-instance and multi-instance deployment.
- **Tradeoffs:** Redis is now a hard dependency at Growth stage — but it earns its keep across three jobs (rate limits, sockets, hot cache). One dependency to operate for three problems is a good ratio.
- **Review trigger:** Deployment moves to a serverless architecture where Socket.io no longer fits, or a fundamentally different real-time model (e.g., server-sent events) proves better for the two confirmed jobs.

---

### AD-27 — Same-origin serving of API and built portals at MVP

- **Status:** Confirmed (Doc 09 §26, Doc 18 §14)
- **Context:** MVP has one Render service. Splitting the API and the built portals onto separate hosts would introduce CORS configuration, a second deploy pipeline, and a distinct static-host billing line — ceremony without a matching user benefit at pilot scale.
- **Decision:** The Express server serves `client/dist/` for non-`/api` paths (the SPA fallback route); the browser sees one origin for both the portals and the API.
- **Alternatives:**
  - Static host (Vercel, Cloudflare Pages, Netlify) for the built portals + Render for the API — deferred to Growth stage (Doc 21 §14) when static delivery becomes a measurable bottleneck. The API stays on Render either way.
  - Split at MVP anyway — rejected: adds CORS configuration, cookie complexity, and a second deploy pipeline for no gain at pilot volume.
- **Consequences:**
  - **No CORS at MVP** (Doc 18 §14) — the browser makes only same-origin requests.
  - **The refresh cookie path** (`Path=/api/v1/auth`) works without cross-origin credential handling.
  - **The Content-Security-Policy** is stricter — `default-src 'self'` covers both API and portal delivery.
  - **A separate frontend deploy pipeline is not needed** — one CI job builds and ships everything.
- **Tradeoffs:**
  - Static asset delivery competes with API request capacity — negligible at MVP volume, revisited when portal load becomes measurable.
  - Cannot use a CDN's edge caching for portal delivery until we split — an accepted trade-off, since Vite's content-hashed filenames + long-cache headers already provide most of the benefit for repeat visitors.
- **Review trigger:** Portal delivery becomes a measurable bottleneck (Doc 21 §30 signals: portal first-paint above the NFR-003 budget consistently, or portal traffic saturates the API instance).

---

### AD-28 — Vite version tracks current stable, not a fixed pin

- **Status:** Confirmed
- **Context:** The documentation series pinned Vite 5 as the frontend bundler. During initial installation (T-A01..T-A12), a high-severity dependency advisory required upgrading beyond that line. The available audit fix moved Vite outside the documented version.
- **Decision:** Adopt the latest stable Vite. Documentation version numbers for build tooling are treated as "current stable at time of writing," not immutable pins. Runtime dependencies (Node 20 LTS, MongoDB 7, React 18) remain hard-pinned.
- **Alternatives considered:**
  - Stay on Vite 5 with a known high-severity vulnerability — rejected. A security debt at day 1 is unacceptable and violates the "never leak sensitive data" ranking above feature completeness.
  - Downgrade around the advisory with a nested override — rejected. This adds fragility without solving the underlying issue.
- **Consequences:** Build tooling versions in Doc 00 §13 and Doc 23 §3 are treated as guidance, not contract. Actual installed versions are recorded in package.json and package-lock.json, which are the real source of truth for tooling versions. Framework-specific patterns in docs remain valid unless a Vite major version introduces a breaking change we depend on.
- **Tradeoffs:** Loses the "the docs say exactly which version" property for build tooling. Gained: zero security debt at project start, ability to accept routine security patches without rewriting docs.
- **Review trigger:** A future Vite major version introduces a breaking change to the module resolution, plugin API, or dev-server behavior that our setup depends on.

---

### AD-29 — Uniform login failures prevent account enumeration

- **Status:** Confirmed
- **Context:** Doc 13 and Doc 12 originally specified a distinct `403 VERIFY_EMAIL_FIRST` response for unverified accounts at login. This conflicted with the uniform-response anti-enumeration rule and was itself an enumeration vector.
- **Decision:** Login returns a uniform response for wrong-email, wrong-password, and unverified cases. `VERIFY_EMAIL_FIRST` is reserved for authenticated contexts. A separate resend-verification endpoint always returns generic success.
- **Alternatives considered:**
  - Keep distinct `403` — rejected: enables enumeration.
  - Silently succeed login but block features until verified — rejected: contradicts FR-002's registration flow intent.
- **Consequences:** Slightly less specific error feedback to legitimate users at login; gained protection against enumeration attacks.
- **Review trigger:** None anticipated; this is a standard security pattern.

---

### AD-30 — Cloudinary signed-upload permit: 10-minute TTL, 50MB/image-video-only constraint

- **Status:** Confirmed
- **Context:** AD-7 established that media never touches the backend -- only signed permits do. The exact TTL and constraint parameters were undocumented.
- **Decision:** 10-minute permit TTL; 50MB max file size; image/video formats only; folder-scoped and public-ID-scoped to the specific visit and client-generated ID for idempotency. **Amendment (2026-07-21):** visit-media permits and direct uploads include `type: "authenticated"`; feed playback uses a short-lived signed URL. This replaces the previous default Cloudinary `upload` delivery type for new visit photos, providing defense in depth for sensitive in-home evidence and matching the consent-recording protection model.
- **Alternatives considered:** Longer TTL (30+ min) -- rejected as unnecessary exposure window for a task that takes at most a few minutes in practice. Shorter TTL (2-3 min) -- rejected as too tight for genuinely slow connections in the field.
- **Consequences:** Expired-permit retry becomes a normal, expected flow in the offline queue -- not an error path.
- **Review trigger:** Real-world data from Phase 1 showing caregivers frequently hit the TTL limit before completing upload.

---

### AD-31 — Consent recordings use a separate signed-upload permit from visit media

- **Status:** Confirmed
- **Context:** AD-30 established the visit-media permit contract. Consent recordings are a distinct, more sensitive category (Doc 18 §22) with their own folder and lifecycle needs.
- **Decision:** A dedicated `POST /parents/:id/consent-permit` endpoint, separate folder scope, audio allowed as a first-class option (not just video).
- **Alternatives considered:** Reusing the visit-media permit with a different folder parameter — rejected, since it would blur the authorization boundary (visit-media permits check visit assignment; consent permits check parent-level first-visit caregiver assignment — these are related but distinct checks worth keeping in separate code paths).
- **Consequences:** A second permit-issuing endpoint to maintain, but clean separation of concerns.
- **Review trigger:** None anticipated.

---

### AD-32 — First-party Vercel API proxy for WebKit-safe refresh sessions

- **Status:** Confirmed; supersedes AD-27's single-host deployment topology while preserving its same-origin browser security goal.
- **Context:** The deployed portals live at `rozvisit-client.vercel.app` and the API at `rozvisit-api.onrender.com`. Direct cross-site refresh cookies were unreliable on iOS because every iOS browser uses WebKit and is subject to Intelligent Tracking Prevention. The application already used a memory-only access token and `Authorization: Bearer` for protected calls; only reload restoration depended on the cross-site cookie.
- **Decision:** Production clients call the relative `/api/v1` path. Vercel rewrites it to Render, making the role-scoped `HttpOnly; Secure; SameSite=Strict` refresh cookie first-party to the browser. Access tokens remain 15-minute, memory-only Bearer tokens. Registration remains sessionless until verification. No access-token cookie or browser-persistent JavaScript token storage is introduced.
- **Alternatives considered:** Store access or refresh tokens in local/session storage — rejected because XSS could read them. Continue direct cross-site refresh cookies — rejected because iOS WebKit does not provide reliable persistence. Move all frontend hosting back to Render — rejected because the current Vercel deployment is established and the proxy recovers the same-origin boundary without another migration.
- **Consequences:** Vercel becomes part of the API request path; its external rewrite passes upstream response headers, including `Set-Cookie`. The documented 120-second external-origin timeout exceeds the approximately 50-second Render cold start, but production monitoring must flag `ROUTER_EXTERNAL_TARGET_ERROR`. Direct browser calls to the Render origin are no longer the normal production path.
- **Review trigger:** Vercel stops forwarding required response headers, proxy cold starts approach its timeout, or RozVisit adopts a custom parent domain that makes the portal and API same-site without a proxy.
- **Implementation amendment (23 July 2026):** Public authentication screens do not initiate silent refresh. Only a direct load of a protected portal route performs the role-scoped bootstrap refresh. Access-token updates use a monotonic generation guard, preventing a slow pre-existing refresh (including one delayed by a Render cold start) from overwriting the token returned by a newer login or from undoing logout. This preserves the memory-only Bearer-token model while removing a WebKit-visible login race.

---

### AD-33 — Brevo HTTPS is the temporary pilot transactional-email provider

- **Status:** Confirmed
- **Context:** Resend's unverified-domain sandbox can deliver only to the account owner's verified recipient, so it cannot support real pilot registrations. Render also blocks outbound SMTP ports, making the retained Gmail transport non-viable on the active host. PR #19 reserves AD-32 for the first-party authentication proxy decision, so this decision uses AD-33.
- **Decision:** Send verification, password-reset, and product-notification email through Brevo's transactional HTTPS API without changing the `NotificationChannel` interface, templates, retry policy, or idempotency behavior. The sender remains configurable through `EMAIL_FROM_ADDRESS` and must be verified in Brevo. Resend configuration remains dormant as a future reference rather than an active fallback.
- **Alternatives considered:** Continue Resend sandbox — rejected because it cannot reach pilot users. Gmail SMTP — rejected on Render because both ports 465 and 587 time out. Hardcode the Brevo signup address — rejected because sender identity is deployment configuration and must not be committed.
- **Consequences:** Pilot users can receive transactional email at arbitrary real addresses, but deliverability may be weaker and messages may reach spam or junk until RozVisit owns and verifies a custom domain with SPF/DKIM. The UI explicitly asks users to check those folders.
- **Review trigger:** A RozVisit custom domain is available for authenticated sending, or Brevo's pilot delivery/reputation proves inadequate.

---

## ADR Maintenance

- **New ADRs are added** when a significant technical decision is made, in the same PR as the code that implements it.
- **Superseded ADRs** stay in the document with `Status: Superseded by AD-N` — nothing is deleted.
- **The ADR list is walked** at each phase-transition review to check for review triggers that have fired.
- **A decision that isn't captured here won't be understood in a year.** The register is a working document, not a compliance artifact.

---

*End of Document 29 — RozVisit Risk Register and Architecture Decision Records*
