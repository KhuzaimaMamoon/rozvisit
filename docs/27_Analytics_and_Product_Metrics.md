# RozVisit — Analytics, Events and Product Metrics
### Document 27

**Sources:** Documents 00–26, especially the strategy metrics (Doc 02 §15–16), the analytics event references in Doc 06, and the privacy posture (Doc 18 §30, Doc 19 §28, Doc 20 §26).
**Labels:** Everything here is confirmed unless marked *(Assumption)*, *(Recommendation)*, or *(Open)*.

**The one anchoring rule** of this document, restated up front because everything below serves it: **analytics never carry PII.** Names, emails, phone numbers, addresses, care notes, media contents — none of these ever appear in an event payload (Doc 18 §30). Internal user IDs are the only identifier that touches analytics, and even those are governed by the retention and consent rules in Sections 18–19.

---

## 1. Business Goals

The six objectives from Doc 03 §3, restated as the frame every metric must serve:

| # | Business objective | Owning phase |
|---|---|---|
| O-1 | Prove people will pay | Phase 0 |
| O-2 | Launch a working product | Phase 1 |
| O-3 | Make the service provably reliable | Phase 2+ |
| O-4 | Make revenue self-serve | Phase 4 |
| O-5 | Expand beyond the pilot city | Phase 6 |
| O-6 | Keep the business profitable by design | Always |

Every metric in this document maps to at least one of these. A metric that maps to none is a metric we do not track.

---

## 2. North-Star Metric

**Verified visits completed per week.** (Doc 02 §16.)

Why this one number: it only goes up when everything works at once — clients are paying (O-6), caregivers are showing up (O-3), proof is being captured (BR-011), and evidence is honest. Revenue follows it mechanically because visits are tied to paid plans. Quality is embedded in it because only on-time visits with proof count as verified. Every phase of the roadmap exists to raise this number or protect its quality.

**Definition (unambiguous):** a visit is "verified" if — and only if — its status is `completed` AND a finished checklist is attached AND at least one media file with `sourceFlag: "in_app_camera"` is attached (FR-045, SEC-012). Any other status does not count.

**Numerator:** count of `visit.completed` events with a `verified: true` flag in the week window.
**Denominator:** the week (calendar ISO week in the recipient's zone; the week we roll up in reporting).
**Sub-metric to watch alongside:** the on-time share of the numerator — the percentage completed within the SLA window (Section 8).

---

## 3. Acquisition Metrics

For clients (the payer) — because caregivers are recruited through a different, human channel:

| Metric | Definition | Why |
|---|---|---|
| Landing sessions per week | Distinct sessions loading `/` | Top-of-funnel signal |
| Register-CTA click rate | `landing.cta_register` ÷ `landing.viewed` | Landing effectiveness |
| Registration completion rate | `auth.signup_completed` ÷ `auth.signup_started` | Signup friction |
| Referral share | `landing.viewed` sessions with a referral parameter, ÷ total | Word-of-mouth (BR-030 signal) |
| Attribution channel *(Recommendation — a short `?src=` UTM parameter set on shared links)* | `landing.viewed` grouped by source | Which channels are working |

**Not tracked at MVP:** paid-ad conversion (no paid ads exist), search rank (no SEO effort at MVP), social-media impressions (no marketing spend).

## 4. Activation Metrics

Activation is *"the first moment the product delivers what the payer bought."* For RozVisit that is **the first verified visit completed on their parent's profile**.

| Metric | Definition | Why |
|---|---|---|
| Time to activation | Hours from `auth.signup_completed` to first `visit.completed` on this client's parent | The lower this is, the smoother the whole pipeline |
| Activation rate | Share of new clients activated within 14 days *(Recommendation window)* | The gate; a low number here means Phase 0 promises weren't kept |
| Parent-profile completion rate | Share of registered clients with `profile.parent_completed` within 24 h | Doc 03 O-1 support signal |
| Plan selection rate | `plan.selected` ÷ `profile.parent_completed` | Where clients think about money |
| Payment activation rate | `plan.activated` ÷ `plan.selected` | The manual-payment flow's real friction (Doc 05 C4) |
| First-visit scheduled rate | `visit.scheduled` (first) ÷ `plan.activated` | The gap between "paid" and "using" |

**Activation funnel (Section 11)** stitches these together.

## 5. Engagement Metrics

For clients:

| Metric | Definition | Why |
|---|---|---|
| Feed opens per client per week | Distinct `feed.opened` events per week | The heartbeat of the product |
| 24-hour feed-open rate after visit | Share of `visit.completed` where the owning client fires `feed.opened` within 24 h | North-star quality signal — proof is only proof if seen |
| Visits viewed per feed open | `feed.visit_viewed` ÷ `feed.opened` | Depth of engagement |
| Photo lightbox opens | `visit.photo_viewed` events | Do clients look at the proof? |
| Notification open rate | `notif.opened` ÷ `notif.sent` (in-app + push, per type) | Are our messages useful? |

For caregivers:

| Metric | Definition | Why |
|---|---|---|
| Today-list opens per assigned day | `visit.list_opened` events ÷ assigned days | Habit signal |
| Offline usage share | `visit.list_opened_offline` ÷ `visit.list_opened` | The Saima reality — how often is the offline flow the real flow? |
| Checklist completion time | Median seconds from `visit.list_opened` (visit tap) to `visit.checklist_completed` | The under-two-minute promise |

## 6. Retention Metrics

| Metric | Definition | Cadence |
|---|---|---|
| Client monthly retention | Share of paying clients whose subscription is still `active` at day 30 | Monthly |
| Cancellation reason distribution | Reasons recorded at `plan.cancelled` (a short chip list from S-17) | Monthly |
| Grace-to-recovery rate | Share of `plan.grace_entered` that reach `plan.activated` again before pause | Monthly |
| Caregiver retention (weekly) | Share of verified caregivers with ≥1 `visit.completed` in the week | Weekly |
| Client repeat-visit consistency | Share of active subscriptions with visits completed in ≥3 of the last 4 weeks | Monthly |

**Retention target:** 90%+ monthly client retention (Doc 02 §15) — labeled Assumption there, and remains an Assumption until Phase 0/1 gives real data. The number gets baselined, not assumed, from actuals.

## 7. Revenue Metrics

At MVP, revenue is simple, small, and manually captured (Doc 05 C4 payment flow):

| Metric | Definition | Cadence |
|---|---|---|
| Active subscriptions | Count of subscriptions in `state = active` | Continuous |
| MRR (monthly recurring revenue) | Sum of plan-snapshot prices across active subscriptions, converted to USD *(Recommendation — one reporting currency)* | Monthly |
| ARPU | MRR ÷ active subscriptions | Monthly |
| Currency mix | Share of MRR per currency (USD/GBP/AED/SAR) | Monthly |
| Plan mix | Share of active subscriptions per plan (Basic/Standard/Premium) | Monthly |
| Platform share per verified visit | Confirmed as 60–70% by design (Doc 03 §16); tracked as an operational check | Monthly |
| Errand revenue *(Phase 2)* | Sum of errand-completion fees | Monthly |
| CAC — cost of client acquisition | Ad and community-outreach spend ÷ new activated clients | Monthly (once spend exists) |

**Not tracked at MVP:** LTV projections (no basis without retention data), cohort revenue curves (same reason). Both are worth having once six months of data exist.

## 8. Operational Metrics

These are the numbers Nasreen looks at daily (Doc 05 A2):

| Metric | Definition | Target |
|---|---|---|
| On-time completion rate | Verified visits within SLA ÷ scheduled visits | ≥95% (Doc 02 §15, from Phase 2) |
| Proof attach rate | Verified visits ÷ completed visits | 100% by definition (a completed visit without proof does not exist — FR-045) |
| Missed-visit rate | Missed ÷ scheduled | ≤3% *(Recommendation baseline)* |
| Parent-declined rate | `parent_declined` ÷ scheduled | Watched, not targeted — a rising rate flags a bad onboarding conversation |
| Flag resolution time | Median hours from flag to resolve | *(Recommendation — set after 30 days of data)* |
| Backup coverage rate | Reassignments completed on time ÷ reassignments triggered | ≥95% |
| Case (dispute) response time | Median hours from `support.case_created` to first admin response | ≤24 h |

## 9. Reliability Metrics

Cross-references Doc 20 §27 and Doc 21 §30. The ones that surface in analytics:

| Metric | Definition | Target |
|---|---|---|
| API error rate | 5xx responses ÷ total requests | < 1% weekly; alert at 2% over 5 minutes (Doc 20 §27) |
| Programmer error rate | `InternalError` count | < 10/hour (Doc 20 §27) |
| Emergency deadline compliance *(Phase 2)* | Share of emergencies broadcast within 10 s | 100% (NFR-006) |
| Notification failure rate per type | `notif.failed` ÷ `notif.sent`, grouped | Any type persistently above 5% is a real signal |
| Media upload success rate | `visit.upload_completed` ÷ `visit.upload_queued` | ≥98% |
| Uptime | `/health` polls green ÷ total polls | Best-effort at MVP; 99.5% target from Phase 2 (Doc 07 §18) |

## 10. User Satisfaction Metrics

| Metric | Definition | Cadence |
|---|---|---|
| Caregiver rating (average) | Rolling average of `visit.rating` values | Monthly (Phase 2, BR-022) |
| Caregivers below rating threshold | Caregivers with average below 4.0 in the last 30 days | Monthly — feeds Nasreen's action list |
| Client NPS *(Recommendation — Phase 2 quarterly one-question survey)* | Standard NPS in a single non-nagging prompt | Quarterly |
| Complaint resolution satisfaction *(Recommendation)* | Simple "was this resolved?" prompt after case close | Per case |

**Not tracked at MVP:** repeated NPS pings, in-product prompt fatigue tests. The whole product's promise is calm, and analytics should not violate it.

---

## 11. Funnel Definitions

Two funnels matter at MVP.

### 11.1 The Activation Funnel (client)

The single most important funnel of the whole product. Every step is an analytics event; the drop-off between steps is the metric.

```
landing.viewed
      ↓
auth.signup_started
      ↓
auth.signup_completed
      ↓
auth.email_verified
      ↓
profile.parent_completed
      ↓
plan.selected
      ↓
plan.payment_link_sent          (admin action; still on this funnel because it's part of the paid promise)
      ↓
plan.activated
      ↓
visit.scheduled                 (first schedule)
      ↓
visit.completed (first)         ── activation ✓
```

**What we watch on this funnel:**
- Every drop > 40% between consecutive steps is a signal to investigate.
- Time between `plan.selected` and `plan.activated` is the friction Phase 4 automation will eventually remove — measure it from day one so the improvement is provable (Doc 05 C4).

### 11.2 The Caregiver Onboarding Funnel

```
auth.caregiver_applied
      ↓
admin.application_opened
      ↓
admin.caregiver_approved OR admin.caregiver_rejected
      ↓
first assignment (visit.assigned)
      ↓
first visit.completed
```

**What we watch:**
- Application-to-decision median time.
- Rejection reason distribution (from the admin decision note; anonymized in analytics).

---

## 12. Cohort Analysis

**At MVP:** cohorts are a spreadsheet exercise. No dedicated cohort tooling; the founder queries verified visits by client join-week from MongoDB monthly.

**The two cohorts that matter:**

1. **Client join-week cohort** — retention curve of activated clients by the week they joined. This is what tells us whether Phase 0's promises hold at 30, 60, 90 days.
2. **Caregiver approval-week cohort** — visits completed per caregiver per week from the week they were approved. Reveals whether caregiver quality (or their support) is drifting.

**At growth stage:** a lightweight cohort view is added to the admin dashboard (Phase 2 dashboard, S-34) — nothing fancy, a small table with per-cohort activation and retention curves.

---

## 13. Role-Specific Metrics

Which metrics matter to which persona.

| Role | Metrics they act on |
|---|---|
| Founder (product) | North-star, activation funnel, MRR, retention, caregiver ratings, cost |
| Nasreen (operations) | On-time rate, missed-visit rate, flag queue depth, dispute response time, caregiver coverage |
| Ayesha (client — indirectly, via product) | Not measured externally; her satisfaction is inferred from feed opens and retention |
| Bilal (caregiver) | His own earnings and rating (shown in S-25/S-26); not metrics he sets, but ones he sees |

Nasreen's ops dashboard (Phase 2, S-34) surfaces the second row of this table. The founder's dashboard (Section 14) surfaces the first.

---

## 14. Dashboard Recommendations

Two dashboards, one at MVP, one at Phase 2.

### 14.1 Founder Dashboard (MVP, S-27 lite)

A simple admin surface, no charts, just the numbers that matter this week:

- North-star: **verified visits this week** (vs last week).
- Active subscriptions and MRR in USD.
- New client activations this week.
- Caregiver approvals pending.
- Open flags.
- API error rate (last 24 h).

Rendered as CountCards (Doc 15 §36), plain and calm.

### 14.2 Operations Dashboard (Phase 2, S-34)

Adds the working surfaces Nasreen lives in:

- SLA flag list (work-the-flags, not tables — FR-084).
- Missed-visit and parent-declined rates for the week.
- Dispute queue depth.
- Caregiver rating distribution and low-rating caregivers.
- Emergency deadline compliance (NFR-006).
- Notification failure surface.

### 14.3 Not built

Marketing-attribution dashboards, revenue-projection charts, forecast tools. All are premature at MVP volume; genuinely useful only when there's enough data to compute them, which is Phase 2+.

---

## 15. Event Naming Convention

**Format: `area.action`** — the pattern already used in Doc 06 (US-x §Analytics) and Doc 20 §29. Both parts are lowercase snake or plain lowercase. Areas match the eight confirmed modules (Doc 14): `auth`, `profile`, `plan`, `visit`, `errand` (Phase 2), `emergency` (Phase 2), `admin`, `notif`, plus product-shell areas `landing`, `feed`, `consent`, `support`, `system`.

**Actions are past-tense facts** — the thing happened. `auth.signup_completed`, not `signup_complete_now`. This keeps semantics unambiguous for aggregation.

**Anti-patterns explicitly banned:**
- No feature-flag names in event names — those change; events must not.
- No environment names in event names — `dev`, `staging`, `prod` are properties (Section 16), not names.
- No PII in event names — a name like `visit.completed_by_bilal` is instantly wrong.

---

## 16. Event Properties

Every event carries a standard envelope of properties, plus event-specific ones. The envelope is small and every field justifies itself:

**Envelope:**

```json
{
  "event": "visit.completed",
  "occurredAt": "2026-07-21T05:31:12Z",
  "environment": "production",
  "correlationId": "req_2026-07-21_a3b7c9d1",
  "userId": "662f00a1b2c3d4e5f6a7b8c9",
  "role": "caregiver",
  "sessionId": "sess_e9d8c7b6"
}
```

- `correlationId` — the tracing thread across logs, error responses, and audit events (Doc 20 §26).
- `userId` — internal ObjectId only; **never** an email, name, or phone.
- `role` — for role-cohort slicing.
- `sessionId` — a short random per-browser-session id; **not** a persistent user identifier; cleared on tab close.
- `environment` — so pilot data can be filtered out of production analytics.

**Event-specific properties** are added per event and listed in the catalogue (Section 20). The rule: every property named must be non-PII and must map to a metric or a legitimate diagnostic need.

---

## 17. Privacy Rules

Non-negotiable, tied to the confirmed posture (Doc 18 §30, Doc 19 §28):

1. **No PII in event payloads.** Names, emails, phones, addresses, care notes, media contents, CNIC data — never.
2. **Internal IDs only.** `userId` is the ObjectId; `parentId` and similar internal IDs are opaque tokens. If they were exposed publicly they would still not identify anyone.
3. **No free-text in events.** Even non-PII-looking text (a note, a rating comment) can leak. Ratings appear as numeric buckets; concerns appear as pre-defined chip ids, never free text.
4. **Location precision is coarse.** A parent's city (from `countryCode` derivation) is fine; the exact GPS coordinates are never in an analytics event.
5. **Aggregation is the answer to "we want to see more."** Instead of finer-grained events, look at aggregated dashboards.
6. **The analytics tool used at MVP is the database itself.** No third-party analytics provider at MVP — the founder queries MongoDB. This means the privacy rules above are enforced at the point of query, and no third-party ever sees the data. Section 21 covers what changes when a real analytics tool joins.

---

## 18. Consent

- The privacy policy (PRV-001) states plainly that we collect usage data for the purpose of improving the product; the language is warm and specific (Doc 03 §18).
- **No cookie banner at MVP.** RozVisit uses only one cookie — the refresh cookie — which is a strictly-necessary functional cookie and therefore doesn't require the banner under standard privacy law. This is the honest reason, not a shortcut.
- **No third-party trackers, no marketing pixels, no session replay tools.** Doc 19 §5 already commits to no email tracking pixels — this document extends the rule to the whole product surface.
- **When a third-party analytics tool joins** (post-MVP), the consent posture becomes a real decision — a lightweight banner and a default-decline choice, plus a data-processor addendum in the privacy policy.

---

## 19. Data Retention

Analytics data lives in MongoDB at MVP (a small `analyticsEvents` collection, or as query-time aggregations from other collections — decided at build *(Recommendation — aggregate from operational collections where the event is derivable; store only synthetic events like `landing.viewed` that have no operational record)*).

| Data class | Retention |
|---|---|
| Analytics events (synthetic — from client) | 24 months *(Recommendation)* |
| Analytics rollups (weekly counts) | Kept indefinitely — they are aggregates, not personal |
| Deleted-user events | Anonymized when the DATA-007 path runs (Doc 18 §33) — the userId is scrubbed; the fact remains |

The analytics collection is subject to the same field-level retention discipline as everything else (Doc 21 §32).

---

## 20. MVP Analytics — The Event Catalogue

The full catalogue. Groupings match Section 15's areas.

**Legend:** ✓ MVP · ○ Phase 2+.

### Landing

| Event | When | Properties (beyond envelope) | Phase |
|---|---|---|---|
| `landing.viewed` | Landing page renders | `{ referral, src }` | ✓ |
| `landing.cta_register` | Register CTA tapped | — | ✓ |
| `landing.cta_apply` | Caregiver CTA tapped | — | ✓ |
| `landing.cta_login` | Login link tapped | — | ✓ |
| `policy.viewed` | Privacy or Terms opens | `{ page: "privacy" | "terms" }` | ✓ |

### Auth (client)

| Event | When | Properties | Phase |
|---|---|---|---|
| `auth.signup_started` | Register form loaded | — | ✓ |
| `auth.signup_completed` | 201 from `/auth/register` | `{ countryCode }` | ✓ |
| `auth.email_verified` | Email link clicked and confirmed | — | ✓ |
| `auth.login_succeeded` | Login success | `{ role }` | ✓ |
| `auth.login_failed` | Login failure | `{ reason: "credentials" | "verify_email_first" | "disabled" | "rate_limited" }` | ✓ |
| `auth.reset_requested` | Forgot form submitted | — | ✓ |
| `auth.reset_completed` | Reset link used | — | ✓ |

### Auth (caregiver)

| Event | When | Properties | Phase |
|---|---|---|---|
| `auth.caregiver_applied` | Apply form submitted | `{ area }` (city-level only) | ✓ |
| `auth.caregiver_verified` | Application approved | — | ✓ |

### Profile

| Event | When | Properties | Phase |
|---|---|---|---|
| `profile.parent_created` | Parent profile created (may be draft) | — | ✓ |
| `profile.parent_completed` | Profile saved with all required fields | — | ✓ |
| `consent.given` | First-visit consent recorded — given | — | ✓ |
| `consent.declined` | First-visit consent recorded — declined | — | ✓ |
| `consent.withdrawn` | Withdrawal action | `{ initiator: "client" | "admin" }` | ✓ |

### Plans / Subscription

| Event | When | Properties | Phase |
|---|---|---|---|
| `plan.viewed` | Plan-selection screen loaded | `{ currency }` | ✓ |
| `plan.selected` | Plan chosen | `{ planKey, currency }` | ✓ |
| `plan.payment_link_sent` | Admin marks link_sent | — | ✓ |
| `plan.activated` | Admin marks active | — | ✓ |
| `plan.grace_entered` | State machine moves to grace | — | ✓ |
| `plan.paused` | Grace expires without renewal | — | ✓ |
| `plan.cancel_started` | Client opens cancel confirmation | — | ✓ |
| `plan.cancelled` | Cancel confirmed | `{ reason }` (from chip list) | ✓ |
| `plan.reactivated` | Reactivation after cancellation | — | ✓ |

### Visits (client-side)

| Event | When | Properties | Phase |
|---|---|---|---|
| `visit.scheduled` | Schedule saved | `{ slotsCount }` | ✓ |
| `visit.allowance_blocked` | Attempt exceeded allowance | `{ planKey }` | ✓ |
| `visit.rescheduled` | Reschedule saved | — | ✓ |
| `visit.cancelled_before_cutoff` | Cancel before cutoff | — | ✓ |
| `visit.cancelled_after_cutoff` | Cancel after cutoff | — | ✓ |
| `feed.opened` | Feed screen rendered | — | ✓ |
| `feed.visit_viewed` | Visit card opened to detail | `{ status }` | ✓ |
| `visit.photo_viewed` | Photo lightbox opened | — | ✓ |

*Cutoff hours come from `CANCEL_CUTOFF_HOURS` in `constants.js` (Doc 10 §20). The current value is a *(Recommendation)* until founder approval; when the value changes, the two events remain the same but the boundary they measure moves — no analytics-schema change is needed.*

### Visits (caregiver-side)

| Event | When | Properties | Phase |
|---|---|---|---|
| `visit.list_opened` | Today screen loaded (online) | — | ✓ |
| `visit.list_opened_offline` | Today screen loaded from cache | — | ✓ |
| `visit.checklist_completed` | Checklist step complete | — | ✓ |
| `visit.photo_captured` | Camera capture confirmed | — | ✓ |
| `visit.upload_queued` | Photo queued for upload | — | ✓ |
| `visit.upload_completed` | Photo upload confirmed by server | — | ✓ |
| `visit.upload_flagged` | Upload past the 24 h window | — | ✓ |
| `visit.completed` | Visit closed | `{ verified: true, offline: bool }` | ✓ |
| `visit.completed_offline` | Visit synced from offline queue | — | ✓ |
| `visit.parent_declined` | Parent declined path | — | ✓ |

### Admin

| Event | When | Properties | Phase |
|---|---|---|---|
| `admin.overview_viewed` | Admin home loaded | — | ✓ |
| `admin.application_opened` | Application detail opened | — | ✓ |
| `admin.caregiver_approved` | Approval decision | — | ✓ |
| `admin.caregiver_rejected` | Rejection decision | — | ✓ |
| `admin.visit_assigned` | Assignment saved | `{ continuity: bool }` (was previous caregiver suggested?) | ✓ |
| `admin.visit_reassigned` | Reassignment saved | — | ✓ |
| `admin.visit_reviewed` | Visit detail opened by admin | — | ✓ |
| `admin.flag_resolved` | Flag resolved with note | — | ✓ |
| `admin.subscription_state_changed` | Subscription state action | `{ to }` | ✓ |

### Notifications

| Event | When | Properties | Phase |
|---|---|---|---|
| `notif.sent` | Delivery attempted | `{ type, channel }` | ✓ |
| `notif.opened` | In-app notification opened | `{ type }` | ✓ |
| `notif.failed` | Give-up on a channel | `{ type, channel, reason }` | ✓ |

### Support

| Event | When | Properties | Phase |
|---|---|---|---|
| `support.case_created` | Client opens a report | `{ problemType }` (from chip list) | ✓ |
| `support.case_resolved` | Admin closes the case | `{ outcome }` | ○ (Phase 2 formalization) |

### System

| Event | When | Properties | Phase |
|---|---|---|---|
| `system.404` | Catch-all reached | `{ attemptedPath }` | ✓ |
| `system.error_boundary_shown` | React error boundary caught | — | ✓ |

### Errands (Phase 2)

| Event | When | Properties | Phase |
|---|---|---|---|
| `errand.requested` | Client requests | `{ type }` | ○ |
| `errand.over_limit_approved` | Client approves over-limit purchase | — | ○ |
| `errand.completed` | Caregiver marks complete | — | ○ |
| `errand.receipt_flagged` | Receipt unreadable, retake asked | — | ○ |

### Emergency (Phase 2)

| Event | When | Properties | Phase |
|---|---|---|---|
| `emergency.raised` | Caregiver or client raises alarm | `{ raisedByRole }` | ○ |
| `emergency.broadcast_sent` | Broadcast fan-out fired | — | ○ |
| `emergency.channel_delivered` | Per-channel delivery confirmed | `{ channel }` | ○ |
| `emergency.escalated_to_contact` | Escalation reaches next contact | — | ○ |
| `emergency.acked` | Recipient acknowledged | `{ byRole }` | ○ |
| `emergency.resolved` | Admin closes | — | ○ |

### Ratings (Phase 2)

| Event | When | Properties | Phase |
|---|---|---|---|
| `visit.rating` | Rating submitted | `{ score: 1–5 }` (no free-text comment in analytics) | ○ |

---

## 21. Future Analytics

Post-MVP, when a third-party analytics tool joins, the choice should meet three tests:
1. **Data residency** — either hosted where our privacy posture allows (D-11 region) or explicitly acceptable under the privacy policy at that point.
2. **No third-party tracking beyond our own data** — no ad networks, no user-graph enrichment, no session replay by default.
3. **Simple to remove** — the event dispatch is behind a small `analytics.js` wrapper (recommended abstraction from build); switching or removing tools is a wrapper change, not a codebase change.

**Candidates worth evaluating** *(Recommendation — chosen at that moment)*: PostHog (self-hostable), Plausible (privacy-first), a small Grafana + database rollup for internal use. Any of them satisfies the tests better than the big-name analytics platforms.

---

## 22. Experiments

**At MVP: no experiments.** The pilot is too small for statistical significance, and the calm-product promise (Doc 15 §1) forbids the flicker of variants a naive experiment framework introduces.

**When experiments become useful** (Phase 3+ when the user base can produce meaningful cohorts):
- Feature-flag driven, at the API level so the client renders one variant per session.
- Confidence-interval reporting; nothing "declared a winner" on a 5-user sample.
- Never experiments on the emergency path, on consent flow, or on billing state machines — the safety-critical paths.

## 23. Alert Thresholds

Cross-references Doc 20 §27 and Doc 21 §30. The analytics-side thresholds:

| Signal | Threshold | Action |
|---|---|---|
| 24 h feed-open rate after visit | drops below 60% | Investigate: are notifications reaching clients? |
| Registration-to-verification | > 40% drop | Investigate email deliverability |
| `plan.selected → plan.activated` | > 48 h median | Payment operations attention |
| Missed-visit rate | > 5% weekly | Nasreen investigates caregiver coverage |
| Caregiver rating | falls below 4.5 average | Individual caregiver review; possibly recruitment issue |
| Notification failure rate | > 5% of a type | Investigate provider or template |
| Emergency deadline (Phase 2) | any breach of 10 s | Loud alert to incident owner (Doc 20 §27) |

Every threshold above is a signal to look, not a rule to react automatically. The founder or the incident owner decides.

---

*End of Document 27 — RozVisit Analytics, Events and Product Metrics*
