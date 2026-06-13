# 07 — Roadmap, Milestones & Open Questions

## Phasing

### Phase 0 — Project skeleton
- Vite + React + TypeScript (strict) scaffold.
- GitHub Pages deploy via GitHub Actions; correct `base` / hash routing.
- Hash routing, app shell, empty screens (Test / Results / History).
- **Exit criteria:** a blank app deploys live to GitHub Pages.

### Phase 1 — MVP single‑mode test (the cut line)
- ~30–60 hand‑seeded passages (`data/passages.json`) spanning Easy/Medium/Hard, with precomputed composition vectors.
- Frequency list baked into `data/frequency.json` (one source chosen).
- **Matching engine**: tokenise → normalise → compare → completion predicate, **Lexical mode only** first, then Strict. Heavy unit tests.
- Test flow with start‑on‑click timing; WPM + CPM results.
- `localStorage` history + results table.
- **Exit criteria:** you can dictate a passage, auto‑complete, and see WPM/CPM saved to history.

### Phase 2 — Real WPM (Method A) + history viz
- Difficulty‑binned harmonic estimate (Method A in [05](./05-realwpm.md)).
- "Your Real WPM" panel with per‑tier breakdown + confidence flags.
- Trend chart, personal bests, export/import.
- **Exit criteria:** a meaningful, caveated Real WPM appears after a handful of tests.

### Phase 3 — Gutenberg corpus pipeline
- Offline `scripts/ingest-gutenberg.ts`: acquire → strip boilerplate → segment → filter → classify → emit.
- Expand corpus to the bounded cap (≤ ~1,000 passages), difficulty‑balanced, lazy‑loaded shards.
- Attribution UI for sourced passages.
- **Exit criteria:** corpus is mostly book‑derived and difficulty‑balanced.

### Phase 4 — Real WPM (Method B) + polish
- Constrained inverse‑WPM **NNLS** regression, regularised toward Method A.
- Confidence bands; "take more Hard passages" nudges.
- Strict/Lexical parity, accuracy/cleanliness stats, accessibility pass.

## Open questions (need a decision; defaults proposed)

| # | Question | Proposed default |
|---|----------|------------------|
| Q1 | Frequency list source? | **Decided:** `google-10000-english-no-swears.txt` (first20hours), vendored at a pinned commit. Web‑derived; tier = line number. |
| Q2 | Are `?` and `!` strict like full stops, or ignorable? | **Decided:** `.` and `!` are one interchangeable *statement* class; `?` is a distinct *question* class that must match. Every sentence end requires an appropriate terminator. |
| Q3 | Clock starts on Start click or first matching token? | **Decided: on Start click.** Many STT engines batch‑emit all text at the end; first‑match timing would measure flush latency, not human speaking time. |
| Q4 | Display character metric: raw or normalised? | **Raw** (store both). |
| Q5 | Lemmatise before tier lookup? | **No** — surface forms only, keeps matching & tiering identical. |
| Q6 | Number canonicalisation edge cases (`"twenty twenty"`, ordinals, currency)? | Greedy digit parse; ordinals keep suffix; currency **not** canonicalised v1. |
| Q7 | Styling: Tailwind vs CSS Modules? | **Decided:** `styled-components`. Co-located component styles, no class-name management, TypeScript-friendly theming. |
| Q8 | Passage selection: pure random or difficulty‑targeted? | Random by default; allow filtering by bin/length. |

## Risks

- **Real‑WPM identifiability** (collinear compositions) — mitigated by binning + tier‑skewed passages + confidence flags; cannot be fully eliminated. *Set expectations in UI.*
- **Number/abbreviation normalisation correctness** — biggest source of "why won't it complete?" frustration; mitigated by showing the expected normalised token on mismatch and heavy unit tests.
- **STT variance across tools** — different engines punctuate/casing differently; Lexical mode + consistent timing reduce, don't remove, this.
- **Bundle size** from corpus — bounded + lazy‑loaded shards.
- **Gutenberg licensing/attribution** — ship derived passages + attribution, not whole books; verify terms.

## Definition of done (v1)

A deployed GitHub Pages site where a user can: pick/receive a passage, dictate it via their own STT, auto‑complete, and get WPM/CPM; see a history of results in `localStorage`; and view a caveated "Your Real WPM" with a per‑tier breakdown — all with no backend.
