# RozVisit — Final Documentation Index
### Document 32

**Purpose:** The one-page map of the RozVisit documentation series after Document 31's audit was applied. Every canonical document is listed with its purpose, its position in the source-of-truth hierarchy (from Doc 31 Part F), the documents it depends on and is depended on by, its last-reviewed status after the audit pass, and which implementation modules it directly affects.
**How to use this document:** When starting work on a feature, find the module in the "modules affected" column. When investigating a contradiction, walk the source-of-truth priority. When onboarding, read documents in reverse-priority order — highest-priority documents first.
**Labels:** Everything here is confirmed.

---

## Source-of-Truth Priority (recap from Doc 31 Part F)

The priority used in the table below:

| Priority | Meaning |
|---|---|
| **P1** | Founder decisions (Doc 01, D-01..D-11) — canonical facts |
| **P2** | Canonical Project Brief (Doc 00) |
| **P3** | Decision Log (Doc 01) |
| **P4** | Architecture Decision Records (Doc 29 Part B, AD-1..AD-27) |
| **P5** | Domain-specific canonicals — Doc 11 (data), Doc 12 (API), Doc 13 (auth), Doc 15 (design system), Doc 18 (security), Doc 20 (errors) |
| **P6** | Requirements — Doc 07 (SRS), Doc 03 (BRD) |
| **P7** | Consolidated build references — Doc 14 (modules), Doc 16 (screens), Doc 17 (mockups) |
| **P8** | Elaboration and guidance — everything else |
| **P9** | README |
| **P10** | Non-canonical: comments, commit messages, chat |

---

## Implementation Modules (recap from Doc 31 Part C)

Referenced by code name in the last column of each row.

| # | Module | Code name |
|---|---|---|
| 1 | Authentication | `auth` |
| 2 | User & Profile | `profile` |
| 3 | Visit Scheduling | `visits` |
| 4 | Errand | `errands` |
| 5 | Emergency | `emergency` |
| 6 | Billing & Subscription | `plans` / `subscriptions` |
| 7 | Admin Operations | `admin` |
| 8 | Notification | `notifications` (short: `notif`) |
| — | *Cross-cutting* | Applies to all modules |

---

## The Full Index

### Foundational Documents (P2–P3)

#### Doc 00 — Project Canonical Brief

- **Purpose:** The single source of truth for the whole product — vision, market, roles, modules, scope, tech, phases, palette, rules of engagement.
- **Priority:** **P2** — everything else refers to this.
- **Related:** Depends on nothing. Owns everything.
- **Last reviewed:** Corrected in the Doc 31 pass. Fixes applied: AF-03 (Bilal's city → Rawalpindi), AF-04 (Nasreen Shah, no "Dr."), AF-05 (currency list includes SAR).
- **Modules affected:** All.

#### Doc 01 — Decision Log

- **Purpose:** The 11 founder-approved decisions (D-01..D-11) with the alternatives that were rejected. Also lists open items that need decisions.
- **Priority:** **P3** — a decision here overrides an earlier assumption or recommendation.
- **Related:** Referenced by Docs 00, 03, 07, 08, 09, 10, 11, 25.
- **Last reviewed:** No changes in the Doc 31 pass — the decision log was already consistent.
- **Modules affected:** All.

#### Doc 02 — Product Vision and Strategy

- **Purpose:** Long-form articulation of the north-star metric, positioning, moat, and multi-year strategic horizon. The "why" behind the "what."
- **Priority:** **P8**.
- **Related:** Depends on Doc 00. Referenced by Doc 03, Doc 27, Doc 28.
- **Last reviewed:** No changes in the Doc 31 pass.
- **Modules affected:** All (strategic context).

---

### Requirements (P6)

#### Doc 03 — Business Requirements Document

- **Purpose:** The business-side requirements — 32 BR-IDs covering revenue model, caregiver verification, evidence, phased operations, and partnerships. The bridge between "why" and "what shall the system do."
- **Priority:** **P6**.
- **Related:** Depends on Doc 00, Doc 02. Referenced by Doc 06, Doc 07, Doc 14, Doc 27, Doc 28.
- **Last reviewed:** Corrected in the Doc 31 pass. Fixes applied: AF-05 (currency list includes SAR), AF-16 (BR-032 added — introductory-price lock).
- **Modules affected:** All.

#### Doc 07 — Software Requirements Specification

- **Purpose:** The 90+ functional and non-functional requirements, plus 12 stable acceptance criteria (AC-01..AC-12) and the requirement traceability matrix.
- **Priority:** **P6**.
- **Related:** Depends on Docs 00, 01, 03, 04, 05, 06. Referenced by Doc 08, Doc 09, Doc 14, Doc 22.
- **Last reviewed:** Corrected in the Doc 31 pass. Fixes applied: AF-14 (12 acceptance checks now carry stable IDs AC-01..AC-12), AF-15 (FR-026 added — missed-visit refund timing).
- **Modules affected:** All.

---

### Users and Journeys (P8)

#### Doc 04 — User Personas

- **Purpose:** Primary personas (Ayesha, Bilal, Amina Bibi, Nasreen) and edge personas (Tariq, Saima, Kevin, Faisal) with the specific product decisions each persona drives.
- **Priority:** **P8**.
- **Related:** Depends on Doc 00, Doc 02, Doc 03. Referenced by Doc 05, Doc 07, Doc 09, Doc 15, Doc 27, Doc 29.
- **Last reviewed:** No changes in the Doc 31 pass — personas were internally consistent (Doc 00's Bilal/Nasreen text was corrected instead).
- **Modules affected:** All (persona-driven design decisions).

#### Doc 05 — User Journeys and Service Blueprint

- **Purpose:** End-to-end journeys — 10 client journeys (C1..C10), 4 caregiver journeys (G1..G4), 4 admin journeys (A1..A4) — plus the service blueprint showing backstage operations.
- **Priority:** **P8**.
- **Related:** Depends on Doc 04. Referenced by Doc 06, Doc 07, Doc 14, Doc 16.
- **Last reviewed:** No changes in the Doc 31 pass.
- **Modules affected:** All.

#### Doc 06 — User Stories and Acceptance Criteria

- **Purpose:** 20 MVP user stories across 8 epics, each with Given/When/Then acceptance criteria and analytics events. The story-level bridge between journey and requirement.
- **Priority:** **P8**.
- **Related:** Depends on Doc 04, Doc 05. Referenced by Doc 07, Doc 14, Doc 27.
- **Last reviewed:** No changes in the Doc 31 pass.
- **Modules affected:** All.

---

### Architecture (P4–P5)

#### Doc 08 — Software Requirements and Architecture Document (SRAD)

- **Purpose:** The consolidated architecture document combining requirements, architecture principles, and the original ADR summary (which Doc 29 now formalizes fully).
- **Priority:** **P8** — superseded by Doc 09 for architecture detail and Doc 29 for ADRs; kept for the consolidated view.
- **Related:** Depends on all requirements documents. Superseded in part by Doc 09 (architecture) and Doc 29 (ADRs).
- **Last reviewed:** Corrected in the Doc 31 pass. Fixes applied: AF-08 (endpoint rename `/visits/:id/declined` → `/visits/:id/parent-declined`).
- **Modules affected:** All.

#### Doc 09 — System Architecture

- **Purpose:** C4-style diagrams (Context, Container, Component, Deployment), the strict layer boundaries, the three-portal shape, failure scenarios, and the local vs production topologies.
- **Priority:** **P5** — owns architecture.
- **Related:** Depends on Doc 08. Referenced by Docs 10, 11, 12, 13, 14, 18, 19, 20, 21, 22, 23, 24, 25, 29.
- **Last reviewed:** Corrected in the Doc 31 pass. Fixes applied: AF-17 (PaymentProvider mock named in §24 local-dev outside-service list; reference to acceptance check now uses AC-06).
- **Modules affected:** All (architectural).

#### Doc 10 — Repository and Folder Structure

- **Purpose:** Server tree, client tree, docs, tests, scripts, ownership tables, constants file layout, and the import-direction rule that keeps layers clean.
- **Priority:** **P5** — owns folder/file discipline.
- **Related:** Depends on Doc 09. Referenced by Doc 11, Doc 12, Doc 13, Doc 18, Doc 22, Doc 23, Doc 24, Doc 25, Doc 26.
- **Last reviewed:** No changes in the Doc 31 pass.
- **Modules affected:** All (cross-cutting).

#### Doc 11 — Database Design

- **Purpose:** Full data dictionary, ER diagram, index table, enum definitions, plan snapshots, computed allowance (not a counter), `clientVisitId` unique index for offline dedupe, append-only guards on evidence collections.
- **Priority:** **P5** — owns data model.
- **Related:** Depends on Doc 09, Doc 10. Referenced by Doc 12, Doc 14, Doc 18, Doc 22, Doc 27, Doc 29.
- **Last reviewed:** No changes in the Doc 31 pass — enums confirmed as the source in Doc 31 Part E.
- **Modules affected:** All modules read and write data.

#### Doc 12 — API Specification

- **Purpose:** 39 MVP endpoints, cursor pagination, response envelope, signed-permit media upload chain, reserved Phase 2 paths, OpenAPI outline.
- **Priority:** **P5** — owns API contract.
- **Related:** Depends on Doc 09, Doc 10, Doc 11. Referenced by Doc 13, Doc 14, Doc 20, Doc 22, Doc 23, Doc 26, Doc 27.
- **Last reviewed:** Corrected in the Doc 31 pass. Fixes applied: AF-08 (endpoint rename to `/visits/:id/parent-declined` in main spec, OpenAPI outline, and the naming-note clarification).
- **Modules affected:** All modules expose or consume endpoints.

#### Doc 13 — Authentication and Authorization

- **Purpose:** JWT design (two secrets, memory-only access, revocable refresh), the three authorization rings (role, ownership, audit), password/token policy, MFA roadmap, the "revoke everything + force reset" lever.
- **Priority:** **P5** — owns auth mechanics.
- **Related:** Depends on Doc 09, Doc 11, Doc 12. Referenced by Doc 14, Doc 18, Doc 20, Doc 22, Doc 23, Doc 24, Doc 26.
- **Last reviewed:** No changes in the Doc 31 pass.
- **Modules affected:** `auth`; cross-cutting for authorization on every module.

#### Doc 14 — Module Functional Specifications

- **Purpose:** The build-and-review reference per module — one section per confirmed module, listing screens, requirements, business rules, edge cases, acceptance criteria, MVP vs future scope.
- **Priority:** **P7**.
- **Related:** Depends on Doc 05, Doc 06, Doc 07, Doc 12. Referenced by Doc 15, Doc 16, Doc 22, Doc 27.
- **Last reviewed:** Corrected in the Doc 31 pass. Fixes applied: AF-06 (parent-dignity acceptance added to Module 6 Emergency).
- **Modules affected:** All 8 modules (one section each).

---

### Design and UX (P5, P7)

#### Doc 15 — Design System

- **Purpose:** The 11-color palette, derived tints, typography scale, spacing, shadows, motion, the design system component family (StatusBadge, VisitCard, SyncStateBar, ProofTimestamp, CameraCapture, ConsentPanel), and the Tailwind mapping.
- **Priority:** **P5** — owns design tokens and visual language.
- **Related:** Depends on Doc 00 §16 (palette source). Referenced by Doc 16, Doc 17, Doc 22, Doc 23.
- **Last reviewed:** No changes in the Doc 31 pass — palette is the mandatory source.
- **Modules affected:** Cross-cutting (every screen).

#### Doc 16 — Screen Inventory and UI Specifications

- **Purpose:** The 43 confirmed screens (S-01..S-43) across all three portals plus public and system screens, each with purpose, portal, state and edge case coverage.
- **Priority:** **P7**.
- **Related:** Depends on Doc 05, Doc 12, Doc 14, Doc 15. Referenced by Doc 17, Doc 22.
- **Last reviewed:** Corrected in the Doc 31 pass. Fixes applied: AF-08 (endpoint reference updated to `/visits/:id/parent-declined`).
- **Modules affected:** All modules have UI.

#### Doc 17 — Wireframe and Mockup Brief

- **Purpose:** 15 essential-screen mockup briefs with ready-to-paste generation prompts, plus a cross-reference table for 16 near-duplicate screens.
- **Priority:** **P7**.
- **Related:** Depends on Doc 15, Doc 16. Referenced by Doc 22.
- **Last reviewed:** No changes in the Doc 31 pass — palette hex values already exact.
- **Modules affected:** All modules that render screens.

---

### Security, Privacy, Errors (P5)

#### Doc 18 — Security and Privacy

- **Purpose:** Threat model, assets, controls per surface, OWASP mapping, the three-tier launch checklist (MVP / Production / Future compliance), the production launch gate.
- **Priority:** **P5** — owns security posture.
- **Related:** Depends on Doc 09, Doc 11, Doc 13. Referenced by Doc 20, Doc 22, Doc 23, Doc 25, Doc 26.
- **Last reviewed:** Corrected in the Doc 31 pass. Fixes applied: AF-11 (consent-recording reference logging rule added to §23).
- **Modules affected:** All (security is cross-cutting).

#### Doc 19 — Notifications and Real-Time Events

- **Purpose:** Notification design (channels, templates, delivery states, retry, mandatory vs optional lists) + real-time architecture (Socket.io Phase 2 with the two confirmed jobs, ownership rooms).
- **Priority:** **P8**.
- **Related:** Depends on Doc 05, Doc 09, Doc 12, Doc 15, Doc 18. Referenced by Doc 20, Doc 22, Doc 27.
- **Last reviewed:** Corrected in the Doc 31 pass. Fixes applied: AF-02 (AD-11 reference corrected to AD-26 for the Redis Socket.io adapter).
- **Modules affected:** `notifications`, `emergency` (Phase 2).

#### Doc 20 — Error Handling and Validation

- **Purpose:** The `AppError` class hierarchy with `expose` flag, complete stable error code catalogue, correlation IDs, monitoring alerts, testing matrix.
- **Priority:** **P5** — owns error contract.
- **Related:** Depends on Doc 09, Doc 12, Doc 18. Referenced by Doc 22, Doc 23, Doc 24, Doc 25, Doc 27.
- **Last reviewed:** Corrected in the Doc 31 pass. Fixes applied: AF-20 (correlation ID example now matches stated 8-character random format).
- **Modules affected:** All (errors are cross-cutting).

---

### Performance, Testing, Ops (P8)

#### Doc 21 — Performance, Reliability and Scalability

- **Purpose:** Response-time targets, three explicit scale stages (MVP → Growth → Large) with named triggers, graceful shutdown, disaster recovery, capacity planning, cost-aware scaling.
- **Priority:** **P8**.
- **Related:** Depends on Doc 07, Doc 09, Doc 18. Referenced by Doc 22, Doc 25, Doc 27, Doc 29.
- **Last reviewed:** Corrected in the Doc 31 pass. Fixes applied: AF-02 (AD-11 → AD-26 reference), AF-13 (Mermaid growth-stage diagram added), AF-14 (acceptance-check reference now uses AC-01..AC-12), AF-18 (§32.3 clarifying disclaimer added).
- **Modules affected:** All (performance is cross-cutting).

#### Doc 22 — Testing and QA Strategy

- **Purpose:** Testing philosophy, the test pyramid (Jest / Supertest / Playwright), the executable AC-01..AC-12 E2E suite, accessibility and responsive testing, UAT process, coverage targets.
- **Priority:** **P8**.
- **Related:** Depends on Doc 07, Doc 09, Doc 10, Doc 20. Referenced by Doc 24.
- **Last reviewed:** Corrected in the Doc 31 pass. Fixes applied: AF-14 (E2E scenarios now carry AC-01..AC-12 IDs).
- **Modules affected:** All (testing is cross-cutting).

#### Doc 23 — Engineering and Coding Standards

- **Purpose:** General principles, per-technology rules (JS, React, Node, Express, Mongoose, REST, Socket.io), naming conventions, code review checklist, prohibited patterns, good/bad code examples.
- **Priority:** **P8**.
- **Related:** Depends on Doc 09, Doc 10, Doc 12, Doc 13, Doc 18, Doc 20. Referenced by Doc 24, Doc 25.
- **Last reviewed:** No changes in the Doc 31 pass.
- **Modules affected:** All (standards are cross-cutting).

#### Doc 24 — Git and Development Workflow

- **Purpose:** Repository strategy, trunk-based branching, PR template, code review rules, required checks, merge strategy, hotfix/rollback workflows, solo-vs-team distinctions.
- **Priority:** **P8**.
- **Related:** Depends on Doc 10, Doc 22, Doc 23. Referenced by Doc 25.
- **Last reviewed:** No changes in the Doc 31 pass.
- **Modules affected:** All (workflow is cross-cutting).

#### Doc 25 — DevOps and Deployment Guide

- **Purpose:** Local setup, dev/staging/production environments, Atlas setup, deployment shape, health checks, monitoring, backups, disaster recovery, production readiness checklist, estimated hosting costs.
- **Priority:** **P8**.
- **Related:** Depends on Doc 09, Doc 10, Doc 18, Doc 21, Doc 24. Referenced by Doc 26.
- **Last reviewed:** Corrected in the Doc 31 pass. Fixes applied: AF-12 (Mermaid deployment diagram added to §4).
- **Modules affected:** All (deployment is cross-cutting).

#### Doc 26 — Environment Variables Reference

- **Purpose:** Every environment variable specified with 9 fields (variable, service, purpose, required/optional, dev example, production rule, sensitivity, default, validation). Safe `.env.example` files at the end.
- **Priority:** **P8**.
- **Related:** Depends on Doc 10, Doc 13, Doc 18, Doc 25. Referenced by Doc 29 (AD-26 introduces `REDIS_URL`).
- **Last reviewed:** Corrected in the Doc 31 pass. Fixes applied: AF-10 (key-id rotation cross-reference now points to both Doc 25 §7 and Doc 18 §22).
- **Modules affected:** All (config is cross-cutting).

#### Doc 27 — Analytics and Product Metrics

- **Purpose:** Business goals, north-star metric, the metric framework (acquisition, activation, engagement, retention, revenue, operational, reliability), funnels, event catalogue, privacy rules, dashboards.
- **Priority:** **P8**.
- **Related:** Depends on Doc 03, Doc 06, Doc 18, Doc 20. Referenced by Doc 28.
- **Last reviewed:** Corrected in the Doc 31 pass. Fixes applied: AF-07 (cutoff-hours footnote added under Visits events), AF-20 (correlation ID example).
- **Modules affected:** All (analytics is cross-cutting).

#### Doc 28 — Product and Engineering Roadmap

- **Purpose:** The 7-stage roadmap mapped to the confirmed 6-phase plan, with per-stage goals, features, technical work, dependencies, risks, success criteria, and explicit exclusions. MoSCoW prioritization, technical debt plan, future AI opportunities and mobile app.
- **Priority:** **P8**.
- **Related:** Depends on Doc 00, Doc 02, Doc 03. Referenced by Doc 29 (risks and ADRs).
- **Last reviewed:** No changes in the Doc 31 pass.
- **Modules affected:** All (roadmap plans every module's evolution).

#### Doc 29 — Risk Register and Architecture Decision Records

- **Purpose:** 44 risks (R-01..R-44) across 10 categories with likelihood × impact scoring and mitigations; 27 ADRs (AD-1..AD-27) with context, decision, alternatives, consequences, tradeoffs, review triggers.
- **Priority:** **P4** — ADRs are the confirmed technical decisions.
- **Related:** Depends on all prior documents (both the risks and the ADRs consolidate decisions made across the series).
- **Last reviewed:** Corrected in the Doc 31 pass. Fixes applied: AF-02 (AD-26 added — Redis-backed Socket.io adapter), AF-19 (AD-27 added — same-origin serving of API and portals).
- **Modules affected:** All (ADRs cover architecture and risks cover every category).

---

### Meta Documents (P8, P9)

#### Doc 31 — Documentation Consistency Audit

- **Purpose:** The principal-architect audit that identified 20 findings (1 Critical, 6 High, 9 Medium, 4 Low), plus the approved final terminology dictionary, module list, role list, status enums, and source-of-truth hierarchy.
- **Priority:** **P8** — the audit's *findings* are historical; its Parts B–F are P4-equivalent working references.
- **Related:** Depends on all documents 00–29. All corrections applied to source documents in the Doc 32 pass.
- **Last reviewed:** Produced as-is; the findings are now closed via the source-document corrections listed in this index.
- **Modules affected:** All (audit is cross-cutting).

#### Doc 32 — Final Documentation Index (this document)

- **Purpose:** The one-page map of the corrected documentation series.
- **Priority:** **P8**.
- **Related:** Depends on all documents 00–29 and Doc 31.
- **Last reviewed:** Produced fresh in the Doc 31 correction pass.
- **Modules affected:** All (index is cross-cutting).

#### README.md

- **Purpose:** The public-facing entry point at the repository root, covering the product, key features, roles, setup, docs table, contribution, security reporting, roadmap, license, and project status.
- **Priority:** **P9** — must match everything above.
- **Related:** Depends on all documents 00–29.
- **Last reviewed:** Corrected in the Doc 31 pass. Fixes applied: AF-01 (Doc 22 added to the documentation table; "intentional 22 gap" claims removed; project status corrected to reference the complete series plus 31 and 32).
- **Modules affected:** All (readme is cross-cutting).

---

## Correction Summary (from Doc 31 pass)

The audit produced 20 findings. Every one has been applied in the source document(s). This table is the record.

| Finding | Severity | Doc(s) touched | Status |
|---|---|---|---|
| AF-01 | Critical | README.md | ✅ Applied |
| AF-02 | High | Doc 19, Doc 21, Doc 29 (new AD-26) | ✅ Applied |
| AF-03 | High | Doc 00 | ✅ Applied |
| AF-04 | Medium | Doc 00 | ✅ Applied |
| AF-05 | Medium | Doc 00, Doc 03 | ✅ Applied |
| AF-06 | Low | Doc 14 | ✅ Applied |
| AF-07 | Low | Doc 27 | ✅ Applied |
| AF-08 | Medium | Doc 08, Doc 12, Doc 16 | ✅ Applied |
| AF-09 | Low | Doc 31 Part B (terminology dictionary) | ✅ Applied at audit time |
| AF-10 | Low | Doc 26 | ✅ Applied |
| AF-11 | Medium | Doc 18 | ✅ Applied |
| AF-12 | Medium | Doc 25 | ✅ Applied |
| AF-13 | Medium | Doc 21 | ✅ Applied |
| AF-14 | Low | Doc 07, Doc 21, Doc 22 | ✅ Applied |
| AF-15 | Medium | Doc 07 (FR-026) | ✅ Applied |
| AF-16 | Medium | Doc 03 (BR-032) | ✅ Applied |
| AF-17 | Low | Doc 09 | ✅ Applied |
| AF-18 | Low | Doc 21 §32.3 | ✅ Applied |
| AF-19 | Medium | Doc 29 (new AD-27) | ✅ Applied |
| AF-20 | Low | Doc 20, Doc 27 | ✅ Applied |

**Total corrections landed:** 20 findings across 15 documents. No conflicts introduced. Palette conformance: verified — all documents use only the 11 approved colors plus the design-system-derived tints (Doc 15 §3). No new unapproved scope: every addition traces to an existing decision or is labeled *(Recommendation)*.

---

## Reading Order for New Contributors

If you are new to RozVisit and want to read the series in an order that builds understanding fastest:

1. **Doc 00** — what the product is, in one sitting.
2. **Doc 04** — who it's for.
3. **Doc 05** — how they use it.
4. **Doc 03 + Doc 07** — the requirements at the business and system levels.
5. **Doc 09** — how the code is organized.
6. **Doc 11 + Doc 12 + Doc 13** — data, API, auth (the three P5 canonicals for the backend).
7. **Doc 15 + Doc 16** — the design system and screens (the two P5/P7 canonicals for the frontend).
8. **Doc 18 + Doc 20** — security and errors (the cross-cutting P5 canonicals).
9. **Doc 22** — testing.
10. **Doc 23 + Doc 24 + Doc 25** — coding standards, git workflow, deployment (the day-to-day working documents).
11. Everything else as needed by task.

**Total pages to read to be productive at MVP:** roughly Docs 00, 03–07, 09–13, 15, 18, 20, 23. The rest are references you consult when the task calls for them.

---

*End of Document 32 — RozVisit Final Documentation Index*
