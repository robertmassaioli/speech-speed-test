# 14 — Sub-component Decomposition of View Files

## Context

After the controller/view split (proposals 10 and the work in commits 926b2f6 and 3130b06),
`TestScreenView.tsx` and `HistoryScreenView.tsx` each contain several logically distinct
sections that could be extracted into their own named components with their own props interfaces
and stories. This document enumerates what those sections are and weighs the costs.

---

## Candidate sub-components in TestScreenView

| Name | Rendered when | Key props |
|---|---|---|
| `ConfigControls` | idle | `mode`, `difficultyFilter`, `availablePerDifficulty`, `onModeChange`, `onDifficultyFilterChange` |
| `PassageDisplay` | always | `rawTokens`, `matchState`, `testState`, `elapsedMs`, `passage` |
| `DictationInput` | running | `input`, `onInput`, `inputRef`, `onNewPassage` |
| `ResultsCard` | completed | `completedResult`, `passage`, `mode`, `onNewPassage`, `onTryAgain`, `onNavigateHistory` |
| `IdleActions` | idle | `mode`, `onStart`, `onNewPassage` |

`PassageDisplay` already contains `ProgressTrack` + `ProgressFill` which could themselves be
a `ProgressBar` component, but that is likely too granular.

## Candidate sub-components in HistoryScreenView

| Name | Description | Key props |
|---|---|---|
| `EmptyHistoryState` | The no-results placeholder with CTA buttons | `onNavigateTest`, `onImportClick` |
| `RealWpmCard` | Headline + tier grid + confidence legend + explainer `<details>` | `realWpm` |
| `PersonalBestsCard` | Three-row difficulty best table | `bests` |
| `TrendChart` | SVG line chart (already an internal function component) | `results` |
| `HistoryTable` | Toolbar + `<table>` of all results | `results`, `confirmClear`, `onClear`, `onCancelClear`, `onExport`, `onImportClick` |

`TrendChart` is the easiest extraction — it is already a named function with a single prop.

---

## Benefits of extracting sub-components

1. **More targeted stories.** A `RealWpmCard` story only needs a `RealWpmResult` object;
   it does not need the full `HistoryScreenViewProps`. The story is shorter and the controls
   panel in Storybook only shows relevant knobs.

2. **Smaller files.** `HistoryScreenView.tsx` is ~680 lines. Splitting into 4–5 files of
   ~120–180 lines each is easier to navigate.

3. **Isolated type contracts.** Each sub-component's props interface makes implicit assumptions
   explicit (e.g. `RealWpmCard` makes it clear it only needs the model output, not the raw
   results array).

4. **Simpler future reuse.** If a second screen ever needs a `PersonalBestsCard` or
   `TrendChart`, they are already import-ready.

---

## Caveats and costs

### 1. Props-drilling doesn't disappear — it just moves

`HistoryScreenView` currently receives a flat props object and distributes fields to JSX
inline. After extraction, `HistoryScreenView` becomes a thin layout component that passes
sub-sets of its props to each child. The total number of props in the system stays the same;
you now also need to keep the sub-component interfaces in sync with the parent interface.
Any rename ripples through an extra layer.

### 2. The hidden file-input ref is a shared UI concern

The `fileInputRef` inside `HistoryScreenView` is currently accessed by two separate sections:
`EmptyHistoryState` ("Import history" button) and `HistoryTable` ("Import" button). If those
sections become separate components, there are three options, all with downsides:

- Keep `fileInputRef` in the parent and pass a callback `onImportClick` to both children —
  adds a prop that is pure plumbing with no business meaning.
- Move the `<input type="file">` and ref into `HistoryTable` only, and wire `EmptyHistoryState`
  through the parent — creates invisible coupling between sibling components.
- Duplicate the hidden file input in both sub-components — breaks the single-ref invariant
  and means two file pickers could theoretically open.

The cleanest resolution is `onImportClick` as a shared callback, but it is still additional
plumbing the current flat structure avoids.

### 3. Styled-component co-location becomes unclear

Currently all styled components for a view live at the top of one file, grouped by section.
After splitting, each sub-component file needs its own styled components. This is fine but
means:

- ~30% of the current file length is shared layout scaffolding (`SectionTitle`, `StatsGrid`,
  `ChartSection`) that doesn't belong to any single sub-component — it stays in the parent
  file, which itself grows styled components even as it loses JSX.
- Reviewers lose the "one file, full picture" property that makes the current views easy to
  scan visually.

### 4. Story file count grows significantly

Each sub-component warrants its own story file. The current ratio is already 2 story files
per screen (controller + view). After extraction, it could reach 6–7 per screen. With two
screens that is 12–14 story files. Whether this is "rich coverage" or "noise" depends on
the team's story-maintenance discipline.

### 5. Diminishing returns vs. the controller/view split

The controller/view split had a concrete payoff: it fixed the nondeterministic
`RunningWithPartialMatch` story and unlocked the previously-unreachable `Completed` story.
Sub-component decomposition has a more diffuse payoff (shorter files, tighter story scopes).
The bugs it could catch — a `RealWpmCard` rendering with wrong data — are already catchable
by the existing `WithRealWpm` view story.

---

## Recommended approach

**Extract only `TrendChart` and `RealWpmCard` in a first pass.**

These two are the strongest candidates:

- `TrendChart` is already isolated with a single prop (`results`). It has non-trivial
  rendering logic (SVG geometry, axis ticks, per-difficulty lines) that benefits from
  a dedicated story.
- `RealWpmCard` (including the `<details>` explainer) is the most complex section and
  the one most likely to be reused or redesigned independently.

Leave `EmptyHistoryState`, `PersonalBestsCard`, `HistoryTable`, and all of `TestScreenView`'s
sections where they are until there is a concrete reason to move them (reuse elsewhere,
a specific test gap, or the file becoming too large to navigate).

**Do not decompose `TestScreenView` at this time.** Its sections are tightly interleaved
(the passage display's `matchState` drives word colouring that informs the input area's
progress; the idle/running/completed state gates which panels render). Splitting would
require passing `matchState` and `rawTokens` to multiple children rather than computing
them once at the top.

---

## Implementation sketch (if pursued)

```
src/features/history/
  RealWpmCard.tsx           ← RealWpmCard component + explainer + all their styled components
  RealWpmCard.stories.tsx   ← NoData, WithLowConfidence, WithHighConfidence, ExplainerOpen
  TrendChart.tsx            ← TrendChart component + ChartWrap, chart helpers
  TrendChart.stories.tsx    ← OneResult (shows placeholder), TwoResults, ManyResults
  HistoryScreenView.tsx     ← slimmed: imports RealWpmCard + TrendChart, keeps the rest inline
```

For each extracted component, move its styled components with it; leave layout-only styled
components (`StatsGrid`, `ChartSection`, `SectionTitle`) in `HistoryScreenView.tsx`.
