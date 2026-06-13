import { createGlobalStyle } from 'styled-components'

export const GlobalStyle = createGlobalStyle`
  :root {
    /* Brand */
    --purple-50:  #f5f3ff;
    --purple-100: #ede9fe;
    --purple-600: #7c3aed;
    --purple-700: #6d28d9;
    --purple-900: #4c1d95;

    /* Neutrals */
    --neutral-50:  #fafaf9;
    --neutral-200: #e5e5e5;
    --neutral-600: #525252;
    --neutral-700: #374151;
    --neutral-900: #111827;

    /* Difficulty */
    --diff-easy-bg:   #dcfce7;
    --diff-easy-text: #166534;
    --diff-med-bg:    #fef9c3;
    --diff-med-text:  #854d0e;
    --diff-hard-bg:   #fee2e2;
    --diff-hard-text: #991b1b;

    /* Spacing (8 pt grid) */
    --space-1: 0.5rem;   /* 8px  */
    --space-2: 1rem;     /* 16px */
    --space-3: 1.5rem;   /* 24px */
    --space-4: 2rem;     /* 32px */
    --space-5: 3rem;     /* 48px */
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  html, body, #root {
    height: 100%;
    margin: 0;
  }

  body {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    -webkit-font-smoothing: antialiased;
    background: #f0effe;
    color: var(--neutral-900);
  }

  /* Consistent purple focus ring across all interactive elements */
  *:focus-visible {
    outline: 2px solid var(--purple-600);
    outline-offset: 2px;
    border-radius: 2px;
  }

  a {
    color: var(--purple-600);
  }
`
