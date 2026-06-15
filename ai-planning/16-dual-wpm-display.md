# 16 — Dual WPM Display: Traditional WPM + Spoken WPM

## Summary

Introduce a second speed metric alongside the existing one, so users can
compare their results against mainstream typing-test benchmarks *and* see
a speech-native measure. The two metrics are:

| Metric | Name | Formula | Purpose |
|---|---|---|---|
| Traditional | **WPM** | `(allCharsIncludingSpaces / 5) / elapsedMinutes` | Comparable to Monkeytype, TypeRacer, 10FastFingers |
| Speech-native | **Spoken WPM** | `wordCount / elapsedMinutes` | Actual dictionary words dictated per minute |

The app currently uses the Spoken WPM formula but calls it WPM. This
proposal separates them, making WPM the industry-standard figure and
surfacing Spoken WPM as an additional metric everywhere results are shown.

---

## Why two metrics?

**Traditional WPM** defines one word as five characters (including spaces).
This originated in typewriter-era tests to normalise for word-length
variation: typing "I" and "conundrum" takes very different keystrokes, so
raw word counts are unfair to compare between passages. The 5-char
convention is what tools like Monkeytype, TypeRacer, and 10FastFingers
report, and it is what users expect when citing a WPM figure.

**Spoken WPM** counts the literal dictionary words in the passage. For a
speech test this is arguably more natural — speaking the word "I" and
speaking "conundrum" take similar time relative to their syllables, not
their character count. It also matches the unit used by the Real WPM
personalised model (which works entirely in word counts). The two figures
will differ by roughly 15–30 % depending on the average word length of a
given passage.

Showing both lets users:
- Report a WPM score that is directly comparable to typing benchmarks.
- Understand their true dictation throughput in natural speech units.
- See how the passage's word length profile affects the gap between the two.

---

## Metric definitions (updated)

Let:
- `T` = elapsed seconds (unchanged from [04](./04-test-flow-and-metrics.md)).
- `W` = token count of the reference passage after tokenisation.
- `C_raw` = raw character length of the reference passage (already stored).

```
WPM        = round((C_raw / 5) / (T / 60))   ← traditional
Spoken WPM = round(W / (T / 60))              ← actual words
```

Both are deterministic from values already stored in every history entry
(`charsRaw`, `words`, `elapsedSec`), so existing history can be
back-filled on read with no migration needed.

---

## Changes required

### 1. `src/engine/metrics.ts`

Redefine `calcWpm` to use the 5-char formula (takes `charCount`).
Add `calcSpokenWpm` preserving the current word-count logic.

```ts
// Traditional: 1 word = 5 characters (industry standard)
export function calcWpm(charCount: number, elapsedSec: number): number {
  if (elapsedSec <= 0) return 0
  return Math.round((charCount / 5 / elapsedSec) * 60)
}

// Speech-native: actual dictionary words per minute
export function calcSpokenWpm(wordCount: number, elapsedSec: number): number {
  if (elapsedSec <= 0) return 0
  return Math.round((wordCount / elapsedSec) * 60)
}
```

### 2. `src/features/test/TestScreen.tsx`

Compute both at completion time and pass both to the result.

```ts
const wpm      = calcWpm(passage.charCount, elapsedSec)
const spokenWpm = calcSpokenWpm(passage.wordCount, elapsedSec)
```

### 3. `src/storage/history.ts`

Add `spokenWpm` to the stored result type. Back-fill on read for old
entries using the already-stored `words` and `elapsedSec` fields so no
data migration is needed.

```ts
export interface TestResult {
  // ...existing fields...
  wpm: number        // traditional (chars/5/min) — definition changes
  spokenWpm: number  // actual words/min — new field
}
```

Old entries without `spokenWpm` are hydrated on read:
```ts
spokenWpm: r.spokenWpm ?? calcSpokenWpm(r.words, r.elapsedSec)
```

### 4. Results screen (post-test UI)

Show both metrics side by side in the completion panel:

```
  WPM           Spoken WPM
  214                165
traditional      actual words
```

WPM is the primary (larger) figure since it is the benchmark-comparable
one. Spoken WPM sits alongside it as a secondary figure at the same visual
level but with a smaller label beneath.

### 5. History cards and detail view

History cards currently show a single WPM badge. Update to show:
- **Primary:** WPM (traditional)
- **Secondary:** Spoken WPM in smaller text or a secondary badge

The history detail/expand view shows both with full labels.

### 6. Real WPM personalised model

`realwpm.ts` works entirely in actual word counts and actual word rates —
its `realWpm` headline is a Spoken WPM value. The label shown in the
explainer UI should be updated from "Real WPM" to "Spoken WPM" for
consistency with the new naming.

---

## History back-fill behaviour

| Entry age | `wpm` field | `spokenWpm` field |
|---|---|---|
| Pre-change | Stored as actual words/min (old definition) | Back-filled on read from `words` + `elapsedSec` |
| Post-change | Stored as chars/5/min (new definition) | Stored directly |

This means old entries will show a *higher* WPM after the change (since
traditional WPM is typically larger), while their Spoken WPM will equal
what was previously called WPM. A visual indicator (e.g. a small asterisk
or tooltip on old entries) can communicate that the WPM figure was
recalculated.

The safest option is to store a `schemaVersion` flag on results, or simply
re-derive WPM from `charsRaw` and `elapsedSec` on read for all entries
rather than trusting the stored `wpm` value, since both source fields are
already present in the stored data.

---

## Open questions

1. **Primary metric in History sort/filter** — should History sort by
   traditional WPM or Spoken WPM? Traditional is the more recognisable
   benchmark figure; Spoken WPM is what the Real WPM model uses internally.
   Defaulting to traditional WPM makes sense for discoverability.

2. **CPM relationship** — CPM (characters per minute) is already stored and
   is mathematically `WPM × 5`. Once traditional WPM is in place, CPM
   becomes redundant as a separate display value. It can be kept in storage
   for completeness but may not need a dedicated UI slot.

3. **Real WPM explainer label** — the personalised explainer (Proposal 15)
   currently uses "Real WPM". Renaming it to "Spoken WPM" aligns with the
   new nomenclature, but is a visible label change that users familiar with
   the current explainer would notice.
