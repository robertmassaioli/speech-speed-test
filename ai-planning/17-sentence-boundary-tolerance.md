# 17 — Sentence Boundary Tolerance

## Problem

Some passages contain short sentences that flow naturally in speech without a detectable pause. STT engines reliably transcribe the words but frequently omit or misplace the sentence-terminating full stop between two adjacent short sentences. For example:

> "It started with a comment on a forum, then a reply, then a conversation. Over months messages became routine, deadly check-ins, shared thoughts. They knew each other's habits, preferences, small details, but they had never met."

A speaker dictating this is unlikely to produce a distinct pause after "shared thoughts" — the STT may output "…shared thoughts they knew each other's habits…" without the full stop, causing a perpetual mismatch even though every word was correctly spoken. The current matching spec (doc 03) requires sentence boundaries to be enforced in **both** strict and lexical mode with no tolerance.

---

## Options Considered

### Option A — Remove sentence boundary enforcement in lexical mode

Drop all sentence segmentation from the lexical pipeline. Flatten the reference and input to a single word stream and compare tokens only.

**Pros:** Eliminates the class of problem entirely. Simple rule to implement.

**Cons:** Fundamentally changes what the test measures. Users can dictate the whole passage as one run-on sentence and complete; no incentive to punctuate at all. Real WPM and history become incomparable between old and new tests. Throws away a meaningful signal about STT punctuation ability.

**Verdict:** Too broad. The cure is worse than the disease.

---

### Option B — Make sentence terminators optional in lexical mode

Change the completion predicate so that a missing terminator at a sentence boundary is not a mismatch. A present terminator must still be the correct class (statement `.`/`!` or question `?`), but absence is silently tolerated.

**Pros:** Targeted at the exact failure mode (missing full stop). No passage changes needed. Wrong punctuation still penalises; just missing punctuation does not.

**Cons:** Users can dictate without punctuating at all and still complete. The "lexical mode measures dictation throughput" framing in doc 03 explicitly notes that trailing terminators are still required; this reverses that. Passages with intentional short sentences (e.g. staccato literary style) would lose their distinctiveness.

**Verdict:** Goes too far in the other direction — it would make lexical mode fully punctuation-agnostic, which removes a signal users care about.

---

### Option C — Passage curation: enforce a minimum sentence length

Do not change the matching engine. Instead, enforce a minimum sentence length (suggested: **8 tokens**) for all current and future passages. The STT punctuation problem is almost entirely caused by short sentences where speech rhythm does not carry a natural pause. Sentences of 8+ words almost always end in a genuine pause or breath, giving the STT a reliable boundary signal.

**Pros:** Preserves matching fidelity entirely. No engine changes, no test comparability risk. Fixes the root cause: passages that are hostile to STT engines should not be in the corpus. The example passage above would be reworked — "Over months messages became routine, deadly check-ins, shared thoughts." is only 8 tokens and borderline; "They knew each other's habits, preferences, small details, but they had never met." is fine at 15 tokens.

**Cons:** Some existing passages contain intentional short sentences for literary effect and would need manual rewriting. Reduces the author's stylistic freedom. Does not help if a long sentence is still boundary-ambiguous for a specific STT (rare but possible).

**Verdict:** Strong candidate. Addresses the problem at the corpus layer rather than the engine layer.

---

### Option D — Sentence-merge tolerance in lexical mode

Allow up to **N consecutive sentence boundaries** to be omitted from the input without penalty (default N=1). The engine attempts to align the input token stream against the reference with optional boundary insertions, similar to a gap-aware alignment.

**Pros:** Targeted and precise. Handles the specific failure mode (merged adjacent sentences) without making terminators globally optional. Could be tuned per passage.

**Cons:** Significant engine complexity — requires a fuzzy alignment algorithm instead of the current linear scan. Edge cases multiply (what if two merges happen in a row? what if a boundary is in the wrong place?). Complicates the "longest correct prefix" live feedback, which currently relies on simple sequential matching. Makes it harder to explain to the user why they're completing.

**Verdict:** Technically attractive but disproportionately complex for the benefit.

---

### Option E — Passage-level annotation: mark boundary-optional sentences

Allow each passage in `passages.json` to carry a `optionalBoundaries` list — indices of sentence boundaries that are considered optional in lexical mode. The matching engine checks this list before enforcing a missing terminator.

**Pros:** Fine-grained; preserves full fidelity for passages that don't need it. Passage authors decide what's STT-hostile.

**Cons:** Manual annotation labour for all 225+ passages. Adds complexity to the data schema and engine. Falls out of sync as passages are edited. Option C achieves the same goal more cleanly.

**Verdict:** Overly operationally complex when Option C solves the same problem.

---

## Recommendation

**Adopt Option C (passage curation) as the primary fix, with a soft minimum sentence length of 8 tokens.**

The STT sentence-boundary problem is a corpus quality issue, not an engine design issue. The matching engine is doing exactly what it should: requiring accurate sentence termination. The problem is that certain passage sentences are too short for STT to reliably detect the boundary. Removing those passages (or rewriting them) keeps the engine honest and the corpus clean.

Concrete steps:

1. **Audit the corpus** — scan all passages for sentences shorter than 8 tokens. 112 of 225 passages have at least one short sentence; many are innocuous (a single 6-word sentence in an otherwise long passage). Prioritise passages where two or more adjacent sentences are both short, since that is where the merge failure occurs.

2. **Rewrite problematic sentences** — expand short sentences to meet the threshold, preserving meaning and tone. The example passage becomes:

   > "It started with a comment on a forum, then a reply, then a full conversation. Over the following months those messages became routine, serving as daily check-ins and a place for shared thoughts. They knew each other's habits, preferences, and small details of their lives, but they had never met in person."

3. **Add a corpus lint rule** — validate minimum sentence length in the passage-generation pipeline so future passages can't regress below the threshold.

4. **Document the constraint in the corpus pipeline doc (02)** — add "sentences must be ≥ 8 tokens; avoid two consecutive sentences both < 12 tokens" as an authoring rule.

### What this does not change

- The matching engine spec (doc 03) stays as written.
- Strict mode is unaffected.
- Lexical mode still requires sentence terminators.
- The completion predicate is unchanged.

### When Option B becomes relevant

If corpus curation is not sufficient — i.e., well-formed long sentences still routinely fail to receive their terminator from a specific STT engine — revisit Option B **scoped only to the final sentence** (the current spec already waives trailing whitespace; we could additionally waive the trailing terminator for the very last sentence). This is a small, targeted change and would only affect users who stop speaking just before the last period — a common STT failure mode that is distinct from mid-passage merges.
