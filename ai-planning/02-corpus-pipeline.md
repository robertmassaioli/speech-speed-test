# 02 — Corpus & Build‑Time Pipeline

## Summary

The app needs (a) **frequency lists** that define the top‑100 / top‑1000 / top‑10000 word tiers, and (b) a **library of passages** (50–400 words each) classified by how much they rely on common vs rare vocabulary. Both are produced by an **offline Node pipeline** under `scripts/` and emitted as static JSON under `data/`. The browser never ingests raw books or computes frequencies at runtime.

## Why build‑time

It is a static GitHub Pages site. Parsing hundreds of Gutenberg books, stripping boilerplate, tokenising and classifying is heavy and deterministic — exactly the work that should happen once at build time and ship as compact JSON. This keeps the runtime bundle small and the classification reproducible.

## Frequency tiers

The entire model depends on a word‑frequency ranking. **Decision: we use the [`google-10000-english-no-swears.txt`](https://github.com/first20hours/google-10000-english/blob/master/google-10000-english-no-swears.txt) list** from the `first20hours/google-10000-english` repo.

**Format (verified):** plain text, **one word per line, ranked by frequency (most common first), no header/metadata**. Derived from the Google Trillion Word Corpus (n‑gram web data), with profanity removed. The "no‑swears" filtering means the file is slightly under 10,000 lines and a handful of original ranks are absent — negligible for our tiering.

**Why this is convenient:** because the list *is* the ranking, tier membership falls straight out of **line number** — no separate frequency values to threshold. We vendor a copy of the file (pinned to a specific commit for reproducibility) and record source + commit in `data/frequency-meta.json` so the Real‑WPM tiers stay interpretable.

**Trade‑off (accepted):** this is **web‑derived**, not subtitle‑derived, so it reflects *written/web* usage rather than *spoken* usage. For a speech tool a subtitle list (e.g. SUBTLEX‑US) would track dictation vocabulary marginally better, but the Google list is simpler, well‑known, pre‑ranked, and pre‑cleaned. Decision is locked; revisit only if tier estimates look off.

From the list, `rank` = the word's **line number** (1‑based). We derive:

```
tier(word) =
  rank ≤ 100         → T1  (top-100)
  rank ≤ 1000        → T2  (top-1000, i.e. 101–1000)
  word is in list    → T3  (top-10000, i.e. 1001–end-of-list)
  not in list        → T4  (beyond the list / rare — the "fingerspelling-equivalent" tier)
```

T4 is simply "any word not present in the file." This is the bucket that, by design, we cannot rank — which is exactly the under‑determined tier discussed in [05](./05-realwpm.md).

Output: `data/frequency.json` — a map from normalised word → tier (or rank). Words are normalised with the *same* normalisation used by the matching engine (lowercase, punctuation stripped) so tier lookup and matching agree. See [03 — Matching](./03-matching.md).

## Passage composition vector

For each passage we precompute its **tier‑composition vector** `p = (p₁, p₂, p₃, p₄)` = the fraction of its content tokens in each tier (summing to 1). This vector is what the Real‑WPM model consumes — see [05](./05-realwpm.md). We also store cumulative coverage (e.g. "92% of tokens are in the top‑1000") for difficulty binning and UI labels.

> **Reality check that shapes the design:** natural English is dominated by function words, so almost every passage clusters near `p ≈ (0.5, 0.4, 0.09, 0.01)`. You *cannot* write a readable passage dominated by rank‑1001–10000 words — every "the/of/and/is" is top‑100. This collinearity is why the Real‑WPM model leans on **difficulty binning first** and regression second (see 05), and why we deliberately author/select some **tier‑skewed passages** to widen the spread.

## Passage sources

### Tier 0 — hand‑seeded passages (MVP)

A small set (~30–60) authored or curated to span the difficulty range:
- **Simple:** restricted mostly to top‑100/1000 words (children's‑book register).
- **Medium:** ordinary prose.
- **Hard / tier‑skewed:** deliberately seeded with uncommon vocabulary, technical terms, proper nouns, and numbers to push `p₃`/`p₄` up.

This guarantees a working corpus without any external data dependency.

### Tier 1 — Project Gutenberg extraction (later milestone)

Offline pipeline `scripts/ingest-gutenberg.ts`:

1. **Acquire** a few hundred public‑domain books (Gutenberg plain‑text mirror or the Gutenberg dump). Respect Gutenberg's terms; store only derived passages + attribution, not full books, in the shipped data.
2. **Strip boilerplate** — remove the `*** START OF THE PROJECT GUTENBERG EBOOK ***` / `*** END ... ***` headers/footers, license text, transcriber's notes, chapter scaffolding.
3. **Segment** into candidate passages of 50–400 words on sentence boundaries (never cut mid‑sentence — important because full‑stop alignment is part of matching).
4. **Filter** out passages with too much dialogue punctuation, tables, verse, or non‑English text that would make dictation ambiguous.
5. **Classify** each passage: compute its composition vector and difficulty bin; tag with source book + author + Gutenberg ID for attribution.
6. **Emit** `data/passages.json` (and split shards if large), each entry:

```jsonc
{
  "id": "pg1342-0042",
  "text": "It is a truth universally acknowledged ...",
  "wordCount": 118,
  "charCount": 642,
  "composition": [0.51, 0.39, 0.085, 0.015],
  "difficultyBin": "medium",
  "source": { "title": "Pride and Prejudice", "author": "Jane Austen", "gutenbergId": 1342 }
}
```

### Bounding bundle size

Hundreds of books yield far more passages than we need. Cap the shipped library (e.g. ≤ 1,000 passages, ≤ a few MB JSON, gzip‑served), sampled to **maximise difficulty‑bin coverage** rather than taken first‑come. Heavier shards can be lazy‑loaded per difficulty bin.

## Open questions (tracked in 07)

- Exact frequency source + version.
- Whether to lemmatise before tier lookup (does "running" count as "run"?). Default: **no lemmatisation** for v1 — surface forms only — to keep matching and tiering identical and predictable.
- Licensing/attribution display requirements for Gutenberg passages.
