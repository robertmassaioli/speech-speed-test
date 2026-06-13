# 04 — Test Flow & Metrics

## Summary

Defines the end‑to‑end test experience and the exact definitions of the timing, WPM, and CPM metrics. Precision here matters because these numbers feed history and the Real‑WPM model.

## The test loop (UX)

1. **Arrive / new test.** App selects a passage (random, optionally filtered by difficulty bin or length). The passage is displayed prominently, read‑only.
2. **Choose mode** (Strict / Lexical). Default: **Lexical**. Mode is recorded with the result.
3. **Start.** User clicks "Start", which auto‑focuses the input. State → `running` and **the clock starts immediately** (see timing decision below). The user should begin speaking right away.
4. **Dictate.** User dictates with their own STT tool into the text box. As text arrives, the engine highlights the longest correct prefix and marks the first divergent token.
5. **Auto‑complete.** When the completion predicate (see [03](./03-matching.md)) is satisfied, the timer stops, state → `completed`, and the input is locked.
6. **Results.** Show WPM, CPM, elapsed time, mode, passage difficulty, and how this compares to history. Offer "Try again" / "New passage".

User can **reset/abandon** at any time (no result recorded) or **retry the same passage**.

## When does the clock start and stop?

This is a real design decision because of **how STT engines emit text**.

**Decision:**
- **Start the clock the instant the "Start" button is clicked.**
- **Stop the clock the instant the completion predicate is satisfied.**
- Elapsed time `T = t_complete − t_startClick`.

**Rationale (the deciding constraint):** many STT engines do **not** stream — they buffer the entire utterance and dump all the text at the very end (on pause/stop). If we started the clock on the *first matching token*, we would only be timing **how fast the engine flushes its buffer**, not how long the human actually spent speaking. Starting on the button click captures the full human‑dictation duration regardless of whether the engine streams incrementally or batches at the end. This is the fair and engine‑agnostic choice.

Consequence to communicate in the UI: the user should click **Start and then begin speaking immediately**, because their setup/think time is now inside the measured interval. A short "Get ready… go" affordance (or a countdown) before the clock starts is a reasonable UX softener, but the measured interval itself begins at Start.

> Because timing is now from the button click for *every* result, it remains **consistent**, which is what Real‑WPM requires when comparing passages to each other.

Anti‑cheat / sanity guards: if `T` is implausibly small (e.g. the user pasted the whole passage), flag the result as "suspect" and exclude it from Real‑WPM aggregation. Pasting detection: a single input event that jumps the correct‑prefix from ~0 to complete.

## Metric definitions

Let:
- `T` = elapsed seconds (above).
- `W` = word count of the **reference** passage (canonical, not the user's input). Using the reference makes results comparable regardless of how STT chunked the text.
- `C` = character count of the reference passage.

Then:

```
WPM = W / (T / 60) = 60 · W / T
CPM = C / (T / 60) = 60 · C / T
```

### Which character/word count?

- **Words (`W`):** count of reference tokens after tokenisation (consistent with the matching engine), *not* a naive `split(' ')`. This avoids quirks from double spaces or trailing punctuation.
- **Characters (`C`):** two reasonable definitions; we record **both** so we never have to recompute history later:
  - `C_raw` = character length of the original reference text (incl. spaces & punctuation).
  - `C_norm` = character length after lexical normalisation (the "information" characters).
  - **Display default:** `C_raw` (matches user intuition of "how much text"). Store both.

### Accuracy

Because the test only completes on a *full* match, the recorded result is implicitly 100% accurate at completion time. We *also* log the **number of correction events** / divergences encountered en route as a soft "cleanliness" stat (not used in WPM, useful for the user to see how much their STT struggled). Optional for MVP.

## Timing implementation notes

- Use `performance.now()` (monotonic) for timing, not `Date.now()`.
- Record `t_startClick` on the button handler. Debounce the *comparison*, but timestamp `t_complete` from the *raw* input event that first satisfies the predicate, so debouncing doesn't add latency to the measured end.
- All recorded results carry: passage id, mode, `T`, `W`, `C_raw`, `C_norm`, WPM, CPM, difficulty bin, composition vector, timestamp, and a `suspect` flag.

These fields are exactly what [05 — Real WPM](./05-realwpm.md) and [06 — History](./06-history-and-storage.md) consume.
