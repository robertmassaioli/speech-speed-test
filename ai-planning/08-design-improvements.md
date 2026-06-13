# 08 — Design Improvement Proposals

## Context

Visual audit conducted 2026-06-14 across all three app states: test (idle), test (running), and history (empty). Screenshots reviewed at 1280×800. The current UI is functional but entirely monochromatic (black / white / gray) with no brand identity and several layout and hierarchy issues. The following 10 proposals prioritise:

- **Purple as the primary brand/accent colour** (applied via the 60-30-10 rule: ~60% neutral white/light-gray, ~30% dark text, ~10% purple accents)
- **Fitts's Law** — primary actions large and easy to target
- **Visual hierarchy** — one clear thing to do at any moment
- **Gestalt proximity/similarity** — group related controls, separate distinct concerns
- **Progressive disclosure** — surface only what's needed for the current task phase

---

## Colour palette (reference for all proposals)

| Token | Value | Use |
|---|---|---|
| `--purple-50` | `#f5f3ff` | Backgrounds, hover tints |
| `--purple-100` | `#ede9fe` | Section backgrounds |
| `--purple-600` | `#7c3aed` | Primary buttons, active states, focus rings |
| `--purple-700` | `#6d28d9` | Button hover |
| `--purple-900` | `#4c1d95` | Nav bar, brand text |
| `--neutral-50` | `#fafaf9` | Passage background (warm white) |
| `--neutral-200` | `#e5e5e5` | Borders, dividers |
| `--neutral-700` | `#374151` | Body text |
| `--neutral-900` | `#111827` | Headings |

---

## Improvement 1 — Purple brand identity throughout the nav

**Current state:** The nav bar is a plain white strip with thin gray border-bottom, black brand text, and gray link text. It feels like an unstyled skeleton.

**Proposal:** Give the nav a `--purple-900` background with white text and links. The brand wordmark "Speech Speed Test" becomes a white bold logotype on the left. The active route link gets a white pill underline or a white bottom border accent. The overall effect anchors every page with a clear brand stripe and immediately signals this is a named product, not a prototype.

**Design rule:** Consistent brand application in the primary navigation is the single highest-leverage gesture for making an app feel finished (Nielsen's "Aesthetic-Usability Effect"). The nav is the one element present on every screen.

---

## Improvement 2 — Primary action hierarchy: purple Start Test button

**Current state:** "Start Test" (black) and "New Passage" (dark gray) sit side-by-side at identical visual weight, with the mode toggle also at the same weight to the left. There is no clear primary action.

**Proposal:**
- **Start Test** → filled `--purple-600` button, large padding (`0.75rem 2rem`), font-size `1rem`, slight shadow. This is the one thing a first-time visitor should see and click.
- **New Passage** → outline/ghost button (border `--purple-600`, transparent background, purple text). Secondary affordance.
- **Mode toggle (Lexical / Strict)** → remains a compact segmented control, but uses `--purple-600` for the active segment fill instead of black.
- **Difficulty toggle** → same segmented-control treatment, active segment `--purple-600`.

**Design rule:** Fitts's Law + the principle of one primary call-to-action per view. When every button looks the same, users hesitate. The purple Start Test button creates an unmistakable entry point.

---

## Improvement 3 — Passage box as a reading-first surface

**Current state:** The passage box has `line-height: 1.9` (generous to the point of feeling airy and making the box very tall), `font-size: 1.1rem`, and a plain white background with a thin gray border. The long chemistry passage fills nearly the entire above-the-fold area, leaving the controls below the scroll fold on shorter displays.

**Proposal:**
- Reduce `line-height` to `1.7` — still comfortable for reading but reduces total box height by ~10%.
- Increase `font-size` to `1.15rem` and switch the passage text to a reading-optimised serif (`Georgia`, `Charter`, or system `ui-serif`) to signal "this is content to be read, not UI chrome."
- Set passage box background to `--neutral-50` (`#fafaf9`) instead of pure white — a barely-perceptible warm tint reduces eye strain over repeated tests.
- Add a `4px` left border in `--purple-100` to accent the passage as the focal content element.
- Apply `max-height: 420px` + `overflow-y: auto` so a very long passage doesn't push controls below the fold.

**Design rule:** Information hierarchy via typographic contrast (Bringhurst's *Elements of Typographic Style*). Passage text and UI labels should not share the same typeface and size — distinguishing them reduces the cognitive cost of switching roles (reader → operator).

---

## Improvement 4 — Running state: focused mode with a progress bar

**Current state:** When the test starts, the passage text turns gray (upcoming styling). The controls row shrinks slightly, a timer appears, and a textarea is added at the bottom. The mode toggle remains visible but disabled. The progress counter "0 / 133 words matched" appears as plain text in the controls row.

**Proposal:**
- Hide the mode toggle entirely during `running` state — it's non-actionable and adds noise.
- Replace the text progress counter with a thin `4px` purple progress bar that spans the full width of the passage box bottom edge: `width = matchedCount / wordCount × 100%`. This gives a continuous visual signal of progress without requiring the user to parse a number.
- Move the timer to a small pill badge anchored to the top-right corner of the passage box (e.g., `position: absolute; top: 0.75rem; right: 0.75rem`), so it's always visible while reading but doesn't shift the layout.
- Keep the "Abandon" button but style it as a **text link** ("✕ Abandon") rather than a button — it shouldn't compete visually with the running state.

**Design rule:** Progressive disclosure + figure-ground (Gestalt). During the test, the passage is the figure and everything else is ground. Removing non-functional controls and moving metrics to the edges lets the user stay focused on the content.

---

## Improvement 5 — Eliminate the redundant page heading

**Current state:** The nav shows "Speech Speed Test" and the page shows a large `<h1>Speed Test</h1>`. These say the same thing twice. The heading takes up ~50px of prime vertical real estate on the most-visited page.

**Proposal:** Remove the `<h1>Speed Test</h1>` from the test screen. The nav already labels the context. Replace it with a compact context line above the passage: a small breadcrumb/label like `"Passage · Hard"` or just the difficulty badge (`Hard` in red) and word count (`133 words`) as a single muted metadata row — useful, non-redundant. On the History screen, keep the `<h1>` but style it to match the brand (purple-accent underline or left-border).

**Design rule:** The first principle of content editing: eliminate redundancy. Every element must earn its space. The reclaimed 50px is the difference between the controls being visible above the fold and being hidden below it on a 13" laptop.

---

## Improvement 6 — Inline results card: celebration moment

**Current state:** After completion, a white card appears with three metric numbers (WPM, CPM, Time) in a 3-column grid, a muted detail line, and three action buttons. The card looks identical to the passage box in style and doesn't feel like a distinct "result" moment.

**Proposal:**
- Give the results card a `--purple-50` (`#f5f3ff`) background with a `--purple-600` top border (`4px solid`), creating a clear visual break from the passage.
- Make the WPM number significantly larger (`3rem`, bold, `--purple-900` colour) — it's the headline number the user cares about. CPM and Time can be secondary at `2rem`.
- Add a subtle checkmark or celebration icon (✓) in `--purple-600` next to "WPM" to signal success.
- Label the three metrics more expressively: "WPM — Words per minute", "CPM — Characters per minute" as tooltips or sub-labels.
- Style "New Passage" as the purple primary button and "Try Again" / "History" as outlines.

**Design rule:** The peak-end rule (Kahneman) — users remember the peak moment of an experience disproportionately. The result reveal is the emotional peak of each test session; it should feel rewarding.

---

## Improvement 7 — History screen: two-column stat layout

**Current state:** The history page stacks "Your Real WPM" (full-width card), "Personal Bests" (3-column grid), "Trend" (full-width chart), then the table — all as a single vertical column. On a 900px-wide layout this leaves significant horizontal space unused in the upper sections.

**Proposal:** At `≥ 640px` width, use a two-column grid for the stats area:
- **Left column (55%):** Your Real WPM card + per-tier breakdown
- **Right column (45%):** Personal Bests grid (stacked vertically: Easy, Medium, Hard)
- **Full width below:** Trend chart → History table

This creates a natural "dashboard" layout where the two primary metrics (composite Real WPM + personal bests per bin) are visible together without scrolling, and the trend chart below them gives longitudinal context.

**Design rule:** F-pattern reading (Nielsen) — users scan left-to-right then down. Placing the headline Real WPM number top-left puts it exactly where the eye lands first. Personal bests alongside it answer the immediate follow-up question ("is this a record?").

---

## Improvement 8 — History empty state: helpful, not hollow

**Current state:** With zero results, the history screen shows: a gray card saying "Complete your first test…", three Personal Best cards each with a "—" and a tiny colored line (looks broken), a gray chart placeholder card, and "0 results / No results yet." — four separate empty states that collectively feel like a broken page.

**Proposal:** Collapse all four into a **single contextual empty state** occupying the top section:

```
  🎙  No tests recorded yet
  Complete a Speed Test to see your Real WPM, personal bests, and trend chart.
  [Start a test →]  [Import history]
```

- Use a simple microphone/speech icon in `--purple-100` circle background.
- The purple CTA button navigates to `/`.
- The individual section cards (Real WPM, Personal Bests, Trend) are hidden entirely until the first result exists. Don't render hollow shells.

**Design rule:** Empty states should explain what will appear and provide a clear next action (Luke Wroblewski's "Mobile First" empty state pattern). Showing three broken-looking empty cards creates anxiety rather than guidance.

---

## Improvement 9 — Consistent 8-point spacing grid

**Current state:** Spacing throughout the app is ad-hoc: `0.45rem`, `0.6rem`, `0.75rem`, `1rem`, `1.25rem`, `1.4rem`, `1.5rem`, `2rem`, `2.8rem` — no underlying system. The result is a layout that *works* but doesn't feel intentional or balanced.

**Proposal:** Adopt an **8px base grid** for all spacing values:
- `0.5rem` (8px) — tight: icon padding, badge padding
- `1rem` (16px) — standard: element gaps, inner padding
- `1.5rem` (24px) — comfortable: section padding, card gaps
- `2rem` (32px) — open: page padding, major section gaps
- `3rem` (48px) — generous: top-of-page breathing room

All `padding`, `margin`, `gap`, and `border-radius` values should snap to this scale. This doesn't require a CSS framework — a handful of CSS custom properties (`--space-1` through `--space-6`) suffice.

**Design rule:** Grid systems (Jan Tschichold). Consistent spatial rhythm makes layouts feel deliberate. The eye perceives a well-spaced layout as more trustworthy and professional even when it can't articulate why.

---

## Improvement 10 — Accessible purple focus rings and hover states

**Current state:** Focus rings use browser defaults (blue outline in Chrome, variable across browsers). Hover states are minimal (`background: #d4d4d4`, `background: #333`). There are no transitions on interactive elements except for the mode toggle.

**Proposal:**
- All interactive elements (buttons, toggle segments, links, the textarea) get `outline: 2px solid var(--purple-600); outline-offset: 2px` on `:focus-visible`. This is both on-brand and WCAG 2.1 AA compliant (3:1 contrast ratio against white).
- Buttons get a `transition: background 0.15s, box-shadow 0.15s` with a `box-shadow: 0 0 0 3px var(--purple-100)` on hover — a soft purple glow that telegraphs interactivity without a colour shift.
- The matched-word highlight (`color: #2a7a2a`) gains an additional `text-decoration: underline; text-decoration-color: #2a7a2a` for users who distinguish colour poorly (colour-blindness accessibility).
- The timer display in running mode uses `--purple-900` colour instead of `#1a1a1a`, giving it a subtle brand connection.

**Design rule:** WCAG 2.1 accessibility (Criterion 2.4.7: Focus Visible; 1.4.1: Use of Colour). Focus rings serve keyboard users; the colour-blind-friendly word underline serves ~8% of male users. Accessible design and good design are the same thing.

---

## Priority order for implementation

| Priority | Improvement | Effort | Impact |
|---|---|---|---|
| 1 | Purple brand / nav (#1) | Low | High |
| 2 | Primary button hierarchy (#2) | Low | High |
| 3 | Empty state consolidation (#8) | Low | High |
| 4 | Inline results celebration (#6) | Medium | High |
| 5 | Redundant heading removal (#5) | Low | Medium |
| 6 | Running state focused mode (#4) | Medium | Medium |
| 7 | Passage reading surface (#3) | Low | Medium |
| 8 | History two-column layout (#7) | Medium | Medium |
| 9 | 8-point spacing grid (#9) | Medium | Medium |
| 10 | Focus rings / accessibility (#10) | Low | Medium |

Items 1, 2, 3, 5, 7, and 10 can all be done as a single styling pass with no logic changes. Items 4, 6, and 8 require small component restructuring. Item 9 (spacing grid) is best done as part of the same styling pass as 1 and 2.
