# 03 — Matching Engine

## Summary

The matching engine decides whether the user's dictated text equals the reference passage, and therefore when the test completes. It supports two modes:

- **Strict mode** — near‑verbatim character comparison.
- **Lexical mode** (the brief's "lexographical" matching) — forgiving: ignores most punctuation, normalises case, and canonicalises numbers (spelled ↔ digits). **But sentence‑terminating full stops are always significant, in both modes.**

This is the riskiest component, so its rules are specified exactly below and it carries the heaviest unit‑test suite.

## Pipeline

```
raw text → segment into sentences (by full stop)
         → tokenise each sentence into words
         → normalise tokens (mode-dependent)
         → compare reference vs input token streams
         → completion predicate
```

### Step 1 — Sentence segmentation on terminators

Sentence boundaries are significant and must align between reference and input in *both* modes — i.e. the user must put their sentence breaks where the passage has them, and **every sentence end must carry an appropriate terminator** (a sentence boundary with no terminating punctuation is a mismatch).

Terminators fall into **two equivalence classes** (per product decision):

- **Statement class — `.` and `!` are interchangeable.** A reference `.` is satisfied by an input `.` *or* `!`, and vice versa. So `"Stop."` ≡ `"Stop!"`. Both are accepted wherever the reference ends a statement.
- **Question class — `?` is distinct.** A `?` must be matched by a `?`. You may **not** substitute `.`/`!` for `?` or `?` for `.`/`!`. So `"Why?"` ≠ `"Why."`.

In other words, what is enforced at each sentence boundary is *(a)* that a terminator is present, and *(b)* its class (statement vs question). The specific character within the statement class is free.

A terminator is **not** every `.`/`!`/`?` character — we exclude intra‑token punctuation:

- **Decimal points:** `3.14`, `$2.50` — the `.` binds digits; not a sentence break.
- **Abbreviations / honorifics:** `Dr.`, `Mr.`, `etc.`, `U.S.` — handled via a small abbreviation list so they are not treated as sentence ends.
- **Ellipses:** `...` is treated as a single non‑terminating token (configurable), not three terminators.

Detection rule (default): a `.`/`!`/`?` is a sentence terminator iff it is **not** flanked by digits, the preceding token is **not** in the abbreviation list, and it is followed by whitespace/end‑of‑text. Everything else stays inside its token. The terminator's **class** (statement vs question) is recorded at each boundary and compared.

### Step 2 — Tokenisation

Within a sentence, split on whitespace into word tokens. Hyphenated compounds (`well-known`) and contractions (`don't`) are kept as single tokens; their internal punctuation is handled in normalisation.

### Step 3 — Normalisation (mode‑dependent)

| Operation | Strict mode | Lexical mode |
|---|---|---|
| Case folding | no (case‑sensitive) | yes → lowercase |
| Strip punctuation **except** sentence terminators | no | yes — commas, quotes, semicolons, colons, parens, dashes, apostrophes‑as‑quotes all removed. Terminators `.` `!` `?` are **not** stripped; they are lifted out as sentence‑boundary markers (Step 1). |
| Collapse repeated whitespace | yes | yes |
| Number canonicalisation | no | yes → canonical **digit** form |
| Sentence‑break positions + terminator class | enforced | enforced — boundary present, with correct class (statement `.`/`!` interchangeable; question `?` distinct) |

In lexical mode, after stripping, an empty token (was pure punctuation) is dropped.

#### Number canonicalisation

Canonical form is **digits**. Spelled‑out numbers are converted to the digit form before comparison, so `"twenty five"` ≡ `"25"` and `"one hundred and two"` ≡ `"102"`. We use a dedicated words‑to‑number parser (e.g. a small grammar / a vetted library) operating on token runs.

**Cases we explicitly punt on for v1** (documented, not silently wrong):
- `"twenty twenty"` → ambiguous between `2020` and `20 20`. Default: greedy parse → `2020`. May mismatch year‑style dictation; acceptable for v1.
- **Ordinals:** `"third"` vs `"3rd"` vs `"3"` — normalise ordinals to a single canonical (`3rd` → `3` is lossy; default keep ordinal suffix: `"third"` ≡ `"3rd"`).
- **Mixed/idiomatic:** `"nineteen eighty-four"`, phone numbers, `"a hundred"` (implicit one). Best‑effort; failures degrade to a mismatch the user can see and re‑dictate.
- **Currency/units:** `$5` vs `"five dollars"` — **not** canonicalised in v1 (the `$`/`dollars` mismatch); listed as future work.

Because canonicalisation can be imperfect, the UI must make the *expected* normalised form visible on mismatch (see 04) so the user understands why a token isn't matching.

### Step 4 — Comparison

Compare the normalised reference token stream against the normalised input token stream, **respecting sentence boundaries**: sentence *k* of the input must match sentence *k* of the reference, token‑for‑token, in order.

For live feedback we compute the **longest correct prefix**: how many leading tokens (and sentences) currently match. This drives the progress indicator and highlights the first divergent token.

### Step 5 — Completion predicate

The test fires **completed** when:

```
normalize(input)  ==  normalize(reference)
```

as full token streams (all sentences present, all tokens equal, sentence‑break count equal), under the active mode.

STT‑specific handling (speech‑to‑text streams and self‑corrects):
- Compare on every input change (debounced ~50–100 ms), not on keypress only — STT injects whole phrases.
- **Trailing tolerance:** trailing/leading whitespace is normalised away before the equality check. The **final sentence still requires a terminator of the correct class** (per Step 1, every sentence end needs appropriate punctuation), so a missing terminal `.`/`!`/`?` is *not* waived — only stray whitespace is.
- No partial credit on completion — it's all‑or‑nothing equality. (Partial stats can be shown post‑hoc but don't stop the timer.)

## Why two modes

- **Strict** rewards verbatim accuracy — useful for STT engines with good punctuation/casing, and for users who want a hard benchmark.
- **Lexical** measures *dictation throughput* without penalising punctuation/casing/number‑format choices the STT engine makes. This is the default mode and the one feeding "Your Real WPM" (consistency of mode matters for that metric — see 05).

## Testing strategy

The engine is pure functions (`tokenize`, `normalize`, `match`, `isComplete`) with no React/DOM dependency, exhaustively unit‑tested with table‑driven cases covering: decimals vs full stops, abbreviations, spelled numbers, ordinals, contractions, hyphenation, empty/punctuation‑only tokens, multi‑sentence alignment, and the trailing‑terminator tolerance.
