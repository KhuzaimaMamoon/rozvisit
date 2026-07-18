# RozVisit — User Personas
### Document 04

**Sources:** Document 00 (Canonical Brief), Document 02 (Vision and Strategy), Document 03 (Business Requirements).
**Labels:** Everything here is confirmed unless marked *(Assumption)*, *(Recommendation)*, or *(Open)*.
**Purpose:** These personas are working tools, not decoration. Every persona below exists to answer real design and build questions. Each one ends with the product decisions it directly affects.

**Note on realism:** The people are fictional, but every trait is grounded in the confirmed user definitions (Document 00, Section 6) and the pilot context (Islamabad/Rawalpindi, diaspora payers in the Gulf/UK/US). Traits that are educated guesses are marked *(Assumption)*.

---

## Part A — Primary Personas

These are the people the MVP is built for. If a design choice helps them, it is probably right.

---

### Persona 1 — Ayesha (The Diaspora Daughter) — PRIMARY PAYER

| Field | Detail |
|---|---|
| Name | Ayesha Khan |
| Role | Diaspora client (payer) |
| Age range | 30–40 |
| Location context | Marketing manager in Dubai, UAE. Grew up in Rawalpindi. Her widowed mother (67) lives alone in the family home there. Ayesha visits Pakistan once or twice a year. |
| Digital literacy | High. Lives on WhatsApp, Instagram, and banking apps. Pays for Netflix, Careem, and online groceries without thinking about it. |

**Goals**
- Know, with proof, that her mother is okay this week.
- Be able to act from Dubai: get medicine delivered, get a check done today, get a doctor visited.
- Reduce the guilt of being far away.

**Motivations**
- Love and duty. In her culture, caring for parents is a core obligation, and distance makes her feel she is failing at it.
- She already sends money home monthly. Spending some of it on verified care feels like finally spending it on the right thing.

**Pain points**
- Her mother says "I'm fine, beta" on every call, even when she is not.
- The neighbor who "keeps an eye" cannot be given a schedule or asked for photos without insulting her.
- When her mother had a fall last year, Ayesha found out three days later.

**Current behaviour**
- Calls her mother 2–3 times a week. Messages a cousin occasionally to "check in on Ammi."
- Active in Dubai-Pakistani Facebook and WhatsApp groups — where she would first hear about RozVisit.

**Devices used**
- iPhone (recent model), work laptop. Fast internet everywhere.

**Accessibility needs**
- None significant. Reads English comfortably; prefers short, clear updates over long text.

**Trust concerns**
- "Who exactly is this person entering my mother's house?" She needs to see the caregiver's verification: photo, ID-checked badge, rating, history.
- She will read reviews and ask her community before paying.

**Privacy concerns**
- Wants her mother's address, health notes, and photos protected. Would be furious if visit photos leaked.
- Wants to know who inside RozVisit can see her family's data.

**Typical scenarios**
1. Sunday evening: opens the app, sees Tuesday's and Friday's visit photos, reads the checklist notes ("medication taken, mood good"), feels relief.
2. Her mother mentions running low on blood-pressure tablets. Ayesha requests a pharmacy errand from her office desk. (Phase 2)
3. Her phone buzzes with an emergency alert. She sees the caregiver's note and live status while calling her mother. (Phase 2–3)

**Success definition**
- She stops dreading the phone. Verified proof arrives on schedule. In an emergency, she knows within seconds, not days.

**Most valuable features**
- Visit photo/video proof feed. Checklist summaries. Emergency alerts. Simple foreign-currency payment. Caregiver profile with verification badge.

**Adoption barriers**
- Trust in an unknown brand. Answer: verification transparency, community word-of-mouth, referral from someone she knows.
- Fear her mother will refuse "being checked on." Answer: framing the visit as help and company (Product Principle 3).

**Product decisions this persona drives**
- The client portal leads with the visit-proof feed, not settings or billing.
- Caregiver profiles must show verification status openly.
- Payment must be in her currency (AED) with familiar, simple steps.
- Notifications must be calm and useful — proof of wellbeing, not anxiety triggers.

---

### Persona 2 — Bilal (The Caregiver) — PRIMARY FIELD USER

| Field | Detail |
|---|---|
| Name | Bilal Ahmed |
| Role | Caregiver (verified field agent) |
| Age range | 22–30 |
| Location context | Rawalpindi. Social-work graduate. Currently does informal part-time care and odd jobs. Travels by motorbike. |
| Digital literacy | Moderate. Fluent in WhatsApp, YouTube, and JazzCash. Not used to complex apps or long English text. *(Assumption — matches the confirmed caregiver profile: budget Android, patchy internet, simple UI need.)* |

**Goals**
- Steady, fairly paid work with clear instructions.
- Build a visible reputation so he earns more and better assignments over time.

**Motivations**
- Income stability first. Pride in the work second — being trusted by families abroad is a respected position.

**Pain points**
- Informal care work is unpredictable: no schedule, late payment, no proof of his reliability.
- English-heavy apps slow him down and cause mistakes.

**Current behaviour**
- Finds work through word-of-mouth and WhatsApp. Keeps his own notes on paper or in chat messages.

**Devices used**
- Budget Android phone (2–3 years old, 2–3 GB RAM). Mobile data only, often 3G, sometimes offline in stairwells and basements.

**Accessibility needs**
- Simple English with icons (Decision D-09). Big touch targets. Screens that survive slow networks: quick loading, upload retries, clear progress.

**Trust concerns**
- Will he be paid on time, and is the pay calculation visible? He needs to see each verified visit and what it earned him.
- Fair treatment when something goes wrong that is not his fault (parent asleep, wrong address, client unreachable).

**Privacy concerns**
- His CNIC and background-check documents are sensitive. He needs to know they are stored safely and shown only as a "verified" badge, not as raw documents.

**Typical scenarios**
1. Morning: opens the app, sees today's two visits with addresses and times. Taps one for the checklist preview.
2. At the house: checks in (GPS from Phase 2), completes the checklist, takes photos through the app camera. The upload pauses on weak signal and finishes automatically when signal returns.
3. He notices the parent seems unwell and confused. He presses the emergency button and follows the on-screen steps. (Phase 2)

**Success definition**
- He knows his day at a glance, finishes visits without app friction, and gets paid what he expects, when he expects it.

**Most valuable features**
- Today's visit list. One-screen checklist. Camera capture that works on weak internet. Clear per-visit earnings. Emergency button that is impossible to miss.

**Adoption barriers**
- App complexity and English. Answer: minimal-text, icon-led design, in-person pilot training.
- Fear of unfair penalties. Answer: flag-for-review rules instead of automatic punishment (matches the confirmed GPS rule: flag, do not reject).

**Product decisions this persona drives**
- The caregiver app is built for the weakest phone and network first (Product Principle 4).
- Uploads must queue and retry — never silently fail.
- Checklists are tap-based, not typing-based, wherever possible.
- Earnings per visit are always visible.

---

## Part B — Secondary Personas

Important people the product touches, who are not direct MVP build targets.

---

### Persona 3 — Amina Bibi (The Parent) — THE PERSON VISITED

| Field | Detail |
|---|---|
| Name | Amina Bibi |
| Role | Parent / beneficiary (a profile in the system, not a login) |
| Age range | 60–75 |
| Location context | Lives alone in the family home in Rawalpindi. Her daughter Ayesha is in Dubai; her son is in the UK. A part-time cleaner comes twice a week. |
| Digital literacy | Low. Uses WhatsApp voice notes and video calls with help. Does not install or manage apps. |

**Goals**
- Stay independent in her own home.
- Not be a "burden" on her children.
- Company. Someone to talk to.

**Motivations**
- Dignity. She will accept help framed as company and assistance. She will resist anything that feels like surveillance or an insult to her independence.

**Pain points**
- Loneliness. Small tasks getting harder (pharmacy trips, bill payments, heavy shopping).
- She hides health issues to protect her children from worry — the exact behaviour that makes RozVisit necessary.

**Current behaviour**
- Talks to her children on WhatsApp video. Relies on neighbors for small favors, and dislikes asking.

**Devices used**
- A simple smartphone, used mainly for WhatsApp calls. She is not a user of the RozVisit app at all.

**Accessibility needs**
- None in software (she does not use it). In service design: the caregiver must speak Urdu/Punjabi, be patient, and be the same person consistently.

**Trust concerns**
- "Who is this stranger in my house?" The first visit matters enormously. A consistent, familiar caregiver matters more than any feature.

**Privacy concerns**
- Photos inside her home. She must understand and agree to what is captured and who sees it. Her recorded consent at onboarding is mandatory (BR-025).

**Typical scenarios**
1. Tuesday 10 a.m.: Bilal visits, they have tea, he checks her medicine box, takes two photos with her knowledge, and leaves in 30 minutes. She enjoyed the company.
2. She feels dizzy during a visit. Bilal raises the alarm; her daughter is alerted within seconds. She is embarrassed but grateful.

**Success definition**
- She looks forward to the visits. She never feels spied on. Her children worry less, and she can feel that.

**Most valuable "features"** (service, not software)
- The same caregiver every time. Visits framed as company. Consent she understands. The caregiver's help with real tasks.

**Adoption barriers**
- Refusing the service out of pride. Answer: onboarding language centered on help and company; the adult child introduces the caregiver personally (in person or on a video call) at the first visit. *(Recommendation — add this introduction step to the Phase 0 operations checklist.)*

**Product decisions this persona drives**
- Caregiver continuity: the system prefers assigning the same caregiver to the same parent.
- Consent capture is a real onboarding step, not a checkbox.
- Checklist wording is respectful ("mood," "comfort," "company") — never clinical or surveillance-flavored.

---

### Persona 4 — Faisal (The Split-Billing Brother) — FUTURE PAYER (PHASE 4–5)

| Field | Detail |
|---|---|
| Name | Faisal Khan |
| Role | Linked family member (Ayesha's brother) |
| Age range | 35–45 |
| Location context | NHS pharmacist in Manchester, UK. Shares responsibility for their mother with Ayesha. |
| Digital literacy | High. |

**Goals**
- Share the cost and the visibility fairly with his sister.
- See the same proof feed she sees, without managing anything.

**Pain points**
- Today, Ayesha manages everything and he sends her money informally. He feels out of the loop.

**Trust and privacy concerns**
- Same as Ayesha. Additionally: clear rules about what a "linked member" can see and do versus the paying owner.

**Success definition**
- He pays his share in GBP automatically and sees the feed. No coordination overhead with his sister.

**Most valuable features**
- Family group access (Phase 5). Split billing (Phase 4).

**Product decisions this persona drives**
- The database stores linked family members from day one (Decision D-02), even though the app ignores them until Phase 5.
- Permissions design must define viewer versus owner roles before Phase 5 begins.

---

## Part C — Administrative Personas

---

### Persona 5 — Nasreen (The Operations Lead) — ADMIN

| Field | Detail |
|---|---|
| Name | Nasreen Shah |
| Role | Admin / operations lead *(Open — this role is currently filled by the founder; hiring it is the most urgent open item)* |
| Age range | 30–50 |
| Location context | Islamabad. Manages caregiver verification, visit quality, and emergencies. |
| Digital literacy | High for dashboards and spreadsheets. Not a developer. |

**Goals**
- Approve only caregivers she would send to her own mother.
- Spot problems (late check-ins, missed visits, bad ratings) before clients notice them.
- Resolve every emergency fast, with a clean record of what happened.

**Pain points**
- Verification is manual and careful — she needs the pipeline organized, not scattered across chats and folders.
- Emergencies can happen at any hour. She needs alerts that reach her reliably, and a timeline view that shows the whole situation at a glance.

**Devices used**
- Laptop for the dashboard; phone for after-hours alerts.

**Trust concerns**
- The evidence trail. When a client complains, she needs proof records that settle the matter fairly.

**Privacy concerns**
- She handles the most sensitive data in the company (CNICs, medical notes, home addresses). Least-privilege access rules exist for exactly this role's future teammates.

**Typical scenarios**
1. Reviews a new caregiver: checks the CNIC record, watches the interview video, calls a reference, approves — the caregiver's badge flips to Verified.
2. A visit checks in 40 minutes late. The dashboard flags it; she messages the caregiver, then notes the reason on the visit record.
3. An emergency fires at 11 p.m. Her phone alerts her; she opens the timeline, sees the caregiver's note and the client already alerted, and coordinates next steps.

**Success definition**
- 95%+ on-time visits. Zero unverified caregivers ever active. Every emergency has a complete, honest timeline.

**Most valuable features**
- Verification pipeline. SLA dashboard with flags. Emergency timeline view. Complete visit evidence records.

**Adoption barriers**
- None significant — this is an internal role. The risk is tool sprawl; the dashboard must genuinely replace spreadsheets, not sit next to them.

**Product decisions this persona drives**
- The admin dashboard (Phase 2) is data-dense by design — tables, flags, timelines — not a consumer-style interface.
- The verification pipeline is a first-class feature, not a settings page.
- Every admin action on a record is logged (who did what, when).

---

## Part D — Edge-Case Personas

These personas exist to stress-test decisions. They are less common, but designing around them prevents real failures.

---

### Persona 6 — Tariq (The Reluctant Parent) — EDGE CASE

| Field | Detail |
|---|---|
| Name | Tariq Mehmood |
| Role | Parent / beneficiary |
| Age range | 65–80 |
| Context | Retired government officer in Islamabad. Proud, private, sharp. His son in Riyadh bought a plan without fully asking him first. |

**The problem he creates:** he refuses the first visit. "I do not need a babysitter."

**Why he matters:** if the product has no answer for refusal, the son's subscription dies at visit one, and word spreads that "parents hate it."

**What he needs**
- To be asked, not told. His recorded consent (BR-025) is not paperwork — it is the moment the service is accepted or rejected.
- Framing: the caregiver is introduced as help for tasks he chooses, not monitoring.
- Control: he can set visit times, refuse photos in certain rooms, and stop the service any time.

**Success definition**
- By visit three, he has tea ready when the caregiver arrives.

**Product decisions this persona drives**
- Consent capture must include the parent's own choices (visit times, photo boundaries) — not just a yes/no.
- A "parent declined visit" outcome exists in the visit statuses, handled without penalty to the caregiver, with the client informed honestly.
- Onboarding guidance for clients: talk to your parent first. *(Recommendation — include this in client onboarding copy.)*

---

### Persona 7 — Saima (The Low-Connectivity Caregiver) — EDGE CASE

| Field | Detail |
|---|---|
| Name | Saima Riaz |
| Role | Caregiver |
| Age range | 25–35 |
| Context | Covers parents in older neighborhoods with thick-walled houses and dead zones. Her data package runs out some months. |

**The problem she creates:** visits completed in places where the app cannot reach the internet at all.

**What she needs**
- The checklist and camera must work fully offline, storing everything on the phone.
- Everything syncs automatically when signal returns, with clear "saved / waiting to send / sent" states.
- GPS check-in (Phase 2) must tolerate delayed submission without treating her as a cheat — the flag-for-review rule, not auto-rejection.

**Success definition**
- She never loses work she already did, and never gets blamed for the network.

**Product decisions this persona drives**
- Offline-first design for the caregiver visit flow is a Phase 1 requirement, not a nice-to-have. *(Recommendation — record this as a technical requirement in the next document.)*
- Visit proof carries capture time from the device, shown alongside upload time, so late syncs stay honest and verifiable.

---

### Persona 8 — Kevin (The Non-Urdu Speaking In-Law) — EDGE CASE

| Field | Detail |
|---|---|
| Name | Kevin O'Brien |
| Role | Diaspora client (payer) |
| Age range | 35–50 |
| Context | Irish husband of a Pakistani doctor in Toronto. His mother-in-law is in Rawalpindi. His wife works hospital shifts, so Kevin manages the family admin — including RozVisit. |

**The problem he creates:** a payer with zero Urdu and no cultural context for what a "normal" visit looks like.

**What he needs**
- The entire client experience in clear English (already the Phase 1 default).
- Checklist summaries that explain, not assume ("medication reminder given" rather than culturally implicit notes).
- Support that does not assume he understands Pakistani logistics.

**Success definition**
- He can run the whole service confidently without ever needing his wife to translate.

**Product decisions this persona drives**
- Client-facing text avoids Urdu-only terms without explanation.
- Visit summaries are written to be understood by someone with no context — which also makes them better for everyone.

---

## Part E — Persona-to-Module Mapping

Which personas each module must be designed around:

| Module (Document 00, Section 8) | Primary personas | Secondary / edge |
|---|---|---|
| 1. Auth | Ayesha, Bilal, Nasreen | Kevin |
| 2. User & Role | Nasreen | Faisal (linked-member rules, Phase 5) |
| 3. Visit Scheduling (checklists, proof) | Ayesha, Bilal | Amina Bibi (respectful wording), Tariq (declined-visit status), Saima (offline capture) |
| 4. Errand | Ayesha, Bilal | Amina Bibi (task types) |
| 5. Emergency | Ayesha, Bilal, Nasreen | Amina Bibi (dignity during an emergency) |
| 6. Billing & Subscription | Ayesha | Faisal (split billing, Phase 4), Kevin (clear English billing) |
| 7. Admin Operations | Nasreen | Bilal (fair-review rules), Tariq (consent records) |
| 8. Notifications | Ayesha, Nasreen | Bilal (SMS fallback), Kevin (plain-English alerts) |

---

## Summary of Product Decisions Driven by These Personas

1. Client portal leads with the proof feed (Ayesha).
2. Caregiver app is offline-tolerant, icon-led, big-target, weak-network-first (Bilal, Saima).
3. Same-caregiver continuity is a scheduling preference in the system (Amina Bibi).
4. Consent is a rich onboarding step with parent choices, and "parent declined" is a real visit status (Amina Bibi, Tariq).
5. Linked family members exist in the database from day one (Faisal, Decision D-02).
6. Admin dashboard is dense, flag-driven, and fully logged (Nasreen).
7. All client-facing text works for a reader with no Pakistani context (Kevin).
8. Earnings visibility per visit is a caregiver-side requirement (Bilal).

*(Recommendation)* Two new items surfaced by the edge cases should be added as technical requirements in the next document: offline-first caregiver visit flow (Saima) and the "parent declined visit" status with no-fault handling (Tariq).

---

*End of Document 04 — RozVisit User Personas*
