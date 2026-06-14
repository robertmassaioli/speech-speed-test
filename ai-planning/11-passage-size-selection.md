# 11 — Passage Size Selection

## Summary

Add a **Passage Size** control to the Test UI alongside the existing Difficulty filter. The four sizes map to approximate word counts:

| Size       | Target words | Est. time @ 200 WPM |
|------------|-------------|----------------------|
| Small      | ~50         | ~15 s                |
| Medium     | ~100        | ~30 s                |
| Large      | ~200        | ~60 s (1 min)        |
| Extra Large| ~400        | ~120 s (2 min)       |

The current corpus is 30 passages, all 113–141 words (naturally Medium). Each option below describes how to serve all four sizes from the corpus without the user ever seeing a mid-sentence cut.

---

## Option A — Runtime sentence-boundary slicing and concatenation

All logic lives in the browser at selection time. No build-pipeline changes.

### How it works

1. Add `sentences: string[]` to each `Passage` in `passages.json` — a pre-split array of sentence strings produced at build time so the browser doesn't need a sentence tokeniser.
2. At runtime, `getPassageForSize(size, difficulty?)` builds a text to target:
   - **Small (~50 w):** take sentences from one passage until the running total reaches ~50 words.
   - **Medium (~100 w):** use the whole passage as-is (existing behaviour).
   - **Large (~200 w):** concatenate sentences from 2 same-difficulty passages until ~200 words.
   - **Extra Large (~400 w):** concatenate sentences from 4–5 same-difficulty passages until ~400 words.
3. Recompute `wordCount`, `charCount`, and the composition vector from the assembled text on the fly. No passage `id` is stored; instead record the list of source passage ids in the result.

### Pros
- Zero changes to `passages.json` schema beyond adding the `sentences` field to existing entries.
- No new corpus authoring needed.
- Size and difficulty filters compose freely.

### Cons
- Concatenated passages can feel tonally jarring (switching author voice mid-test).
- Composition vector must be recomputed at runtime (small CPU cost, but adds complexity to the front-end).
- History records gain a multi-id `sourcePassages` field — a schema change to the stored result type.
- "Small" passages will always be the opening sentences of the same ~30 passages, reducing variety.

---

## Option B — Build-time size variants stored as first-class passages

The build pipeline emits one or more size-tagged variants for each source passage. The runtime treats each variant as a normal `Passage`.

### How it works

1. In `scripts/build-passages-json.ts`, after parsing each source passage:
   - Segment the full text into a `sentences: string[]` list.
   - Emit a **Small variant**: take sentences until the running word count is in [40, 60].
   - Emit the **Medium variant**: the original passage (already 100–150 w).
   - Emit a **Large variant**: take the source passage + the next same-difficulty passage, concatenating sentences until [175, 225] words.
   - Emit an **Extra Large variant**: concatenate from 3–4 same-difficulty passages until [350, 450] words.
2. Each variant entry gets:
   ```jsonc
   {
     "id": "pg1342-0042-sm",
     "sizeVariant": "small",          // new field
     "text": "...",
     "wordCount": 52,
     "charCount": ...,
     "composition": { ... },          // precomputed from this text
     "difficultyBin": "medium"
   }
   ```
3. `passages.ts` exposes `passagesForSize(size, difficulty?)` which filters on `sizeVariant`.
4. The UI adds a **Size** toggle row (Small / Medium / Large / XL) identical in style to the Difficulty row.

### Pros
- Passages are fully pre-computed: accurate metadata, no runtime assembly.
- Composition vector and difficulty bin reflect the actual displayed text.
- Stored results are unchanged — a passage id still uniquely identifies the text.
- Clean separation: the corpus pipeline handles complexity, the UI stays simple.

### Cons
- `passages.json` grows ~4×; need to cap or shard per [02](./02-corpus-pipeline.md).
- Small variants all start from the beginning of their source passage (limited variety until the corpus grows).
- Large/XL variants that concatenate across passages still have the tonal-shift issue (though less severe than Option A since it only occurs once per size tier, not every test).
- Pipeline complexity increases; the build script needs to pair passages for Large/XL.

---

## Option C — Four separate authored passage pools

Each size tier is a distinct, purpose-authored collection. No passage is ever sliced or combined.

### How it works

1. Add a `sizeTarget` field to the passages source data with values `small | medium | large | xlarge`.
2. Source passages natively:
   - **Small (~50 w):** write or curate short paragraphs — one striking fact, a proverb with commentary, an opening sentence and a clause.
   - **Medium (~100 w):** existing corpus.
   - **Large (~200 w):** extract two-paragraph sections from Gutenberg or other public-domain prose.
   - **Extra Large (~400 w):** extract three-to-four paragraph sections.
3. The pipeline classifies each passage normally; the `sizeTarget` field is preserved verbatim.
4. UI and `getRandomPassage` filter on `sizeTarget` exactly as they already filter on `difficultyBin`.

### Pros
- Every passage is self-contained, coherent prose — no tonal seams.
- Composition vectors and difficulty bins are fully accurate.
- Stored results are a single passage id, no schema changes.
- The model is the simplest possible: size is just another filter field.

### Cons
- **Authoring/curation effort is ~4×.** Small and Large/XL passages do not exist yet and must be created or harvested.
- Small passages in particular require intentional authoring — finding natural 50-word standalone chunks is harder than it sounds.
- Until the corpus is populated, two of the four size options will show "no passages available" (same empty-pool UX issue that already exists for difficulty bins).
- Large/XL passages require a Gutenberg extraction pipeline (planned in [02](./02-corpus-pipeline.md) but not yet implemented).

---

## Recommendation

**Option B** is the best near-term choice. It works with the existing 30-passage corpus today, keeps accurate metadata at zero runtime cost, and aligns with the build-time-heavy architecture already established in [02](./02-corpus-pipeline.md). The concatenation seam for Large/XL is acceptable while the corpus is small; as the Gutenberg pipeline lands (Option C's approach becomes available), Large/XL entries can be replaced with native multi-paragraph extractions one-by-one.

Option C is the right long-term end state but requires the Gutenberg pipeline to be useful. Option A should be avoided because it pushes complexity and imprecision into the runtime and complicates the history schema.

---

## UI changes (all options)

A **Size** filter row is added to the idle state of `TestScreen`, styled identically to the existing Difficulty row:

```
Size:  [Small]  [Medium]  [Large]  [XL]
```

- Default: **Medium** (preserves existing behaviour).
- Persisted in `settings.json` alongside `mode` and `difficulty`.
- Buttons for sizes with no available passages are dimmed and non-interactive (same pattern as difficulty).
- The PassageMeta row already shows word count; no additional size label is needed.
