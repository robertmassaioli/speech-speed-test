import { createGlobalStyle } from 'styled-components'
import { purpleTheme } from './themes/purple'
import { blueTheme } from './themes/blue'
import { orangeTheme } from './themes/orange'
import { redTheme } from './themes/red'

export const GlobalStyle = createGlobalStyle`
  :root {
    --space-1: 0.5rem;
    --space-2: 1rem;
    --space-3: 1.5rem;
    --space-4: 2rem;
    --space-5: 3rem;
  }

  ${purpleTheme}
  ${blueTheme}
  ${orangeTheme}
  ${redTheme}

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
    background: var(--surface);
    color: var(--text-primary);
  }

  *:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
    border-radius: 2px;
  }

  a {
    color: var(--accent);
  }
`
