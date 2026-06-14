# Proposal: Separate Test and Story File Directories

## Background

Currently all test files (`*.test.ts`) and Storybook story files (`*.stories.tsx`) are co-located alongside the source files they test or demonstrate:

```
src/
  engine/
    match.test.ts
    metrics.test.ts
    normalize.test.ts
    numbers.test.ts
    tokenize.test.ts
  corpus/
    realwpm.test.ts
  app/
    components.stories.tsx
  features/
    test/TestScreen.stories.tsx
    history/HistoryScreen.stories.tsx
```

The goal is to evaluate whether these files should be moved to a dedicated directory, and if so, which layout works best.

## Critical Finding: Co-located Files Already Don't Ship in the Production Build

Before evaluating options, it's worth being precise about whether moving these files would have any effect on the production build.

**Vite builds by traversing the import graph from the entry point.** The entry point is `index.html` → `src/main.tsx` → `./app/App`. Vite only bundles files that are reachable through `import` statements starting from that root. It does not bundle every file under `src/` just because they sit in the source directory.

- `*.test.ts` files are never imported by any production source file. They only appear in `vitest.config.ts`'s `include` pattern, which is a test-runner config — it has no effect on `vite build`.
- `*.stories.tsx` files are never imported by any production source file either. Storybook discovers them via the glob in `.storybook/main.ts`, but that config is only used when running the Storybook dev server or `build-storybook`. The `vite build` command that creates the production app in `dist/` does not use `.storybook/main.ts` at all.

**Conclusion: co-located test and story files are already excluded from the production Vite build today.** Moving them to a different directory does not improve build safety. It is a developer-experience and codebase-organisation change only.

This changes the trade-off analysis for all three options: "keeps test/story files out of the production build" is not a valid argument for any of them, because the production build is already clean regardless of file location.

## Current Configuration Summary

| Config | Relevant setting |
|---|---|
| `vite.config.ts` | Entry point only — no explicit includes/excludes. Bundles from `src/main.tsx`. |
| `tsconfig.app.json` | `"include": ["src"]` — type-checks everything under `src/`. |
| `tsconfig.node.json` | `"include": ["vite.config.ts"]` — covers Vite config only. |
| `tsconfig.scripts.json` | `"include": ["scripts", "src/engine", "src/corpus"]` — covers build scripts. |
| `vitest.config.ts` | `include: ['src/**/*.test.ts']` for the unit test project; the storybook test project reads from `.storybook/main.ts`. |
| `.storybook/main.ts` | `stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)']` |

---

## Option A: Keep Files in `src/` Under Dedicated Subdirectories

Move all test and story files to purpose-built subdirectories still inside `src/`:

```
src/
  engine/
    match.ts
    metrics.ts
    ...
  tests/
    engine/
      match.test.ts
      metrics.test.ts
      normalize.test.ts
      numbers.test.ts
      tokenize.test.ts
    corpus/
      realwpm.test.ts
  stories/
    app/
      components.stories.tsx
    features/
      test/TestScreen.stories.tsx
      history/HistoryScreen.stories.tsx
```

### Config Changes Required

| Config | Change |
|---|---|
| `tsconfig.app.json` | No change — `"include": ["src"]` already covers the whole tree. |
| `vitest.config.ts` | Update `include` from `src/**/*.test.ts` to `src/tests/**/*.test.ts`. |
| `.storybook/main.ts` | Update stories glob from `../src/**/*.stories.@(...)` to `../src/stories/**/*.stories.@(...)`. |
| `vite.config.ts` | No change. |

### Trade-offs

**Pros:**
- Fewest config changes — only two glob patterns need updating.
- TypeScript coverage is automatic; `tsconfig.app.json` already includes all of `src/`.
- Path aliases like `../engine/match` in test files become `../../engine/match` — a minor but manageable depth increase.
- Easy to find all tests at a glance (`src/tests/`) without leaving the `src/` tree.

**Cons:**
- `tsconfig.app.json` still type-checks test and story files as part of the app. This means test-only imports (e.g., Vitest globals, `@storybook/react`) must remain available to the app TypeScript project even though the app never uses them. Strict `noUnusedLocals` shouldn't trigger, but the boundary isn't enforced by the type system.
- The separation is structural (by directory name) rather than enforced by a config boundary. A developer could accidentally import `src/tests/engine/match.test.ts` from app code and the type-checker wouldn't stop them.
- `src/` remains somewhat cluttered — you still see `tests/` and `stories/` mixed in with `engine/`, `app/`, `corpus/`, and `features/`.

---

## Option B: Move Everything to Sibling Directories Next to `src/`

The most complete separation: create `tests/` and `stories/` as siblings of `src/`:

```
src/
  engine/
    match.ts
    ...
  app/
    ...
  features/
    ...
tests/
  engine/
    match.test.ts
    metrics.test.ts
    normalize.test.ts
    numbers.test.ts
    tokenize.test.ts
  corpus/
    realwpm.test.ts
stories/
  app/
    components.stories.tsx
  features/
    test/TestScreen.stories.tsx
    history/HistoryScreen.stories.tsx
.storybook/
  main.ts
  preview.tsx
```

### Config Changes Required

| Config | Change |
|---|---|
| `tsconfig.app.json` | No change — `"include": ["src"]` already excludes `tests/` and `stories/`. |
| `vitest.config.ts` | Update `include` from `src/**/*.test.ts` to `tests/**/*.test.ts`. |
| `.storybook/main.ts` | Update stories glob from `../src/**/*.stories.@(...)` to `../stories/**/*.stories.@(...)`. |
| New `tsconfig.test.json` | Create a tsconfig covering `tests/` with `"references": [{"path": "./tsconfig.app.json"}]` so test files can import from `src/`. |
| New `tsconfig.stories.json` | Create a tsconfig covering `stories/` similarly, so story files can import from `src/`. |
| `vite.config.ts` | No change — the production build was never reading from these directories anyway. |
| `tsconfig.json` (root) | Add references to `tsconfig.test.json` and `tsconfig.stories.json` if you want `tsc -b` to type-check them. |

Note: `tsconfig.scripts.json` already uses an explicit include (`scripts`, `src/engine`, `src/corpus`) and is unaffected.

### Trade-offs

**Pros:**
- Hard architectural boundary: `src/` is strictly production code. `tests/` is strictly unit tests. `stories/` is strictly Storybook. The type-checker enforces this — test files can see `src/` types (via project references) but app code cannot accidentally import from `tests/` without a compiler error.
- The project root communicates structure at a glance: `src/`, `tests/`, `stories/` are top-level peers.
- Consistent with many large projects and monorepo layouts.

**Cons:**
- Two new tsconfig files are required. They are straightforward boilerplate, but they are new files to maintain.
- The root `tsconfig.json` may need updating to include the new references (depending on whether `tsc -b` is expected to type-check them).
- Import paths in test files become longer — `../../src/engine/match` instead of `../match`. This is mitigated by using a TypeScript path alias (e.g., `@/engine/match`), but that requires adding `paths` to `tsconfig.app.json` and mirroring it in `vitest.config.ts` via `resolve.alias`.
- When a module and its test are co-located, you immediately know where the test is. When they're in a sibling tree, you mentally maintain two parallel directory structures. For this project, whose `src/` tree is relatively flat, the friction is low but not zero.
- `.storybook/preview.tsx` currently imports from `../src/app/GlobalStyle`. With stories moved to `stories/`, that path becomes `../../src/app/GlobalStyle` — a minor but real change.

---

## Option C: Move Tests to `tests/` (Sibling), Keep Stories Co-located in `src/`

A targeted middle ground: move unit tests out to a `tests/` sibling directory, but leave `.stories.tsx` files where they are.

```
src/
  engine/
    match.ts
    ...
  app/
    components.stories.tsx    ← stays here
  features/
    test/TestScreen.stories.tsx    ← stays here
    history/HistoryScreen.stories.tsx    ← stays here
tests/
  engine/
    match.test.ts
    metrics.test.ts
    normalize.test.ts
    numbers.test.ts
    tokenize.test.ts
  corpus/
    realwpm.test.ts
.storybook/
  main.ts    ← unchanged
  preview.tsx    ← unchanged
```

### Config Changes Required

| Config | Change |
|---|---|
| `tsconfig.app.json` | No change — `"include": ["src"]` already excludes `tests/`. |
| `vitest.config.ts` | Update `include` from `src/**/*.test.ts` to `tests/**/*.test.ts`. |
| `.storybook/main.ts` | No change — stories glob remains `../src/**/*.stories.@(...)`. |
| New `tsconfig.test.json` | Create a tsconfig covering `tests/` so test files type-check cleanly against `src/` types. |
| `vite.config.ts` | No change. |

### Rationale for Asymmetric Treatment

The asymmetry is justified because tests and stories have different co-location value:

- **Unit tests** test the behaviour of a module in isolation. They are maintenance artefacts — when you rename or refactor `match.ts`, the test is the first thing that needs updating. However, a `tests/` directory makes it easy to run, discover, and CI-gate the entire test suite without touching `src/`. The test files also have no meaningful relationship to the component's visual appearance or API surface that benefits from physical proximity.

- **Storybook stories** document and visually demonstrate a component's states. They are most useful when sitting near the component they illustrate — they serve as living documentation for the component author and for designers reviewing the component in Storybook. The Storybook ecosystem also expects story discovery via glob, so the location doesn't matter to the tooling. In this project stories are already in `src/app/` and `src/features/`, which mirrors the component they cover. Co-location is a meaningful benefit here.

That said, this is a stylistic preference, not a technical constraint.

### Trade-offs

**Pros:**
- Fewer config changes than Option B: only two files need updating (no new `tsconfig.stories.json`, no `.storybook/main.ts` change).
- `tests/` becomes a clean, scannable list of all unit tests.
- Stories stay co-located with their components, preserving the discoverability benefit.
- `src/` still only contains the `.stories.tsx` files, not `.test.ts` files — a significant reduction in test noise.

**Cons:**
- `src/` still contains stories — if the goal is "production source code only in `src/`", this doesn't fully achieve it. Pragmatically this is fine because stories never enter the production build, but it's a philosophical inconsistency.
- One new tsconfig file (`tsconfig.test.json`) is needed.
- Test import paths grow by one level (`../src/engine/match` instead of `../match`). A path alias resolves this if it matters.

---

## Recommendation

**Option C** is the best fit for this project at its current scale.

The primary motivation for moving test files is organisational clarity: keeping `tests/` out of `src/` makes `src/` clearly the production source tree and makes the test suite easy to locate and run. The cost is one new tsconfig and slightly longer import paths in test files.

Keeping stories in `src/` preserves the co-location benefit that Storybook files genuinely provide — a story next to its component is easier to maintain — at zero config cost.

Option B is the principled maximum-separation choice and would be the right call if the project were growing toward a monorepo or if strict enforcement of the `src/`-is-production-only rule were required. At current scale it introduces more overhead (two new tsconfigs, longer import paths, `.storybook/preview.tsx` path changes) than the benefit warrants.

Option A is the lightest lift but provides the weakest separation: the type-checker offers no boundary, and `src/` remains mixed.

### Implementation Plan for Option C

1. Create `tests/engine/` and `tests/corpus/` directories.
2. Move the six `.test.ts` files, preserving the subdirectory shape.
3. Update relative imports inside each test file (`../match` → `../../src/engine/match`, etc.) or add a `@/` path alias to avoid churn.
4. In `vitest.config.ts`, change `include: ['src/**/*.test.ts']` to `include: ['tests/**/*.test.ts']`.
5. Create `tsconfig.test.json` at the root referencing `tsconfig.app.json` and including `["tests"]`.
6. Optionally add `tsconfig.test.json` to the references in the root `tsconfig.json` so `tsc -b` covers it.
7. Verify `vitest run` and `tsc -b` both pass.
