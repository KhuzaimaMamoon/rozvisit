# RozVisit — Wireframe and Mockup Generation Brief
### Document 17

**Sources:** Documents 00–16, especially the design system (Document 15) and the screen inventory (Document 16).
**Labels:** Everything here is confirmed unless marked *(Assumption)*, *(Recommendation)*, or *(Open)*.
**Palette rule:** the eleven colors in the prompt are mandatory and used exactly as defined; derived tints (soft variants, hover shades, focus ring, overlay) come from Document 15 §3 and nowhere else.
**Scope of "essential":** the 15 screens that define the visual language across the three portals plus public and system moments. Near-duplicate screens (list/detail pairs across portals, notification lists, account screens) reuse these briefs and are cross-referenced at the end.

**Shared tokens for every brief (not repeated below):**
- Background `#F8FAF9`, Surface `#FFFFFF`, Text `#18232A`, Muted `#6B7C85`, Border `#DCE5E8`, focus ring = Primary at 25% alpha.
- Radius family sm 6 / md 10 / lg 16; spacing 4/8/12/16/20/24/32/48; shadows sm/md/lg (Document 15 §14).
- Inter for everything; type scale from Document 15 §7.
- Icons: lucide, 20px (24px in the caregiver portal), stroke inherits text color.
- No gradients, no neon, no template-style hero flourishes, no drop shadows on text, no illustrations that include real people.

---

# Part A — Public

## Brief 1 — Landing (S-01)

**1. Objective:** Explain the service in one screen and earn a first click to register or apply.

**2. Layout:** classic marketing single-column with breathing room. Not a "SaaS unicorn" grid — this is a healthcare-adjacent product; restraint is the message.

**3. Content hierarchy:** hero → how it works (3 steps) → trust panel (verification explanation with a real proof example card) → pricing preview → footer.

**4. Desktop (≥1280px):** max content width 1120px, centered. Hero: two-column, left column 60% (headline `text-3xl` Bold, sub `text-lg` Muted, primary CTA "Create an account", secondary "I'm a caregiver → Apply"), right column an EvidenceExampleCard (see §35 of Document 15). Trust panel below: 3 evenly spaced Cards. Pricing preview: 3 plan cards with the "Introductory pricing" note.

**5. Tablet (768–1279px):** hero stacks; content width fluid with 32px page padding; 3 steps become horizontal at `md` and stack at `sm`.

**6. Mobile (<768px):** everything single column; CTAs full-width but ≤360px; the EvidenceExampleCard sits between hero and steps.

**7. Components:** Public Header (logo left, Login + Register right), Hero, Card × 3 (steps), EvidenceExampleCard, PlanCard × 3, Footer.

**8. Primary action:** "Create an account" (Primary button).

**9. Secondary actions:** "I'm a caregiver → Apply" (Ghost), Login (top-right), plan comparison (link).

**10. Empty state:** N/A.

**11. Error state:** if plan preview fails, show the confirmed ranges as static content — never a broken price.

**12. Loading state:** minimal — Prices show skeleton; hero is static-first.

**13. Accessibility:** heading order H1 → H2 → H3; every CTA has an accessible label; the example proof photo has factual alt text.

**14. Tokens:** Hero background `#F8FAF9`; Header/Footer on `#FFFFFF` with `#DCE5E8` bottom/top border; Primary CTA fill `#315A67` / text `#FFFFFF` (hover `#27484F`); Secondary Ghost text `#315A67`; step-card icons `#7AA6B2` on a `#E7F0F2` circle background; body text `#18232A`, muted `#6B7C85`.

**15. Example content:**
- Headline: *"Know your parents are okay today."*
- Sub: *"Verified in-person visits with photo proof. Booked from anywhere, in your currency."*
- Steps: *"Add your parent" · "Choose a plan" · "See daily proof."*
- Trust panel item: *"Every caregiver: CNIC verified, background-checked, interviewed on video."*
- Plan card example: *"Standard — 3 visits / week + 1 errand — from AED 240/mo (introductory pricing)."*

**16. Generation prompt:**
> Design a calm, premium landing page for RozVisit — a healthcare-adjacent service that lets overseas Pakistanis book verified in-person visits for their aging parents in Pakistan. Use ONLY these colors: Primary #315A67, Primary Soft #E7F0F2, Accent #7AA6B2, Background #F8FAF9, Surface #FFFFFF, Text #18232A, Muted #6B7C85, Border #DCE5E8, Success #3F8F6B. No gradients, no neon, no template hero flourishes. Two-column hero on desktop, single column on mobile. Serif-free typography (Inter). Include: headline, subtitle, primary CTA ("Create an account") in Primary fill, secondary "I'm a caregiver → Apply" ghost, and a small evidence example card on the right showing a visit-proof photo, a StatusBadge (Success-soft pill with "Completed"), a one-line checklist summary and a muted timestamp. Below the hero: three step cards with lucide-style line icons in Accent inside Primary Soft circles. Then a trust panel with three cards explaining caregiver verification (CNIC, background, interview). Then three plan cards (Basic / Standard / Premium) with a small "Introductory pricing" muted note. Public header with logo and Login/Register. Footer with Privacy and Terms links. Whitespace generous, borders soft (10px radius on cards). No stock-photo hospital imagery, no cartoon people, no illustrated hands.

---

# Part B — Authentication

## Brief 2 — Register (S-04)

**1. Objective:** Create a client account with minimal friction and clear rules.

**2. Layout:** centered card, 480px wide on desktop, full-width on mobile; brand-side quiet trust column at `lg`.

**3. Content hierarchy:** short warm heading → form → password rules inline → primary CTA → auth alternate link.

**4. Desktop:** two columns at `lg`: left form card (Surface, `shadow-sm`, `radius-md`), right column three quiet trust bullets in Muted text on Background.

**5. Tablet:** single centered card; trust bullets hidden.

**6. Mobile:** full-width form with 20px page padding.

**7. Components:** FormInput × 5 (name, email, phone with country selector, country, password), Primary button, inline password-rules helper.

**8. Primary action:** "Create account".

**9. Secondary actions:** "Already have an account? Log in" link.

**10. Empty state:** N/A.

**11. Error state:** field-level for validation; alert band above form for `409 DUPLICATE` with links to Login and Reset — Emergency-soft `#F8E6E5` background, `#C94A44` text.

**12. Loading state:** button shows inline spinner; other inputs disabled.

**13. Accessibility:** labels above fields; first field auto-focused; error messages linked with `aria-describedby`; the country selector is keyboard-navigable.

**14. Tokens:** Card Surface with 1px `#DCE5E8` border, `shadow-sm`; input border `#DCE5E8`, focus border `#315A67` with focus-ring; helper text `#6B7C85` `text-xs`.

**15. Example content:**
- Heading: *"Create your account"*
- Sub: *"It takes about a minute."*
- Password helper: *"At least 8 characters, with letters and numbers."*
- Duplicate-email alert: *"An account with this email already exists. Log in or reset your password."*

**16. Generation prompt:**
> Design a calm registration page for RozVisit using ONLY these colors: Primary #315A67, Primary Soft #E7F0F2, Background #F8FAF9, Surface #FFFFFF, Text #18232A, Muted #6B7C85, Border #DCE5E8, Emergency #C94A44 (used only inside an inline "email already exists" alert band). Centered white card at 480px, 10px radius, subtle shadow, on the soft background. Fields stacked with labels above: Full name, Email, Phone (with a country selector), Country, Password. Password rules shown inline in muted text before submit. Primary button "Create account" in #315A67 fill. Muted "Already have an account? Log in" link below. On desktop, add a right-side column of three quiet trust bullets in muted text (no icons needed). No illustrations, no gradients, no marketing logos.

---

## Brief 3 — Login (S-08)

Layout as Register; fields reduced to Email + Password; primary "Log in"; secondary "Forgot password" link; the same-message error rule (never leaks which of email/password was wrong).

**Generation prompt (short):**
> A minimal login page in the same visual language as Brief 2. Only Email and Password fields, a "Forgot password?" ghost link right-aligned above the button, primary "Log in" button in #315A67. No social login buttons. Error message reads: "That email and password don't match. Please try again."

---

# Part C — Client Portal

## Brief 4 — Feed / Home (S-11) — the core screen

**1. Objective:** Deliver the reassurance the whole product exists for: today's proof, at a glance.

**2. Layout:** sidebar shell + main content. The feed is the home; nothing else fights it.

**3. Content hierarchy:** page header (parent name + tabs) → quick-action row → feed stream (newest first) → pagination cursor at the end.

**4. Desktop (≥1024px):** 240px Sidebar + main. Main width max 960px. VisitCards single-column at `lg`, two-column at `xl` for quick scanning. Sidebar items: Feed (active with Primary-soft background, 3px Primary left bar), Parents, Schedule, Notifications, Account.

**5. Tablet:** sidebar collapses to a 64px icon rail; VisitCards single column.

**6. Mobile:** bottom tab bar replaces sidebar (Feed / Parents / Schedule / Account); page header shrinks; VisitCards full-width.

**7. Components:** Sidebar, TopHeader with page title + Notification bell + Avatar menu, ParentSelector (only if >1 parent), QuickActions row, VisitCard × N, SyncPending state on cards where media is still uploading, EmptyState, Pagination "Load older" ghost button at the bottom.

**8. Primary action:** none permanent — the feed *is* the delivery; the sidebar's Schedule item is the standing next-step for empty states.

**9. Secondary actions per card:** Open detail, Save photo, Report a problem (on the ⋮ menu).

**10. Empty state:** centered EmptyState — small line illustration in Accent inside a Primary-soft circle, one sentence: *"Your first visit with Ammi is scheduled for Tuesday, 21 July at 10:00."*, primary "View schedule".

**11. Error state:** cursor-page load fail → inline retry chip at the bottom; individual card load error → per-card retry.

**12. Loading state:** three skeleton VisitCards matching the layout; cold-start message after 2s.

**13. Accessibility:** each VisitCard is a landmark (`article`); each proof photo has factual alt text ("Photo from visit, 21 July"); StatusBadge has both color and word "Completed" / "Missed"; the mood value has an accessible label ("Mood 4 of 5").

**14. Tokens:** Sidebar Surface with right border `#DCE5E8`; active nav item background `#E7F0F2` with text `#315A67`; VisitCard Surface, `radius-md`, `shadow-sm`, 20px padding; StatusBadge for "Completed" = Success-soft `#E3F1EA` background + `#3F8F6B` text; muted timestamp `#6B7C85` `text-xs`; "photos uploading" chip = Pending-soft `#F1ECE3` + `#8A7A5C` text.

**15. Example content:**
- One VisitCard: two thumbnails, Completed badge, *"Medication taken · mood 4 · asked about her grandson"*, *"Bilal Ahmed · 21 Jul, 10:35 (2 hours ago)"*.
- A "photos uploading" card just below: same shape, StatusBadge "Completed", small chip "Photos uploading" in Pending-soft, no thumbnails yet.
- A missed card lower down: StatusBadge "Missed" in Emergency-soft with `#C94A44` text, muted reason line: *"Ammi had a wedding — make-up visit scheduled for Thursday."*

**16. Generation prompt:**
> Design the "Feed" home screen for the RozVisit client portal — a premium, calm healthcare-adjacent dashboard where overseas Pakistanis see today's visit proof for their parent in Pakistan. Use ONLY: Primary #315A67, Primary Soft #E7F0F2, Accent #7AA6B2, Background #F8FAF9, Surface #FFFFFF, Text #18232A, Muted #6B7C85, Border #DCE5E8, Success #3F8F6B on Success-soft #E3F1EA, Pending #8A7A5C on Pending-soft #F1ECE3, Emergency #C94A44 on Emergency-soft #F8E6E5. Layout: 240px sidebar on the left with logo top, five nav items (Feed active with Primary-soft background and a 3px Primary left bar), user block bottom. Top header: page title "Feed" + parent name, right side notification bell and small avatar. Main area: single column of visit cards on a soft background. Each card has two photo thumbnails on the left, and on the right a pill-shaped StatusBadge ("Completed" in Success colors), a one-line summary in Text color ("Medication taken · mood 4 · asked about her grandson"), and a muted line with caregiver name and time ("Bilal Ahmed · 21 Jul, 10:35 · 2 hours ago"). Include one card that says "Photos uploading" in a Pending pill instead of thumbnails, and one card marked "Missed" in Emergency-soft with a calm muted line about the make-up plan. No sensational red, no alerts, no ads, no charts. Rounded corners 10px, subtle shadow, generous whitespace. Feel: like a well-run private clinic's dashboard, not a social feed.

---

## Brief 5 — Visit Detail (S-12)

**1. Objective:** Show one visit's full evidence with respect for the parent.

**2. Layout:** narrow content column (max 720px), centered under the shell.

**3. Content hierarchy:** header (parent name, caregiver, StatusBadge, scheduled + capture + upload times with the ProofTimestamp component when capture and upload differ) → media gallery → checklist details → standing note → footer actions.

**4. Desktop:** 720px column; gallery 3 across, click-to-lightbox.

**5. Tablet:** 2 across in gallery.

**6. Mobile:** 1 across; header sticks with a back button.

**7. Components:** BackButton, StatusBadge, ProofTimestamp, MediaGallery, ChecklistDetails, TextBlock (standing note), ActionRow (Report a problem, Save photo).

**8. Primary action:** none — this is a receive screen. The primary is implicit: back to Feed.

**9. Secondary:** Report a problem → S-19.

**10. Empty state:** N/A.

**11. Error state:** media link expired (rare, minted per-request) → "Refresh to reload photos" chip.

**12. Loading state:** skeleton for gallery and checklist grid.

**13. Accessibility:** gallery navigable with arrow keys in lightbox; photo alt text names the visit date and includes the caregiver's name.

**14. Tokens:** header on Surface with border-bottom `#DCE5E8`; timestamps in muted; checklist bullets use small chips (mood chip `#E7F0F2` with `#315A67` text).

**15. Example content:**
- ProofTimestamp: *"Captured 10:35, uploaded 12:44 — synced later."*
- Checklist: *"Medication ✓ · Mood 4 · Notes: talked about her grandson; will bring a book next visit."*

**16. Generation prompt:**
> Design a "Visit detail" screen for RozVisit. Palette exactly as before. Header row: parent name in Text (bold), caregiver name below in Muted, right side a StatusBadge "Completed" in Success colors. Below the header: a small ProofTimestamp line — two timestamps side by side ("Captured 10:35 · Uploaded 12:44") in Muted with a small info dot in Accent that would explain the delay. Then a three-across media gallery of proof photos on Surface cards with 10px radius. Below the gallery: a checklist details block with small chips ("Medication ✓" and "Mood 4" in Primary-soft with Primary text) and a paragraph of notes in Text color. Footer: a ghost "Report a problem" link right-aligned in Primary. No overlays or filters on photos.

---

## Brief 6 — Plan Selection (S-16)

**1. Objective:** Let a client pick a plan confidently — in their own currency.

**2. Layout:** three plan cards side by side, equal weight; a subtle "Introductory pricing" note above and a payment-model explainer below (manual link at Phase 1).

**3. Hierarchy:** header ("Choose Ammi's care plan") → note → three plan cards → payment-model panel.

**4. Desktop:** cards 3 across, equal height, middle card visually equal (never "featured" — this is not a manipulation surface).

**5. Tablet:** 3 across becomes 2 + 1 stack.

**6. Mobile:** vertical stack.

**7. Components:** PlanCard × 3 (plan name, visits/week, errand allowance, price in own currency, Primary CTA "Select"), IntroPricingNote, PaymentModelPanel.

**8. Primary action:** "Select" on the chosen card.

**9. Secondary:** "Compare plans" (opens a modal with a small comparison table).

**10. Empty state:** N/A.

**11. Error state:** if `409 DUPLICATE` (active subscription exists) → alert band offering to view the existing subscription.

**12. Loading state:** three skeleton cards.

**13. Accessibility:** each card is a semantic group with an accessible name including the plan and price; keyboard focus visible on the Select buttons; the intro note is announced before the cards.

**14. Tokens:** cards on Surface, `radius-md`, `border` line, `shadow-sm`; the plan name `text-lg` Semibold; the price `text-2xl` Bold with tabular numerals; a small Muted "Introductory pricing" pill in Pending-soft above the row; PaymentModelPanel with `#E7F0F2` background and a simple three-step icon row explaining "Select → We send a secure Payoneer link → Your subscription activates."

**15. Example content:**
- Basic: *"1 visit / week — AED 100/mo"*
- Standard: *"3 visits / week + 1 errand — AED 240/mo"*
- Premium: *"Daily visits + priority doctor escort — AED 460/mo"*
- Intro note: *"Introductory pricing — locked when you subscribe."*

**16. Generation prompt:**
> Design a plan selection screen for RozVisit. Palette exactly as before. Above the cards, a small "Introductory pricing" pill in Pending-soft with Pending text. Three equal plan cards in a row on desktop: each with plan name at the top, a short one-line description, a large price in Text color with the currency label, and a Primary "Select" button. No card is highlighted as "recommended". Below the row, a soft explainer panel in Primary Soft (#E7F0F2) with three small circular icons in Accent explaining the three-step manual Payoneer payment model: "Select" → "We send a secure Payoneer link (within 24h)" → "Your plan activates." No gradients, no confetti, no "Save 20%" tags.

---

## Brief 7 — Schedule Visits (S-18)

**1. Objective:** Set the weekly slots within the plan's allowance without confusion.

**2. Layout:** two-column at `lg`: left column the picker (60%), right column the upcoming visits list (40%). Below `lg`, stacked.

**3. Hierarchy:** allowance counter → picker → upcoming visits with per-visit actions.

**4. Desktop:** 2-column; picker card on Surface, upcoming list card on Surface.

**5. Tablet:** stacked; picker first.

**6. Mobile:** same as tablet.

**7. Components:** AllowanceCounter (2 of 3 used, in Muted with a Primary progress bar), DayChip row (Mon–Sun toggles), TimeDropdown per selected day, StandingNoteField, UpcomingVisitRow × N with Reschedule / Cancel actions.

**8. Primary action:** "Save schedule".

**9. Secondary:** Reschedule / Cancel per upcoming visit; cutoff messaging inline before the cancel-after action.

**10. Empty state:** "Choose your first slot" with a small hint about service hours.

**11. Error state:** allowance exceeded → inline banner with the plan limit and an "Upgrade plan" ghost link (only ever a link, never a hard sell); slot conflict → alternatives inline.

**12. Loading state:** picker skeleton + list skeleton.

**13. Accessibility:** each day chip is a toggle button with pressed state announced; time dropdowns are keyboard-completable; the allowance counter has an accessible summary ("2 of 3 visits scheduled").

**14. Tokens:** Day chips = Border-outlined pills; active chip = Primary fill with Surface text; TimeDropdown = FormInput; upcoming rows on Surface with a soft divider `#DCE5E8`.

**15. Example content:** *"Tuesdays 10:00 · Thursdays 10:00 · Sundays 16:30"*. Note: *"Please check the medicine box every visit."*

**16. Generation prompt:**
> Design a "Schedule visits" screen. Palette as before. Left card (60%) contains an "Allowance" line showing "2 of 3 visits scheduled this week" with a thin Primary progress bar, a row of seven day-of-week toggle chips (active chip in Primary fill with white text), a time picker per selected day, and a "Standing note" text input. Right card (40%) is an "Upcoming visits" list with three rows: parent name, day/time, small "Reschedule" and "Cancel" ghost links. Below on mobile, cards stack. Primary button "Save schedule" bottom right of the left card. No calendar grid.

---

# Part D — Caregiver Portal

## Brief 8 — Today (S-23) — the caregiver home

**1. Objective:** Show Bilal his day in one glance and get him into his first visit fast.

**2. Layout:** simple top bar + a list of visits — no sidebar. This is a phone-first, focus-first surface.

**3. Hierarchy:** top bar with date + status chip → visit list (ordered by time) → sticky Earnings link at the bottom.

**4. Desktop (rare — the caregiver portal is optimized at 360px first):** single narrow column centered, 480px max.

**5. Tablet:** two-column list optional at `md`.

**6. Mobile (primary):** 360px-first, full width, big touch targets.

**7. Components:** TopBar (date title, Online/Offline chip, small avatar link → Account), VisitRow × N, SyncStateBar collapsed pill when the queue is empty (expands into a summary when items are pending), FooterLink to Earnings.

**8. Primary action:** none permanent — the day *is* the primary action. Tapping the first visit opens Visit Flow.

**9. Secondary:** open a visit; open Earnings; open Account (top-right avatar).

**10. Empty state:** *"No visits today. Enjoy the break."* — short and warm.

**11. Error state:** if the list fails to load, use the last cached list with a "Showing last synced list" strip and a Retry chip.

**12. Loading state:** three skeleton rows.

**13. Accessibility:** each VisitRow is a link with an accessible label including time and parent name; the SyncStateBar reads its state ("2 items waiting to send").

**14. Tokens:** TopBar Surface with border-bottom; Online chip = Success-soft with a small dot in Success; Offline chip = Pending-soft with a Pending dot; VisitRow on Surface with border-bottom `#DCE5E8`, time bold `text-base`, parent name `text-sm`, address in Muted `text-xs`, right-side chevron in Muted.

**15. Example content:**
- Header: *"Tuesday, 21 Jul"* / *"Online — 2 items sent"*.
- Rows: *"10:00 · Amina Bibi · House 24, Street 7 · Rawalpindi"* → chevron; *"14:00 · Rasheed Ahmed · Gulberg III · Lahore"* → chevron.

**16. Generation prompt:**
> Design a mobile-first "Today" screen for the RozVisit caregiver portal at 360px width. Palette exactly as before. Top bar on Surface with a border-bottom: left side date title "Tuesday, 21 Jul" in Text, right side a small Online chip (Success-soft background, Success text) and a small avatar. Below the top bar: a stack of three visit rows on Surface with a soft divider between each. Each row has a bold time on the left (like "10:00" in Text bold), then the parent name in Text, then a muted address line, and a right chevron. Comfortable padding, 44px minimum touch targets. Under the last row, a small footer link "Earnings this month · PKR 12,600" in Primary ghost. No sidebar, no dashboard cards. Feel: quick, calm, high-contrast, dependable.

---

## Brief 9 — Visit Flow (S-24) — the highest-value caregiver screen

**1. Objective:** Guide Bilal through a visit in under two minutes with zero friction, online or offline, respecting the parent throughout.

**2. Layout:** a single focused screen that steps through Consent (first visit only) → Checklist → Camera → Complete. Progress lives at the top; each step is a full section.

**3. Hierarchy:** visit header (parent name, time, address, standing note, consent-choice reminders) → step section → sticky bottom action bar with the current step's primary CTA.

**4. Desktop:** narrow centered column, 520px max.

**5. Tablet:** 640px column; camera step keeps controls big.

**6. Mobile (primary):** full-height sections, camera step becomes a near-fullscreen viewfinder.

**7. Components:** VisitHeader, ConsentPanel (first visit only, per Document 15 §35 — given/declined actions equal weight), ChecklistForm (medication yes/no toggle pair, mood 1–5 as five 44px targets, concern chips, optional short note), CameraCapture (live viewfinder, single shutter, thumbnail strip, no gallery affordance), SyncStateBar (always visible), StickyActionBar (contextual primary).

**8. Primary action:** at each step, the step's action; at Complete, "Complete visit".

**9. Secondary:** "Parent declined" (Ghost button, but equal visual weight in ConsentPanel — no dark pattern toward yes).

**10. Empty state:** none — the visit is the state.

**11. Error state:** camera denied → clear instructions; low storage → warn before capture; upload flagged past 24h → the visit shows a Pending "photos flagged for review" chip on Today (Bilal isn't punished — flag for review per SEC-011).

**12. Loading state:** step transitions use `motion-fast`; camera warm-up shows a plain viewfinder placeholder.

**13. Accessibility:** every step keyboard-reachable; shutter button has aria-label "Take proof photo"; mood targets have accessible names 1–5; ConsentPanel's given and declined buttons must sound equal in accessible labels ("Record parent's agreement" and "Record parent declined").

**14. Tokens:** VisitHeader on Surface, border-bottom `#DCE5E8`; mood targets = 44px pill buttons, selected in Primary fill/Surface text; concern chips = Primary-soft with Primary text; camera controls = shutter as a 64px Surface circle with `shadow-md`; SyncStateBar = Pending-soft strip with Pending text when items are pending, Success-soft when all synced.

**15. Example content:**
- Header: *"Amina Bibi · 10:00 · House 24, Street 7"*. Standing note: *"Please check the medicine box."*
- ConsentPanel copy: *"Please explain to Ammi that we will visit on a schedule and take a couple of photos she chooses. Ask if she agrees. Record her answer below."* — two buttons: "She agreed" (Primary) and "She declined" (Ghost with border) sized equally.
- Checklist: Medication ✓ · Mood 4 · Concerns: none · Note: *"Asked about her grandson."*.
- SyncStateBar states: "All synced" (Success), "2 photos waiting to send" (Pending).

**16. Generation prompt:**
> Design a mobile-first "Visit Flow" screen for the RozVisit caregiver portal at 360px width. Palette exactly as before. Top: a visit header on Surface with parent name in Text bold, a muted time and address line, and a standing note pill. Below, a single step section — show the Checklist step: a "Medication taken" yes/no pair of large 44px pills, a "Mood" row of five 44px numbered pills (with 4 selected in Primary fill), a small row of concern chips in Primary Soft with Primary text, and an optional short note field. Below that, an in-app camera capture area: a live viewfinder placeholder (no gallery button anywhere), a large 64px circular shutter in Surface with a subtle shadow, and a thumbnail strip of two captured photos. Bottom: a SyncStateBar strip in Pending-soft with the text "2 photos waiting to send". A sticky bottom action bar with a Primary "Complete visit" button on the right and a "Parent declined" ghost link on the left, both equal in visual weight. No file-picker icons, no filters, no cartoons. Feel: focused, calm, high-contrast, purposeful.

---

# Part E — Admin Portal

## Brief 10 — Admin Overview (S-27) — the workbench entry

**1. Objective:** Give Nasreen an instant read on the workload and one-click access to the right list.

**2. Layout:** sidebar shell + four count cards + shortcut list. MVP-simple; the SLA Dashboard replaces this at Phase 2.

**3. Hierarchy:** page header → 4 count cards → recent activity list.

**4. Desktop:** 4 cards in one row, activity list below.

**5. Tablet:** 2×2 card grid.

**6. Mobile:** cards stack; activity list becomes a compact rows list.

**7. Components:** Sidebar (admin variant with all items), TopHeader with page title + Search, CountCard × 4, ActivityRow × N.

**8. Primary action:** open the queue with the highest attention need (Applications if any pending, else Flags).

**9. Secondary:** open each area from the sidebar.

**10. Empty state:** a count of 0 renders "No pending applications" with a small muted line.

**11. Error state:** if counts fail, each card shows a small retry; the page never blocks.

**12. Loading state:** count skeletons.

**13. Accessibility:** each count card is a link with an accessible label ("4 pending applications, open queue"); focus order is left-to-right; every action is keyboard-completable.

**14. Tokens:** CountCard = Surface `radius-md` `shadow-sm` `border-line`, small label in Muted `text-sm`, big number `text-3xl` tabular numerals in Text, small delta line in Muted; a count of open flags shows the number in `#C94A44` (Emergency) only when >0.

**15. Example content:**
- *"4 · Pending applications"*
- *"38 · Active subscriptions"*
- *"142 · Completed visits today (+8 vs yesterday)"*
- *"2 · Open flags"* (the number in Emergency color)

**16. Generation prompt:**
> Design an admin overview screen for RozVisit. Palette exactly as before. Layout: 240px sidebar on the left with logo top and eight admin nav items (Overview active with Primary Soft background and a 3px Primary left bar). Top header on Surface with page title "Overview" and a right-aligned search input pill in a Background fill. Main area on the soft background: four count cards in one row on desktop, each on Surface with 10px radius and a very subtle shadow — small muted label above, a large number in Text using tabular numerals, and a small muted subline. Only the "Open flags" number is colored (in Emergency #C94A44) — the others are Text. Below the cards: a compact recent activity list on Surface with soft dividers, each row with a StatusBadge (Completed / Verified / Missed), a subject line, and a muted timestamp. No graphs, no gauges, no confetti.

---

## Brief 11 — Applications Queue (S-28) — the caregiver verification pipeline

**1. Objective:** Nasreen sees applicants organized by state and can enter any application in one click.

**2. Layout:** sidebar shell + filter chips + table.

**3. Hierarchy:** filter chips (Applied, In review, Rejected) → table → pagination.

**4. Desktop:** table with columns Applicant, Area, Applied, Gates (three dots), Actions.

**5. Tablet/Mobile:** table becomes stacked cards, one per applicant.

**6. Components:** FilterChips, DataTable, GateDots (three small dots — Border for missing, Success for complete), Row action (Open).

**7. Primary action:** Open an applicant.

**8. Secondary:** filter change; search by name.

**9. Empty state:** *"No pending applications."*.

**10. Error state:** row load error → per-row retry.

**11. Loading state:** table skeleton (8 rows).

**12. Accessibility:** table has a caption "Caregiver applications" and column headers with proper roles; gate dots have accessible labels ("CNIC complete, Interview pending, Reference complete").

**13. Tokens:** table header row on Surface-sunken `#F1F4F3` with Muted `text-xs` Semibold; body rows on Surface, row hover in Background; StatusBadge for the current state.

**14. Example content:**
- Row: *"Bilal Ahmed · Rawalpindi · 3 days ago · ● ● ○ · Open"*.

**15. Generation prompt:**
> Design an admin "Applications" queue for RozVisit. Palette exactly as before. Sidebar as in Brief 10. Main area: a filter chip row with "All", "Applied", "In review" (active), and "Rejected" — active chip in Primary Soft with Primary text and a thin Primary bottom border. Below, a data table on Surface with columns: Applicant (name + small muted CNIC-verified sub), Area, Applied (relative + absolute), Gates (three small dots — filled Success circles for complete, hollow Border circles for pending), and Actions (a small ghost "Open" link on the right). Table header row uses the sunken surface color. On mobile the same rows collapse into stacked cards. No colors on the row backgrounds. Feel: dense but calm — a professional verification desk.

---

## Brief 12 — Application Detail (S-29) — the gate view

**1. Objective:** Show Nasreen the three verification gates in one place and let her decide fairly.

**2. Layout:** header with applicant + StatusBadge → three gate cards (CNIC / Interview / Reference) → decision panel.

**3. Hierarchy:** identity → evidence per gate → decision.

**4. Desktop:** two-column at `xl` (gate cards left, decision panel right sticky); one column at `lg`.

**5. Tablet/Mobile:** one column.

**6. Components:** ApplicantHeader (name, applied at, StatusBadge), GateCard × 3, CnicViewer (image inside a card with an audit microcopy note "Viewing this record is logged"), InterviewPlayer, ReferenceNotes, DecisionPanel (Approve / Reject / Request info — Approve disabled unless all three gates complete).

**7. Primary action:** Approve (disabled state clearly explained).

**8. Secondary:** Reject, Request info, back to queue.

**9. Empty state:** N/A.

**10. Error state:** media load error → per-media retry (the audit event is written regardless of image load state — this is a permission fact, not a UI fact).

**11. Loading state:** gate card skeletons.

**12. Accessibility:** Approve button has an accessible label including its disabled reason ("Approve — disabled: Interview and Reference gates are not complete"); the "Viewing this record is logged" microcopy is read out by screen readers.

**13. Tokens:** GateCard with a small check-circle in Success when complete, or a hollow Border circle with Muted text when pending; the audit microcopy is `text-xs` Muted with a small info icon in Accent.

**14. Example content:**
- Header: *"Bilal Ahmed · applied 3 days ago"* · StatusBadge "In review" in Pending-soft.
- Gate cards: *"CNIC · ✓ verified"*, *"Interview · pending"*, *"Reference · ✓ complete — spoke with Dr. Farooq, 20 Jul"*.
- Decision panel copy above Approve: *"Approve becomes available when all three gates are complete."*.

**15. Generation prompt:**
> Design an admin "Application detail" screen. Palette exactly as before. Header: applicant name in Text bold, muted "Applied 3 days ago", right side a StatusBadge "In review" in Pending-soft with Pending text. Below, a two-column layout on desktop: left column with three gate cards stacked on Surface (each 10px radius, subtle shadow) — CNIC card shows a small CNIC image thumbnail with the microcopy "Viewing this record is logged" in Muted and a small info dot in Accent, Interview card shows a small audio/video player placeholder with a "Pending" pill in Pending-soft, and Reference card shows a short quote in Muted with a Success check dot. Right column: a sticky decision panel with three buttons stacked — a Primary "Approve" button that is clearly disabled (light state) with a small muted line below explaining that Approve becomes available when all three gates complete, then a Ghost "Request info", then a Ghost "Reject" in the Emergency color scheme (Emergency-soft background text). No shame styling on the applicant.

---

## Brief 13 — Visit Oversight (S-30) — the everyday admin surface

**1. Objective:** Let Nasreen filter and open any visit in a few keystrokes.

**2. Layout:** sidebar + filter row + table.

**3. Hierarchy:** filters (status, date range, caregiver) → table → pagination.

**4. Desktop:** table columns: Parent, Caregiver, Scheduled, Status, Flag.

**5. Tablet/Mobile:** stacked cards.

**6. Components:** FilterRow, DataTable, StatusBadge per row, FlagIndicator (small triangle in Emergency color when a flag is open, plus a text label "Flagged" per ACC-001).

**7. Primary action:** Open a row.

**8. Secondary:** filter change; export a filtered CSV (Phase 2 *(Recommendation)*).

**9. Empty state:** *"No visits match your filters."*.

**10. Error state:** per-row retry.

**11. Loading state:** table skeleton.

**12. Accessibility:** the flag indicator has an accessible label ("Flagged — click to view reason").

**13. Tokens:** as Brief 11.

**14. Example content:** row *"Amina Bibi · Bilal Ahmed · 21 Jul, 10:00 · Completed · —"*; a flagged row *"Rasheed Ahmed · Bilal Ahmed · 21 Jul, 09:30 · Flagged · Upload delayed"*.

**15. Generation prompt:**
> Design an admin "Visits" oversight table for RozVisit. Palette exactly as before. Above the table: a compact filter row with a Status dropdown, a Date range picker, a Caregiver dropdown, and a small search pill for parent name. Table columns: Parent, Caregiver, Scheduled (relative + absolute), Status (StatusBadge), Flag (a small filled Emergency triangle with the word "Flagged" beside it, or an em-dash when clean). Header row on the sunken surface color. Row hover shows a subtle Background tint. On the far right of each row, a small ghost "Open" link. No red row backgrounds — only the tiny triangle carries the flag color. Feel: professional table, quick to scan.

---

## Brief 14 — Subscriptions Workbench (S-33) — the manual-payment surface

**1. Objective:** Nasreen sends payment links, records payment references, and moves subscriptions to Active — with every action audited invisibly.

**2. Layout:** sidebar + state filter chips + table + action modals.

**3. Hierarchy:** filters → table → per-row actions (state-machine legal only).

**4. Desktop:** table columns: Client, Parent, Plan, State, Period end, Updated, Actions.

**5. Tablet/Mobile:** stacked cards.

**6. Components:** FilterChips (Selected / Link sent / Active / Grace / Paused / Cancelled), DataTable, ActionMenu per row, ActivationModal (paymentRef input required for state=Active — refuses on `409 STATE_INVALID`).

**7. Primary action:** contextual — Send link when state=Selected; Activate when state=Link sent; Pause when state=Grace.

**8. Secondary:** View history, message client (opens a canned message drawer *(Recommendation)*).

**9. Empty state:** per filter — *"Nothing in the link-sent queue right now."*.

**10. Error state:** activation without paymentRef → validation error inline in the modal.

**11. Loading state:** table skeleton.

**12. Accessibility:** each action button announces its target state ("Activate subscription with payment reference").

**13. Tokens:** StatusBadge for each state — Active in Success-soft/Success, Grace in Pending-soft/Pending, Paused in Pending-soft/Pending with a slightly darker text (or a distinct label), Cancelled in Muted-neutral.

**14. Example content:** row *"Ayesha Khan · Amina Bibi · Standard · Link sent (2 days ago) · —"* with an Activate action.

**15. Generation prompt:**
> Design an admin "Subscriptions" workbench for RozVisit. Palette exactly as before. Above the table: a chip row for states — All, Selected, Link sent (active), Active, Grace, Paused, Cancelled. Below: a table with columns Client, Parent, Plan, State (StatusBadge), Period end, Updated, and Actions. The Actions column shows a single contextual ghost button per row ("Send link", "Activate", "Pause", or "View"). Above the table, a small info line reminding "Payment happens outside the app during Phase 1 — record the Payoneer reference on activation." When Activate is clicked, an activation modal opens on Surface with a required "Payoneer reference" text field, a Cancel ghost button on the left, and a Primary "Activate subscription" button on the right. No dollar-sign icons, no charts, no revenue graphs.

---

# Part F — System Screens

## Brief 15 — 404 (S-40) and Unexpected Error (S-41)

**1. Objective:** Fail calmly. Never surprise, never dead-end.

**2. Layout:** centered panel on Background, minimum ceremony.

**3. Hierarchy:** small brand mark → short human sentence → one primary action → optional support link.

**4–6. Responsive:** single centered column at all breakpoints.

**7. Components:** BrandMark (small, single color), Text block, Primary button (contextual: to the role's home if authenticated, to Login otherwise; on the 500 boundary it becomes Retry), Ghost "Contact support" link.

**8. Primary action:** as above.

**9. Secondary:** Contact support.

**10. Empty state:** N/A.

**11. Error state:** these *are* the error states.

**12. Loading state:** N/A.

**13. Accessibility:** the panel is inside a `main` landmark; focus is placed on the primary action; no auto-redirects.

**14. Tokens:** small line icon in Muted; heading `text-xl`; body `text-sm` in Muted; a very light background remains Background — no Emergency red anywhere.

**15. Example content:**
- 404 title: *"This page doesn't exist."* Sub: *"You might have followed an old link."* Action: *"Go to Feed"* (or Login).
- 500 title: *"Something went wrong on our side."* Sub: *"We're on it. Please try again in a moment."* Action: *"Retry"*.

**16. Generation prompt:**
> Design two calm system screens for RozVisit — a 404 and an unexpected-error state. Palette exactly as before. Each is a small centered panel on a Background surface. At the top, a small line icon in Muted (no color). Below, a short sentence in Text ("This page doesn't exist." or "Something went wrong on our side."), a Muted sub line, one Primary button ("Go to Feed" / "Retry"), and a small ghost "Contact support" link below the button. Absolutely no red styling, no error illustrations, no cartoons, no emojis.

---

# Screens Sharing an Existing Brief (cross-reference only)

To keep this document useful rather than repetitive, the following screens reuse the visual pattern of an already-defined brief. The prompt for each is the referenced brief's prompt with the noted substitutions.

| Screen | Reuses | Substitutions |
|---|---|---|
| S-02 Privacy, S-03 Terms | Brief 1 shell | Content-only, no CTAs, ToC on the side at `lg` |
| S-05 Caregiver Apply | Brief 2 | Add CNIC number field and a service-area map pin card; heading "Apply as a caregiver" |
| S-06 Verify Prompt, S-07 Verify link, S-09 Forgot, S-10 Reset | Brief 3 (mini forms) | Single-field or no-field variants; system message content |
| S-13 My Parents (list) | Brief 4 sidebar + Brief 11 table | Row = parent name + StatusBadge for parent status + subscription state |
| S-14 Parent Overview | Brief 5 (single column) | Header carries parent StatusBadge; tabs Profile / Visits / Plan |
| S-15 Add / Edit Parent | Brief 2 form shell | Map pin card + emergency contacts repeater; consent explainer at the bottom |
| S-17 Subscription Status | Brief 5 | State history list; single primary "Cancel plan" ghost action |
| S-19 Report a Problem | Brief 2 form shell | Auto-attached evidence preview card at the top |
| S-20 / S-25 / S-37 Notifications | Brief 4 sidebar + list | Row = icon + title + body + timestamp, unread dot in Primary |
| S-21 / S-26 / S-38 Account | Brief 2 form shell | Named fields per role; Log out ghost at the bottom |
| S-22 Application Status | Brief 8 top bar | Center a single card with the gate list and status copy |
| S-25 Earnings | Brief 8 top bar + Brief 13 table (compact) | Total header + per-visit rows in PKR |
| S-31 Visit Evidence (admin) | Brief 5 | Add statusHistory panel and Flag resolution modal trigger |
| S-32 Assign | Brief 11 table | Suggestions with a "previous caregiver" pill on the first row |
| S-42 Offline banner | Brief 4/8 header inset | Muted Pending strip: "You're offline — showing your last synced view" |
| S-43 Maintenance | Brief 15 | Content only |

---

*End of Document 17 — RozVisit Wireframe and Mockup Generation Brief*
