# 05 — "Your Real WPM" Model

## Background: the original RealWPM

The [stenography RealWPM](https://robertmassaioli.medium.com/a-realwpm-for-stenography-be94beffab20) recognises that your speed depends on *which* words you write, and weights four separate tests by how often each vocabulary tier occurs in real text:

```
RealWPM = (s × 0.50) + (m × 0.40) + (l × 0.09) + (f × 0.01)
```

where, measured **on separate tests**:
- `s` = WPM on the **top‑100** words (used ~50% of the time)
- `m` = WPM on the **top‑1000** words (next ~40%)
- `l` = WPM on the **top‑10000** words (next ~9%)
- `f` = WPM fingerspelling rare words (last ~1%)

The weights are the population frequencies of each tier. The genius is that it produces a single number reflecting *real‑world* mixed‑vocabulary writing.

## The problem we must solve

In stenography you can administer four clean, tier‑isolated tests. **In a dictation speed test we cannot** — every passage is a *mixture* of tiers (you can't write English using only rank‑1001–10000 words; function words are unavoidable). A passage gives us **one** WPM that blends all tiers. So we must *infer* the per‑tier speeds `(s, m, l, f)` from passages of differing composition, then apply the same population weights.

## The key correction: speeds don't blend — time does

A tempting mistake is to regress passage‑WPM directly on tier composition. That is **wrong**, because WPM is a rate; rates combine **harmonically**, not arithmetically. Work it out.

A passage of `N` words with composition `p = (p₁, p₂, p₃, p₄)` and your per‑tier speeds `(v₁, v₂, v₃, v₄)` (words/min) takes total time:

```
T = N · ( p₁/v₁ + p₂/v₂ + p₃/v₃ + p₄/v₄ )
```

Dividing by `N` and noting passage WPM = `N / (T/60) ⇒ (T/60)/N = 1/WPM`:

```
1 / WPM_passage = p₁·(1/v₁) + p₂·(1/v₂) + p₃·(1/v₃) + p₄·(1/v₄)
```

So **inverse WPM (time‑per‑word) is linear in the inverse tier speeds**, with the known composition fractions as the weights. *This* is the quantity to fit — not WPM itself.

Let `y = 1/WPM_passage` and `β = (1/v₁, 1/v₂, 1/v₃, 1/v₄)`. Across the user's history we have rows `(pᵢ, yᵢ)`, giving the linear system `y = P · β`.

## Estimation — two methods, in order of robustness

### Method A (primary / MVP): difficulty‑binned harmonic estimate

Because natural passages cluster tightly around `p ≈ (0.5, 0.4, 0.09, 0.01)`, a free 4‑way regression is **ill‑conditioned** — the columns of `P` are nearly collinear, so `l` and `f` come out noisy or absurd. The robust MVP avoids solving for four free speeds:

1. Bin passages by difficulty (cumulative top‑N coverage), e.g. **Easy / Medium / Hard** (see [02](./02-corpus-pipeline.md)).
2. Compute the user's **median time‑per‑word** within each bin (median resists outliers / suspect runs).
3. Map bins → tier speeds using the *known mean composition of each bin*:
   - Easy bin ≈ dominated by T1/T2 → informs `s`, `m`.
   - Hard / tier‑skewed bin → pushes T3/T4 weight up → informs `l`, `f`.
4. Where a tier is under‑determined (almost always `f`, and often `l`), **fall back to a prior**: assume the rare tier is dictated at a fraction of the common‑word speed (e.g. `f ≈ 0.4·s`, mirroring the article's example where fingerspelling lagged common words), and **flag the estimate as low‑confidence** in the UI.

This yields a defensible RealWPM from day one without pretending we can cleanly separate `l` from `f`.

### Method B (refinement): constrained inverse‑WPM regression

Once the user has enough results across **distinct composition profiles**, fit `y = P·β` properly:

- Solve with **non‑negative least squares (NNLS)** so every `1/vᵢ ≥ 0` (no negative or infinite speeds).
- Optionally **regularise toward the binned estimates** (ridge / Bayesian prior) to tame the collinear `l`/`f` columns.
- Invert: `vᵢ = 1/βᵢ`, i.e. `s = 1/β₁`, `m = 1/β₂`, `l = 1/β₃`, `f = 1/β₄`.

> **Honest caveat to state in the product UI:** we deliberately seed the corpus with tier‑skewed/hard passages (02) to widen the spread of `P` and make `l`/`f` identifiable, but there is a hard ceiling — you cannot construct natural passages that isolate the rare tiers. Therefore `l` and especially `f` will always carry more uncertainty than `s`/`m`. Show confidence per tier; don't present a falsely precise single number.

## Producing the headline number

With estimated `(s, m, l, f)` from whichever method, apply the **original population weights**:

```
Your Real WPM = 0.50·s + 0.40·m + 0.09·l + 0.01·f
```

### Worked example (from the article, sanity check)

`s=70, m=40, l=10, f=50` → `0.5·70 + 0.4·40 + 0.09·10 + 0.01·50 = 35 + 16 + 0.9 + 0.5 = 52.4`. ✔️ Our pipeline must reproduce 52.4 given those tier speeds.

## What the "Your Real WPM" section shows

- The headline **Your Real WPM** number, with a confidence band.
- A breakdown: estimated `s / m / f / l`, each with a confidence indicator and the number of contributing passages.
- "To improve confidence, take more **Hard** passages" — nudges the user to fill the under‑sampled tiers.
- A note that this number is **mode‑dependent** (computed from Lexical‑mode results by default) and **frequency‑list‑dependent** (records which list/version — see 02), so it stays interpretable.

## Implementation notes

- All inputs (`composition`, `WPM`, `mode`, `suspect`) already live on each stored result ([04](./04-test-flow-and-metrics.md), [06](./06-history-and-storage.md)).
- Exclude `suspect` (paste‑detected / implausible) results from estimation.
- Use **median / robust** statistics, not mean, given small samples and STT variance.
- Recompute on demand from history; never store a stale RealWPM — store the inputs, derive the number.
