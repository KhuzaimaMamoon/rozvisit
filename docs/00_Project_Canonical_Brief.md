# RozVisit — Canonical Project Brief
### Document 00 — The Single Source of Truth for All Project Documents

**What this document is:** Everything decided about RozVisit so far, collected in one place. All future documents must follow this one.

**How to read the labels:** Everything in this document is a confirmed decision, unless it is marked *(Assumption)*, *(Recommendation)*, or *(Open)*. Confirmed means the founder said yes to it. A recommendation stays a recommendation until the founder approves it.

---

## 1. Project Name

**RozVisit** — made from the Urdu word "roz" (daily) and the English word "visit." It is a made-up word. We chose a made-up word on purpose, so no other company is likely to already own the name.

Two earlier names were rejected:
- "HomeBridge" — rejected. A well-known open-source software project already uses this name.
- "CareLine" — rejected. A cosmetics brand already uses this name, and other companies have registered it as a trademark.

*(Assumption)* We recommended checking the name officially (domain check on Namecheap or GoDaddy, trademark check with IPO Pakistan and USPTO). The founder has not yet confirmed this was done.

---

## 2. Product Vision

RozVisit is a subscription service. Overseas Pakistanis pay a monthly fee. In return, a verified local caregiver visits their aging parents in Pakistan on a schedule. The caregiver sends photo and video proof of each visit, runs small errands, and raises an alarm right away if something is wrong.

Working tagline: *"Because you can't be there — but someone trustworthy can."*

Brand feel: warm, trustworthy, calm, dependable. This is an emotional product. It should never feel cold like a hospital, or silly like a game.

---

## 3. The Exact Problem We Are Solving

Adult children working abroad have no reliable way to know if their parents in Pakistan are okay day to day. What they use today does not work well:

- **Phone calls** — parents say "I'm fine" even when they are not. They hide health problems, missed medicine, and loneliness so their children do not worry.
- **Relatives and neighbors** — they help as a favor. There is no schedule, no proof, and no one is responsible if they skip a check.
- **Emergencies** — when something bad happens, like a fall, the family abroad often finds out days later. There is no alarm system.

---

## 4. Target Market

**Who pays:** Pakistanis living abroad — mainly in the UAE, Saudi Arabia, the UK, and the USA. Age around 28 to 55. They already send money home. Pakistan receives more than $30 billion in remittances every year, which proves this group spends money on family back home.

**Where the service happens:** Pakistan.

---

## 5. Target Cities

**Pilot city:** Islamabad/Rawalpindi (confirmed through Decision D-01).
**Later expansion (Phase 6):** Lahore first, then Karachi, Faisalabad, and more.

---

## 6. Target Users

| User | Who they are |
|---|---|
| Diaspora client (the payer) | Age 28–55, comfortable with technology, pays in USD/GBP/AED/SAR, buys because of trust |
| Parent (the person visited) | Age 55+, lives alone or with little support, needs respect and simplicity |
| Caregiver (the visitor) | Local person, uses a cheap Android phone, often has weak internet, needs a fast and simple app |
| Admin (our operations team) | Internal staff, needs a dashboard full of data to watch visits and emergencies |

Example people (personas) are written in the SRAD document: "Ayesha" (a client in Dubai), "Bilal" (a caregiver in Rawalpindi), "Nasreen Shah" (operations lead).

---

## 7. User Roles in the System

The software has three login roles:

1. `client` — the diaspora payer
2. `caregiver` — the verified visitor
3. `admin` — our operations staff

The parent does not log in. The parent is a profile in the system, not an account.

---

## 8. Core Product Modules

The system is split into eight parts (from SRAD Section 20):

1. Auth Module — login and accounts
2. User & Role Module — who can do what
3. Visit Scheduling Module — booking visits, checklists, photo/video proof
4. Errand Module — errand requests, receipts, repayment
5. Emergency Module — alarms and fast alerts
6. Billing & Subscription Module — plans and payments
7. Admin Operations Module — caregiver approval, visit monitoring
8. Notification Module — push messages, SMS, WhatsApp

---

## 9. User Journeys

How each person uses the product:

- **Client:** signs up → creates a parent profile → picks a plan → schedules visits → sees live updates from each visit → gets emergency alerts.
- **Caregiver:** gets a visit assignment → checks in with GPS at the house → fills the checklist and takes photos/video inside the app → checks out → gets paid for each verified visit.
- **Emergency:** caregiver or client presses the alarm → the client and admin are alerted in under 10 seconds → SMS, push, and WhatsApp messages go out → admin manages the situation until it is resolved.
- **Admin:** approves caregivers (ID card check, background check, video interview) → watches visit performance → handles complaints.

---

## 10. Business Model

Monthly plans, paid in foreign currency:

| Plan | Visits | Errands | Price (US dollars, example range) |
|---|---|---|---|
| Basic | 1 per week | none | $25–35 per month |
| Standard | 3 per week | 1 per week included | $60–80 per month |
| Premium | Daily | Unlimited, plus doctor-visit priority | $120–150 per month |

Prices stay as ranges until Phase 0 gives us real evidence of what people will pay (Decision D-03).

Extra income: pay-per-errand add-ons, a one-time emergency call-out fee for non-subscribers, and partnerships with companies and NGOs.

Why the money works: clients pay in strong currencies (USD/GBP/AED/SAR). Caregivers are paid in Pakistani rupees. The platform keeps 60–70% of each visit or errand fee.

Phase 4 will add: a wallet (pre-loaded credit), split billing (brothers and sisters share one parent's cost), and automatic refunds for missed visits.

---

## 11. MVP Scope (Phases 0–1)

MVP means "minimum viable product" — the smallest version that works.

**Phase 0 (no code at all):** prove people will pay. Find 3–5 checked caregivers in Islamabad/Rawalpindi. Sign up 5 paying diaspora families using only WhatsApp and a spreadsheet. Collect payment through manual Payoneer links.

**Phase 1 (first version of the software):**
- Login for the three roles
- Create a parent profile with location on a map
- Schedule visits with a checklist
- Photo/video proof taken only through the app camera (no gallery uploads — this stops fake proof)
- Client picks their plan in the app; payment still happens through a manual Payoneer link (Decision D-04)

**Not in the MVP:** GPS check-in, errands, the emergency system, and the admin dashboard (all Phase 2). Live video (Phase 3). Automatic payments (Phase 4). Caching and scaling tools (later). The app is English-only at Phase 1, with simple words and icons on caregiver screens (Decision D-09).

---

## 12. Future Scope (Phases 2–6)

- **Phase 2:** GPS check-in/out, errands, the emergency alarm system, the admin dashboard.
- **Phase 3:** live video check-ins, "see them now" live camera for premium clients, caregiver live selfie check at arrival, emergency live streaming.
- **Phase 4:** in-app Payoneer checkout, wallet, split billing, automatic refunds.
- **Phase 5:** caregiver voice notes, simple health readings (blood pressure, sugar), Urdu/English language switch, family group access.
- **Phase 6:** more cities, company and NGO partnerships, a caregiver training and certificate program, a foreign company registration plus Stripe payments.
- **Long-term ideas:** native mobile apps, connected health devices, expansion to Indian and Bangladeshi diaspora, and AI that notices worrying patterns in visit checklists (as a wellbeing signal only — never a medical diagnosis).

---

## 13. Confirmed Technology Stack

| Layer | Choice |
|---|---|
| Database | MongoDB 7.x with Mongoose; supports location-based search (2dsphere indexes) |
| Backend | Node.js 20 LTS with Express.js; REST API with versions (`/api/v1`) |
| Frontend | React 18 (built with Vite 8.1.5); Tailwind CSS for styling |
| Real-time updates | Socket.io |
| Login security | JWT tokens (15-minute access token, 7-day refresh token in a secure cookie); passwords hashed with bcrypt |
| Photo/video storage | Cloudinary for Phases 1–4; look at S3 again in Phase 5 (Decision D-05) |
| Payments | Payoneer for Phases 1–4; Stripe only after a foreign company is registered |
| Messages | Firebase (push), Twilio (SMS), WhatsApp Business API |
| Live video | WebRTC through Daily.co (Phase 3; vendor may be checked again at Phase 3 start) |
| Code checker (linter) | Oxlint — this is the newest decision, made during setup. It replaces the older ESLint choice written in the SRAD (see Section 22) |
| Code formatter | Prettier |
| Testing | Jest (small unit tests), Supertest with an in-memory MongoDB (integration tests), Playwright (full user-journey tests) |
| Build and deploy pipeline | GitHub Actions |
| Hosting (Phases 0–1) | Render free tier + MongoDB Atlas free M0 tier (Decision D-06). The free server sleeps when idle, so the first request can be slow. We accept this until we have revenue |
| Code storage | GitHub, private repository, one repo with `/server`, `/client`, and `/docs` folders |

---

## 14. Confirmed Architecture Decisions

- **One application, well organized** — not microservices. The code is layered: routes → controllers → services → repositories. Each layer has one job. If we need to split parts out later for scale, the layers make that possible without rewriting.
- **The API keeps no memory of sessions** (stateless, using JWT). This lets us run more copies of the server side by side later.
- **Events for side effects.** When a visit finishes, the system fires an event like `visit.completed`. The notification system listens for it. This keeps the core code clean.
- **Design patterns used:** Repository, Service Layer, Factory (for notification channels), Observer (for events), Strategy (for swapping payment providers), Middleware Chain.
- **Scaling grows with the phases:** one server (Phases 0–1) → load balancer plus database replicas (Phases 2–3) → Redis cache and background job queue (Phases 4–5) → splitting out heavy parts (Phase 6+).
- **The emergency system is the most protected part.** Alerts must arrive in under 10 seconds, through more than one channel, so a single failure never silently drops an alarm.

---

## 15. Confirmed UI/UX Decisions

- The product should look like a calm, clean, professional dashboard (like Linear or the Stripe Dashboard) — not like a social media app.
- Layout: a 240px sidebar (can collapse) plus a top bar, used the same way in all three portals.
- Status is always shown with a color **and** a text label. Never color alone (this helps colorblind users).
- Fixed spacing sizes: 4, 8, 12, 16, 20, 24, 32, 48 pixels. One main action button per page.
- Fonts: Inter for everything; Noto Nastaliq Urdu for Urdu screens in Phase 5.
- Component tools: shadcn/ui with Radix, Recharts for charts, lucide-react for icons.
- Mockups already made and colored with the final palette: login, dashboard, caregiver list, schedule-visit form with a popup, and profile.
- Dark mode: approved as suitable, mainly for admin staff watching screens for long hours.
- There is now only **one** color palette for everything (Section 16). The earlier idea of separate brand and product palettes is closed.

---

## 16. Design Palette (Mandatory — Latest Approved)

| Role | Hex |
|---|---|
| Primary | `#315A67` |
| Primary Soft | `#E7F0F2` |
| Accent | `#7AA6B2` |
| Background | `#F8FAF9` |
| Surface | `#FFFFFF` |
| Text | `#18232A` |
| Muted Text | `#6B7C85` |
| Border | `#DCE5E8` |
| Success | `#3F8F6B` |
| Pending | `#8A7A5C` |
| Emergency | `#C94A44` |

This palette replaces every earlier one: the teal/gold (v1), the navy/terracotta (v2), the indigo (v3), and the bright blue used in the first mockups. All future documents and code must use only this table, plus lighter or darker shades of these same colors where the design system defines them.

Logo: a heart-shaped map pin with a small house and signal arcs inside (`Rozvisit_Logo_Final.svg`). The logo will be re-made in this final palette (Decision D-08), because the current file still uses old colors.

---

## 17. Security Requirements

- Passwords are hashed with bcrypt (strength 10 or higher). Never stored or logged as plain text.
- Login uses short-lived JWT tokens plus a secure refresh cookie.
- Every protected action is checked on the server. Hiding a button in the app is not security.
- Sensitive data (medical notes, addresses, photos) is encrypted at rest with AES-256.
- All connections use TLS 1.2 or higher (https).
- Login endpoints have rate limits to block password-guessing attacks.
- All input is cleaned to block database injection attacks. React's built-in escaping blocks script injection.
- If a caregiver's GPS location looks wrong at check-in, the visit is flagged for admin review — not silently rejected, and not silently trusted.
- Photos and videos can only be taken with the app camera. This stops fake or old images being used as proof.
- Logs never contain passwords, tokens, or full medical notes.
- As the team grows, each admin gets only the permissions they need — not full access for everyone.

---

## 18. Real-Time Features

- Socket.io sends live updates: visit progress, emergency alerts, and live status on the admin dashboard.
- Emergency alerts must reach the client in under 10 seconds.
- Emergency messages go out on four channels at once: socket, Firebase push, Twilio SMS, and WhatsApp. If one fails, the others still deliver.
- Phase 3 adds live video (WebRTC through Daily.co): scheduled video check-ins, on-demand live view for premium clients, and emergency live streaming.

---

## 19. Third-Party Integrations

| Service | When it starts | Status |
|---|---|---|
| Payoneer | Phase 1 (manual links) → Phase 4 (in-app) | Confirmed. Chosen because it costs nothing up front, and Stripe does not accept Pakistan-registered businesses |
| Cloudinary | Phase 1 | Confirmed for Phases 1–4 (Decision D-05) |
| Firebase push messages | Phase 1 | Confirmed |
| Twilio SMS | Phase 2 | Confirmed |
| WhatsApp Business API | Phases 2–3 | Confirmed |
| Daily.co (live video) | Phase 3 | Confirmed; vendor may be reviewed again at Phase 3 start |
| Stripe (through a US/UK company) | After Phase 6 | Confirmed as a future step. The trigger is enough revenue to justify the cost of registering a foreign company |

---

## 20. Assumptions

- Diaspora clients have smartphones and stable internet.
- Enough trustworthy, checkable caregivers can be found in Islamabad/Rawalpindi.
- Payoneer keeps working as our way to receive money through Phase 4.
- Elder care stays mostly unregulated in Pakistan for about the next 12 months. We write our own standards early, so we are ready if rules come.
- The founder is a final-year student, building part-time with no funding. All timelines show the order of work, not promised dates.
- Phase 0 (manual validation) is not finished yet. All building phases wait for it.

---

## 21. Open Questions

Resolved through the Decision Log (Document 01, all approved):
1. Pilot city: Islamabad/Rawalpindi (D-01).
2. Media storage: Cloudinary for Phases 1–4 (D-05).

Still open (these do not block writing documents):
3. Domain and social media handles (rozvisit.com / rozvisit.pk) — recommended, not yet done.
4. Trademark check (IPO Pakistan at least) — recommended, not yet done.
5. Caregiver app: mobile web is confirmed for the MVP. The point where we would build a native app is not defined.
6. Insurance for caregivers — needed before Phase 2 grows; no provider chosen yet.
7. Who runs Phase 0 operations (finding and checking caregivers)? An operations lead is the most urgent hire; not resolved.

---

## 22. Contradictions Found in Previous Discussions

| # | Conflict | How it was resolved (the newest confirmed decision wins) |
|---|---|---|
| 1 | The color palette changed four times: teal/gold → navy/terracotta → indigo → bright blue mockups → the final table | The Section 16 palette is now the only one. All others are retired |
| 2 | The SRAD says ESLint; during setup, Oxlint was chosen instead | Oxlint is the confirmed linter. Prettier still formats the code. *(Recommendation)* Update SRAD Section 49 to match |
| 3 | The final logo file was made with old colors | The logo will be re-made in the final palette (Decision D-08, approved) |
| 4 | Earlier documents kept two palettes: one for the brand, one for the product | Closed. One palette (Section 16) now covers both |
| 5 | Early plans assumed Stripe; research showed Stripe does not accept Pakistan-registered businesses | Payoneer confirmed for Phases 1–4; Stripe waits for a foreign company registration |

---

## 23. Decisions Approved from the Decision Log

The founder reviewed and approved all 11 decisions in Document 01. They are now canonical:

| ID | Decision | Approved answer |
|---|---|---|
| D-01 | Pilot city | Islamabad/Rawalpindi |
| D-02 | Parent-client link in the database | One paying client per parent, but the database includes a `linkedFamilyMembers` field from day one (used in Phase 5) |
| D-03 | Pricing | Prices stay as ranges until Phase 0 gives real evidence; any exact figures in documents are examples only |
| D-04 | Plan selection in Phase 1 | The client picks a plan inside the app; payment still happens through a manual Payoneer link |
| D-05 | Photo/video storage | Cloudinary for Phases 1–4; look at S3 again in Phase 5 |
| D-06 | Hosting for Phases 0–1 | Render free tier + MongoDB Atlas free M0; slow first requests (cold starts) accepted until we have revenue |
| D-07 | Signup verification | Email verification in Phase 1; phone OTP added in Phase 2 with Twilio |
| D-08 | Logo | Re-make the existing heart-pin mark in the final palette |
| D-09 | Phase 1 language | English only, with simple words and icons on caregiver screens; Urdu switch comes in Phase 5 |
| D-10 | Privacy policy | A simple self-written privacy policy and terms at Phase 1; a lawyer reviews before Phase 2 |
| D-11 | Data hosting region | Asia-Pacific (Mumbai) |

Still needing action later (not blocking documents): domain registration, trademark check, insurance provider, and the Phase 0 completion sign-off before Phase 1 feature building formally starts.

---

## Source of Truth Rules

All future RozVisit documents must follow these rules:

1. **This document (00) is the base.** If any older document disagrees with it, this one wins.
2. **The newest confirmed decision always wins.** A decision counts as confirmed only when the founder clearly says yes. Suggestions from the technical team stay suggestions until approved.
3. **The Section 16 palette cannot be changed** unless the founder clearly approves a new one. No document or code may use other colors, except lighter or darker shades defined in the design system.
4. **Nothing is invented silently.** Future documents must not add features, cities, prices, or tools that cannot be traced back to this brief or a later founder approval. Anything new must be labeled *(Assumption)* or *(Recommendation)*.
5. **Labels are used the same way everywhere.** *(Assumption)*, *(Recommendation)*, and *(Open)* mark anything that is not confirmed. Unlabeled statements are confirmed.
6. **Open questions must shrink, not quietly pile up.** Each big new document says which open items it resolves, if any.
7. **Phase rules are respected in documents too.** A document must not describe a later-phase feature as if it is being built now. For example, payment-integration details do not belong in Phase 1 documents.
8. **Changes are announced.** When a confirmed fact changes (like ESLint to Oxlint), the document says which old text it replaces, and this brief is updated at the same time.
9. **Plain language.** All documents are written in simple, clear English. Short sentences. Technical words only where needed, explained the first time they appear. (Founder instruction — applies to every document.)

---

*End of Document 00 — RozVisit Canonical Project Brief*
