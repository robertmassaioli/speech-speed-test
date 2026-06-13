import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { clearHistory, isStorageAvailable, loadResults, type StoredResult } from '../../storage/history'

const Banner = styled.div`
  font-size: 0.85rem;
  color: #a05000;
  background: #fff8ec;
  border: 1px solid #f0c060;
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  margin-bottom: 1rem;
`

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`

const Empty = styled.p`
  color: #888;
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
`

const Th = styled.th`
  text-align: left;
  padding: 0.5rem 0.75rem;
  border-bottom: 2px solid #ddd;
  white-space: nowrap;
`

const Td = styled.td<{ $dim?: boolean; $warn?: boolean }>`
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #eee;
  color: ${p => p.$warn ? '#a05000' : p.$dim ? '#999' : 'inherit'};
`

const Button = styled.button`
  padding: 0.45rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: #e8e8e8;
  color: #1a1a1a;

  &:hover {
    background: #d4d4d4;
  }
`

const DangerButton = styled(Button)`
  background: #fee;
  color: #900;

  &:hover {
    background: #fcc;
  }
`

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatElapsed(sec: number): string {
  return sec < 60 ? `${sec.toFixed(1)}s` : `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`
}

export function HistoryScreen() {
  const navigate = useNavigate()
  const storageOk = isStorageAvailable()
  const [results, setResults] = useState<StoredResult[]>(() => loadResults())
  const [confirmClear, setConfirmClear] = useState(false)

  function handleClear() {
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    clearHistory()
    setResults([])
    setConfirmClear(false)
  }

  return (
    <div>
      <h1>History</h1>

      {!storageOk && (
        <Banner>Storage is unavailable (private mode?) — results are not being saved.</Banner>
      )}

      <Toolbar>
        <span style={{ fontSize: '0.9rem', color: '#666' }}>
          {results.length} result{results.length !== 1 ? 's' : ''}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button onClick={() => navigate('/')}>New Test</Button>
          {results.length > 0 && (
            <DangerButton onClick={handleClear}>
              {confirmClear ? 'Confirm clear' : 'Clear history'}
            </DangerButton>
          )}
          {confirmClear && (
            <Button onClick={() => setConfirmClear(false)}>Cancel</Button>
          )}
        </div>
      </Toolbar>

      {results.length === 0 ? (
        <Empty>No results yet. <a href="#/">Take a test to get started.</a></Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Passage</Th>
              <Th>Mode</Th>
              <Th>WPM</Th>
              <Th>CPM</Th>
              <Th>Time</Th>
            </tr>
          </thead>
          <tbody>
            {results.map(r => (
              <tr key={r.id}>
                <Td $dim>{formatDate(r.ts)}</Td>
                <Td $dim>{r.passageId}</Td>
                <Td>{r.mode}</Td>
                <Td $warn={r.suspect}>{r.wpm}{r.suspect ? ' *' : ''}</Td>
                <Td $warn={r.suspect}>{r.cpm}{r.suspect ? ' *' : ''}</Td>
                <Td>{formatElapsed(r.elapsedSec)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {results.some(r => r.suspect) && (
        <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.75rem' }}>
          * Possible paste detected — excluded from aggregate stats.
        </p>
      )}
    </div>
  )
}
