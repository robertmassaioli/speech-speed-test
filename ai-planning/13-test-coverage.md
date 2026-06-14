# Test Coverage Plan

## Status quo (144 tests passing)

Existing test files and what they cover:

| Test file | Module under test | Coverage notes |
|---|---|---|
| `src/engine/tokenize.test.ts` | `tokenize.ts` | `tokenize` and `countTokens` — well covered |
| `src/engine/numbers.test.ts` | `numbers.ts` | `canonicalizeNumbers` — good breadth across cardinals, ordinals, hundreds, thousands, terminators |
| `src/engine/normalize.test.ts` | `normalize.ts` | `normalizeTokens` — covers both modes, punctuation classes, abbreviations; edge cases noted below |
| `src/engine/match.test.ts` | `match.ts` | `compareTokens` and `matchText` — comprehensive |
| `src/engine/metrics.test.ts` | `metrics.ts` | `calcWpm` and `calcCpm` — basic arithmetic cases |
| `src/corpus/realwpm.test.ts` | `realwpm.ts` | `computeHeadline` and `computeRealWpm` — good confidence/nudge coverage |

**Untested modules:** `corpus/tiers.ts`, `corpus/passages.ts`, `storage/history.ts`, `storage/settings.ts`, `app/useTheme.ts`.

---

## How to run coverage today

```bash
# Run the node project tests only (stories/browser tests excluded to avoid Playwright dependency)
npx vitest run --coverage --project=''

# Or, target the node test project by environment — simpler invocation once a
# coverage config is added to vitest.config.ts (see "Recommended config change" below).
npm test -- --coverage
```

**Important nuance:** `vitest.config.ts` defines two projects — a `node` project for `*.test.ts` files and a `storybook` project for browser/Playwright stories. The `--coverage` flag works with both, but the storybook project requires a running browser (Playwright + Chromium). For a pure coverage run of the logic layer, either:

- pass `--project=` with the implicit node project name, or
- add a `coverage` block to the node project in `vitest.config.ts`:

```ts
// Inside the node project entry in vitest.config.ts:
coverage: {
  provider: 'v8',
  include: ['src/engine/**', 'src/corpus/**', 'src/storage/**'],
  exclude: ['src/**/*.stories.*', 'src/app/**', 'src/features/**', 'src/main.tsx'],
  reporter: ['text', 'html'],
},
```

Coverage output format: `@vitest/coverage-v8` produces a text summary to stdout and an HTML report under `coverage/index.html`. The `text` reporter shows per-file statement/branch/function/line percentages; `html` allows drilling into uncovered lines.

---

## Untested modules and what to test

### Priority 1 — Pure logic, zero DOM/React, highest value per test written

#### `src/corpus/tiers.ts`

All three exported functions are pure and deterministic.

| Function | What to test | Estimated tests |
|---|---|---|
| `buildTierMap(rankedWords)` | Empty input returns empty map; first 100 words are tier 1; word 101 is tier 2; word 1001 is tier 3; words above 9894 (if applicable) are tier 3; case-folding via `toLowerCase`; blank lines / whitespace-only entries are skipped and don't advance rank | 7 |
| `getTier(map, word)` | Known tier-1 word returns 1; known tier-2 word returns 2; unknown word returns 4 (tier 4 default); case-insensitive lookup (`Word` vs `word`) | 4 |
| `computeComposition(words, map)` | Empty words array returns all-zero composition; all T1 words gives p1=1.0; mix of T1/T2/T3/T4 yields correct counts and proportions summing to 1; tokens with non-alpha characters (e.g. `"don't"`) have their alpha extracted correctly and then looked up; digit-only tokens (e.g. `"42"`) are stripped to empty string and skipped (no tier counted) | 6 |
| `difficultyBin(comp)` | p4=0 → easy; p4=P4_EASY (0.08) → easy (boundary inclusive); p4 just above 0.08 → medium; p4=P4_MEDIUM (0.14) → medium (boundary inclusive); p4 just above 0.14 → hard | 5 |

**Estimated total: ~22 tests**

Note: `P4_EASY` and `P4_MEDIUM` are module-private constants. Test by constructing `Composition` objects with the exact threshold values. The thresholds are documented in the source (0.08 and 0.14), so tests can use those literals without importing the constants.

---

#### `src/corpus/passages.ts`

Two exported functions operate on the live `PASSAGES` array (populated at module load from `data/passages.json`).

| Function / export | What to test | Estimated tests |
|---|---|---|
| `PASSAGES` constant | Array is non-empty; each entry has `id`, `text`, `wordCount`, `charCount`, `composition`, `difficulty`; `wordCount` matches `countTokens(text)` for a sampled entry; `difficulty` is one of `'easy'`, `'medium'`, `'hard'`; composition percentages sum to ~1 (within float epsilon) | 5 |
| `passagesForDifficulty(difficulty)` | Returns subset with matching difficulty; no entries from other difficulties leak in; calling with a difficulty that no passage has returns `[]` | 3 |
| `getRandomPassage()` | Returns a passage from `PASSAGES`; never throws; with no difficulty arg, the returned passage has a valid `id` | 2 |
| `getRandomPassage(difficulty)` | Returns a passage with the requested difficulty (when passages exist for that difficulty); falls back to full `PASSAGES` pool when a difficulty has zero passages (currently not the case, but the fallback path `pool.length > 0 ? pool : PASSAGES` should be exercised — achievable by mocking or with a synthetic test if the corpus always has all three) | 2 |

**Estimated total: ~12 tests**

Caveat: `getRandomPassage` is nondeterministic. Tests should assert on the shape of the result (valid `Passage` object, correct `difficulty`) rather than on the exact value.

---

### Priority 2 — Requires `localStorage` mock, moderate effort

Both storage modules call `localStorage` directly. Vitest's `node` environment does not provide `localStorage`, so tests need either:

- `vi.stubGlobal('localStorage', ...)` with a hand-rolled in-memory mock, or
- switching the test environment to `jsdom` for these files (`@vitest/environment-jsdom` already available implicitly, or set `environment: 'jsdom'` per-file via `// @vitest-environment jsdom`).

The jsdom per-file override is the lowest-friction path.

#### `src/storage/history.ts`

| Function | What to test | Estimated tests |
|---|---|---|
| `saveResult` | Saves a result and returns it with `id` (UUID) and `ts` (timestamp); result appears in subsequent `loadResults()`; multiple results accumulate | 3 |
| `loadResults` | Returns results in reverse-chronological order (latest first); returns `[]` on empty store | 2 |
| `clearHistory` | After clearing, `loadResults()` returns `[]` | 1 |
| `exportStore` | Returns valid JSON string; parsed JSON has `version: 1` and `results` array | 2 |
| `importStore` | Round-trip: export then import restores results; malformed JSON returns `false`; mismatched version returns `false`; missing `results` array returns `false` | 4 |
| `isStorageAvailable` | Returns `true` in a jsdom environment with working localStorage | 1 |
| Error handling | `readStore` with corrupted JSON (non-parseable) returns empty store; `readStore` with `version !== 1` returns empty store | 2 |

**Estimated total: ~15 tests**

#### `src/storage/settings.ts`

| Function | What to test | Estimated tests |
|---|---|---|
| `loadSettings` | Returns defaults when key absent; returns saved settings when key present; rejects invalid `mode` value and falls back to default; rejects invalid `difficulty` value and falls back to default; handles JSON parse error gracefully | 5 |
| `saveSettings` | Persists settings that are then retrievable by `loadSettings`; round-trip for all four valid difficulties and both valid modes | 3 |

**Estimated total: ~8 tests**

---

### Priority 3 — Hooks with DOM/React, lower priority

#### `src/app/useTheme.ts`

`useTheme` is a React hook that reads/writes `localStorage` and `window.matchMedia`. It can be tested with `@testing-library/react`'s `renderHook`, but requires:

- jsdom environment
- a `matchMedia` mock (jsdom doesn't implement it)
- the `@testing-library/react` package (not currently installed)

Given the installation overhead and the fact that the hook is purely a glue layer between localStorage, a media query, and React state (no business logic), this is low-value for the effort. Skip for now.

---

### `src/engine/normalize.ts` — edge cases not yet covered

The existing `normalize.test.ts` is solid but misses:

| Gap | Concrete test | Priority |
|---|---|---|
| `normalizeToken` with empty string input | `normalizeTokens([''], 'lexical')` should return `[]` | Low — the filter at line 64 handles it |
| Known abbreviations beyond `Dr`, `Mr`, `etc` | `Prof.`, `Rev.`, `Gen.`, `Col.`, `Lt.`, `Sgt.`, `Capt.`, `Maj.`, `Brig.` — confirm dot stripped not treated as sentence end | Medium |
| `Ave.`, `Blvd.`, `vs.`, `approx.`, `dept.`, `govt.`, `inc.`, `ltd.` | Same abbreviation-class test | Medium |
| Numeric token with trailing terminator (no alpha body) like `3!` | Should produce `3.` (statement class, no alpha body but has `3` digit body via alphaNum check) — actually `alphaNum` is alpha-only, so `3` stripped of alpha is empty — the body is `3`, `alphaNum = body.replace(/[^a-z0-9]/g, '')` wait — `alphaNum = body.replace(/[^a-z0-9]/g, '')` includes digits, so `alphaNum = '3'`, result is `'3.'` | Medium |

**Estimated additional tests: ~14**

---

## Summary table

| Module | Status | Est. new tests | Effort |
|---|---|---|---|
| `engine/tokenize.ts` | Covered | — | — |
| `engine/numbers.ts` | Covered | — | — |
| `engine/normalize.ts` | Mostly covered | ~14 (abbreviation + edge cases) | Low |
| `engine/match.ts` | Covered | — | — |
| `engine/metrics.ts` | Covered | — | — |
| `corpus/realwpm.ts` | Covered | — | — |
| **`corpus/tiers.ts`** | **Not tested** | **~22** | **Low** |
| **`corpus/passages.ts`** | **Not tested** | **~12** | **Low** |
| **`storage/history.ts`** | **Not tested** | **~15** | **Medium** (localStorage mock) |
| **`storage/settings.ts`** | **Not tested** | **~8** | **Medium** (localStorage mock) |
| `app/useTheme.ts` | Not tested | — | High (React hook + matchMedia mock) |
| `app/App.tsx`, `features/**` | Not tested | — | Skip |

**Estimated new tests: ~71**, bringing the suite to approximately 215 tests.

---

## Recommended implementation order

1. **`corpus/tiers.ts`** — pure functions, no imports beyond types, fastest to write (~22 tests). Create `src/corpus/tiers.test.ts`.
2. **`corpus/passages.ts`** — depends on the live JSON corpus; tests are mostly shape assertions (~12 tests). Create `src/corpus/passages.test.ts`.
3. **`engine/normalize.ts` edge cases** — add to existing `normalize.test.ts` (~14 tests). Remaining abbreviations and numeric-terminator corner cases.
4. **`storage/history.ts`** — add `// @vitest-environment jsdom` header, use `beforeEach` to clear localStorage (~15 tests). Create `src/storage/history.test.ts`.
5. **`storage/settings.ts`** — same jsdom pattern (~8 tests). Create `src/storage/settings.test.ts`.

---

## What NOT to test

| Category | Reason |
|---|---|
| React components (`App.tsx`, `TestScreen.tsx`, `HistoryScreen.tsx`) | Rendering tests are brittle, slow, require DOM, and test framework wiring rather than logic. The Storybook integration already catches visual regressions. |
| styled-components / `GlobalStyle.ts` | CSS-in-JS output is not unit-testable in a meaningful way. |
| Theme objects (`src/app/themes/*.ts`) | These are static color constant objects. No logic to test. |
| `useTheme` hook | Thin glue between localStorage and React state. No standalone business logic; the cost (installing `@testing-library/react`, mocking `matchMedia`) exceeds the value. |
| `src/main.tsx` | Application bootstrap / mount point. Nothing to assert on. |
| `*.stories.tsx` files | Covered by the Storybook/Playwright project. |
| `src/vite-env.d.ts` | Type declarations only. |
| `data/passages.json` | Data file, not code. |
| `PASSAGES` array initialization (module-level side effect) | Tested indirectly by `passages.ts` function tests and by the app running. |

---

## Notes on coverage reporting

The `vitest run --coverage` flag is correct for a one-shot run. For the node-only project (which is what matters for this plan), coverage will include all files matched by `include` in the coverage config. Without an explicit `include`, v8 coverage defaults to all files imported during the test run — meaning untested modules (`tiers.ts`, `passages.ts`, `history.ts`, `settings.ts`) will show 0% until their test files exist and import them.

Adding the `include` list to `vitest.config.ts` as shown above ensures those files appear as 0% in the report immediately, making gaps visible before tests are written.
