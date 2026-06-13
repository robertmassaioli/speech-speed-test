# Speech Speed Test — Proposal

A static web application for measuring how fast you can dictate text with a speech‑to‑text (STT) tool. You are shown a randomly assigned passage (50–400 words), you start the test, you dictate the passage into a text box, and the moment your transcribed text matches the passage the timer stops and you receive your results in **words per minute (WPM)** and **characters per minute (CPM)**.

The differentiating feature is **"Your Real WPM"** — an adaptation of the [RealWPM model for stenography](https://robertmassaioli.medium.com/a-realwpm-for-stenography-be94beffab20) that estimates your real‑world dictation speed by weighting performance across vocabulary‑frequency tiers, even though a dictation test cannot isolate individual word tiers the way the stenography version can.

## Goals

1. **Zero backend.** Pure static site (TypeScript + Vite + React) deployable to GitHub Pages.
2. **Frictionless test loop.** Land on the page → get a passage → start → dictate → auto‑complete → see results.
3. **Forgiving but principled matching.** Two modes: a *strict* verbatim mode and a *lexical* mode that ignores most punctuation and normalises numbers — but always treats sentence‑terminating full stops as significant.
4. **A meaningful aggregate metric.** "Your Real WPM" that corrects for the vocabulary difficulty of the passages you happened to be tested on.
5. **Personal history.** All results stored in `localStorage`; trends visualised over time.
6. **A rich, classified corpus.** Hand‑seeded passages plus an offline pipeline that ingests public‑domain books (Project Gutenberg) and classifies extracted passages by vocabulary complexity.

## Non‑goals (initially)

- Multi‑user accounts, leaderboards, or any server‑side persistence.
- Building or shipping a speech‑to‑text engine. The user brings their own STT (OS dictation, Whisper, etc.); we only consume the text it produces.
- Real‑time audio capture. We measure the *typed/dictated text stream*, not the microphone.

## Subproposals

| # | Document | Scope |
|---|----------|-------|
| 01 | [Architecture & Tech Stack](./01-architecture.md) | Vite/React/TS, GitHub Pages deploy, module layout, state management |
| 02 | [Corpus & Build‑Time Pipeline](./02-corpus-pipeline.md) | Frequency tiers, Gutenberg ingestion, passage classification, bundling |
| 03 | [Matching Engine](./03-matching.md) | Tokenisation, normalisation, strict vs lexical matching, number/full‑stop rules |
| 04 | [Test Flow & Metrics](./04-test-flow-and-metrics.md) | UX flow, timing, WPM/CPM definitions, completion predicate |
| 05 | ["Your Real WPM" Model](./05-realwpm.md) | Adapting RealWPM to passage‑level dictation; the math |
| 06 | [History & Storage](./06-history-and-storage.md) | `localStorage` schema, versioning, charts, export/import |
| 07 | [Roadmap & Milestones](./07-roadmap.md) | Phasing, MVP cut line, open questions |

## Reading order

If you only read two documents, read **03 (Matching)** and **05 (Real WPM)** — they contain the non‑obvious design decisions. Everything else is comparatively conventional web‑app engineering.
