# 06 — History & Storage

## Summary

All user data persists in the browser's `localStorage`. No backend, no accounts. The store holds the full list of completed test results plus lightweight settings, and is the single source of truth from which history charts and "Your Real WPM" are derived.

## Why `localStorage`

- Static site, no backend — `localStorage` is synchronous, simple, and survives reloads.
- Data volume is tiny (a few hundred results × a small JSON object) — well within the ~5 MB quota.
- If we ever outgrow it (unlikely), the schema is portable to `IndexedDB` without changing the result shape.

## Schema

Top‑level key: `sst.v1` (namespaced + versioned so we can migrate).

```jsonc
{
  "version": 1,
  "settings": {
    "defaultMode": "lexical",
    "frequencyListId": "google-10k-no-swears@<commit>"  // ties results to the tier definitions used
  },
  "results": [
    {
      "id": "uuid",
      "ts": 1718200000000,               // completion epoch ms
      "passageId": "pg1342-0042",
      "mode": "lexical",
      "elapsedSec": 41.2,
      "words": 118,                       // reference token count W
      "charsRaw": 642,                    // C_raw
      "charsNorm": 610,                   // C_norm
      "wpm": 171.8,
      "cpmRaw": 935.0,
      "composition": [0.51, 0.39, 0.085, 0.015],
      "difficultyBin": "medium",
      "corrections": 3,                   // optional cleanliness stat
      "suspect": false                    // excluded from Real WPM if true
    }
  ]
}
```

> Each result stores **everything needed to recompute every derived metric** (composition, mode, words, chars). We never persist the Real‑WPM number itself — it is always derived from `results`, so improving the model retroactively improves historical insight.

## Schema versioning & migration

- `version` gates a migration step on load. Unknown/newer versions are handled gracefully (read‑only fallback rather than data loss).
- If the **frequency list changes** (different tier definitions), historical `composition` vectors become inconsistent with new ones. Mitigation: stamp each result with `frequencyListId`; Real‑WPM aggregation only mixes results sharing the same list, or recomputes compositions if the passage is still in the corpus.

## Views over history

- **Results table:** reverse‑chronological list (date, passage, difficulty, mode, WPM, CPM).
- **Trend chart:** WPM (and/or CPM) over time, optionally faceted by difficulty bin so improvement is visible per tier.
- **Real WPM panel:** the derived headline + per‑tier breakdown (see [05](./05-realwpm.md)).
- **Personal bests** per difficulty bin.

## Data management

- **Export / Import:** download the store as a JSON file and re‑import it — the only "sync" mechanism in a backend‑less app (move between machines/browsers). Strongly recommended for MVP since `localStorage` is easily cleared.
- **Clear history:** explicit, confirmed destructive action.
- **Privacy:** everything is local; nothing leaves the device. State this plainly in the UI — it's a feature.

## Edge cases

- `localStorage` disabled / private mode → app runs in ephemeral memory with a visible "history won't be saved" banner.
- Quota exceeded → prune oldest non‑personal‑best results, or prompt to export.
- Corrupt JSON → fail safe to an empty store, offer to download the raw corrupt blob for recovery rather than silently wiping it.
