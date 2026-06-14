# 10 — Storybook Integration

## Goal

A running Storybook instance lets us browse every UI state without navigating the live app,
gives AI tools a single-page-per-component screenshot surface, and makes manual visual
regression trivial.

---

## Package versions

| Package | Role |
|---|---|
| `storybook` | CLI + core |
| `@storybook/react-vite` | React + Vite builder (no separate webpack; reuses our vite.config) |
| `@storybook/react` | React renderer |
| `@storybook/addon-essentials` | Controls, viewport, docs, backgrounds, actions |
| `@storybook/addon-a11y` | Accessibility panel |

Current npm version: **10.4.4**. All packages from the same version family.

---

## Installation (one-time)

```bash
npx storybook@latest init --type react --builder vite
```

This command:
- Adds the packages above to `devDependencies`
- Creates `.storybook/main.ts` and `.storybook/preview.ts`
- Adds `"storybook": "storybook dev -p 6006"` and `"build-storybook": "storybook build"` scripts

After running, remove any auto-generated example stories Storybook creates
(`src/stories/`) — we'll write our own.

---

## `.storybook/main.ts` config

```ts
import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.tsx'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
}
export default config
```

No extra Vite config needed — Storybook inherits our `vite.config.ts` automatically,
which already handles the `@vitejs/plugin-react` transform and JSON imports
(`resolveJsonModule` → passages.json loads correctly in stories).

---

## `.storybook/preview.ts` — the two critical decorators

### 1 — Theme decorator

Our theming is entirely CSS custom properties on `[data-theme]` / `[data-dark]` on
`<html>`. No styled-components ThemeProvider is involved. The decorator sets those
attributes before each story renders:

```ts
import type { Preview } from '@storybook/react'
import { GlobalStyle } from '../src/app/GlobalStyle'

const withTheme = (Story, ctx) => {
  const { theme = 'purple', dark = false } = ctx.globals
  document.documentElement.setAttribute('data-theme', theme)
  if (dark) document.documentElement.setAttribute('data-dark', '')
  else       document.documentElement.removeAttribute('data-dark')
  return <><GlobalStyle /><Story /></>
}
```

A globalTypes toolbar block gives a hue swatch + dark toggle in the Storybook toolbar:

```ts
export const globalTypes = {
  theme: {
    description: 'Colour theme',
    defaultValue: 'purple',
    toolbar: {
      icon: 'circlehollow',
      items: ['purple', 'blue', 'orange', 'red'],
      dynamicTitle: true,
    },
  },
  dark: {
    description: 'Dark mode',
    defaultValue: false,
    toolbar: {
      icon: 'moon',
      items: [
        { value: false, title: 'Light' },
        { value: true,  title: 'Dark'  },
      ],
    },
  },
}
export const decorators = [withTheme]
```

### 2 — Storage decorator

Components that read localStorage (`HistoryScreen`, `TestScreen`) need seed data.
Pass a `storage` parameter from each story to pre-populate `sst.v1` before render:

```ts
const withStorage = (Story, ctx) => {
  const { storage } = ctx.parameters
  if (storage !== undefined) {
    localStorage.setItem('sst.v1', JSON.stringify(storage))
  } else {
    localStorage.removeItem('sst.v1')
  }
  return <Story />
}
// Add to decorators array alongside withTheme
```

Stories provide seed data via:
```ts
export const WithResults: Story = {
  parameters: {
    storage: { version: 1, results: [ /* StoredResult objects */ ] },
  },
}
```

---

## Story file structure

One `.stories.tsx` file per screen / logical group. Co-locate with the component:

```
src/
  features/
    test/
      TestScreen.stories.tsx      ← idle, running (via play fn), completed
    history/
      HistoryScreen.stories.tsx   ← empty, no-realwpm, with-realwpm, expanded-explainer
  app/
    components.stories.tsx        ← shared atoms (buttons, badges, toggles)
```

### TestScreen story approach

`TestScreen` manages all state internally with hooks. To reach `running` or `completed`
states, use Storybook's `play` function (which runs user-event interactions after mount):

```ts
import { userEvent, within } from '@storybook/test'

export const Running: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByText('Start Test'))
  },
}

export const Completed: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByText('Start Test'))
    // Type a known passage in full to trigger completion
    const textarea = canvas.getByRole('textbox')
    await userEvent.type(textarea, KNOWN_PASSAGE_TEXT, { delay: 0 })
  },
}
```

`delay: 0` makes typing instant — no waiting in CI or during browsing.

### HistoryScreen story approach

All state comes from localStorage, so stories just seed `parameters.storage` with
different result sets. No play function needed for most stories:

```ts
// Empty (no results)
export const Empty: Story = { parameters: { storage: undefined } }

// Results exist but none have composition data → example numbers in explainer
export const NoRealWpm: Story = {
  parameters: {
    storage: { version: 1, results: [ /* results without composition field */ ] },
  },
}

// Full data — explainer shows real numbers
export const WithRealWpm: Story = {
  parameters: {
    storage: { version: 1, results: NINE_RESULTS_WITH_COMPOSITION },
  },
}

// Explainer open
export const ExplainerOpen: Story = {
  ...WithRealWpm,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByText('How is this calculated?'))
  },
}
```

### Shared components story

For atoms where we want to see all variants side-by-side without the full screen:

```ts
// src/app/components.stories.tsx
export const Buttons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', padding: '2rem', background: 'var(--surface)' }}>
      <PrimaryButton>Start Test</PrimaryButton>
      <OutlineButton>New Passage</OutlineButton>
      <DangerButton>Clear history</DangerButton>
    </div>
  ),
}
```

---

## Running Storybook

```bash
npm run storybook          # dev server at http://localhost:6006
npm run build-storybook    # static export to storybook-static/
```

The static export is a standard HTML/JS bundle — host it on GitHub Pages alongside
the app (different path), or serve locally for AI screenshot workflows.

---

## AI / automated screenshot workflow

With Storybook running, a Playwright script can visit each story URL directly:

```
http://localhost:6006/iframe.html?id=features-testscreen--idle&viewMode=story
http://localhost:6006/iframe.html?id=features-testscreen--running&viewMode=story
http://localhost:6006/iframe.html?id=features-historyscreen--with-real-wpm&viewMode=story
```

Story IDs follow the pattern `{path-to-file}--{export-name}` (lowercase, hyphens).
The `iframe.html` endpoint renders only the story canvas, no Storybook chrome —
ideal for screenshots.

To test all 4 themes × 2 modes, append globals to the URL:
```
?globals=theme:blue;dark:true
```

---

## What NOT to do

- Do not extract new presentational sub-components just to make them easier to story.
  Use `play` functions on the existing full screens instead — splitting components
  purely for Storybook creates abstraction debt.
- Do not import from `../../../` deep paths in story files. Stories live next to
  components and import their immediate neighbours.
- Do not add Storybook-specific state management (Redux decorators, mock providers,
  etc.) — this project deliberately has no global state; localStorage seed + play
  functions cover all cases.

---

## Implementation steps

1. `npx storybook@latest init --type react --builder vite`
2. Delete auto-generated `src/stories/`
3. Write `.storybook/main.ts` and `.storybook/preview.ts` as above
4. Write `TestScreen.stories.tsx` (idle, running, completed stories)
5. Write `HistoryScreen.stories.tsx` (empty, no-realwpm, with-realwpm, explainer-open)
6. Write `components.stories.tsx` for shared atoms
7. `npm run storybook` — verify all stories render correctly across 4 themes × 2 modes
8. Add `"build-storybook"` to CI if desired (optional — slow, ~60s)
