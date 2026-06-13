# 01 — Architecture & Tech Stack

## Summary

A single‑page application built with **TypeScript + React + Vite**, shipped as fully static assets to **GitHub Pages**. There is no runtime backend; all data the app needs (passages, frequency lists) is bundled or fetched as static JSON, and all user data lives in `localStorage`.

## Tech choices

| Concern | Choice | Rationale |
|---|---|---|
| Language | TypeScript (strict) | Type safety across the matching/scoring logic, which is the riskiest code. |
| Build tool | Vite | Fast dev server, first‑class TS/React, trivial static build (`vite build`). |
| UI | React 18 | Component model fits the small set of screens; hooks for test state. |
| Styling | `styled-components` | Co-located component styles; TypeScript-friendly theming; no class-name management. |
| Routing | `react-router` (hash or `basename`) | GitHub Pages serves from a subpath; hash routing avoids 404s on refresh. |
| Charts | `recharts` or a lightweight canvas chart | History visualisation only; keep bundle small. |
| State | React context + reducer (no Redux) | App state is small: current test, results, history. |
| Testing | Vitest + Testing Library | Vitest integrates with Vite; matching engine gets heavy unit coverage. |

### GitHub Pages specifics

- The site is served from `https://<user>.github.io/<repo>/`, so Vite's `base` must be set to `/<repo>/`.
- Use **hash‑based routing** (`/#/history`) *or* configure a `404.html` SPA fallback. Hash routing is simpler and recommended for the MVP.
- Deploy via a GitHub Actions workflow (`actions/deploy-pages`) that runs `vite build` and publishes `dist/`.
- All corpus/frequency data is part of the build output (or fetched from the same origin under `base`), so there are no CORS or backend concerns.

## Proposed module layout

```
src/
  app/                     # App shell, routing, layout
  features/
    test/                  # The active-test screen + state machine
    results/               # Post-test results view
    history/               # History list + charts
    realwpm/               # "Your Real WPM" computation + display
  engine/
    tokenize.ts            # Reference & input tokenisation
    normalize.ts           # Punctuation stripping, number canonicalisation
    match.ts               # Strict + lexical comparison, completion predicate
    metrics.ts             # WPM / CPM calculation
  corpus/
    passages.ts            # Loader for bundled passage data
    tiers.ts               # Frequency-tier lookup (top-100/1k/10k membership)
  storage/
    history.ts             # localStorage read/write, schema versioning
  realwpm/
    model.ts               # NNLS / binned estimation of per-tier speeds
data/                      # Bundled JSON: passages, frequency lists (build output)
scripts/                   # Offline pipeline (Node) — NOT shipped to the browser
  ingest-gutenberg.ts
  build-frequency.ts
  classify-passages.ts
```

> **Key separation:** everything under `scripts/` runs at build time in Node and emits JSON into `data/`. The browser only ever reads the precomputed JSON. See [02 — Corpus & Build‑Time Pipeline](./02-corpus-pipeline.md).

## Performance / bundle budget

- Frequency lists (top‑10k words) and the passage library are the largest assets. Lazy‑load them: the test screen only needs the passages; the Real‑WPM and classification metadata can be split into a separate chunk.
- Target: initial JS+CSS under ~250 KB gzip; corpus JSON loaded on demand. Bound passage count to keep total payload reasonable (see 02).

## State model (test lifecycle)

A small finite‑state machine drives the test screen:

```
idle → running → completed
          │
          └→ abandoned (user resets)
```

- **idle:** passage shown, "Start" button enabled.
- **running:** entered the instant "Start" is clicked; **timer starts immediately** (see 04 — many STT engines batch‑emit text at the end, so we must time from the click, not from first matching token). Input is compared against the reference on every change.
- **completed:** completion predicate satisfied; timer stopped; result recorded.

> An optional pre‑roll countdown ("3…2…1…go") may sit between the click and the start of the measured interval as a UX softener, but the measured interval itself begins when the clock starts.

See [04 — Test Flow & Metrics](./04-test-flow-and-metrics.md) for the exact start/stop semantics.
