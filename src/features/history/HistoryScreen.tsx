import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { computeRealWpm, type Confidence, type RealWpmResult } from '../../corpus/realwpm'
import type { DifficultyBin } from '../../corpus/tiers'
import {
  clearHistory,
  exportStore,
  importStore,
  isStorageAvailable,
  loadResults,
  type StoredResult,
} from '../../storage/history'

// ── Styled components ─────────────────────────────────────────────────────────

const Banner = styled.div`
  font-size: 0.85rem;
  color: #a05000;
  background: #fff8ec;
  border: 1px solid #f0c060;
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  margin-bottom: 1rem;
`

const Section = styled.div`
  margin-bottom: 1.5rem;
`

const SectionTitle = styled.h2`
  font-size: 1rem;
  font-weight: 600;
  color: #444;
  margin: 0 0 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
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

  &:hover { background: #d4d4d4; }
`

const DangerButton = styled(Button)`
  background: #fee;
  color: #900;
  &:hover { background: #fcc; }
`

// ── Real WPM panel ─────────────────────────────────────────────────────────────

const RealWpmCard = styled.div`
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
`

const RealWpmHeadline = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 1rem;
`

const RealWpmValue = styled.span`
  font-size: 2.8rem;
  font-weight: 700;
  line-height: 1;
`

const RealWpmLabel = styled.span`
  font-size: 0.9rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const TierGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 0.75rem;

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }
`

const TierCell = styled.div`
  text-align: center;
  background: #f9f9f9;
  border-radius: 6px;
  padding: 0.6rem 0.4rem;
`

const TierSpeed = styled.div`
  font-size: 1.4rem;
  font-weight: 700;
`

const TierName = styled.div`
  font-size: 0.7rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 0.15rem;
`

const TierConf = styled.div<{ $conf: Confidence }>`
  font-size: 0.65rem;
  color: ${p => p.$conf === 'high' ? '#2a7a2a' : p.$conf === 'medium' ? '#c07800' : '#aaa'};
  margin-top: 0.2rem;
`

const Nudge = styled.p`
  font-size: 0.82rem;
  color: #555;
  margin: 0.5rem 0 0;
  background: #f0f4ff;
  border-radius: 4px;
  padding: 0.4rem 0.6rem;
`

const RealWpmEmpty = styled.p`
  color: #888;
  margin: 0;
`

// ── Personal bests ─────────────────────────────────────────────────────────────

const BestGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
`

const BestCell = styled.div`
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 0.75rem;
  text-align: center;
`

const BestValue = styled.div<{ $color: string }>`
  font-size: 1.6rem;
  font-weight: 700;
  color: ${p => p.$color};
`

const BestLabel = styled.div`
  font-size: 0.75rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 0.2rem;
`

// ── Trend chart ────────────────────────────────────────────────────────────────

const ChartWrap = styled.div`
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0.75rem;
  overflow: hidden;
`

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatElapsed(sec: number): string {
  return sec < 60 ? `${sec.toFixed(1)}s` : `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`
}

const DIFF_COLOR: Record<DifficultyBin, string> = {
  easy:   '#2a7a2a',
  medium: '#c07800',
  hard:   '#c0392b',
}

function confLabel(c: Confidence): string {
  return c === 'high' ? '●●●' : c === 'medium' ? '●●○' : '●○○'
}

function personalBests(results: StoredResult[]): Partial<Record<DifficultyBin, number>> {
  const bests: Partial<Record<DifficultyBin, number>> = {}
  for (const r of results) {
    if (r.suspect || !r.difficultyBin) continue
    const cur = bests[r.difficultyBin]
    if (cur === undefined || r.wpm > cur) bests[r.difficultyBin] = r.wpm
  }
  return bests
}

// ── Trend chart SVG ────────────────────────────────────────────────────────────

const CW = 520, CH = 160
const PAD = { top: 16, right: 16, bottom: 36, left: 44 }
const IW = CW - PAD.left - PAD.right
const IH = CH - PAD.top - PAD.bottom

function niceStep(range: number): number {
  const raw = range / 5
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const norm = raw / mag
  return (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag
}

function TrendChart({ results }: { results: StoredResult[] }) {
  const chartable = results.slice().reverse()  // chronological order
  if (chartable.length < 2) {
    return (
      <ChartWrap>
        <p style={{ textAlign: 'center', color: '#aaa', margin: '2rem 0', fontSize: '0.85rem' }}>
          Complete at least 2 tests to see a trend chart.
        </p>
      </ChartWrap>
    )
  }

  const wpms = chartable.map(r => r.wpm)
  const yMin = Math.max(0, Math.floor(Math.min(...wpms) / 10) * 10 - 10)
  const yMax = Math.ceil(Math.max(...wpms) / 10) * 10 + 10
  const yRange = yMax - yMin
  const step = niceStep(yRange)
  const ticks: number[] = []
  for (let v = Math.ceil(yMin / step) * step; v <= yMax; v += step) ticks.push(v)

  function xPos(i: number) { return PAD.left + (i / (chartable.length - 1)) * IW }
  function yPos(wpm: number) { return PAD.top + (1 - (wpm - yMin) / yRange) * IH }

  // Group into per-difficulty polyline paths.
  const byDiff: Record<DifficultyBin, Array<{ x: number; y: number }>> = {
    easy: [], medium: [], hard: [],
  }
  chartable.forEach((r, i) => {
    const bin = r.difficultyBin
    if (!bin) return
    byDiff[bin].push({ x: xPos(i), y: yPos(r.wpm) })
  })

  function polyPath(pts: Array<{ x: number; y: number }>) {
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  }

  return (
    <ChartWrap>
      <svg
        viewBox={`0 0 ${CW} ${CH}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {/* Y-axis grid + labels */}
        {ticks.map(v => (
          <g key={v}>
            <line
              x1={PAD.left} y1={yPos(v)} x2={PAD.left + IW} y2={yPos(v)}
              stroke="#eee" strokeWidth="1"
            />
            <text
              x={PAD.left - 6} y={yPos(v)}
              textAnchor="end" dominantBaseline="middle"
              fontSize="11" fill="#999"
            >{v}</text>
          </g>
        ))}

        {/* Axis lines */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + IH} stroke="#ccc" strokeWidth="1" />
        <line x1={PAD.left} y1={PAD.top + IH} x2={PAD.left + IW} y2={PAD.top + IH} stroke="#ccc" strokeWidth="1" />

        {/* Y-axis label */}
        <text
          x={10} y={PAD.top + IH / 2}
          textAnchor="middle" dominantBaseline="middle"
          fontSize="11" fill="#aaa"
          transform={`rotate(-90, 10, ${PAD.top + IH / 2})`}
        >WPM</text>

        {/* Per-difficulty lines */}
        {(['easy', 'medium', 'hard'] as DifficultyBin[]).map(bin => {
          const pts = byDiff[bin]
          if (pts.length < 2) return null
          return (
            <path
              key={bin}
              d={polyPath(pts)}
              fill="none"
              stroke={DIFF_COLOR[bin]}
              strokeWidth="1.5"
              strokeOpacity="0.5"
            />
          )
        })}

        {/* Dots */}
        {chartable.map((r, i) => (
          <circle
            key={r.id}
            cx={xPos(i).toFixed(1)}
            cy={yPos(r.wpm).toFixed(1)}
            r="4"
            fill={r.difficultyBin ? DIFF_COLOR[r.difficultyBin] : '#aaa'}
            opacity="0.85"
          />
        ))}

        {/* Legend */}
        {(['easy', 'medium', 'hard'] as DifficultyBin[]).map((bin, i) => (
          <g key={bin} transform={`translate(${PAD.left + i * 80}, ${CH - 14})`}>
            <circle cx="5" cy="5" r="4" fill={DIFF_COLOR[bin]} />
            <text x="14" y="9" fontSize="11" fill="#666" dominantBaseline="middle" textAnchor="start">
              {bin.charAt(0).toUpperCase() + bin.slice(1)}
            </text>
          </g>
        ))}
      </svg>
    </ChartWrap>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function HistoryScreen() {
  const navigate = useNavigate()
  const storageOk = isStorageAvailable()
  const [results, setResults] = useState<StoredResult[]>(() => loadResults())
  const [confirmClear, setConfirmClear] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const realWpm: RealWpmResult | null = computeRealWpm(results)
  const bests = personalBests(results)

  function handleClear() {
    if (!confirmClear) { setConfirmClear(true); return }
    clearHistory()
    setResults([])
    setConfirmClear(false)
  }

  function handleExport() {
    const blob = new Blob([exportStore()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `sst-history-${date}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      if (!importStore(text)) {
        setImportError('Import failed — file is not a valid history export.')
      } else {
        setImportError(null)
        setResults(loadResults())
      }
    }
    reader.readAsText(file)
    // Reset so the same file can be re-imported if needed.
    e.target.value = ''
  }

  return (
    <div>
      <h1>History</h1>

      {!storageOk && (
        <Banner>Storage is unavailable (private mode?) — results are not being saved.</Banner>
      )}

      {/* ── Real WPM ─────────────────────────────────────────── */}
      <Section>
        <SectionTitle>Your Real WPM</SectionTitle>
        <RealWpmCard>
          {realWpm === null ? (
            <RealWpmEmpty>
              Complete your first test to see your Real WPM estimate.
            </RealWpmEmpty>
          ) : (
            <>
              <RealWpmHeadline>
                <RealWpmValue>{realWpm.realWpm}</RealWpmValue>
                <RealWpmLabel>Real WPM</RealWpmLabel>
              </RealWpmHeadline>
              <TierGrid>
                {([
                  { key: 's', label: 'T1 common',  est: realWpm.s },
                  { key: 'm', label: 'T2 frequent', est: realWpm.m },
                  { key: 'l', label: 'T3 uncommon', est: realWpm.l },
                  { key: 'f', label: 'T4 rare',     est: realWpm.f },
                ] as const).map(({ key, label, est }) => (
                  <TierCell key={key}>
                    <TierSpeed>{est.speed}</TierSpeed>
                    <TierName>{label}</TierName>
                    <TierConf $conf={est.confidence}>{confLabel(est.confidence)}</TierConf>
                  </TierCell>
                ))}
              </TierGrid>
              <p style={{ fontSize: '0.78rem', color: '#999', margin: '0.25rem 0 0' }}>
                Based on {realWpm.contributing} result{realWpm.contributing !== 1 ? 's' : ''}.
                ●●● direct estimate · ●●○ moderate · ●○○ prior
              </p>
              {realWpm.nudge && (
                <Nudge>
                  To improve confidence, take more <strong>{realWpm.nudge}</strong> passages.
                </Nudge>
              )}
            </>
          )}
        </RealWpmCard>
      </Section>

      {/* ── Personal bests ────────────────────────────────────── */}
      <Section>
        <SectionTitle>Personal Bests</SectionTitle>
        <BestGrid>
          {(['easy', 'medium', 'hard'] as DifficultyBin[]).map(bin => (
            <BestCell key={bin}>
              <BestValue $color={DIFF_COLOR[bin]}>
                {bests[bin] !== undefined ? bests[bin] : '—'}
              </BestValue>
              <BestLabel>{bin} WPM</BestLabel>
            </BestCell>
          ))}
        </BestGrid>
      </Section>

      {/* ── Trend chart ───────────────────────────────────────── */}
      <Section>
        <SectionTitle>Trend</SectionTitle>
        <TrendChart results={results} />
      </Section>

      {/* ── History table ─────────────────────────────────────── */}
      <Section>
        <Toolbar>
          <span style={{ fontSize: '0.9rem', color: '#666' }}>
            {results.length} result{results.length !== 1 ? 's' : ''}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button onClick={() => navigate('/')}>New Test</Button>
            {results.length > 0 && (
              <Button onClick={handleExport}>Export</Button>
            )}
            <Button onClick={() => fileInputRef.current?.click()}>Import</Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={handleImportFile}
            />
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

        {importError && (
          <Banner style={{ marginBottom: '0.75rem' }}>{importError}</Banner>
        )}

        {results.length === 0 ? (
          <Empty>No results yet. <a href="#/">Take a test to get started.</a></Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Passage</Th>
                <Th>Difficulty</Th>
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
                  <Td>
                    {r.difficultyBin ? (
                      <span style={{ color: DIFF_COLOR[r.difficultyBin], fontWeight: 500 }}>
                        {r.difficultyBin}
                      </span>
                    ) : '—'}
                  </Td>
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
            * Possible paste detected — excluded from Real WPM and personal bests.
          </p>
        )}
      </Section>
    </div>
  )
}
