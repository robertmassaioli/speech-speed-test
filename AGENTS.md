# AGENTS.md — Speech Speed Test

Speech-to-text dictation speed tester. User speaks a passage aloud into a STT tool (e.g. Vocamac), the transcription appears in a textarea, and the app scores it. No keyboard input assumed.

## Stack

| Layer | Choice |
|---|---|
| UI | React 19, styled-components v6, react-router-dom v7 (HashRouter) |
| Build | Vite 8, TypeScript 6 strict (`erasableSyntaxOnly: true`) |
| Test | Vitest 4 (133 tests, all pure unit — no DOM) |
| Deploy | GitHub Pages — `base: '/speech-speed-test/'` in vite.config.ts |

## Commands

```bash
npm run dev          # dev server → http://localhost:5173/speech-speed-test/ (port may vary)
npm run build        # tsc -b && vite build → dist/
npm test             # vitest run (must stay green; run after every change)
npm run classify -- data/passages.json   # print tier vector + difficulty for a passage file
npm run build:frequency                  # regenerate data/frequency.json from word list
```

## Source map

```
src/
  main.tsx                    # entry — mounts <App />
  app/
    App.tsx                   # Shell, Nav, HashRouter routes, theme switcher
    GlobalStyle.ts            # injects theme CSS blocks + global resets
    useTheme.ts               # HueTheme/DarkPref state → data-theme/data-dark on <html>
    themes/{purple,blue,orange,red}.ts  # CSS var blocks per theme × mode
  corpus/
    passages.ts               # loads data/passages.json; getRandomPassage(), DifficultyBin
    tiers.ts                  # frequency tier classification (T1–T4 cutoffs)
    realwpm.ts                # Method A harmonic Real WPM (see below)
    realwpm.test.ts
  engine/                     # all pure functions, no DOM
    tokenize.ts               # splits text into word tokens
    normalize.ts              # case-fold, strip punct, expand numbers (lexical mode)
    numbers.ts                # CUSTOM number-word parser — NO third-party lib allowed
    match.ts                  # compareTokens → { matchedCount, inputCount, isComplete }
    metrics.ts                # calcWpm, calcCpm
    types.ts                  # MatchMode = 'lexical' | 'strict'
  features/
    test/TestScreen.tsx       # main test UI (idle → running → completed inline)
    history/HistoryScreen.tsx # stats dashboard: Real WPM, personal bests, trend, table
  storage/
    history.ts                # localStorage wrapper; key 'sst.v1'
data/
  passages.json               # corpus (30 passages, easy/medium/hard)
  frequency.json              # rank→word map built from word list
  frequency-meta.json         # provenance of the word list
  google-10000-english-no-swears.txt  # source word list (vendored)
scripts/
  build-frequency.ts          # regenerates data/frequency.json
  classify-passage.ts         # prints tier vector for a passage
  build-passages-json.ts      # helper used to build passages.json
```

## Architecture decisions

**HashRouter** — deployed to GitHub Pages with no server config. All routes use `#/`.

**Inline results** — `TestState = 'idle' | 'running' | 'completed'`. No separate `/results` route. Completed state shows a results card below the passage on the same screen.

**No paste/suspect detection** — STT tools emit all text as a final paste event, so paste detection always fired falsely. Removed entirely.

**Theming** — CSS custom properties only, no `ThemeProvider`. `[data-theme="x"]` and `[data-theme="x"][data-dark]` blocks define all colour tokens. Component code uses only **semantic tokens** (`--accent`, `--accent-fill`, `--accent-bg`, `--surface`, `--surface-raised`, `--text-primary`, `--text-secondary`, etc.). Never use `--purple-*` or `--neutral-*` in component code — those are private to theme files.

**FOUC prevention** — inline `<script>` in `index.html` reads `localStorage` and sets `document.documentElement.style.background` + `data-theme`/`data-dark` synchronously before JS loads.

## Real WPM (Method A)

Words classified into four frequency tiers based on Google top-10,000 list:
- T1: top-100 words · T2: ranks 101–1,000 · T3: ranks 1,001–9,894 · T4: not in list

Passage composition stored per result as `[p1, p2, p3, p4]` (fraction of words in each tier).

Single free parameter β1 estimated as median across eligible results:
`β1 = median( (elapsedSec/words) / (p1 + 1.3·p2 + 1.8·p3 + 2.5·p4) )`

Tier speeds: `v1 = 60/β1`, `v2 = 60/(1.3·β1)`, `v3 = 60/(1.8·β1)`, `v4 = 60/(2.5·β1)`

Headline: `Real WPM = 0.50·v1 + 0.40·v2 + 0.09·v3 + 0.01·v4`

Confidence for T1: `high` (3 bins with data) / `medium` (2) / `low` (1). T2–T4 always `low`.

## Storage schema

```ts
// localStorage key: 'sst.v1'
{ version: 1, results: StoredResult[] }

StoredResult {
  id, ts, passageId, mode: MatchMode, elapsedSec, words, charsRaw, wpm, cpm
  composition?: [p1, p2, p3, p4]   // required for Real WPM
  difficultyBin?: 'easy'|'medium'|'hard'
  frequencyListId?: string          // 'google-10k-no-swears@bdf4c221'
}
```

## Passage difficulty thresholds

`p4 ≤ 0.08` → easy · `p4 ≤ 0.14` → medium · `p4 > 0.14` → hard

Inflection inflation is expected: inflected verb forms ("hopped", "smiled") are absent from the word list even when the base form is present. Run `npm run classify` to check any new passage.

Passages must be free of: hyphens, dialogue quotes (`"`), em-dashes, ellipses, colons, semicolons.

## Deployment

Push to `main`. GitHub Pages is configured to serve from the `dist/` output directory (or `gh-pages` branch depending on repo settings). The Vite `base` is already set to `/speech-speed-test/`.

Manual deploy: `npm run build` then upload/push `dist/`.

## Hard constraints

1. **No enums** — `erasableSyntaxOnly: true`. Use `'a' | 'b'` union types everywhere.
2. **No third-party number-parsing libraries** — all number-word conversion goes through `src/engine/numbers.ts` (custom implementation).
3. **Semantic CSS vars only in components** — never reference `--purple-*` or `--neutral-*` outside the `src/app/themes/` files.
4. **Tests must stay green** — `npm test` after every change. 133 tests, all in `*.test.ts` files co-located with source.
