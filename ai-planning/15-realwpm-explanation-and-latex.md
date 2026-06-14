# 15 — Real WPM: Deep Explanation + LaTeX Math Rendering

---

## Part 1: What the T1–T4 WPM numbers actually mean

### The core idea

Your dictation speed is not one number — it depends on *which words you are speaking*. Common
words like "the", "is", and "and" flow out fast. Rare technical words slow you down. The Real
WPM model tries to tease apart your speed at four vocabulary levels and then combine them into a
single number that reflects real-world mixed text.

The four tiers come from a ranked frequency list of English words (the Google top-10,000):

| Tier | What's in it | Approx. share of a typical passage |
|---|---|---|
| T1 | The top-100 most common words: "the", "of", "and", "to", "a", "in", "is"… | ~50% of all word tokens |
| T2 | Ranks 101–1,000: everyday words like "city", "answer", "water", "letter" | ~40% |
| T3 | Ranks 1,001–9,894: less common but recognisable words | ~9% |
| T4 | Not in the top 10,000: rare, technical, or proper-noun words | ~1% |

The numbers next to T1–T4 in the UI are your **estimated dictation speed in WPM for words at
each tier**. T1 will always be the highest (common words are easy). T4 will always be the
lowest (rare words trip you up, slow your speech-to-text, or require spelling out).

### The fundamental problem: you can't test tiers in isolation

In the original RealWPM system for stenography (which this app adapts), you can administer
four separate tests — one with only T1 words, one with only T2 words, etc. — and directly
measure each speed.

**In a dictation speed test you cannot do this.** Every real English passage is a blend of all
tiers. Function words (T1) are grammatically unavoidable. You cannot write natural English
sentences using only T3–T4 words. So each test result gives you *one* overall WPM that mixes
all four speeds together in unknown proportion.

The composition vector [p1, p2, p3, p4] stored with each passage tells us *exactly* what that
proportion is: p1 = fraction of words that are T1, p2 = T2, etc.

### Why time adds but speed doesn't

Here is the key mathematical insight, written in plain terms.

If you dictate a 100-word passage where 50 words are T1 (your T1 speed = 200 WPM) and 50 words
are T4 (your T4 speed = 50 WPM), what is your overall WPM?

**Wrong instinct:** average the speeds → (200 + 50) / 2 = 125 WPM.

**Correct reasoning:** add the *times*. The 50 T1 words take 50/200 = 0.25 min. The 50 T4 words
take 50/50 = 1.0 min. Total time = 1.25 min for 100 words = 80 WPM. Very different from 125.

This is the harmonic mean, not the arithmetic mean. Speeds combine harmonically because the
quantity that adds linearly is **time-per-word** (the inverse of speed), not speed itself.

Formally, for a passage of N words with composition (p1, p2, p3, p4) and per-tier speeds
(v1, v2, v3, v4):

```
total_time = N × (p1/v1 + p2/v2 + p3/v3 + p4/v4)
```

Rearranging to express 1/WPM_passage (time-per-word):

```
1 / WPM_passage = p1×(1/v1) + p2×(1/v2) + p3×(1/v3) + p4×(1/v4)
```

So **inverse WPM is a linear combination of inverse tier speeds**, weighted by the known
composition fractions. This is what makes estimation tractable.

### The collinearity problem: why we can't just fit four free parameters

In principle you could collect many test results, treat each as a row of a linear system
`y = P·β` (where `y = 1/WPM`, `P` is the matrix of composition vectors, `β = [1/v1 … 1/v4]`),
and solve for the four unknowns with least-squares regression.

In practice this almost never works, because natural English passages cluster extremely tightly:
p ≈ (0.50, 0.40, 0.09, 0.01) for almost every passage regardless of topic or difficulty.
Even a "hard" passage has p1 ≈ 0.42 and p4 ≈ 0.06 — not enough variation in the design matrix
to pin down four independent numbers. The system is near-singular; solutions are unstable and
dominated by noise.

### What the app actually does: the single-parameter model

Because of collinearity, the app solves only for **one free parameter: β1 = 1/v1** (your
time-per-T1-word). The other three β values are locked to fixed ratios:

```
β2 = 1.3 × β1     →  v2 = v1 / 1.3      (T2 ≈ 23% slower than T1)
β3 = 1.8 × β1     →  v3 = v1 / 1.8      (T3 ≈ 44% slower)
β4 = 2.5 × β1     →  v4 = v1 / 2.5      (T4 ≈ 60% slower; mirrors the article's finding
                                           that fingerspelling lagged common words by ~2.5×)
```

For each of your test results, the app computes an estimate of β1:

```
β1_estimate = (elapsed_sec / word_count) / (p1 + 1.3×p2 + 1.8×p3 + 2.5×p4)
```

It then takes the **median** of all β1 estimates across your results (median is more robust to
outlier runs than the mean), derives v1–v4 from the fixed ratios, and rounds to the nearest
integer WPM.

### The headline formula

```
Your Real WPM = 0.50 × v1 + 0.40 × v2 + 0.09 × v3 + 0.01 × v4
```

The weights (0.50, 0.40, 0.09, 0.01) are the population-level tier fractions — the same numbers
that appear in passage compositions. So the headline answers: *"If you dictated a perfectly
typical English passage, what would your WPM be?"*

### The confidence indicators (●●●, ●●○, ●○○)

The T1 speed (v1) is estimated from real data and gets a confidence rating based on how many
**different difficulty bins** your results cover:

- **●●● high**: results from all three difficulty bins (easy, medium, hard) — the widest spread
  of compositions, giving the best β1 estimate.
- **●●○ medium**: results from two difficulty bins.
- **●○○ low**: results from only one difficulty bin.

T2, T3, T4 are always shown as **●○○ low** because they are never directly measured — they are
derived from the fixed ratios. The ratios are educated priors (based on the original RealWPM
article), not fitted to your data. The UI honestly flags this.

### The nudge message

The app notices which difficulty bin you are most under-sampled in and suggests "Take more
**Hard** passages to improve confidence." This is because hard passages have higher p3 and p4
fractions, which give more information for estimating β1 accurately when combined with easy/
medium results. (There is no magic with p3/p4 — it is just that more diverse compositions
tighten the β1 estimate.)

---

## Part 2: What it would take to use LaTeX-style math

### The case for math rendering

The current explainer renders the formulas as plain text strings:

```
0.50 × 130 + 0.40 × 100 + 0.09 × 72 + 0.01 × 52 = 112.0
```

A LaTeX renderer would produce typeset fractions, subscripts, and proper Greek letters:

```
Real WPM = 0.50·v₁ + 0.40·v₂ + 0.09·v₃ + 0.01·v₄

1/WPM = p₁·β₁ + p₂·β₂ + p₃·β₃ + p₄·β₄
```

This would make the model description considerably clearer to anyone with a maths background.

### Library options

**KaTeX** is the right choice for this app. Comparison:

| | KaTeX | MathJax |
|---|---|---|
| Render style | Synchronous | Asynchronous (needs page ready) |
| Bundle size | ~280 kB (JS + CSS + fonts) | ~1.5 MB+ |
| Speed | Very fast — sub-ms per formula | Noticeably slower |
| LaTeX coverage | ~90% of common LaTeX | Near-complete |
| SSR / static | Works fine | Needs config |
| React integration | `react-katex` or direct API | `better-react-mathjax` |

KaTeX can't do everything LaTeX can, but it handles everything this explainer needs: fractions,
subscripts, Greek letters, aligned equations, summation notation.

### Packages needed

```bash
npm install katex
npm install --save-dev @types/katex
```

`react-katex` is a thin wrapper but it adds a dependency for very little gain. Using KaTeX
directly is straightforward:

```tsx
import katex from 'katex'
import 'katex/dist/katex.min.css'

function Math({ tex, display = false }: { tex: string; display?: boolean }) {
  const html = katex.renderToString(tex, {
    throwOnError: false,
    displayMode: display,
  })
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}
```

The CSS import adds ~50 kB (it includes the font-face declarations). The fonts themselves
(WOFF2) are ~100 kB and are loaded on demand.

### Integration points

The only place in the current codebase that needs math rendering is `HistoryScreenView.tsx` —
specifically the `ExplainBody` section inside the explainer panel. The formulas that would
benefit:

1. The time-per-word identity: `1/WPM = p₁/v₁ + p₂/v₂ + p₃/v₃ + p₄/v₄`
2. The β1 estimate formula: `β₁ ≈ (elapsed/words) / (p₁ + 1.3·p₂ + 1.8·p₃ + 2.5·p₄)`
3. The headline formula: `Real WPM = 0.50·v₁ + 0.40·v₂ + 0.09·v₃ + 0.01·v₄`
4. The live formula with the user's actual numbers filled in (currently shown as a monospace
   string like `0.50 × 130 + 0.40 × 100 + 0.09 × 72 + 0.01 × 52 = 112.0`)

### Bundle size impact

KaTeX's JS is ~280 kB unminified (~90 kB gzipped). The fonts are loaded lazily by the browser.
For a static app deployed to GitHub Pages this is acceptable, but it is non-trivial. It would
only be loaded on the History screen (not the Test screen). Vite's code-splitting handles this
automatically if `HistoryScreen` is a lazy route:

```tsx
const HistoryScreen = React.lazy(() => import('./features/history/HistoryScreen'))
```

That would mean KaTeX is only downloaded when the user visits the History screen. Currently the
app does not lazy-load routes, so adding KaTeX would increase the initial bundle by ~90 kB
gzipped if route splitting is not added first.

### Caveats

1. **The explainer is currently sparse.** Adding KaTeX to four short formulas is a lot of
   infrastructure for modest gain. The bigger win would be rewriting the explainer text itself
   (the current prose doesn't explain *why* time adds, *why* there's only one free parameter,
   or *what the confidence ratings mean*) — that pays off without any new dependencies.

2. **The live formula is tricky.** The current live formula string interpolates user data into
   the middle of the formula text (`0.50 × 130 + ...`). With KaTeX you'd construct the LaTeX
   string dynamically: `` `0.50 \\cdot ${v1} + 0.40 \\cdot ${v2} + ...` ``. This works but
   the template-string approach is fragile; it's easy to accidentally produce invalid LaTeX.
   A helper function that takes the numbers and produces the string is the right mitigation.

3. **Dark mode.** KaTeX's default CSS uses hardcoded black for text. The existing dark-mode
   tokens would need an override: `--katex-color: var(--text-primary)` applied to the KaTeX
   container, or a small CSS patch. This is easy but must not be forgotten.

4. **Accessibility.** KaTeX can emit MathML alongside the HTML, which screen readers consume.
   Set `output: 'htmlAndMathml'` in the render options. The default `html`-only output is
   visually fine but not screen-reader friendly.

### Recommended order of work

1. **First: rewrite the explainer prose** using the explanation in Part 1 above. This is the
   highest-leverage change — most readers are confused by what the numbers mean, not by the
   lack of typesetting.
2. **Then: add lazy route splitting** for HistoryScreen to contain the bundle impact.
3. **Then: add KaTeX** if the improved prose still feels inadequate without proper math notation.
   The four target formulas are clear; integration is a half-day task.
