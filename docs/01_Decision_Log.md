# RozVisit — Decision Log
### Document 01 — Decisions That Had to Be Made Before Writing Full Documentation

**Source:** Document 00 (Canonical Project Brief) and the full project conversation.
**Rule used:** Only decisions that block accurate documentation are listed here. Decisions already confirmed in Document 00 are not reopened. Questions already answered in the conversation are not asked again.

**Result:** The founder reviewed this document and approved all 11 recommendations. Every decision below is now final and recorded in Document 00.

---

## 1. Product Scope

### D-01: Which city do we start in?

**Why it matters:** Almost every later document needs a real city name — caregiver hiring plans, service-area maps, Phase 0 planning, even example data. Without one, every document is full of placeholders.

**Options:**
1. **Lahore** — second-largest city, strong ties to the UK diaspora, many social-work and nursing graduates to hire from.
2. **Islamabad/Rawalpindi** — smaller and easier to manage, better infrastructure, many retired parents of overseas professionals live here. The founder also lives in this region, which makes hands-on Phase 0 work much easier.
3. **Karachi** — biggest market, but hardest to operate in. Better as a later expansion, not a pilot.

**Approved decision:** Option 2 — Islamabad/Rawalpindi.

**Tradeoff:** Lahore has a bigger market. But Phase 0 is manual, in-person work: interviewing caregivers, visiting homes, handling problems. Being physically present matters more than market size right now. Lahore becomes the first expansion city in Phase 6 instead.

---

## 2. User Roles

### D-02: Can more than one family member be linked to a parent?

**Why it matters:** Family group access is planned for Phase 5. But the database design must be chosen now. Changing the parent-to-client relationship later means rebuilding part of the database — expensive and risky.

**Options:**
1. One client per parent now; rebuild the database in Phase 5.
2. One paying client per parent, but add a `linkedFamilyMembers` field in the database from day one. The app does not use it until Phase 5.
3. Full shared ownership by many clients from day one.

**Approved decision:** Option 2.

**Tradeoff:** A little extra database design now, at zero cost to the app. In return, no painful rebuild in Phase 5. Option 3 would drag split-billing work into the MVP, which breaks our phase rules.

---

## 3. Business Model

### D-03: Do we lock exact prices now, or keep ranges?

**Why it matters:** Documents about billing and pricing need either exact numbers, or a clear note that prices are not final yet.

**Options:**
1. Lock launch prices now (for example $29 / $69 / $129).
2. Keep prices as ranges. Final prices are set after Phase 0, when real families tell us what they will pay.

**Approved decision:** Option 2. Documents may show example numbers, but must mark them as examples.

**Tradeoff:** Documents are slightly less exact. But Phase 0 exists to test what people will pay. Locking prices before hearing from real customers would put paperwork ahead of evidence.

---

## 4. MVP Boundaries

### D-04: Does the client pick their plan inside the app in Phase 1?

**Why it matters:** Phase 1 has no payment code (payment is a manual Payoneer link). But we must decide: does the client choose a plan in the app, or does our admin assign it? This changes which screens Phase 1 needs.

**Options:**
1. The client picks a plan in the app. The system saves the choice and enforces visit limits. Payment link is sent manually.
2. The admin assigns the plan after talking to the client. The client only sees their assigned plan.

**Approved decision:** Option 1.

**Tradeoff:** A little more Phase 1 screen work. But the system needs plan data anyway to enforce visit limits, and self-service feels right for diaspora clients. Option 2 saves little and makes the admin a bottleneck.

---

## 5. Technology

### D-05: Cloudinary or Amazon S3 for photos and videos?

**Why it matters:** Photos and videos appear everywhere in the system — uploads, security rules, cost planning, and the caregiver app on weak internet.

**Options:**
1. **Cloudinary** — free tier is enough for the MVP. It compresses images and videos automatically. Easiest to set up.
2. **Amazon S3 + CloudFront** — cheaper at large scale, more control, but we would have to build compression and secure links ourselves.

**Approved decision:** Option 1 — Cloudinary for Phases 1–4. Look at S3 again in Phase 5 when we know our real usage. Our architecture already has a swap-ready media layer, so moving later is a contained job.

**Tradeoff:** Cloudinary's paid plans cost more than raw S3 at scale. The price of choosing it now is a possible move later — and our design already makes that move manageable.

### D-06: Where do we host the app in Phases 0–1?

**Why it matters:** Deployment documents and the build pipeline need one named platform.

**Options:**
1. **Render** — free tier, works well with GitHub Actions, handles https automatically, simple settings.
2. **Railway** — similar, slightly nicer to use, but the free allowance is smaller.
3. **A cheap VPS (a $5 server)** — cheapest over time, full control, but the founder must handle updates, security, and https alone.

**Approved decision:** Option 1 — Render for the app, plus MongoDB Atlas free M0 tier for the database.

**Tradeoff:** Render's free tier goes to sleep when idle, so the first request after a quiet period is slow (a "cold start"). This is fine before revenue, and we document it as a known limit. A VPS avoids cold starts but adds server chores a solo student founder should not carry in Phase 1.

---

## 6. Security

### D-07: How do new users verify their account — email or phone?

**Why it matters:** The signup documents and API design need this fixed. Phone numbers are required for all users, but nothing said which channel proves the account is real.

**Options:**
1. Email verification link only — free, standard for web apps.
2. Phone OTP (a code by SMS) only — matches how Pakistani users expect to verify, but every SMS costs money from day one.
3. Email verification in Phase 1; phone OTP added in Phase 2, when Twilio arrives anyway for caregiver SMS.

**Approved decision:** Option 3.

**Tradeoff:** Slightly weaker identity checking in Phase 1 (email only). But it keeps signups free of cost, and it matches Twilio's already-planned Phase 2 arrival. Caregiver identity in the MVP is proven by our admin checks (ID card, interview), not by signup mechanics.

---

## 7. Integrations

*No blocking decisions.* All integrations are already confirmed in Document 00, Section 19. The media-storage question (D-05) is listed under Technology above.

---

## 8. UI/UX

### D-08: Re-make the logo in the final colors?

**Why it matters:** The current logo file uses old colors. Brand documents cannot be final while the main brand asset breaks the mandatory palette.

**Options:**
1. Re-make the existing heart-pin mark in the final palette (Primary `#315A67` lines).
2. Design a completely new logo.

**Approved decision:** Option 1. The mark itself was already reviewed and liked — only its colors are old.

**Tradeoff:** Almost none. Option 2 would reopen a settled creative choice and delay work for no real gain.

### D-09: Is Phase 1 English-only?

**Why it matters:** The Urdu/English switch is planned for Phase 5. But no document clearly said Phase 1 is English-only — including caregiver screens, and caregivers are the least English-fluent users. This must be stated openly, with a plan to soften it.

**Options:**
1. English only at Phase 1, written down as a known limit. Caregiver screens use very simple words, few words, and clear icons.
2. Make caregiver screens bilingual at Phase 1 (pulls Phase 5 work forward).

**Approved decision:** Option 1.

**Tradeoff:** Some difficulty for caregivers at the start. This is softened by the simple-screen rule, and the 3–5 pilot caregivers get in-person training anyway. Option 2 breaks phase rules and adds translation work for a tiny pilot group.

---

## 9. Deployment

*Covered by D-06.* Everything else — environments (dev/staging/production), GitHub Actions, Docker timing (Phase 2) — is already confirmed.

---

## 10. Legal and Privacy

### D-10: What privacy policy do we need for the pilot?

**Why it matters:** The platform stores parent addresses, medical notes, and home photos — sensitive data about people who are not the account holders. Even a small pilot needs a privacy policy and a consent plan. Clients in the UK/EU also bring GDPR (European data-protection law) into the picture.

**Options:**
1. A simple self-written privacy policy and terms at Phase 1. It must cover: what data we collect, the parent's consent (the parent must agree to visits and photos), how long media is kept, and how to request deletion. A lawyer reviews it before Phase 2.
2. Hire a lawyer fully before any Phase 1 launch.
3. No formal policy; rely on informal WhatsApp agreement.

**Approved decision:** Option 1.

**Tradeoff:** A self-written policy carries some legal risk compared to a lawyer. But full legal work is too slow and costly for a five-family pilot. Option 3 is not acceptable for a product taking photos inside elders' homes — it would break the trust promise at the heart of the brand. Parent consent (recorded at the first onboarding visit) goes into the Phase 0 operations checklist regardless.

### D-11: Where does our data physically live?

**Why it matters:** MongoDB Atlas and Cloudinary both ask us to pick a hosting region. Security documents and the privacy policy must say where data is stored. Clients may ask.

**Options:**
1. The nearest practical region to Pakistan with a free tier (usually AWS Mumbai, `ap-south-1`) — fastest for caregiver uploads.
2. A European region — simpler for GDPR, but slower for users in Pakistan.

**Approved decision:** Option 1. The privacy policy will say data is hosted on cloud infrastructure in the Asia-Pacific region. We will revisit this if UK/EU clients become a large share.

**Tradeoff:** GDPR can be met in any region through proper controls (encryption, limited access, deletion rights). Upload speed for the caregiver — our weakest-connection user — is harder to fix later. So speed wins the tiebreak.

---

## Decision Summary Table

| ID | Category | Decision | Approved answer | Status |
|---|---|---|---|---|
| D-01 | Product scope | Pilot city | Islamabad/Rawalpindi | Approved |
| D-02 | User roles | Parent-client link | One payer, future-ready database field | Approved |
| D-03 | Business model | Price locking | Ranges until Phase 0 evidence | Approved |
| D-04 | MVP boundaries | In-app plan selection | Yes, with manual payment link | Approved |
| D-05 | Technology | Media storage | Cloudinary (Phases 1–4) | Approved |
| D-06 | Technology | Hosting | Render + MongoDB Atlas M0 | Approved |
| D-07 | Security | Signup verification | Email in Phase 1, OTP in Phase 2 | Approved |
| D-08 | UI/UX | Logo | Same mark, final palette | Approved |
| D-09 | UI/UX | Phase 1 language | English only, simple caregiver screens | Approved |
| D-10 | Legal | Privacy policy | Simple self-written, lawyer review before Phase 2 | Approved |
| D-11 | Legal | Data region | Asia-Pacific (Mumbai) | Approved |

---

*End of Document 01 — Decision Log. All 11 decisions approved by the founder and recorded in Document 00.*
