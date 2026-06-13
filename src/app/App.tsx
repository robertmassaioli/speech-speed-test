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
  gap: 1.5rem;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;

  a {
    color: #555;
    text-decoration: none;
    font-weight: 500;

    &.active {
      color: #1a1a1a;
      text-decoration: underline;
    }
  }
`

const AppTitle = styled.span`
  font-weight: 700;
  margin-right: auto;
`

const Main = styled.main`
  flex: 1;
  padding: 2rem 1.5rem;
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
