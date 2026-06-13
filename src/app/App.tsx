import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import styled from 'styled-components'
import { GlobalStyle } from './GlobalStyle'
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
  background: var(--purple-900);

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
  margin-right: auto;
  letter-spacing: -0.01em;
`

const Main = styled.main`
  flex: 1;
  padding: var(--space-4) var(--space-3);
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
`

export function App() {
  return (
    <HashRouter>
      <GlobalStyle />
      <Shell>
        <Nav>
          <AppTitle>Speech Speed Test</AppTitle>
          <NavLink to="/">Test</NavLink>
          <NavLink to="/history">History</NavLink>
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
