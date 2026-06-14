# 09 — Dark Mode + Multi-Theme Support

## Context

The app currently has a single light purple theme defined as hardcoded palette tokens in
`GlobalStyle.ts` (`:root { --purple-50 … --purple-900 … }`). Colour references are a mix of
CSS variables and hardcoded literals (`#fff`, `#aaa`, `#166534`, etc.) scattered across
`TestScreen.tsx`, `HistoryScreen.tsx`, and the inline SVG chart. This proposal defines the
architecture for:

1. **Dark mode** — respects `prefers-color-scheme` by default; the user can pin light/dark
   manually.
2. **Four hue themes** — Purple (existing), Blue, Orange, Red. Each works in both light and
   dark mode, giving eight total combinations.

---

## 1. Architecture: semantic CSS custom property tokens

### Why CSS vars, not `ThemeProvider`

styled-components `ThemeProvider` requires every styled-component to access colours through
`p.theme.*`, which would require touching every component. CSS custom properties on
`:root` (or `[data-theme]`) work automatically for any component that already references a
variable, require no changes to component signatures, and are readable by inline SVG `fill`
attributes and `style` props alike.

The one required change is replacing hardcoded literals (`#fff`, `#aaa`) with the
appropriate semantic token everywhere they appear. This is a one-time migration done in
the same PR as the feature.

### Semantic token set

All UI code will reference only these semantic tokens. Palette tokens (`--purple-600` etc.)
become private implementation details of each theme definition and should not be used in
component code after migration.

| Token | Light role | Dark role |
|---|---|---|
| `--accent-50`    | tint backgrounds (hover, card fill) | deep tint (accessible on dark bg) |
| `--accent-100`   | icon backgrounds, left borders | slightly lighter deep tint |
| `--accent-600`   | primary buttons, focus rings, active states | same hue, slightly lighter |
| `--accent-700`   | button hover | hover shade |
| `--accent-900`   | nav bar, brand text, WPM headline | very light version (inverted) |
| `--surface`      | page background | dark background |
| `--surface-raised` | card/table/input background | elevated dark surface |
| `--surface-subtle` | table header, tier cell | subtle dark layer |
| `--border`       | card/table borders, dividers | muted dark border |
| `--text-primary` | headings, strong values | near-white |
| `--text-secondary`| labels, muted text | medium-light gray |
| `--text-on-accent`| text on filled accent buttons | white (same in both modes) |
| `--text-matched` | correctly matched word colour | accessible green (same hue) |
| `--text-mismatch`| mismatched word colour | accessible red (same hue) |
| `--text-upcoming`| un-reached word colour | muted dark gray |
| `--diff-easy-bg` / `--diff-easy-text` | existing difficulty tokens | darker bg, lighter text |
| `--diff-med-bg`  / `--diff-med-text`  | " | " |
| `--diff-hard-bg` / `--diff-hard-text` | " | " |
| `--chart-grid`   | SVG grid lines | dark grid lines |
| `--chart-axis`   | SVG axis label colour | muted dark label |

### Why separate `--text-matched` and `--text-mismatch` tokens

Currently `TestScreen.tsx` hardcodes `#166534` (matched green) and `#991b1b` (mismatch red)
directly in the `Word` styled component. In dark mode these values are too dark against a
dark background and must invert. The SVG chart also hardcodes the same green/red as
difficulty-line colours. Making them CSS tokens solves both in one declaration.

---

## 2. Theme definitions

Each theme is a CSS block that re-assigns the semantic tokens for light + dark mode.
Six files would live in `src/app/themes/`:

```
src/app/themes/
  purple.ts    ← default (migrates current values)
  blue.ts
  orange.ts
  red.ts
```

Each file exports a single `createThemeBlock(id: string): string` template literal.

**Example — purple theme sketch:**

```css
/* purple.ts light */
[data-theme="purple"] {
  --accent-50:    #f5f3ff;
  --accent-100:   #ede9fe;
  --accent-600:   #7c3aed;
  --accent-700:   #6d28d9;
  --accent-900:   #4c1d95;
  --surface:         #f0effe;
  --surface-raised:  #ffffff;
  --surface-subtle:  #fafaf9;
  --border:          #e5e5e5;
  --text-primary:    #111827;
  --text-secondary:  #525252;
  --text-on-accent:  #ffffff;
  --text-matched:    #166534;
  --text-mismatch:   #991b1b;
  --text-upcoming:   #aaaaaa;
  --diff-easy-bg:    #dcfce7; --diff-easy-text: #166534;
  --diff-med-bg:     #fef9c3; --diff-med-text:  #854d0e;
  --diff-hard-bg:    #fee2e2; --diff-hard-text: #991b1b;
  --chart-grid:   #f3f4f6;
  --chart-axis:   #9ca3af;
}
/* purple.ts dark */
[data-theme="purple"][data-dark] {
  --accent-50:    #1e1b4b;
  --accent-100:   #312e81;
  --accent-600:   #a78bfa;
  --accent-700:   #c4b5fd;
  --accent-900:   #ede9fe;
  --surface:         #0f0e1a;
  --surface-raised:  #1a1828;
  --surface-subtle:  #1f1d30;
  --border:          #2e2c42;
  --text-primary:    #f0effe;
  --text-secondary:  #a5a3b8;
  --text-on-accent:  #ffffff;
  --text-matched:    #4ade80;
  --text-mismatch:   #f87171;
  --text-upcoming:   #4a4860;
  --diff-easy-bg:    #14532d; --diff-easy-text: #86efac;
  --diff-med-bg:     #78350f; --diff-med-text:  #fde68a;
  --diff-hard-bg:    #7f1d1d; --diff-hard-text: #fca5a5;
  --chart-grid:   #1f2937;
  --chart-axis:   #4b5563;
}
```

**Blue theme accent colours (light):**
`--accent-600: #2563eb; --accent-700: #1d4ed8; --accent-900: #1e3a8a`
Surface: light blue tint (`#eff6ff`).

**Orange theme accent colours (light):**
`--accent-600: #ea580c; --accent-700: #c2410c; --accent-900: #7c2d12`
Surface: warm cream (`#fff7ed`).

**Red theme accent colours (light):**
`--accent-600: #dc2626; --accent-700: #b91c1c; --accent-900: #7f1d1d`
Surface: pale rose (`#fff1f2`).

---

## 3. State management

### What to store

Two independent preferences, stored in `localStorage`:
- `sst-theme`: `'purple' | 'blue' | 'orange' | 'red'` (default `'purple'`)
- `sst-dark`: `'auto' | 'light' | 'dark'` (default `'auto'`)

### How to apply

`<html>` gets two attributes:
- `data-theme="purple"` (or blue/orange/red)
- `data-dark` is present when dark mode is active (absent otherwise)

Dark mode is active when:
- `sst-dark === 'dark'`, OR
- `sst-dark === 'auto'` AND `window.matchMedia('(prefers-color-scheme: dark)').matches`

A small `useTheme()` hook in `src/app/useTheme.ts` manages this:
```typescript
export type HueTheme = 'purple' | 'blue' | 'orange' | 'red'
export type DarkMode = 'auto' | 'light' | 'dark'
export function useTheme(): {
  hue: HueTheme; dark: DarkMode; effectiveDark: boolean
  setHue(h: HueTheme): void; setDark(d: DarkMode): void
}
```

`App.tsx` calls `useTheme()` and applies `data-theme` and `data-dark` to `document.documentElement`
via a `useEffect`. This is the only place in the app that touches those attributes; all
components read them passively through CSS.

### Flash of unstyled content prevention

A tiny inline `<script>` in `index.html` (before `<body>`) reads `localStorage` and sets
`data-theme` / `data-dark` synchronously so the correct theme is active before first paint.
This prevents a purple flash when the user has selected blue, and prevents a white flash
when the user has pinned dark mode.

```html
<script>
  (function(){
    var t = localStorage.getItem('sst-theme') || 'purple'
    var d = localStorage.getItem('sst-dark') || 'auto'
    var dark = d === 'dark' || (d === 'auto' && window.matchMedia('(prefers-color-scheme:dark)').matches)
    document.documentElement.setAttribute('data-theme', t)
    if (dark) document.documentElement.setAttribute('data-dark', '')
  })()
</script>
```

---

## 4. Theme switcher UI

### Placement

A small control group on the right side of the nav bar, after the navigation links.

### Controls

- **Hue swatches** — four 18×18px circle buttons (purple / blue / orange / red), each
  filled with that theme's `--accent-600` colour. The active swatch has a white ring.
  No labels needed — they are colour swatches.
- **Dark mode toggle** — a single icon button cycling `auto → dark → light → auto`.
  Icons: `☀` (light), `☾` (dark), `⬡` or `◐` (auto). A `title` attribute provides
  accessible text. Pressing cycles between the three states.

```
┌─────────────────────────────────────────────────────┐
│  Speech Speed Test          Test  History  ● ● ● ●  ☾  │
└─────────────────────────────────────────────────────┘
                                        ↑ swatches  ↑ dark toggle
```

On screens narrower than 480px, the swatches collapse behind a single "Theme" button that
opens a small `<details>` dropdown.

---

## 5. Component migration: hardcoded values to replace

The following literals must be replaced with semantic tokens in the same PR:

### `src/app/GlobalStyle.ts`
- `body { background: #f0effe }` → `background: var(--surface)`
- Remove all `--purple-*` and `--neutral-*` top-level tokens (they move into theme files)
- Keep `--diff-*`, `--space-*` in `:root` (not theme-specific)

### `src/features/test/TestScreen.tsx`
| Current value | Replace with |
|---|---|
| `var(--purple-900)` (TimerBadge) | `var(--accent-900)` |
| `var(--purple-100)` (PassageBox border-left) | `var(--accent-100)` |
| `var(--neutral-50)` (PassageBox bg) | `var(--surface-subtle)` |
| `var(--neutral-200)` (PassageBox border, ProgressTrack) | `var(--border)` |
| `#aaa` (upcoming word) | `var(--text-upcoming)` |
| `#166534` (matched word colour + underline) | `var(--text-matched)` |
| `#991b1b` (mismatch word colour) | `var(--text-mismatch)` |
| `background: #fff` (ToggleGroup, InputArea) | `var(--surface-raised)` |
| `var(--purple-600)` (all accent uses) | `var(--accent-600)` |
| `var(--purple-700)` (button hover) | `var(--accent-700)` |
| `var(--purple-50)` (ResultsCard bg, button hover tint) | `var(--accent-50)` |
| `var(--purple-100)` (button hover glow) | `var(--accent-100)` |
| `color: var(--purple-900)` (MetricValue primary) | `var(--accent-900)` |
| `var(--neutral-600)` | `var(--text-secondary)` |
| `var(--neutral-700)` | `var(--text-primary)` |
| `var(--neutral-900)` | `var(--text-primary)` |

### `src/features/history/HistoryScreen.tsx`
| Current value | Replace with |
|---|---|
| `background: #fff` (cards, table, input) | `var(--surface-raised)` |
| `var(--purple-600)` (all accent) | `var(--accent-600)` |
| `var(--purple-50)` (NudgeLine) | `var(--accent-50)` |
| `var(--purple-900)` (WPM headline) | `var(--accent-900)` |
| `var(--neutral-50)` (TierCell, table header) | `var(--surface-subtle)` |
| `#f3f4f6` (SVG grid lines) | `var(--chart-grid)` |
| `#e5e7eb` (SVG axes) | `var(--chart-grid)` |
| `#9ca3af` (SVG labels) | `var(--chart-axis)` |
| `#6b7280` (SVG legend text) | `var(--chart-axis)` |
| `#166534`, `#854d0e`, `#991b1b` (SVG diff lines/dots) | `var(--diff-easy-text)`, `var(--diff-med-text)`, `var(--diff-hard-text)` |
| `border-left: 4px solid var(--purple-600)` (h1) | `border-left: 4px solid var(--accent-600)` |

### `src/app/App.tsx`
- `var(--purple-900)` (Nav bg) → `var(--accent-900)`
- `a` / `a.active` colours stay white (hardcoded `#fff` / `rgba(255,255,255,…)`) — these are correct as-is against the dark nav bar regardless of theme

---

## 6. Implementation plan

All steps are in a single PR; no interleaved commits needed.

### Step 1 — Token migration (no visible change)
- Create `src/app/themes/purple.ts` with the full light + dark token block for purple
- Update `GlobalStyle.ts` to import and inject this block instead of hardcoding values
- Update all three component files to replace hardcoded values per the tables above
- Run tests — should all pass (token names don't affect test output)

### Step 2 — Remaining three theme files
- `src/app/themes/blue.ts`, `orange.ts`, `red.ts` — same structure as `purple.ts`
- Each defines light + dark variants

### Step 3 — `useTheme` hook + `App.tsx` wiring
- Write `src/app/useTheme.ts`
- In `App.tsx`, call `useTheme()`, apply `data-theme` / `data-dark` to `document.documentElement`
- Add theme switcher controls to `Nav` (four swatch circles + dark toggle icon)

### Step 4 — FOUC prevention
- Add inline script in `index.html`

### Step 5 — Verify
- Build + run tests
- Manually verify: each of the 4 themes × 2 modes (light/dark) = 8 combinations
- Verify `prefers-color-scheme: dark` respected when `sst-dark` is `'auto'`

---

## 7. Trade-offs considered

| Approach | Pros | Cons | Decision |
|---|---|---|---|
| CSS custom properties on `[data-theme]` | Zero component refactor after token migration; works in SVG; no re-render on theme change | Requires one-time literal → token migration | **Chosen** |
| styled-components `ThemeProvider` | Type-safe theme access per component | Must update every styled-component; no automatic CSS variable; SVG needs separate handling | Rejected |
| Tailwind dark variant classes | Very common, good tooling | Not used in this project; major migration | Out of scope |
| CSS `color-scheme` + `light-dark()` | Browser-native | Hue theming still requires custom properties on top | Can layer in later as enhancement |

---

## 8. Files to create / modify

| File | Action |
|---|---|
| `src/app/themes/purple.ts` | Create |
| `src/app/themes/blue.ts`   | Create |
| `src/app/themes/orange.ts` | Create |
| `src/app/themes/red.ts`    | Create |
| `src/app/useTheme.ts`      | Create |
| `src/app/GlobalStyle.ts`   | Modify (inject theme blocks, remove hardcoded palette) |
| `src/app/App.tsx`          | Modify (call useTheme, add switcher to Nav) |
| `src/features/test/TestScreen.tsx`    | Modify (token migration) |
| `src/features/history/HistoryScreen.tsx` | Modify (token migration) |
| `index.html`               | Modify (add FOUC-prevention inline script) |

No new dependencies. No changes to the engine, corpus, or storage layers.
