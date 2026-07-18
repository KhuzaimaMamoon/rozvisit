# RozVisit — Business Requirements Document (BRD)
### Document 03

**Sources:** Document 00 (Canonical Brief), Document 01 (Decision Log, all approved), Document 02 (Vision and Strategy).
**Labels:** Everything here is confirmed unless marked *(Assumption)*, *(Recommendation)*, or *(Open)*.
**Writing style:** Plain English, per Source of Truth Rule 9.

---

## 1. Document Purpose

This document explains what the business needs from RozVisit — in business terms, not technical ones. It is the bridge between the product vision (Document 02) and the technical documents that come after it. Every business requirement here has a unique ID (BR-001, BR-002, and so on) so later documents can point back to it.

Who should read this: the founder, future team members, future investors, and anyone writing technical requirements based on it.

---

## 2. Business Background

Overseas Pakistanis send home more than $30 billion every year. This money flow proves two things: the community is large, and it spends real money on family back home.

But money alone cannot answer the question these families ask every day: *"Is my mother okay right now?"* No product in Pakistan answers it. Care for elders is handled through phone calls and informal favors — with no schedule, no proof, and no alarm system.

RozVisit was created to fill this gap. The founder is a final-year software student in the Islamabad/Rawalpindi region, building the business part-time with no outside funding. This shapes the plan: everything starts small, cheap, and manual, and grows only when proof of demand exists.

---

## 3. Business Objectives

| # | Objective | Measure | When |
|---|---|---|---|
| O-1 | Prove people will pay | 5 paying families, onboarded manually | Phase 0 |
| O-2 | Launch a working product | Core MVP live (login, profiles, visits, proof, plan selection) | Phase 1 |
| O-3 | Make the service provably reliable | 95%+ of visits done on time | Phase 2 onward |
| O-4 | Make revenue self-serve | In-app checkout replaces manual payment links | Phase 4 |
| O-5 | Expand beyond the pilot city | Second city (Lahore) operating | Phase 6 |
| O-6 | Keep the business profitable by design | 60–70% platform share of each visit/errand maintained | Always |

---

## 4. Business Problem

Families abroad cannot verify the wellbeing of parents at home. The tools they use today — phone calls, favors from relatives — give no schedule, no proof, and no emergency alarm. This creates constant worry and guilt for millions of households, and money cannot currently buy a solution, because no organized solution exists.

---

## 5. Proposed Solution

A subscription platform with three sides:

1. **The client side (abroad):** pick a plan, schedule visits, see photo/video proof of every visit, get instant emergency alerts, pay in foreign currency.
2. **The caregiver side (in Pakistan):** verified local caregivers receive assignments, follow checklists, capture proof through the app camera, run errands, and raise alarms.
3. **The operations side (our team):** verify every caregiver (ID card, background check, recorded interview), watch visit performance, and manage emergencies and complaints.

The platform keeps 60–70% of each visit or errand fee. Clients pay in USD/GBP/AED/SAR; caregivers are paid in rupees.

---

## 6. Stakeholders

| Stakeholder | What they care about |
|---|---|
| Founder / product owner | Product direction, funding, partnerships, day-to-day pilot operations |
| Diaspora clients | Trust, proof, easy foreign-currency payment, fair pricing |
| Parents (the people visited) | Respect, comfort, a familiar face, not feeling watched |
| Caregivers | Fair pay, clear tasks, safe working conditions, growing reputation |
| Development team | Clear, stable requirements |
| Future investors | A defendable market position, clean business numbers |
| Regulators (future) | Compliance with any elder-care or gig-work rules that may arrive in Pakistan |

---

## 7. Target Customers

**Primary paying customer:** overseas Pakistanis aged roughly 28–55, in the UAE, Saudi Arabia, the UK, and the USA. Middle income or higher. Already sending money home. The buying decision is driven by trust and peace of mind, not price.

**Service recipient:** their parents, aged 55+, living alone or with little support in Islamabad/Rawalpindi (the pilot city), then more cities from Phase 6.

---

## 8. Business Capabilities

The capabilities the business must have, in plain terms:

1. **Sell trust:** verify caregivers so well that a stranger 3,000 km away lets them into their parent's home.
2. **Deliver visits:** schedule, perform, and prove wellbeing visits on time, week after week.
3. **Handle emergencies:** detect, alert, and manage urgent situations within seconds, day or night.
4. **Collect money across borders:** receive foreign-currency subscriptions with no upfront tool costs (Payoneer).
5. **Pay caregivers fairly and on time:** track each verified visit and pay the caregiver's share in rupees.
6. **Keep records:** store proof of every visit and errand, for trust, for complaint handling, and for future insurance claims.
7. **Grow city by city:** repeat the caregiver-network playbook in new cities without rebuilding the platform.

---

## 9. Business Requirements

Each requirement has a unique ID. "Must" means required for the phase listed. Requirements are grouped by area.

### Customer and revenue

| ID | Requirement | Phase |
|---|---|---|
| BR-001 | The business must collect subscription revenue in foreign currency (USD, GBP, AED, SAR). | 0 |
| BR-002 | The business must operate with zero upfront payment-tool costs until it has revenue. Fees may only be taken as a share of real transactions. | 0 |
| BR-003 | Clients must be able to choose between three plan levels (Basic, Standard, Premium) with different visit counts and prices. | 1 |
| BR-004 | Plan prices stay as ranges until Phase 0 gives real evidence of willingness to pay. Exact figures in any document are examples only. | 0 |
| BR-005 | The client must be able to pick their plan inside the app; payment happens through a manually sent Payoneer link until Phase 4. | 1 |
| BR-006 | From Phase 4, clients must be able to pay inside the app without manual steps. | 4 |
| BR-007 | From Phase 4, more than one family member must be able to share the cost of one parent's plan (split billing). | 4 |
| BR-008 | From Phase 4, a missed visit must trigger an automatic refund or credit. | 4 |
| BR-009 | The business must be able to sell single errands and one-time emergency call-outs to people who are not subscribers. | 2 |

### Service delivery

| ID | Requirement | Phase |
|---|---|---|
| BR-010 | Every caregiver must pass verification before their first visit: national ID (CNIC) check, background check, and a recorded interview. | 0 |
| BR-011 | Every visit must produce proof: photos or video taken through the app camera only, plus a completed checklist. A visit without proof does not count as complete. | 1 |
| BR-012 | Visits must follow a schedule set by the client's plan, and the system must enforce the plan's visit limits. | 1 |
| BR-013 | From Phase 2, caregiver arrival and departure must be confirmed by GPS location at the parent's address. | 2 |
| BR-014 | From Phase 2, clients must be able to request errands (medicine pickup, bill payment, doctor escort) with photo receipts as proof. | 2 |
| BR-015 | The business must keep a pool of backup caregivers so a caregiver absence does not mean a missed visit. | 2 |
| BR-016 | From Phase 3, premium clients must be able to see their parent through live video during visits, and on demand. | 3 |
| BR-017 | From Phase 3, the caregiver's identity must be confirmed at arrival by a live selfie matched to their verified profile photo. | 3 |

### Emergency handling

| ID | Requirement | Phase |
|---|---|---|
| BR-018 | An emergency raised by a caregiver or client must alert the client and our operations team in under 10 seconds. | 2 |
| BR-019 | Emergency alerts must travel on at least four channels at once (in-app, push, SMS, WhatsApp), so one failure never silently drops an alarm. | 2 |
| BR-020 | Every emergency must have a tracked timeline from raised to resolved, owned by the operations team. | 2 |

### Caregiver workforce

| ID | Requirement | Phase |
|---|---|---|
| BR-021 | Caregivers must be paid per verified visit, with the platform keeping a 60–70% share. | 0 |
| BR-022 | Caregivers must have ratings, and repeated poor ratings must lead to removal from the platform. | 2 |
| BR-023 | Caregiver liability insurance must be arranged through an outside provider before Phase 2 growth. *(Open — provider not chosen yet.)* | 2 |
| BR-024 | From Phase 6, a caregiver training and certification program must exist. | 6 |

### Trust, privacy, and records

| ID | Requirement | Phase |
|---|---|---|
| BR-025 | The parent must give recorded consent to visits and photo/video capture at the first onboarding visit. This is part of the Phase 0 operations checklist. | 0 |
| BR-026 | A simple privacy policy and terms of service must exist before Phase 1 launch, covering: what data is collected, parent consent, how long media is kept, and how to request deletion. A lawyer reviews before Phase 2. | 1 |
| BR-027 | All visit and errand records must be kept in a form that can settle complaints and support future insurance claims. | 1 |
| BR-028 | Customer data must be stored on cloud infrastructure in the Asia-Pacific region (Mumbai), and the privacy policy must say so. | 1 |

### Growth

| ID | Requirement | Phase |
|---|---|---|
| BR-029 | The pilot runs in Islamabad/Rawalpindi only. Expansion starts with Lahore in Phase 6. | 0 |
| BR-030 | From Phase 2, the business must measure what share of new clients come from referrals. | 2 |
| BR-031 | From Phase 6, the business must support partnerships with companies and NGOs (for example, sponsored care plans). | 6 |
| BR-032 | Early subscribers who choose an introductory-price plan keep that price for as long as their subscription remains continuously active. Price changes apply only to new subscriptions and to subscribers whose plan lapses and is re-selected. | 1 |

---

## 10. Business Rules

Rules the business follows at all times:

1. A visit without proof (photos/video plus checklist) is treated as a missed visit.
2. No caregiver performs a visit before completing verification. No exceptions, including trials and demos.
3. The platform share stays between 60% and 70%. It is never discounted below this to win growth.
4. Caregivers never provide medical services. No diagnosis, no treatment, no giving medicine. They may remind, escort, and report only.
5. The parent's consent is required before any visits begin, and can be withdrawn at any time.
6. Emergency handling always takes priority over every other operational task.
7. One client pays for one parent's plan (until split billing arrives in Phase 4); the database supports linked family members from day one.
8. Every price shown to a client is in the client's own currency.

---

## 11. Constraints

- **No capital.** The founder builds part-time with no outside funding. Every tool must be free or pay-from-revenue until income exists.
- **Stripe is unavailable.** Stripe does not accept Pakistan-registered businesses. Payoneer is the payment channel until a foreign company is registered (after Phase 6).
- **Solo development capacity.** Phases 0–1 are realistically built by one person. The plan must not assume a team.
- **Caregiver hardware.** The caregiver app must work on cheap Android phones with weak internet.
- **Free-tier hosting limits.** Render's free tier sleeps when idle; the first request after quiet time is slow. Accepted until revenue exists.

---

## 12. Dependencies

| Dependency | What depends on it |
|---|---|
| Payoneer availability | All revenue collection, Phases 0–4 |
| MongoDB Atlas free tier | The database, Phases 0–1 |
| Cloudinary free tier | All photo/video proof storage, Phases 1–4 |
| Twilio and WhatsApp Business API | Emergency alerts and caregiver SMS, Phase 2 onward |
| Daily.co (or similar) | Live video features, Phase 3 |
| An insurance provider | Caregiver liability cover, before Phase 2 growth *(Open)* |
| An operations lead | Phase 0 caregiver recruitment and verification *(Open — currently the founder)* |

---

## 13. Assumptions

- Enough trustworthy, checkable caregivers can be recruited in Islamabad/Rawalpindi.
- Diaspora clients will pay a repeating foreign-currency fee for non-medical wellbeing visits. Phase 0 tests exactly this.
- Payoneer remains available as the receiving channel through Phase 4.
- Elder care stays mostly unregulated in Pakistan for about the next 12 months.
- Parents will accept regular visits when they are framed as help and company, not monitoring.
- Diaspora word-of-mouth (family and community networks) can be a real customer acquisition channel.

---

## 14. Revenue Opportunities

1. **Subscriptions (core):** monthly plans in three tiers — the main, repeating revenue.
2. **Errand add-ons:** single paid errands beyond a plan's included amount.
3. **Emergency call-out fee:** a one-time paid dispatch for non-subscribers. Also works as a first taste of the service.
4. **Corporate and NGO partnerships (Phase 6):** companies sponsoring care plans for employees' parents; NGO-funded care for vulnerable elders.
5. **Future (Year 3+):** the same model repeated for Indian and Bangladeshi diaspora corridors.

---

## 15. Pricing Possibilities

Confirmed price ranges (final numbers set after Phase 0 evidence — BR-004):

| Plan | Visits | Errands | Range (USD/month) |
|---|---|---|---|
| Basic | 1 per week | none | $25–35 |
| Standard | 3 per week | 1 per week | $60–80 |
| Premium | Daily | Unlimited + doctor-visit priority | $120–150 |

Pricing principles:
- Prices are shown in the client's own currency.
- The price should feel small next to what it replaces — worry — and next to what the client already spends on remittances.
- Example launch figures like $29 / $69 / $129 may appear in documents, always marked as examples.

---

## 16. Operational Model

**Phase 0 (fully manual):** the founder recruits and verifies 3–5 caregivers, signs up 5 families over WhatsApp, schedules visits in a spreadsheet, sends payment links by hand, and forwards visit photos personally. The goal is proof of demand, not efficiency.

**Phases 1–3 (software-assisted):** the platform takes over scheduling, proof capture, and alerts. The operations role focuses on caregiver verification, quality monitoring, and emergency management. An operations lead is the most urgent hire. *(Open — currently the founder does this.)*

**Phases 4–6 (self-serve and scaling):** payment, refunds, and plan changes run without manual steps. Operations focuses on new-city launches, the caregiver certification program, and partnerships.

Working-hours note: clients live in time zones 3–9 hours behind or ahead of Pakistan. Emergency handling must work around the clock; general support follows defined hours published to clients. *(Recommendation — exact support hours to be set at Phase 1 launch.)*

---

## 17. Partner Ecosystem

| Partner type | Role | When |
|---|---|---|
| Payoneer | Cross-border payment collection | Phase 0 |
| Cloud providers (Render, MongoDB Atlas, Cloudinary) | Hosting and storage | Phase 1 |
| Twilio / WhatsApp | Alert delivery | Phase 2 |
| Insurance provider | Caregiver liability cover *(Open)* | Before Phase 2 growth |
| Nursing schools, social-work programs | Caregiver recruitment pipeline | Phase 2 onward |
| Mosques and community centers abroad | Trusted word-of-mouth channels for client acquisition | Phase 2 onward |
| Companies and NGOs | Sponsored care plans | Phase 6 |

---

## 18. Compliance Considerations

- **Privacy:** the platform holds sensitive data (elder medical notes, home addresses, photos inside homes). A privacy policy exists from Phase 1 (BR-026); parent consent is mandatory (BR-025); data lives in the Asia-Pacific region and the policy says so (BR-028).
- **GDPR:** clients in the UK/EU bring European data-protection duties. These are met through controls — encryption, limited access, deletion on request — regardless of hosting region.
- **Elder-care regulation:** none currently applies in Pakistan. *(Assumption)* We write our own operating standards early so we are ahead of rules, not behind them.
- **Employment classification:** caregivers are independent contractors paid per verified visit. *(Recommendation — have this reviewed in the pre-Phase-2 legal review, together with the privacy policy.)*
- **Tax:** foreign-currency income received through Payoneer must be declared under Pakistani tax rules. *(Recommendation — confirm treatment with an accountant before Phase 1 revenue.)*

---

## 19. Success Criteria

The business is succeeding when:

1. Phase 0 closes with 5 paying families and caregivers performing real visits (O-1).
2. From Phase 2, at least 95% of scheduled visits complete on time (O-3).
3. 100% of completed visits carry proof — no exceptions.
4. Emergency alerts reach clients in under 10 seconds.
5. Monthly client retention reaches 90% or better. *(Assumption — target re-set after real data.)*
6. Average caregiver rating stays at 4.5/5 or higher.
7. The 60–70% platform share holds without discounting (O-6).
8. The north-star metric — verified visits completed per week — grows month over month.

---

## 20. Risks

| Risk | Chance | Impact | Answer |
|---|---|---|---|
| Families do not trust a stranger in the home | High | High | Strong verification, recorded interviews, references, insurance, live selfie checks (Phase 3) |
| Phase 0 fails to find 5 paying families | Medium | High | The plan stops and rethinks before any build spend — this is exactly what Phase 0 is for |
| Caregiver no-shows or fraud | Medium | High | GPS check-ins, camera-only proof, ratings, backup pool, removal rules |
| Payoneer becomes unavailable | Low | High | Provider-swap design in the payment layer; alternate channels (bank transfer, other processors) evaluated if triggered |
| A single bad incident (theft, harm) in a parent's home | Low | Very high | Verification, insurance *(Open)*, incident response owned by operations, honest communication policy |
| Regulation arrives suddenly | Low | Medium | Own standards written early; legal review before Phase 2 |
| Founder burnout (solo, part-time) | Medium | High | Phase gating keeps scope small; operations lead is the first hire |
| Data breach | Low | Very high | Encryption, access controls, cleaned logs, least-privilege admin |

---

## 21. MVP Acceptance Conditions

The MVP (end of Phase 1) is accepted when all of the following are true:

1. A client can sign up, verify by email, create a parent profile with a location, pick a plan, and schedule visits within their plan's limits.
2. A caregiver can log in, see assigned visits, complete a checklist, and attach photo/video proof captured only through the app camera.
3. An admin can view users, visits, and proof records.
4. A visit cannot be marked complete without a checklist and at least one proof file.
5. The privacy policy and terms are published and linked in the app.
6. Payment works end-to-end through manually sent Payoneer links, recorded against the client's chosen plan.
7. The app runs correctly on a cheap Android phone over a slow connection (caregiver screens).
8. All screens use the approved palette and design rules.

---

## 22. Out-of-Scope Items

Not part of this business plan at all (or until the phase noted):

1. Medical services of any kind — permanently out of scope.
2. Open caregiver self-signup — permanently out; verification is always managed.
3. Building our own insurance — permanently out; always an outside provider.
4. Native mobile apps — out until real usage justifies them.
5. Countries beyond Pakistan for service delivery — out until Year 3 evaluation.
6. Payment integration code — out until Phase 4.
7. Urdu interface — out until Phase 5.
8. GPS check-in, errands, emergency system, admin dashboard — out of the MVP; they arrive in Phase 2.
9. Live video — out until Phase 3.
10. Discounts below the 60–70% platform share — permanently out.

---

## 23. Traceability to Product Goals

How the requirement groups connect to the objectives in Section 3 and the strategy in Document 02:

| Product goal (Document 02) | Business objective | Supporting requirements |
|---|---|---|
| Prove demand before building | O-1 | BR-001, BR-002, BR-004, BR-010, BR-021, BR-025 |
| Trust through proof | O-2, O-3 | BR-011, BR-012, BR-013, BR-017, BR-027 |
| The emergency path is sacred | O-3 | BR-018, BR-019, BR-020 |
| Self-serve revenue | O-4 | BR-005, BR-006, BR-007, BR-008 |
| Fair, quality caregiver workforce | O-3, O-6 | BR-021, BR-022, BR-023, BR-024 |
| Privacy and dignity for the parent | O-2 | BR-025, BR-026, BR-028 |
| City-by-city growth | O-5 | BR-029, BR-030, BR-031 |
| Margin discipline | O-6 | BR-021, Business Rule 3 |

Every future technical requirement (in the documents that follow) must trace back to at least one BR-ID in this document.

---

*End of Document 03 — RozVisit Business Requirements Document*
