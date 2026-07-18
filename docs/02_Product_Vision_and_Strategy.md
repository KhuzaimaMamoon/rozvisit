# RozVisit — Product Vision and Strategy
### Document 02

**Sources:** Document 00 (Canonical Project Brief) and Document 01 (Decision Log — all decisions approved).
**Labels:** Everything here is confirmed unless marked *(Assumption)*, *(Recommendation)*, or *(Open)*.

---

## 1. Executive Summary

RozVisit is a subscription service that lets overseas Pakistanis truly know their aging parents in Pakistan are okay. Clients pay a monthly fee in foreign currency. In return, a verified local caregiver visits their parents on a schedule, sends photo and video proof, runs errands, and raises an instant alarm in an emergency.

The opportunity is clear: overseas Pakistanis send home more than $30 billion every year. This proves they spend real money on family back home. Yet no product today turns any of that money into verified, day-to-day care. RozVisit will be that product.

The plan is deliberately low-cost and low-risk: prove people will pay before writing code, start in one city, use a simple web app before mobile apps, and use free payment tools (Payoneer) before building payment systems.

---

## 2. Product Vision

**Every overseas Pakistani should be able to know — not hope, know — that their parents at home are okay today.**

The long-term vision: RozVisit becomes the app that connects families abroad with their elders at home. Someone in Dubai, Manchester, or Toronto opens the app to see this morning's visit photos, request a medicine pickup, or reach a verified person standing in their parent's living room within the hour.

---

## 3. Mission Statement

To close the distance between overseas children and their aging parents — by making trustworthy, in-person care bookable from anywhere in the world, delivered with the respect the parent deserves and the proof the family needs.

---

## 4. Problem Statement

Adult children abroad have no reliable way to check on parents living alone in Pakistan. What they use today fails:

- **Phone calls:** parents say "I'm fine" even when they are not. They hide health problems and loneliness so their children do not worry.
- **Relatives and neighbors:** they help as a favor. No schedule, no proof, no responsibility if they skip a visit. And asking them for proof would damage the relationship.
- **Emergencies:** when something goes wrong — a fall, a sudden illness — the family abroad often finds out days later.

The result: millions of families live with constant worry and guilt, and pay nothing to fix it, because nothing exists to pay for.

---

## 5. Market Context

- Remittances to Pakistan are over $30B per year — a proven, repeating flow of money from overseas Pakistanis to family at home.
- The payers (diaspora professionals aged 28–55 in the Gulf, UK, and US) are comfortable with technology, live on WhatsApp, and already pay for digital services in foreign currency.
- Elder care in Pakistan is almost completely informal. There is no big home-care brand, no verification system, and no existing company to beat. Our competition is the current habit of informal favors.
- *(Assumption)* Elder care stays mostly unregulated in Pakistan in the near term. This gives RozVisit time to set its own high standards before formal rules arrive.
- Helpful trends: the population is aging, working-age Pakistanis keep moving abroad, and people are now used to arranging in-person services remotely.

---

## 6. Target Audience

**The payer:** overseas Pakistanis, roughly aged 28–55, mainly in the UAE, Saudi Arabia, the UK, and the USA. Middle income or higher. Already sending money home. Worried — often guilty — about parents living alone.

**The person we visit:** their parents — aged 55 and above, living alone or with little support. The pilot starts in Islamabad/Rawalpindi.

---

## 7. Primary Users

| User | What they do in the product |
|---|---|
| Diaspora client | Picks a plan, schedules visits, sees proof and alerts, pays in foreign currency |
| Parent | Receives the visits. Talks to the caregiver, not the software. A profile in the system, not a login |
| Caregiver | Verified local visitor. Does visits, checklists, errands, and alarms through a simple mobile screen |
| Admin | Approves caregivers, watches visit performance, manages emergencies and complaints |

---

## 8. User Pain Points

**Diaspora client:**
- Cannot see a parent's true condition between phone calls.
- Cannot act from abroad — no way to get medicine delivered or a check done today.
- Worry and guilt grow over time. Every unanswered call feels like a small crisis.
- Informal helpers cannot be given a schedule or asked for proof without hurting the relationship.

**Parent:**
- Loneliness, and slowly losing the ability to manage alone — with no dignified way to ask for help.
- Does not want to feel "watched." Help must feel like company and support, not surveillance.

**Caregiver:**
- Informal care work today is unstable and badly paid. Good caregivers have no way to prove they are reliable and earn better work.

**Admin:**
- In this business, one trust failure can destroy everything. Operations needs verification, monitoring, and evidence tools from day one.

---

## 9. Value Proposition

**For the client:** *Verified eyes on your parents, on a schedule you control, with proof you can see and an emergency line you can trust — for less than one restaurant meal a week abroad.*

**For the parent:** a regular, respectful, familiar visitor who helps with real tasks — not a stranger with a clipboard.

**For the caregiver:** steady, fairly paid work with clear expectations, and a professional platform that builds their reputation.

The core exchange: clients pay in strong currency for certainty. The platform turns that into verified care work paid in rupees, and keeps a 60–70% share that funds the verification, coordination, and trust systems.

---

## 10. Product Principles

1. **Proof over promises.** Every visit produces evidence — in-app camera photos, checklists, timestamps. Trust is built from proof, not marketing.
2. **The emergency path is sacred.** The alarm system is the most protected part of the product (alerts in under 10 seconds, multiple channels). Anything else may slow down under load; this may not.
3. **Dignity for the parent.** The parent is a person, not a monitored object. Words, design, and caregiver training must never make the parent feel watched.
4. **Build for the weakest connection.** The caregiver on a cheap Android phone with slow 3G sets the baseline. If it works for them, it works for everyone.
5. **Prove it before building it.** Manual work comes before automation, everywhere. Phase 0 before Phase 1. Manual payment links before payment code. One city before two.
6. **Phase rules are real.** Features ship in their assigned phase. Sneaking extra features into the MVP is a planning mistake, not ambition.

---

## 11. Strategic Differentiation

RozVisit is not a listing site for freelance helpers, and not a medical nursing service. What makes it different is the **accountability layer**:

- Verified caregivers (ID check, background check, recorded interview) — not open sign-up.
- Visits that produce evidence — not self-reported ones.
- A managed emergency chain — not "call us if something happens."
- Billing built in the currency the payer actually earns — not a domestic product with foreign payment bolted on.

Nearby alternatives (general services marketplaces, Facebook groups, maid-finder services) all lack the three things — verification, proof, escalation — that a buyer living 3,000 kilometers away actually needs.

---

## 12. Key Competitive Advantages

1. **Trust as a moat.** A verified caregiver network with a track record is slow and costly to copy. It grows stronger city by city.
2. **Currency advantage.** Foreign-currency income against rupee costs gives healthy margins at prices that feel small to the payer.
3. **Demand that does not fade.** Care for one's parents is among the last expenses this audience would ever cut. Cancellation pressure is naturally low.
4. **The founder is on the ground.** Hands-on, founder-led work in the pilot city gives learning speed no remote competitor can match.
5. **Timing.** No organized player exists. The first brand that diaspora communities associate with "checking on parents back home" gets word-of-mouth growth almost for free.

---

## 13. MVP Definition

The MVP is deliberately small. It answers one question: can verified, proof-producing visits be sold, scheduled, done, and trusted?

**Phase 0 (no code):** manual proof of demand. Find 3–5 vetted caregivers in Islamabad/Rawalpindi. Sign up 5 paying diaspora families using WhatsApp and a spreadsheet. Collect payment with manual Payoneer links. All building waits until this works.

**Phase 1 (first software build):**
- Login for the three roles (client, caregiver, admin)
- Parent profile with location
- Visit scheduling with checklists
- Photo/video proof, taken only through the app camera
- Client picks their plan in the app; payment through a manual Payoneer link

**Not in the MVP:** GPS check-in, errands, the emergency system, the admin dashboard (Phase 2); live video (Phase 3); automatic payments (Phase 4); caching and scaling tools. English-only interface, with simple words and icons on caregiver screens.

---

## 14. Post-MVP Strategy

The six-phase roadmap adds capability in order of trust value:

- **Phase 2 — Operational trust:** GPS-verified check-ins, errands with receipts, the emergency alarm system, the admin dashboard. This phase makes the service provably reliable.
- **Phase 3 — Live trust:** live video check-ins, on-demand live view for premium clients, caregiver selfie checks, emergency live streaming. This phase makes the service feel present.
- **Phase 4 — Revenue maturity:** in-app checkout, wallet credit, sibling split billing, automatic refunds. This phase makes the business self-serve.
- **Phase 5 — Depth:** voice notes, simple health readings, the Urdu/English switch, family group access. This phase widens who can use it.
- **Phase 6 — Growth:** second city (Lahore), company and NGO partnerships, caregiver certification, foreign company registration plus Stripe.

The logic behind the order: each phase removes one kind of doubt. "Will they really show up?" (Phase 2). "Is that really my mother on the screen?" (Phase 3). "Can my brother in London split the cost?" (Phase 4).

---

## 15. Product Success Metrics

| Area | Measure | First target |
|---|---|---|
| Validation | Paying families signed up manually | 5 (this is the Phase 0 gate) |
| Reliability | Scheduled visits done on time | 95% or more (from Phase 2) |
| Trust | Completed visits with proof attached | 100% — a visit without proof does not count as complete |
| Emergency | Time from alarm to client alert | Under 10 seconds |
| Retention | Clients still subscribed each month | 90% or more *(Assumption — real target set after Phase 0–1 data)* |
| Caregiver quality | Average caregiver rating | 4.5 out of 5 or more |
| Money | Platform share per visit/errand | 60–70% maintained |
| Growth | New clients coming from referrals | Measured from Phase 2; target set after we have a baseline |

---

## 16. North-Star Metric

**Verified visits completed per week.**

*(Recommendation — proposed by the technical team, open to founder override.)*

Why this number: it only goes up when everything works at once — clients paying, caregivers showing up, proof being captured. Revenue follows it automatically, because visits are tied to paid plans. Quality is built into it, because only on-time visits with proof count as "verified." Every phase of the roadmap exists to raise this number or protect its quality.

---

## 17. Risks and Assumptions

**Main risks and how we answer them:**

| Risk | Answer |
|---|---|
| Families do not trust a stranger in a parent's home | Strong checks (ID, background, recorded interview, references); insurance before Phase 2 growth *(Open — provider not chosen yet)* |
| Caregivers skip visits or cheat | GPS check-ins, camera-only proof, monitoring, backup caregivers, ratings that can remove a caregiver |
| Payment tool stops working | Payoneer confirmed for Phases 1–4; a Stripe path is defined for later; the code is built so payment providers can be swapped |
| Trust grows slowly in the pilot | Deliberate single-city start with the founder personally involved |
| New government rules arrive | We write our own standards early, including recorded parent consent at the first visit |
| A data leak of sensitive elder data | Encryption at rest, secure connections, role-based access, cleaned logs, limited admin permissions |

**Assumptions the plan depends on:**
- Enough trustworthy caregivers can be found in Islamabad/Rawalpindi.
- Diaspora clients will pay a repeating foreign-currency fee for non-medical wellbeing visits. Phase 0 exists to test exactly this.
- Payoneer keeps working as our payment channel through Phase 4.
- The founder can keep building part-time with no funding through Phase 1. Timelines show order, not promised dates.

---

## 18. Long-Term Product Vision

RozVisit becomes the trusted presence layer for families split across countries: any family with members abroad and elders at home can arrange verified in-person care, see daily proof of wellbeing, and reach a vetted human within minutes in an emergency. On the caregiver side, "RozVisit caregiver" becomes a respected credential — proof of verified reliability that opens doors across the home-services economy.

---

## 19. Three-Year Strategic Direction

**Year 1 — Prove and harden (Phases 0–4).** One city. Manual validation, the MVP, operational trust features, live video, payment automation. We exit Year 1 when: visits complete on time 95%+ of the time, retention is measured, and the money model is proven at real volume.

**Year 2 — Repeat the playbook (Phases 5–6).** Second and third cities (Lahore, then Karachi, order guided by pilot learnings). Caregiver certification. Company and NGO partnership channels. Foreign company registration and the Stripe switch, once revenue covers the cost. Urdu UI and family group access widen the customer base.

**Year 3 — Extend the model.** The same playbook — payer abroad, verified caregiver network at home — fits other communities with the same structure: Indian and Bangladeshi diasporas first. Native mobile apps and connected health devices are evaluated. AI that notices worrying patterns in visit checklists (as a wellbeing signal only, never a diagnosis) becomes a data advantage that simple marketplaces cannot copy.

*(Recommendation)* Year 2–3 plans should be re-checked against Year 1 real results at each phase boundary — they are direction, not fixed commitments.

---

## 20. What RozVisit Will Not Do Initially

1. **No medical services.** Caregivers visit, help, and run errands. They do not diagnose, treat, or give medicine. No medical claims of any kind.
2. **No open marketplace.** Caregivers cannot sign themselves up and list their services. Every caregiver passes our verification process. Quality is curated, not crowdsourced.
3. **No native mobile apps at launch.** Web app only, until real usage justifies the investment.
4. **No countries beyond Pakistan.** Service delivery is Pakistan-only. Other corridors are a Year 3 question.
5. **No building our own insurance.** Caregiver liability coverage comes from an outside provider, never built in-house.
6. **No payment code before Phase 4.** Manual Payoneer links until proven revenue justifies automation.
7. **No Urdu interface at MVP.** Softened by simple-word, icon-supported caregiver screens and in-person pilot training. The Urdu switch arrives in Phase 5.
8. **No discounting below our margin.** The 60–70% platform share is a design rule, not an opening offer to negotiate away for growth.

---

*End of Document 02 — RozVisit Product Vision and Strategy*
