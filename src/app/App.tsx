import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import styled from 'styled-components'
import { GlobalStyle } from './GlobalStyle'
import { useTheme, HUE_FILLS, DARK_ICONS, type HueTheme } from './useTheme'
import { TestScreen } from '../features/test/TestScreen'
import { HistoryScreen } from '../features/history/HistoryScreen'

const Shell = styled.div`
  min-height: 100%;
  display: flex;
  flex-direction: column;
`

const Nav = styled.nav`
  display: flex;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-2) var(--space-3);
  background: var(--accent-bg);

  a {
    color: rgba(255, 255, 255, 0.75);
    text-decoration: none;
    font-weight: 500;
    font-size: 0.95rem;
    padding: 0.3rem 0.6rem;
    border-radius: 4px;
    transition: color 0.15s, background 0.15s;

    &:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.1);
    }

    &.active {
      color: #fff;
      background: rgba(255, 255, 255, 0.15);
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  }

  *:focus-visible {
    outline-color: rgba(255, 255, 255, 0.7);
  }
`

const AppTitle = styled.span`
  font-weight: 700;
  font-size: 1rem;
  color: #fff;
  letter-spacing: -0.01em;
`

const ThemeSwitcher = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
`

const Swatch = styled.button<{ $color: string; $active: boolean }>`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: ${p => p.$color};
  border: 2px solid ${p => p.$active ? '#fff' : 'transparent'};
  cursor: pointer;
  padding: 0;
  box-shadow: ${p => p.$active ? '0 0 0 1px rgba(255,255,255,0.4)' : 'none'};
  flex-shrink: 0;
  transition: transform 0.1s, box-shadow 0.1s;

  &:hover {
    transform: scale(1.2);
  }
`

const DarkToggle = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.75);
  font-size: 1rem;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  line-height: 1;
  margin-left: 4px;
  transition: color 0.15s, background 0.15s;

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
  }
`

const Main = styled.main`
  flex: 1;
  padding: var(--space-4) var(--space-3);
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
`

const HUES: HueTheme[] = ['purple', 'blue', 'orange', 'red']

export function App() {
  const { hue, darkPref, setHue, cycleDarkPref } = useTheme()

  return (
    <HashRouter>
      <GlobalStyle />
      <Shell>
        <Nav>
          <AppTitle>Speech Speed Test</AppTitle>
          <NavLink to="/">Test</NavLink>
          <NavLink to="/history">History</NavLink>
          <ThemeSwitcher>
            {HUES.map(h => (
              <Swatch
                key={h}
                $color={HUE_FILLS[h]}
                $active={hue === h}
                onClick={() => setHue(h)}
                title={`${h.charAt(0).toUpperCase() + h.slice(1)} theme`}
              />
            ))}
            <DarkToggle
              onClick={cycleDarkPref}
              title={`Colour scheme: ${darkPref}. Click to cycle.`}
            >
              {DARK_ICONS[darkPref]}
            </DarkToggle>
          </ThemeSwitcher>
        </Nav>
        <Main>
          <Routes>
            <Route path="/" element={<TestScreen />} />
            <Route path="/history" element={<HistoryScreen />} />
          </Routes>
        </Main>
      </Shell>
    </HashRouter>
  )
}
