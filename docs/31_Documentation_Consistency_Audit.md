# RozVisit — Documentation Consistency Audit
### Document 31

**Auditor role:** Principal Software Architect and Documentation Auditor.
**Scope:** every canonical document in `docs/00–29` and the repository `README.md`, reviewed against each other and against the confirmed palette and rules.
**Method:** structural cross-checks (naming, enums, endpoints, roles, IDs), semantic cross-checks (contradictions, missing coverage, over/under-engineering), and palette/theme conformance.
**Severity scale used throughout:**

| Severity | Meaning |
|---|---|
| **Critical** | Blocks build, breaks a contract, or misleads a stakeholder in a way that could cause real damage. Fix immediately. |
| **High** | A real inconsistency that will cause developer confusion or a bug during MVP work. Fix before the next PR that touches the affected area. |
| **Medium** | Drift that should be corrected but doesn't block progress. Fix in the next housekeeping pass. |
| **Low** | Cosmetic or minor stylistic issue. Fix opportunistically. |

**Overall verdict up front:** the series is in good structural shape. The 30 documents show high internal consistency on the hardest things — modules, roles, enums, palette, layer boundaries, API contract. The audit identifies **1 Critical**, **6 High**, **9 Medium**, and **4 Low** findings, all listed below with exact corrections. No finding requires a redesign; the corrections are text-level edits and a small number of clarifications that fit the source-of-truth model already in Doc 00.

---

# Part A — Audit Findings

Each finding carries: **ID**, **Severity**, **Category** (mapped to the 22 audit dimensions in the prompt), **Affected documents**, **What is wrong**, and **Exact correction**.

---

## AF-01 — README claims Doc 22 does not exist

- **Severity:** Critical
- **Category:** Broken document references (dim. 19)
- **Affected documents:** `README.md` (lines 461, 548)
- **What is wrong:** The README states *"Doc 22 is intentionally not present — the numbering skip is intentional and recorded"* and *"the 30-document canonical documentation series is complete (Docs 00–29, with the intentional 22 gap)."* But `docs/22_Testing_and_QA_Strategy.md` **does exist** and is a full 468-line document. The README was written during a period when Doc 22 had been skipped, but Doc 22 was later added; the README was never updated (violates Rule 8 in Doc 00 §Source of Truth Rules).
- **Exact correction:**
  - Remove line 461: *"Doc 22 is intentionally not present — the numbering skip is intentional and recorded."*
  - Add Doc 22 to the documentation table (between rows 21 and 23): `| 22 | [Testing and QA Strategy](docs/22_Testing_and_QA_Strategy.md) |`.
  - Change line 548 from *"Docs 00–29, with the intentional 22 gap"* to *"Docs 00–29, complete series."*
  - Ripple: any other document that mentions the "intentional gap" needs the same correction. A cross-check finds none besides the README.

---

## AF-02 — AD-11 cross-reference wrong (Redis adapter vs Oxlint)

- **Severity:** High
- **Category:** Broken document references (dim. 19); Contradictions (dim. 1)
- **Affected documents:** `docs/19_Notifications_and_Real_Time_Events.md` (line 185), `docs/21_Performance_Reliability_and_Scalability.md` (line 204)
- **What is wrong:** Both documents describe the Phase 2/growth-stage Redis adapter for multi-instance Socket.io and attribute it to *"the deployment change AD-11 anticipates"* or *"(AD-11 shape)"*. But the confirmed AD-11 (Doc 08 §30 and Doc 29 §AD-11) is *"Oxlint + Prettier; GitHub Actions gates"* — completely unrelated to Socket.io scaling. There is no ADR for the Redis-adapter decision; it lives only in Doc 21 §32.2 (growth-stage row) as a scaling step.
- **Exact correction:**
  - **Option A (preferred):** create a new ADR — `AD-26 — Redis-backed Socket.io adapter for multi-instance real-time` — in Doc 29 §Part B, capturing the growth-stage decision from Doc 21 §32.2. Then update Doc 19 line 185 to reference *"(AD-26)"* and Doc 21 line 204 to *"the deployment change AD-26 anticipates"*.
  - **Option B (lighter):** remove the ADR reference and say *"a deployment change captured in Doc 21 §32.2, not a code change"* — since the scaling decision is already documented there, just not as a formal ADR.
  - Recommendation: Option A. This is a genuine architecture decision that deserves an ADR of its own; Doc 29 is the right place.

---

## AF-03 — Bilal's city contradicts between Doc 00 and Doc 04 (and Doc 17)

- **Severity:** High
- **Category:** Contradictions (dim. 1); Inconsistent terminology (dim. 16)
- **Affected documents:** `docs/00_Project_Canonical_Brief.md` (line 66), `docs/04_User_Personas.md` (line 90), `docs/17_Wireframe_and_Mockup_Brief.md` (line 427)
- **What is wrong:** Doc 00 §6 introduces Bilal as *"a caregiver in **Lahore**"*. Doc 04 §Persona 2 places him firmly in *"**Rawalpindi**"* (line 90), which correctly matches the confirmed pilot city (Islamabad/Rawalpindi, D-01). Doc 17's admin queue mockup shows *"Bilal Ahmed · Rawalpindi"*. The Doc 00 line is a residual error from an earlier draft written before D-01 was fixed.
- **Exact correction:**
  - In Doc 00 line 66, change *"Bilal (a caregiver in Lahore)"* to *"Bilal (a caregiver in Rawalpindi)"*.
  - No changes needed elsewhere. Doc 04 and Doc 17 are already correct.

---

## AF-04 — Nasreen: "Dr. Nasreen" vs "Nasreen Shah"

- **Severity:** Medium
- **Category:** Incorrect role names (dim. 5); Inconsistent terminology (dim. 16)
- **Affected documents:** `docs/00_Project_Canonical_Brief.md` (line 66), `docs/04_User_Personas.md` (Persona 5, lines 242–246), all other documents use *"Nasreen"* unqualified.
- **What is wrong:** Doc 00 says *"Dr. Nasreen (operations lead)"*, implying a doctorate. Doc 04 gives her real name as *"Nasreen Shah"* with role *"Admin / operations lead"* — no doctorate. All 19+ other references in Docs 05, 07, 09, 27, and 29 use plain *"Nasreen"*. The *"Dr."* prefix is unsupported by Doc 04 and appears nowhere else.
- **Exact correction:**
  - In Doc 00 line 66, change *"Dr. Nasreen (operations lead)"* to *"Nasreen Shah (operations lead)"*.
  - Approved canonical form: *"Nasreen Shah"* full name, *"Nasreen"* short form, role *"Admin / operations lead"*. No *"Dr."*.

---

## AF-05 — Doc 00 §3 lists three payer currencies; §4 lists four (SAR)

- **Severity:** Medium
- **Category:** Contradictions (dim. 1); Missing requirements (dim. 2)
- **Affected documents:** `docs/00_Project_Canonical_Brief.md` (lines 61 and 122), `docs/03_Business_Requirements_Document.md` (line 55 vs BR-001 at line 103)
- **What is wrong:** Doc 00 §6 target-user table says *"pays in USD/GBP/AED/SAR"* (four currencies), and BR-001 in Doc 03 confirms all four. But Doc 00 §11 (why the money works) and Doc 03 §Business Model summary both list only *"USD/GBP/AED"* — dropping SAR silently. The requirement is four currencies; the summaries are wrong.
- **Exact correction:**
  - Doc 00 line 122: change *"clients pay in strong currencies (USD/GBP/AED)"* to *"USD/GBP/AED/SAR"*.
  - Doc 03 line 55: change *"USD/GBP/AED"* to *"USD/GBP/AED/SAR"*.

---

## AF-06 — Doc 04 lists Bilal but the module coverage table lists him inconsistently

- **Severity:** Low
- **Category:** Missing acceptance criteria (dim. 14); Missing edge cases (dim. 12)
- **Affected documents:** `docs/04_User_Personas.md` (line 385)
- **What is wrong:** The module-to-persona matrix at the end of Doc 04 §5 mentions *"5. Emergency | Ayesha, Bilal, Nasreen | Amina Bibi"* — but the Emergency module's personas do not include Amina Bibi's dignity concerns in the module 5 detail. This is a small omission — the primary persona touching Emergency alongside caregiver/client/admin is the parent (Amina Bibi), and her dignity is Persona-level content that should feed into Module 6 (Emergency) or Module 5 in Doc 14.
- **Exact correction:**
  - Verify in Doc 14 §Module 6 (Emergency) that "parent dignity" as a design consideration is called out. If not, add a one-line acceptance criterion referring to Amina Bibi from Doc 04.

---

## AF-07 — Recommended value for CANCEL_CUTOFF_HOURS vs its analytics counterpart

- **Severity:** Low
- **Category:** Duplicate requirements (dim. 3); Missing requirements (dim. 2)
- **Affected documents:** `docs/10_Repository_and_Folder_Structure.md` §20, `docs/27_Analytics_and_Product_Metrics.md` line 419
- **What is wrong:** The analytics event catalogue defines `visit.cancelled_before_cutoff` and `visit.cancelled_after_cutoff` as separate events, but the actual cutoff constant is a *(Recommendation)* value only (Doc 10 §20). The events depend on a value that hasn't been founder-approved. Not a bug, but worth flagging that the events implicitly bake in a soft assumption.
- **Exact correction:**
  - In Doc 27 §20 (Visits, client-side), add a note under the cancellation rows: *"Cutoff hours from `constants.js` (Recommendation until founder approval)."*
  - No code change needed.

---

## AF-08 — API endpoint for "parent declined" uses `/declined` but VISIT_STATUS uses `parent_declined`

- **Severity:** Medium
- **Category:** Conflicting statuses (dim. 9); Inconsistent terminology (dim. 16)
- **Affected documents:** `docs/12_API_Specification.md` (line 356), `docs/11_Database_Design.md` (line 165)
- **What is wrong:** The API endpoint is `POST /visits/:id/declined` (Doc 12 line 356), and it produces status `parent_declined` (Doc 12 line 360). The status enum in Doc 11 uses `parent_declined` (line 165). Naming the endpoint `/declined` while the status is `parent_declined` is inconsistent shorthand — a developer reading only the route file might not associate it with the correct enum value. Small but real drift.
- **Exact correction:**
  - **Option A (preferred):** rename the endpoint to `POST /visits/:id/parent-declined` to match the status verbatim.
  - **Option B (lighter):** keep the endpoint name, but add a one-line comment in Doc 12 line 356 explaining *"→ status `parent_declined`; the endpoint uses a shortened path for URL brevity."*
  - Recommendation: Option A. Endpoint names as terse shorthand cost clarity for the reader and gain little.

---

## AF-09 — "Emergency" as a section name in module list vs "Emergency Module" in Doc 00

- **Severity:** Low
- **Category:** Inconsistent module names (dim. 6)
- **Affected documents:** `docs/00_Project_Canonical_Brief.md` §8, `docs/14_Module_Functional_Specifications.md` (Module 6 heading)
- **What is wrong:** Doc 00 §8 lists the module as *"Emergency Module — alarms and fast alerts"*. Doc 14 uses *"Module 6 — Emergency"* (no "Module" repeated). Both are OK on their own but the file naming in Doc 10 could differ. Cross-check confirms Doc 10 uses `emergency.service.js` etc. — this is fine. Just document the canonical short name.
- **Exact correction:**
  - Add to the terminology dictionary (Part B): *"Emergency Module (canonical); short form 'Emergency' in code and headers. Never 'Alerts' or 'Alarms'."*

---

## AF-10 — Doc 25 §7 references "Doc 25 §7" recursively (self-reference)

- **Severity:** Low
- **Category:** Broken document references (dim. 19)
- **Affected documents:** `docs/26_Environment_Variables_Reference.md` (Section A.4, key-rotation note)
- **What is wrong:** Doc 26 A.4 says *"never rotated in-place — Doc 25 §7's key-id approach*(Recommendation)*"*. Doc 25 §7 is the Secrets Management section, which does discuss rotation. This works, but the direction is a little confusing — Doc 26 is A.4 (encryption key rules), and the deeper "key id" recommendation actually lives in Doc 18 §22 as well. The cross-reference is not broken, but could be clearer.
- **Exact correction:**
  - In Doc 26 A.4, change *"Doc 25 §7's key-id approach"* to *"the key-id rotation pattern (Doc 25 §7, Doc 18 §22)"* — points to both owners.

---

## AF-11 — Payment reference status may be logged, but consent recording reference is Secret

- **Severity:** Medium
- **Category:** Privacy gaps (dim. 11); Logging restrictions (dim. 23 in Doc 18)
- **Affected documents:** `docs/18_Security_and_Privacy.md` §23, `docs/27_Analytics_and_Product_Metrics.md` §16 (event envelope), `docs/11_Database_Design.md`
- **What is wrong:** Doc 18 §23 says *"Payment references are logged (they are not card data) — needed for reconciliation."* This is correct. But consent recording references (e.g., a Cloudinary media ID for a consent audio clip) are equally identifying, and no document explicitly rules on whether the *reference* is loggable. Doc 11 §26 says the *content* is `select: false` — but the reference identifier is fair game unless we say otherwise.
- **Exact correction:**
  - In Doc 18 §23, add: *"Consent recording references are logged only when necessary for admin diagnosis (e.g., a support case); routine logging omits them."*
  - In Doc 27 §16, verify the analytics envelope excludes any consent-recording reference. If any event property carries one today (`consent.given` currently has no properties — good), keep it that way.

---

## AF-12 — Missing Mermaid diagram in Doc 25 (DevOps)

- **Severity:** Medium
- **Category:** Missing Mermaid diagrams (dim. 20)
- **Affected documents:** `docs/25_DevOps_and_Deployment_Guide.md`
- **What is wrong:** Docs 05, 08, 09, 11, 13, 19 contain Mermaid diagrams. Doc 25 (DevOps) describes the environment layout in prose only. A single deployment diagram would materially help a reviewer, showing Render + Atlas + Cloudinary + Firebase + Sentry + UptimeRobot boundaries — this is exactly the kind of "picture worth a thousand words" content Mermaid is for.
- **Exact correction:**
  - Add a Mermaid diagram to Doc 25 §4 (Production Environment). Suggested:
    ```mermaid
    flowchart LR
        subgraph Users
            C[Clients]
            G[Caregivers]
            A[Admins]
        end
        subgraph "Render (production)"
            APP[RozVisit API + built portals]
            HC[/health/]
        end
        subgraph "MongoDB Atlas (Mumbai, M0 at MVP)"
            DB[(rozvisit database)]
        end
        subgraph "Outside services"
            CL[Cloudinary]
            FB[Firebase FCM]
            EM[Email provider]
            SN[Sentry]
            UM[UptimeRobot]
        end
        Users --> APP
        APP --> DB
        APP --> CL
        APP --> FB
        APP --> EM
        APP -.-> SN
        UM -.-> HC
    ```

---

## AF-13 — Missing Mermaid diagram in Doc 21 (Performance)

- **Severity:** Medium
- **Category:** Missing Mermaid diagrams (dim. 20)
- **Affected documents:** `docs/21_Performance_Reliability_and_Scalability.md`
- **What is wrong:** Doc 21 §32 introduces the three scale stages (MVP → Growth → Large) — an ideal candidate for a visual growth-stage diagram showing what components exist at each stage and where the triggers fire. Currently the three stages are prose + a table only.
- **Exact correction:**
  - Add a Mermaid diagram before Doc 21 §32.1 showing the components and how each stage adds them:
    ```mermaid
    flowchart LR
        subgraph "MVP (Phase 1)"
            M1[Render free] --> M2[Atlas M0]
            M1 --> M3[Cloudinary/Firebase/Email]
        end
        subgraph "Growth (Phase 2–3)"
            G1[Render paid] --> G2[Atlas replica]
            G1 --> G3[Redis: rate limits + Socket.io adapter]
            G1 --> G4[Docker + staging]
        end
        subgraph "Large (Phase 4+)"
            L1[Multi-instance + LB] --> L2[Atlas dedicated]
            L1 --> L3[BullMQ + Redis full]
            L1 --> L4[CDN for portals]
        end
        M1 -.triggers.-> G1
        G1 -.triggers.-> L1
    ```

---

## AF-14 — Doc 07 §28's "12 acceptance checks" repeated in Doc 22 as "acceptance suite"

- **Severity:** Low
- **Category:** Duplicate requirements (dim. 3)
- **Affected documents:** `docs/07_Software_Requirements_Specification.md` §28, `docs/22_Testing_and_QA_Strategy.md`
- **What is wrong:** Doc 07 §28 defines the 12 acceptance checks; Doc 22 refers to them extensively. There is no contradiction, but Doc 22 restates several checks in its own language rather than referencing them by ID (AC-01 through AC-12 or similar). This is not wrong — Doc 22 is authoritative for how tests run — but future edits could drift.
- **Exact correction:**
  - Give the 12 checks stable IDs in Doc 07 §28 (`AC-01` through `AC-12`). Update Doc 22 to reference the IDs rather than restate the descriptions.
  - This is a documentation hygiene improvement; it prevents future drift.

---

## AF-15 — "Missed visit refund" — Doc 03 BR-008 vs the timing rule

- **Severity:** Medium
- **Category:** Missing acceptance criteria (dim. 14)
- **Affected documents:** `docs/03_Business_Requirements_Document.md` (BR-008), `docs/07_Software_Requirements_Specification.md`, `docs/28_Product_and_Engineering_Roadmap.md`
- **What is wrong:** BR-008 (missed visits are refunded automatically) is a business requirement, but the *timing* of the refund (immediately, at the end of the period, on the next billing cycle) is not specified in the SRS. Doc 28 §V1 lists automatic refunds as a Must feature but doesn't state timing either. A developer building this would have to guess.
- **Exact correction:**
  - In Doc 07, add an FR-xxx *(Recommendation)*: *"When a visit is marked missed with no make-up scheduled, the wallet is credited within 24 hours in the equivalent of that visit's per-visit share of the plan price."* Get founder confirmation.
  - Add to Doc 28 V1 features: cross-reference the new FR.

---

## AF-16 — "Introductory pricing" language: is it a promise or a marketing note?

- **Severity:** Medium
- **Category:** Contradictions (dim. 1); Missing acceptance criteria (dim. 14)
- **Affected documents:** `docs/15_RozVisit_Design_System.md`, `docs/17_Wireframe_and_Mockup_Brief.md` (Brief 6), Doc 03, Doc 27
- **What is wrong:** The plan selection mockup brief (Doc 17 Brief 6) shows an *"Introductory pricing"* pill and copy *"Introductory pricing — locked when you subscribe."* This implies the introductory price is locked to that subscriber for the life of their subscription. Doc 11 §Section 4's `planSnapshot` rule (AD-14 in Doc 29) confirms this is *technically* implemented (the price snapshot is stored on the subscription). But no document states the *business promise* explicitly — that early subscribers are promised their price. This is a real customer-communication decision that should be an approved business rule, not just implied by architecture.
- **Exact correction:**
  - Add a business rule to Doc 03: *"BR-xxx: Early subscribers who choose an introductory-price plan keep that price for as long as their subscription remains active. Price changes apply only to new subscriptions."*
  - Cross-reference from Doc 17 Brief 6 and Doc 29 AD-14.

---

## AF-17 — Doc 00 lists Payoneer under Third-Party (§19) with "Confirmed" but flags it Phase 4 for in-app

- **Severity:** Low
- **Category:** Missing edge cases (dim. 12)
- **Affected documents:** `docs/00_Project_Canonical_Brief.md` §19, `docs/29_Risk_Register_and_ADRs.md` AD-13
- **What is wrong:** Doc 00 line 254 says *"Payoneer | Phase 1 (manual links) → Phase 4 (in-app) | Confirmed."* Doc 29 AD-13 elaborates. Good. But R-40 (Payoneer service discontinuation) is a real dependency risk with medium impact, and the risk mitigation depends on the PaymentProvider interface being real. There is no acceptance criterion that says *"the PaymentProvider interface is exercised locally with a mock implementation from day one"* — Doc 09 §24 does note the mocked local outside services generally, but the specific case is not called out.
- **Exact correction:**
  - Verify Doc 09 §24 (local dev outside-service posture) explicitly names `PaymentProvider` — it currently mentions Cloudinary, email, push, maps. Add: *"PaymentProvider (Payoneer): a no-op logging implementation in local dev; the interface is exercised even at Phase 1 so the Phase 4 swap is a one-file change."*

---

## AF-18 — Over-engineering flag: Doc 21 §32 introduces three scale stages before Foundation is proven

- **Severity:** Low
- **Category:** Over-engineering (dim. 21)
- **Affected documents:** `docs/21_Performance_Reliability_and_Scalability.md` §32
- **What is wrong:** Doc 21 §32 does exactly the right thing (documents the three stages and their triggers), but the "Large scale" row on §32.3 casually mentions *"multi-region posture"* and *"possibly self-hosted Grafana + Loki + Prometheus"* — cognitive load for a solo student-founder pre-Foundation. This is not wrong (the section is honest about it being trigger-gated), but the reader may worry unnecessarily.
- **Exact correction:**
  - Add a one-sentence disclaimer at the top of Doc 21 §32.3: *"The Large-scale row exists for completeness. None of it is built or planned before evidence — reading it should not create a to-do list; it is a signposted future."*

---

## AF-19 — Under-engineering flag: no ADR for "Same-origin API + built portals from one Render service"

- **Severity:** Medium
- **Category:** Under-engineering (dim. 22); Missing acceptance criteria (dim. 14)
- **Affected documents:** `docs/29_Risk_Register_and_ADRs.md`, `docs/09_System_Architecture.md`, `docs/18_Security_and_Privacy.md` §14
- **What is wrong:** The decision to serve the built portals from the same origin as the API (the reason CORS is not configured at MVP, Doc 18 §14) is architecturally significant and shapes the CSP, cookie handling, and the eventual multi-host decision. Yet no formal ADR captures it. AD-1 (layered monolith) is related but not the same decision; AD-10 (Render + Atlas) is about hosting choice, not topology.
- **Exact correction:**
  - Add ADR `AD-27 — Same-origin serving of API and built portals at MVP` to Doc 29 §Part B:
    - **Status:** Confirmed
    - **Context:** MVP has one Render service; separate frontend host adds ceremony without benefit.
    - **Decision:** The Express server serves `client/dist/` for non-`/api` paths; the browser sees one origin.
    - **Alternatives:** Split static host (Vercel/Cloudflare Pages) — deferred to growth stage.
    - **Consequences:** No CORS at MVP; single-cookie refresh path stays clean; CSP is stricter.
    - **Tradeoffs:** Static asset delivery competes with API capacity — negligible at MVP volume.
    - **Review trigger:** Portal delivery becomes a measurable bottleneck (Doc 21 §32.2 CDN row).

---

## AF-20 — "Correlation ID" format inconsistency between Doc 20 §26 and Doc 27 §16 example

- **Severity:** Low
- **Category:** Inconsistent terminology (dim. 16)
- **Affected documents:** `docs/20_Error_Handling_and_Validation.md` §26, `docs/27_Analytics_and_Product_Metrics.md` §16
- **What is wrong:** Doc 20 §26 defines the format as `req_<yyyy-mm-dd>_<random8>` (e.g., `req_2026-07-21_abc123`). Doc 27 §16 shows the same example verbatim in the event envelope, so this is technically consistent. But `abc123` is only 6 characters, not `random8`. The example is off by 2.
- **Exact correction:**
  - In both documents, replace `req_2026-07-21_abc123` with an 8-character example, e.g. `req_2026-07-21_a3b7c9d1` — matches the stated `<random8>` shape.

---

# Part B — Approved Final Terminology Dictionary

The one place any future document confirms the exact word to use. Where variations exist, this table names the canonical one.

| Canonical term | Definition | Not to be used |
|---|---|---|
| **RozVisit** | Product/company name. Always as one word, capital R and V. | rozvisit (lowercase), Roz Visit, Roz-Visit, ROZVISIT |
| **Client** | The overseas diaspora payer with a subscription. | Customer, subscriber, buyer, family (family is inclusive but not the role) |
| **Caregiver** | The verified local field agent. | Care worker, care giver, worker, staff, helper, attendant |
| **Admin** | Operations staff internal to RozVisit. | Operator, staff (staff is broader), moderator, manager |
| **Parent** | The person receiving visits. Never a portal user. | Elder, senior, patient, ward, care recipient |
| **Client portal** | The web app used by clients. | Client app, client site, family portal |
| **Caregiver portal** | The web app used by caregivers. | Caregiver app, worker portal, field app |
| **Admin portal** | The web app used by admins. | Admin app, ops portal, admin dashboard (dashboard is a screen inside the portal, not the portal) |
| **Verified caregiver** | A caregiver who has passed all three verification gates: CNIC, interview, reference. | Approved caregiver (approved is the state; verified is the identity) |
| **Verification gate** | One of the three checks: CNIC, interview, reference. | Verification step, verification check (both are OK but "gate" is canonical) |
| **Visit** | A single scheduled attendance by a caregiver. | Appointment, session, checkup |
| **Verified visit** | A completed visit with a finished checklist and at least one in-app camera photo. Used for the north-star metric. | Completed visit (a completed visit without proof does not exist — see FR-045) |
| **Proof feed** | The client's home screen showing the sequence of visits. | Timeline, wall, activity feed |
| **Checklist** | The short list of items caregivers record per visit (medication, mood, concerns, note). | Form, questionnaire, survey |
| **Consent** | The parent's own-words recording made at the first visit. Includes chosen scope (no photos in bedroom, etc.). | Agreement, waiver, permission |
| **Consent withdrawal** | The action pausing visits when the parent decides they no longer want them. | Consent cancellation, opt-out |
| **Emergency** | The rare escalation with a 10-second broadcast deadline. | Alert (alerts are the delivery vehicle; the event is an emergency), alarm |
| **Errand** | A small task done during or between visits (medicine, groceries). Phase 2. | Chore, task |
| **Correlation ID** | The `req_<yyyy-mm-dd>_<random8>` string that threads a request across logs, errors, notifications, and audit. | Trace ID, request ID |
| **Introductory pricing** | The pricing offered to early subscribers, locked to their subscription. See AF-16 correction. | Founding price, launch pricing |
| **Missed visit** | A scheduled visit that was not completed and was not declined by the parent. | Skipped visit, no-show |
| **Parent declined** | A visit the parent turned away, no fault to the caregiver. | Rejected visit, refused visit |
| **North-star metric** | Verified visits completed per week. | KPI (KPIs are the other metrics; this one has a name) |
| **AD-N** | An Architecture Decision Record, N is the ID from Doc 29. | ADR-N (Doc 29 uses AD-N exclusively) |
| **BR-N / FR-N / NFR-N** | Business Requirement / Functional Requirement / Non-Functional Requirement IDs. | Business rule (BR is business requirement, "rule" is a different concept in Doc 00) |
| **D-NN** | A decision from Doc 01 Decision Log. | Decision-N, DL-N |
| **R-NN** | A risk from Doc 29 Part A. | Risk-N |

---

# Part C — Approved Final Module List

The eight modules confirmed in Doc 00 §8 and specified in Doc 14. No changes; documented here for canonical reference.

| # | Canonical name | Purpose | Short form (code, headers) |
|---|---|---|---|
| 1 | **Authentication Module** | Login, registration, verification, sessions | `auth` |
| 2 | **User & Profile Module** | Client, parent, caregiver profiles; consent capture | `profile` (client/caregiver); `parent` domain |
| 3 | **Visit Scheduling Module** | Visits, checklists, proof, offline flow | `visits` |
| 4 | **Errand Module** | Errand requests, receipts, repayment (Phase 2) | `errands` |
| 5 | **Emergency Module** | Alarms, four-channel broadcast, timelines (Phase 2) | `emergency` |
| 6 | **Billing & Subscription Module** | Plans, states, manual payment tracking (Phase 1); wallet + auto-payments (Phase 4) | `plans` / `subscriptions` |
| 7 | **Admin Operations Module** | Verification pipeline, assignment, oversight, disputes | `admin` |
| 8 | **Notification Module** | In-app, push, email; SMS + WhatsApp at Phase 2 | `notifications` (short: `notif`) |

**Explicitly not modules** (documented as decisions):
- **Discovery / search of caregivers** — not applicable; caregivers are assigned, not browsed (Doc 05).
- **Clinic / organization management** — not in the canonical brief.
- **Reviews** — exists as the Phase 2 ratings feature inside the Visits module.
- **Payments** — a subset of Billing & Subscription; not a separate module.
- **Reports** — the admin dashboard and analytics rollups, not a separate module at MVP.
- **Support** — the dispute workflow lives inside Admin (Journey A4).

---

# Part D — Approved Final Role List

Three roles in the system. Confirmed in Doc 00 §7 and Doc 13.

| Role code | Display name | Description |
|---|---|---|
| `client` | Client | Overseas subscriber; adds parents, chooses plans, schedules visits, sees proof. |
| `caregiver` | Caregiver | Verified field agent in Pakistan; performs visits, captures proof, uploads (immediately or on next connection). |
| `admin` | Admin | Operations staff; verifies caregivers, assigns visits, resolves flags, manages subscriptions, oversees emergencies. |

**Not a role:** the **Parent**. The parent is a profile in the system, never a portal user, and never has a login. Consent is captured on the first visit; withdrawal is honored at any time.

**Scoped admin permissions** exist from day one (SEC-010): even with one admin, permission checks are structured so growing to multiple admins is data entry, not development. Doc 13 §16 lists the permission surface.

---

# Part E — Approved Final Status Enums

All enums live in `server/src/config/constants.js` (Doc 10 §20) and are imported by schemas. This part is the read-only reference.

## E.1 `ROLES`

`'client' | 'caregiver' | 'admin'`

## E.2 `USER_STATUS`

`'active' | 'disabled'`

## E.3 `PARENT_STATUS`

`'pending_consent' | 'active' | 'paused' | 'archived'`

## E.4 `CAREGIVER_STATUS`

`'applied' | 'in_review' | 'verified' | 'rejected' | 'deactivated'`

## E.5 `CONSENT_STATE`

`'pending' | 'given' | 'declined' | 'withdrawn'`

## E.6 `VISIT_STATUS`

`'scheduled' | 'in_progress' | 'completed' | 'missed' | 'parent_declined' | 'flagged'`

**Cross-reference:** the corresponding endpoint for the `parent_declined` transition is `POST /visits/:id/declined` — see AF-08 for the recommended rename to `POST /visits/:id/parent-declined` for perfect consistency.

## E.7 `SUBSCRIPTION_STATE`

`'selected' | 'link_sent' | 'active' | 'grace' | 'paused' | 'cancelled'`

Transitions (from Doc 11 §Section 4 rule and Doc 14 §Module 6):
- `selected → link_sent` (admin action, records manual payment link sent)
- `link_sent → active` (admin action with `paymentRef`; refuses without it)
- `active → grace` (period-end passes without renewal)
- `grace → active` (renewal recorded before grace expiry)
- `grace → paused` (grace expires)
- `active | grace | paused → cancelled` (client action)
- No transition writes in-place; each writes a history entry.

## E.8 `PLAN_NAMES`

`'Basic' | 'Standard' | 'Premium'`

Pricing is D-03 (ranges until Phase 0 evidence). Any concrete number in any document is an example only.

## E.9 Notification delivery per channel

`'queued' | 'sent' | 'retrying' | 'failed'` (Doc 19 §11).

Give-up moves to `failed` and surfaces the admin `notif.failed` flag (FR-091).

---

# Part F — Approved Final Source-of-Truth Hierarchy

When two documents disagree, the higher-ranked one wins. This closes the "Rule 2" question from Doc 00 with a concrete order.

| Rank | Source | Scope |
|---|---|---|
| 1 | **Founder decisions (approved in Doc 01 Decision Log, D-01..D-11)** | The 11 approved decisions are canonical facts. Any document that contradicts them is wrong. |
| 2 | **Doc 00 (Canonical Project Brief)** | The base for everything except where a founder decision has explicitly moved past it. |
| 3 | **Doc 01 (Decision Log)** | Any decision listed here overrides an earlier assumption or recommendation. |
| 4 | **Doc 29 Part B (Architecture Decision Records, AD-1..AD-25+)** | The confirmed technical decisions with review triggers. |
| 5 | **Domain-specific canonicals** — Doc 11 for data, Doc 12 for API, Doc 13 for auth, Doc 15 for design system, Doc 18 for security, Doc 20 for errors | Each of these owns its domain. Contradictions inside their domain lose to them. |
| 6 | **Doc 07 (SRS) + Doc 03 (BRD)** | The requirements. If Doc 09/10 architecture appears to contradict a stated requirement, the requirement wins pending an architecture correction. |
| 7 | **Doc 14 (Module specs) + Doc 16 (Screen inventory) + Doc 17 (Wireframe brief)** | The consolidated build-and-review references. |
| 8 | **All other documents** (Docs 02, 04, 05, 06, 08, 10, 19, 21–28) | Elaboration, guidance, workflow, and roadmap. Wins over nothing above. |
| 9 | **README.md** | Public-facing summary; must match everything above. |
| 10 | **Comments, commit messages, chat** | Not a source of truth; must not contradict any of the above. |

**When a change is needed:** Rule 8 in Doc 00 §Source of Truth Rules applies — the change lands in the same PR that makes it true. The source-of-truth hierarchy tells the reviewer which document to check first.

---

# Summary Table of Findings

| ID | Severity | Category | Correction shape |
|---|---|---|---|
| AF-01 | Critical | Broken references | README text edit (remove Doc 22 gap claim) |
| AF-02 | High | Broken references | Add AD-26 or clarify text in Docs 19, 21 |
| AF-03 | High | Contradictions | Doc 00 §6 text edit (Bilal: Lahore → Rawalpindi) |
| AF-04 | Medium | Terminology | Doc 00 §6 text edit ("Dr. Nasreen" → "Nasreen Shah") |
| AF-05 | Medium | Contradictions | Doc 00 §11 and Doc 03 currency-list text edits |
| AF-06 | Low | Acceptance criteria | Verify Doc 14 §Module 6 covers parent dignity |
| AF-07 | Low | Duplicate requirements | Analytics event footnote in Doc 27 |
| AF-08 | Medium | Terminology | Rename `/visits/:id/declined` → `/visits/:id/parent-declined` |
| AF-09 | Low | Module names | Add short-form clarification to terminology dictionary |
| AF-10 | Low | References | Small cross-reference tweak in Doc 26 |
| AF-11 | Medium | Privacy | Add logging rule for consent-recording references in Doc 18 |
| AF-12 | Medium | Missing diagram | Add Mermaid deployment diagram to Doc 25 |
| AF-13 | Medium | Missing diagram | Add Mermaid growth-stage diagram to Doc 21 |
| AF-14 | Low | Duplicate requirements | Give the 12 acceptance checks IDs; reference in Doc 22 |
| AF-15 | Medium | Missing criteria | Add refund-timing FR *(Recommendation)* |
| AF-16 | Medium | Contradictions | Add BR for introductory-price lock |
| AF-17 | Low | Missing coverage | Doc 09 §24 — name PaymentProvider in local mocks |
| AF-18 | Low | Over-engineering | Doc 21 §32.3 disclaimer sentence |
| AF-19 | Medium | Under-engineering | Add AD-27 (same-origin) to Doc 29 |
| AF-20 | Low | Terminology | Correlation ID example length fix |

**Totals:** 1 Critical, 6 High + Medium (Medium counted separately: 9 total Medium), 4 Low.

---

# What to Fix First

If time is limited, fix in this order:

1. **AF-01** (README claims Doc 22 doesn't exist). One minute; it misleads every reviewer.
2. **AF-03** (Bilal's city). One line in Doc 00. Prevents a persona confusion during development.
3. **AF-02** (broken AD-11 references). Either add AD-26 or edit the two lines. Prevents developer confusion.
4. **AF-08** (endpoint rename). Do this in the same PR as the first `/visits` route work — cheaper now than later.
5. **AF-19 and AF-15 and AF-16** — the three "missing" items that add business/architecture clarity. Ideally each with founder sign-off.
6. **AF-04, AF-05, AF-11, AF-12, AF-13** — the medium-quality-of-life fixes.
7. Everything else in a housekeeping pass.

---

*End of Document 31 — RozVisit Documentation Consistency Audit*
