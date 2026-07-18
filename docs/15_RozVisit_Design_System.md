# RozVisit — Design System
### Document 15

**Sources:** Documents 00–14, especially the mandatory palette (Document 00 §16), the UI decisions (Document 00 §15), the personas (Document 04), and the 27-screen MVP inventory (Document 14).
**Labels:** Everything here is confirmed unless marked *(Assumption)*, *(Recommendation)*, or *(Open)*.
**Supersedes:** the earlier standalone design-system draft (pre-series, blue palette). This is the official version, built on the final palette only.
**Palette rule:** the eleven colors below are final and mandatory (Source of Truth Rule 3). Nothing in this document replaces or reinterprets them; derived tints and shades are defined here, from them, and only here.

---

## 1. Design Principles

1. **Calm is the product.** Every screen either delivers reassurance or gets out of the way. Nothing flashes, bounces, or shouts — except the emergency path, which is the single sanctioned exception.
2. **Proof looks like proof.** Photos, timestamps, and checklists are presented plainly and legibly — evidence styling, not social-media styling.
3. **The weakest phone sets the floor.** If a component is heavy, small-tapped, or text-dense, it fails Bilal's phone and is redesigned (Product Principle 4).
4. **Status is never color alone.** Every state pairs its color with a text label (ACC-001) — the rule with its own component (StatusBadge).
5. **One primary action per screen.** A screen with two primary buttons has an undecided designer.
6. **Dignity in every word and image.** The parent is a person receiving company and help — never a monitored subject. Copy and imagery are reviewed against this sentence.

## 2. Brand Personality

Premium, trustworthy, calm, dependable — a well-run private clinic's front desk, not a hospital corridor and not a startup's confetti. The interface should feel like it was designed by someone whose own mother uses the service.

Voice: warm, plain, honest. Short sentences. No exclamation marks in product copy except genuine celebration (a first visit completed). Never alarm-flavored words outside the emergency path.

---

## 3. Color Tokens

The mandatory eleven, as tokens:

| Token | Hex | 
|---|---|
| `color-primary` | `#315A67` |
| `color-primary-soft` | `#E7F0F2` |
| `color-accent` | `#7AA6B2` |
| `color-background` | `#F8FAF9` |
| `color-surface` | `#FFFFFF` |
| `color-text` | `#18232A` |
| `color-text-muted` | `#6B7C85` |
| `color-border` | `#DCE5E8` |
| `color-success` | `#3F8F6B` |
| `color-pending` | `#8A7A5C` |
| `color-emergency` | `#C94A44` |

**Derived shades (defined once, here — the only permitted additions):**

| Token | Value | Derivation | Use |
|---|---|---|---|
| `color-primary-hover` | `#27484F` | Primary darkened ~20% | Hover/pressed on primary elements |
| `color-success-soft` | `#E3F1EA` | Success tint | Success badge/alert backgrounds |
| `color-pending-soft` | `#F1ECE3` | Pending tint | Pending badge/alert backgrounds |
| `color-emergency-soft` | `#F8E6E5` | Emergency tint | Emergency badge/alert backgrounds |
| `color-emergency-hover` | `#A93B36` | Emergency darkened | Hover on destructive/emergency buttons |
| `color-surface-sunken` | `#F1F4F3` | Background deepened slightly | Table header rows, subtle wells |
| `color-focus-ring` | `#315A67` at 25% alpha | Primary alpha | Focus outlines |
| `color-overlay` | `#18232A` at 50% alpha | Text alpha | Modal backdrops |

No other color values may appear anywhere in the product. Screens import tokens; only `design-system/tokens.js` contains hex strings (Document 10 rule).

## 4. Semantic Color Usage

| Meaning | Token | Where |
|---|---|---|
| Brand moments, primary actions, active nav, links, focus | `primary` | Buttons, sidebar active, links |
| Selected/active backgrounds, gentle highlights | `primary-soft` | Active nav bg, selected rows, info wells |
| Secondary interactive, chart second series, quiet accents | `accent` | Secondary emphasis, decorative signal dot in the logo |
| Page canvas | `background` | The app shell |
| Everything that holds content | `surface` | Cards, modals, inputs |
| Reading | `text` / `text-muted` | Body / meta, placeholders, captions |
| Separation | `border` | Card edges, dividers, input borders |
| Completed, verified, healthy | `success` (+soft) | Visit completed, Verified badge, positive deltas |
| Waiting, scheduled, in review | `pending` (+soft) | Payment pending, in-review applications, upcoming visits |
| Emergency, errors, missed, destructive | `emergency` (+soft) | Alarms, missed visits, form errors, delete confirms |

Hard rules: `emergency` never decorates — it appears only when something is actually wrong or destructive. `accent` never carries meaning alone (it fails no-color-alone anyway). Success/pending/emergency always travel with their text label.

## 5. Contrast Requirements

WCAG AA minimum everywhere; AAA where it comes free:

| Pair | Ratio | Verdict |
|---|---|---|
| `text` on `surface` | ~15.4:1 | AAA — body text |
| `text` on `background` | ~14.6:1 | AAA |
| `text-muted` on `surface` | ~4.9:1 | AA — meta text only, never long passages |
| `primary` on `surface` | ~6.9:1 | AA+AAA large — buttons, links |
| `surface` (white) on `primary` | ~6.9:1 | Button text passes |
| `success` on `success-soft` | ~4.6:1 | AA at badge sizes |
| `pending` on `pending-soft` | ~4.5:1 | AA at badge sizes |
| `emergency` on `emergency-soft` | ~4.6:1 | AA at badge sizes |
| `surface` on `emergency` | ~4.9:1 | Emergency button text passes |

*(Assumption — ratios computed from the hex values; re-verified with a contrast tool at build as a CI-adjacent check.)* `accent` on `surface` (~3.1:1) fails AA for text — therefore `accent` is never used for text or icons that must be read; it is a fill/graphic color only.

---

## 6. Typography

**Inter** for everything (confirmed): UI, headings, numbers. Loaded once, `font-display: swap`, with the system-UI stack as fallback. **Noto Nastaliq Urdu** joins at Phase 5 for Urdu screens (confirmed), already named in the token file so the slot exists.

Numbers: Inter's tabular figures (`font-variant-numeric: tabular-nums`) on any column of numbers (earnings, admin tables) so digits align.

## 7. Type Scale

| Token | Size / Line height | Use |
|---|---|---|
| `text-xs` | 12 / 16 | Timestamps, captions, badge text |
| `text-sm` | 14 / 20 | Body default (dashboards are dense) |
| `text-base` | 16 / 24 | Reading-weight body (consent copy, landing) |
| `text-lg` | 18 / 26 | Card titles |
| `text-xl` | 20 / 28 | Section headings |
| `text-2xl` | 24 / 32 | Page titles |
| `text-3xl` | 30 / 36 | Landing hero, big stat numbers |

Caregiver-portal minimum is `text-sm` for anything tappable-adjacent and `text-base` for primary content — small text fails the floor (Principle 3).

## 8. Font Weights

| Weight | Use |
|---|---|
| 400 Regular | Body, inputs |
| 500 Medium | Buttons, labels, nav items, badge text |
| 600 Semibold | Card and section titles, table headers |
| 700 Bold | Page titles, stat numbers |

Nothing lighter than 400, nothing heavier than 700. Bold is emphasis, not decoration — one bold element per group.

## 9. Line Heights

Baked into the scale above (roughly 1.4 for headings, ~1.45–1.5 for body). Long-form passages (consent explanation, privacy policy) use 1.6 for comfortable reading at `text-base`.

---

## 10. Spacing Scale

The confirmed fixed scale: **4, 8, 12, 16, 20, 24, 32, 48 px** — tokens `space-1` through `space-8` in that order. No arbitrary values; a gap that "needs" 14px is a design mistake. Default rhythms: 16 inside components, 24 between cards, 32 between page sections, 48 above page titles on desktop.

## 11. Grid System

- **App shell:** fixed sidebar (240px, Section 31) + fluid content column, max-width 1200px, centered, 24px gutters.
- **Content grids:** CSS grid with the spacing tokens as gaps. Dashboard stat rows: 4 → 2 → 1 columns by breakpoint. Forms: single column always (two-column forms slow completion and break on mobile); related short fields may pair (city + code style) as the one exception.

## 12. Breakpoints

| Token | Width | Targets |
|---|---|---|
| `sm` | ≥ 640px | Large phones landscape |
| `md` | ≥ 768px | Tablets — sidebar collapses to icon rail |
| `lg` | ≥ 1024px | Laptops — full sidebar |
| `xl` | ≥ 1280px | Desktops — max content width engages |

Mobile-first: base styles are the phone; breakpoints add. The caregiver portal is designed at 360px width first (Bilal's phone), decorated upward — the reverse of the admin portal, designed at `lg` and gracefully degraded.

## 13. Border Radius

| Token | Value | Use |
|---|---|---|
| `radius-sm` | 6px | Inputs, badges, small controls |
| `radius-md` | 10px | Buttons, cards |
| `radius-lg` | 16px | Modals, feature panels |
| `radius-full` | 999px | Avatars, pills, the sync-state dot |

One family, softly rounded — premium and calm, never bubbly. No mixed radii on one component.

## 14. Shadows

Shadows whisper. Borders do the separating; shadows add lift only where something floats:

| Token | Value | Use |
|---|---|---|
| `shadow-sm` | `0 1px 3px rgba(24,35,42,0.06)` | Cards (with border) |
| `shadow-md` | `0 4px 12px rgba(24,35,42,0.10)` | Dropdowns, popovers, toasts |
| `shadow-lg` | `0 12px 32px rgba(24,35,42,0.14)` | Modals, drawers |

All shadow color derives from `text` (#18232A), never black — keeps the lift warm and consistent.

## 15. Iconography

**lucide-react** (confirmed): 1.5px stroke, 20px default (24px in the caregiver portal — Principle 3), color inherits text color; `accent` allowed as icon fill only in decorative (non-meaning) spots. Every meaningful icon has a text label beside it or an accessible name; icon-only buttons require a tooltip and aria-label. The emergency button icon pairs with its word, always.

## 16. Illustrations

Minimal use: empty states and onboarding moments only. Style: simple line illustrations in `primary` and `accent` on `primary-soft` shapes — quiet, geometric, no cartoon people *(Recommendation — a small set commissioned or drawn to this rule; placeholder geometric marks until then)*. Never illustrate the emergency path — that screen is content-only.

## 17. Imagery

The product's real imagery is **visit proof photos** — they are content, not decoration, and are never filtered, cropped for style, or overlaid. Presented on `surface` with `radius-md`, capture time visible. Marketing imagery (landing page): real-feeling, warm, dignified — an elder with tea, a caregiver listening — never stock-photo clinical, never staged distress (Principle 6).

## 18. Motion

Calm motion only:

| Token | Value | Use |
|---|---|---|
| `motion-fast` | 120ms ease-out | Hovers, toggles |
| `motion-base` | 200ms ease-out | Modals, drawers, toasts entering |
| `motion-slow` | 300ms ease-in-out | Page-level transitions, skeleton shimmer |

No bounces, no springs, no attention-seeking loops. Respect `prefers-reduced-motion`: all non-essential motion collapses to instant. The single sanctioned attention animation: a slow 1.5s pulse on the active emergency banner — the exception that proves the calm.

---

## 19. Buttons

| Variant | Style | Use |
|---|---|---|
| Primary | `primary` fill, `surface` text, `radius-md`, 40px height (44px caregiver portal) | The one main action per screen |
| Secondary | `surface` fill, `border` border, `text` text | Everything else |
| Ghost | No fill, `primary` text | Tertiary, inline actions |
| Emergency | `emergency` fill, `surface` text | Destructive confirms and the emergency button only |

States: hover (`primary-hover` / `surface-sunken`), focus (2px `focus-ring` outline, always visible — ACC-002), disabled (50% opacity + not-allowed cursor, never hidden), loading (spinner replaces label, width preserved, button disabled). Minimum touch target 44×44px in the caregiver portal. Button text: verb-first, plain — "Schedule visits", "Complete visit", never "OK"/"Submit".

## 20. Inputs

40px height (44px caregiver), `surface` fill, 1px `border`, `radius-sm`, `text` at `text-sm`, placeholder in `text-muted`. Focus: border becomes `primary` + `focus-ring` glow. Error: border `emergency` + message below in `emergency` at `text-xs` — the field keeps its value (ERR-005). Disabled: `surface-sunken` fill. Labels always above the field (never floating, never placeholder-as-label), `text-sm` Medium.

## 21. Forms

Single column (Section 11). Label → field → helper/error, 8px within a group, 20px between groups, 32px before the action row. Required fields unmarked; optional fields say "(optional)" — the reverse convention, because most fields here are required. Inline validation on blur, full validation on submit, first error scrolled into view. Drafts persist (FR-011/047). The action row: primary right, secondary left of it, nothing else.

## 22. Cards

`surface`, 1px `border`, `radius-md`, `shadow-sm`, 16–20px padding. Title `text-lg` Semibold, optional meta in `text-muted`. Cards never nest inside cards. The **visit card** (the product's signature): photo thumbnails, StatusBadge, checklist summary line, caregiver name + time in muted — evidence-plain (Principle 2).

## 23. Tables

Admin-portal workhorse: `surface-sunken` header row (`text-xs` Semibold uppercase `text-muted`), 44px body rows, `border` row dividers, hover `background`, StatusBadge in status columns, tabular numerals in number columns, row action as a ghost icon-button with tooltip. Responsive: below `md`, tables become stacked cards — no horizontal scrolling of admin data on phones. Pagination controls right-aligned below.

## 24. Modals

Centered, max-width 480px, `surface`, `radius-lg`, `shadow-lg`, on `color-overlay`. Title `text-xl`, body `text-sm/base`, action row right-aligned (primary rightmost). Dismiss: X, Escape, and overlay click — except confirmation modals (overlay click disabled to prevent accidental dismissal of a decision). One modal at a time, ever. Focus is trapped inside and returns on close (Section 42).

## 25. Drawers

Right-side panel, 400px (full-width below `sm`), same skin as modals, `motion-base` slide. Use: admin detail views (an application, a visit's evidence) where context behind should stay visible. Never for forms that create things — those get pages or modals.

## 26. Toasts

Bottom center (mobile) / bottom right (desktop), `surface`, `shadow-md`, `radius-md`, icon + one sentence, auto-dismiss 4s with a visible action ("Undo" where applicable) pausing on hover. Maximum two stacked; older collapse. Toasts confirm ("Visit scheduled"); they never carry errors that need action — those are inline or alerts.

## 27. Alerts

Inline page-level bands: `-soft` background, 3px left border in the full-strength color, icon + `text-sm`, optional action link. Info uses `primary-soft`/`primary`. The emergency alert is the one full-strength variant: `emergency` background, `surface` text, the sanctioned pulse (Section 18) — reserved for an actual active emergency (Phase 2).

## 28. Badges

The StatusBadge component (the ACC-001 rule embodied): pill (`radius-full`), `-soft` background, full-color text, `text-xs` Medium, the status word always present. Variants map exactly to the semantic table (Section 4): completed/verified → success; scheduled/pending/in-review → pending; missed/flagged/emergency → emergency; neutral states → `primary-soft`/`primary`. Never icon-only, never color-only.

## 29. Tabs

Underline style: `text-muted` labels, active gets `text` color + 2px `primary` underline, `motion-fast` slide. Used in: parent overview (Profile / Visits / Plan), admin detail views. Maximum 5 tabs; more means the page is overloaded. Below `sm`, tabs scroll horizontally with edge fade.

## 30. Navigation

Three portal navigation patterns from one system:
- **Client:** sidebar (desktop) / bottom tab bar (mobile — 4 items max: Feed, Parents, Schedule, Account) — the feed is the home tab (Ayesha's decision).
- **Caregiver:** no sidebar — a simple top bar + the Today list IS the navigation; visit flow is full-screen focused (Bilal's decision). Bottom bar only if a 4th destination ever earns it.
- **Admin:** full sidebar always (Nasreen's density).

## 31. Sidebar

240px, `surface`, 1px `border` right. Logo top (the D-08 regenerated mark). Items: 40px, icon 20px + label `text-sm` Medium, `text-muted` default; active = `primary-soft` background + `primary` text + 3px `primary` left bar; hover = `background`. Collapses to 64px icon rail at `md` (tooltips carry labels). Bottom-pinned: user block (avatar, name, role) + logout.

## 32. Header

64px, `surface`, 1px `border` bottom, sticky. Left: page title (`text-2xl` on desktop, `text-lg` mobile) + breadcrumb `text-xs muted`. Right: notification bell (dot in `emergency` only when unread contains something needing action; otherwise a `primary` dot count), avatar menu. The caregiver header adds the persistent SyncStateBar slot when the queue is non-empty.

## 33. Search

MVP search is admin-only and exact (Doc 11 §18): a right-aligned 240px input in admin list toolbars, `background` fill, `radius-full`, filtering by email/name prefix. No global search bar exists at MVP — one is added only when a confirmed need names it.

## 34. Date and Time Components

- All times shown in the viewer's local time zone with the zone visible where ambiguity could matter ("10:00 (Rawalpindi time)" on caregiver-facing schedules; client sees their local + "in Rawalpindi" contextual line on visit detail) *(Recommendation — dual display on visit detail; confirm at build)*.
- Slot picker (scheduling): day-of-week chips + time dropdown within service hours — not a free calendar; structure prevents errors.
- Relative + absolute together on evidence: "2 hours ago · 21 Jul, 05:26" — trust needs the absolute.

## 35. Visit Components

The product's own component family:
- **VisitCard** (feed): photos, StatusBadge, summary, caregiver, time.
- **VisitRow** (today-list): time bold, parent name, address line, map link, status.
- **ChecklistForm:** big tap targets — yes/no toggle pair, 1–5 mood as five 44px faces/numbers, concern chips, optional note last.
- **CameraCapture:** full-screen viewfinder, single shutter, thumbnail strip of captures, no gallery affordance anywhere (FR-042).
- **SyncStateBar:** the honesty strip — per-item state chips (saved / waiting to send / sent) in pending/success colors with labels.
- **ProofTimestamp:** capture time + upload time when they differ (FR-044) — the honest-gap display.
- **ConsentPanel:** the first-visit step — explanation at `text-base`/1.6, the parent's choices as chips, given/declined actions of equal visual weight (no dark pattern toward yes — Principle 6).

## 36. Dashboard Widgets

- **StatCard** (admin, Phase 2 dashboard): label `text-sm muted`, value `text-3xl` Bold tabular, delta with direction + color + label. MVP admin uses tables, not widgets — widgets arrive with the Phase 2 dashboard.
- **FlagList:** exception rows with reason chips — the work-the-flags surface (FR-084).
- Charts (Phase 2, Recharts): `primary` first series, `accent` second, `border` gridlines, no chart borders, tooltips on `surface`/`shadow-md`.

## 37. Empty States

The EmptyState component (Doc 10): centered icon (line style, `accent`/`primary-soft`), one sentence `text-sm muted`, one action button. Copy is warm and forward-looking: feed → "Your first visit is scheduled for Tuesday"; applications → "No pending applications"; flags → "No flags — a good day." Never a bare "No data."

## 38. Loading States

- Skeletons for content areas (Section 39); spinners only inside buttons and tiny inline spots.
- The cold-start state (NFR-008): logo mark + "Waking up — just a moment" after 2s of no response — honest, branded, calm.
- Never block the whole screen for a partial load; loaded parts render as they arrive.

## 39. Skeletons

`surface-sunken` shapes with a `motion-slow` shimmer (disabled under reduced-motion), matching real layout geometry (a feed skeleton looks like visit cards). Skeletons appear only on first load of a view; refreshes update in place.

## 40. Error States

Three tiers, consistent everywhere: field errors inline (Section 20); recoverable screen errors as an alert band with a retry action; the unexpected-error screen — calm illustration-free panel, "Something went wrong on our side", retry + support path (ERR-003). The caregiver portal adds the offline tier: not an error at all — the SyncStateBar treats offline as a normal working mode (ERR-004).

## 41. Responsive Rules

Summarized contract: client portal desktop-and-mobile equal citizens (sidebar ↔ bottom tabs); caregiver portal designed at 360px first, enhanced up; admin designed at `lg`, degrades to stacked cards (§23) and icon rail (§31); touch targets ≥44px on anything a thumb hits; no horizontal scroll anywhere except deliberate chip rows with edge fades.

## 42. Accessibility

The binding rules (with their requirement IDs): color+label always (ACC-001); visible focus everywhere, `focus-ring` (ACC-002); contrast per Section 5; caregiver large-target/minimal-text rule (ACC-003); plain-context English (ACC-004, Kevin); semantic HTML and landmarks; modals trap and return focus; forms label-associated; images of proof get factual alt text ("Photo from visit, 21 July"); reduced-motion respected; the app is keyboard-completable — every acceptance E2E runs once keyboard-only *(Recommendation — added to the Playwright suite)*.

## 43. Dark Mode Roadmap

Confirmed suitable, targeted at admin/ops long sessions (Document 00 §15). Not MVP. When built (Phase 2 alongside the dashboard *(Recommendation)*): derived dark tokens from the same palette family — `dark-bg #111A1F`, `dark-surface #18242A`, `dark-border #2A3A41`, text `#E7F0F2` (primary-soft doing double duty), `accent` as the interactive color (its contrast works on dark). Semantic mapping unchanged — components consume tokens, so dark mode is a token swap, not a redesign. Client and caregiver portals stay light until a confirmed need says otherwise.

## 44. Tailwind Token Mapping

The palette enters Tailwind once, in the config — classes carry token names, never hex:

```javascript
// tailwind.config.js (theme.extend)
colors: {
  primary: { DEFAULT: "#315A67", soft: "#E7F0F2", hover: "#27484F" },
  accent: "#7AA6B2",
  background: "#F8FAF9",
  surface: { DEFAULT: "#FFFFFF", sunken: "#F1F4F3" },
  ink: { DEFAULT: "#18232A", muted: "#6B7C85" },   // "text" clashes with Tailwind's text- prefix
  line: "#DCE5E8",                                  // border token
  success: { DEFAULT: "#3F8F6B", soft: "#E3F1EA" },
  pending: { DEFAULT: "#8A7A5C", soft: "#F1ECE3" },
  emergency: { DEFAULT: "#C94A44", soft: "#F8E6E5", hover: "#A93B36" },
},
borderRadius: { sm: "6px", md: "10px", lg: "16px" },
boxShadow: {
  sm: "0 1px 3px rgba(24,35,42,0.06)",
  md: "0 4px 12px rgba(24,35,42,0.10)",
  lg: "0 12px 32px rgba(24,35,42,0.14)",
},
spacing: { 1: "4px", 2: "8px", 3: "12px", 4: "16px", 5: "20px", 6: "24px", 7: "32px", 8: "48px" },
```

Usage: `bg-primary text-surface`, `bg-success-soft text-success`, `border-line`, `text-ink-muted`. An Oxlint/review rule forbids arbitrary-value color classes (`bg-[#...]`) — the structural enforcement of Rule 3.

## 45. Component Do-and-Don't Examples

**StatusBadge**
- Do: `[ ● Completed ]` — success-soft pill, success text, the word present.
- Don't: a bare green dot; a red badge for "pending payment" (pending is `pending`, not alarm).

**Primary button**
- Do: one per screen — "Complete visit" filled primary.
- Don't: three filled-primary buttons in a modal; "OK" as a label; emergency-red for an ordinary delete-draft.

**Visit card**
- Do: photo, badge, one summary line, muted meta — evidence-plain.
- Don't: filters/overlays on proof photos; hiding a missed visit; decorative icons crowding the timestamp.

**Emergency styling**
- Do: reserve `emergency` for missed visits, errors, the alarm; pair with words; the one pulse on an active alarm.
- Don't: red asterisks on required fields (they're unmarked by convention); red for "unread"; any red decoration.

**Empty state**
- Do: "Your first visit is scheduled for Tuesday" + View schedule.
- Don't: "No data found."; an empty white void; three suggested actions.

**Caregiver checklist**
- Do: five 44px mood targets, tap chips, note last and optional.
- Don't: dropdowns for mood; required typing; text under 14px.

**Form errors**
- Do: field keeps its value, message under the field, first error scrolled to.
- Don't: toast-only errors; clearing the form; alarm-toned copy ("Invalid input!").

---

*End of Document 15 — RozVisit Design System*
