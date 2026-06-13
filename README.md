# Speech Speed Test

A static web app for measuring how fast you can dictate text with a speech-to-text tool. You are shown a randomly assigned passage (50–400 words), click Start, dictate it with your STT tool, and the moment your transcribed text matches the passage the timer stops — giving you results in **words per minute (WPM)** and **characters per minute (CPM)**.

Live at: **https://robertmassaioli.github.io/speech-speed-test/**

## Features (planned)

- **Zero backend.** Pure static site deployable to GitHub Pages.
- **Two matching modes.** *Strict* (verbatim) and *Lexical* (ignores most punctuation, normalises numbers, but always enforces sentence-terminating full stops).
- **Rich corpus.** Hand-seeded passages plus Project Gutenberg extracts, classified by vocabulary difficulty (top-100 / 1k / 10k word tiers).
- **Your Real WPM.** An adaptation of the [RealWPM model](https://robertmassaioli.medium.com/a-realwpm-for-stenography-be94beffab20) that weights your speed across vocabulary-frequency tiers for a single realistic number.
- **Personal history.** All results stored in `localStorage`; trends visualised over time.

## Tech stack

- TypeScript (strict) · React 19 · Vite 8
- styled-components · react-router-dom (hash routing)
- GitHub Actions → GitHub Pages

## Development

```bash
npm install
npm run dev        # dev server at http://localhost:5173/speech-speed-test/
npm run build      # production build → dist/
npm run preview    # serve dist/ locally to verify base-path behaviour
npm run lint       # ESLint
```

## Deployment

Every push to `main` triggers `.github/workflows/deploy.yml`, which builds the site and deploys `dist/` to GitHub Pages.

First-time setup: in the repo settings go to **Pages → Source → GitHub Actions**.
