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

// ── Tokens ────────────────────────────────────────────────────────────────────

const DIFF_COLOR: Record<DifficultyBin, string> = {
  easy:   'var(--diff-easy-text)',
  medium: 'var(--diff-med-text)',
  hard:   'var(--diff-hard-text)',
}
const DIFF_BG: Record<DifficultyBin, string> = {
  easy:   'var(--diff-easy-bg)',
  medium: 'var(--diff-med-bg)',
  hard:   'var(--diff-hard-bg)',
}

// ── Buttons ───────────────────────────────────────────────────────────────────

const PrimaryButton = styled.button`
  padding: 0.55rem 1.4rem;
  font-size: 0.9rem;
  font-weight: 600;
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  background: var(--purple-600);
  color: #fff;
  transition: background 0.15s, box-shadow 0.15s;

  &:hover {
    background: var(--purple-700);
    box-shadow: 0 0 0 3px var(--purple-100);
  }
`

const OutlineButton = styled.button`
  padding: 0.5rem 1.1rem;
  font-size: 0.9rem;
  font-weight: 600;
  border: 2px solid var(--neutral-200);
  border-radius: 6px;
  cursor: pointer;
  background: #fff;
  color: var(--neutral-700);
  transition: border-color 0.15s, box-shadow 0.15s;

  &:hover {
    border-color: var(--purple-600);
    color: var(--purple-600);
    box-shadow: 0 0 0 3px var(--purple-100);
  }
`

const DangerButton = styled(OutlineButton)`
  color: #991b1b;
  border-color: #fca5a5;

  &:hover {
    border-color: #991b1b;
    color: #991b1b;
    box-shadow: 0 0 0 3px #fee2e2;
  }
`

// ── Layout ────────────────────────────────────────────────────────────────────

const StorageBanner = styled.div`
  font-size: 0.85rem;
  color: #92400e;
  background: #fef9c3;
  border: 1px solid #fde68a;
  border-radius: 6px;
  padding: var(--space-1) var(--space-2);
  margin-bottom: var(--space-3);
`

const ErrorBanner = styled(StorageBanner)`
  color: #991b1b;
  background: #fee2e2;
  border-color: #fca5a5;
`

const SectionTitle = styled.h2`
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--neutral-600);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 var(--space-2);
`

// ── Empty state ───────────────────────────────────────────────────────────────

const EmptyState = styled.div`
  background: #fff;
  border: 1px solid var(--neutral-200);
  border-radius: 8px;
  padding: var(--space-5) var(--space-4);
  text-align: center;
  margin-bottom: var(--space-3);
`

const EmptyIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--purple-100);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  margin: 0 auto var(--space-2);
`

const EmptyTitle = styled.p`
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--neutral-900);
  margin-bottom: var(--space-1);
`

const EmptyDesc = styled.p`
  font-size: 0.9rem;
  color: var(--neutral-600);
  margin-bottom: var(--space-3);
  max-width: 360px;
  margin-left: auto;
  margin-right: auto;
`

const EmptyActions = styled.div`
  display: flex;
  gap: var(--space-2);
  justify-content: center;
`

// ── Stats grid (two-column) ───────────────────────────────────────────────────

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 55fr 45fr;
  gap: var(--space-3);
  margin-bottom: var(--space-3);

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`

// ── Real WPM ─────────────────────────────────────────────────────────────────

const RealWpmCard = styled.div`
  background: #fff;
  border: 1px solid var(--neutral-200);
  border-radius: 8px;
  padding: var(--space-3);
  height: 100%;
`

const RealWpmHeadline = styled.div`
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
  margin-bottom: var(--space-2);
`

const RealWpmValue = styled.span`
  font-size: 2.8rem;
  font-weight: 700;
  line-height: 1;
  color: var(--purple-900);
`

const RealWpmUnit = styled.span`
  font-size: 0.85rem;
  color: var(--neutral-600);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const TierGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-1);
  margin-bottom: var(--space-2);
`

const TierCell = styled.div`
  text-align: center;
  background: var(--neutral-50);
  border-radius: 6px;
  padding: 0.5rem 0.25rem;
`

const TierSpeed = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--neutral-900);
`

const TierName = styled.div`
  font-size: 0.65rem;
  color: var(--neutral-600);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 0.15rem;
`

const TierConf = styled.div<{ $conf: Confidence }>`
  font-size: 0.6rem;
  color: ${p =>
    p.$conf === 'high'   ? 'var(--diff-easy-text)'  :
    p.$conf === 'medium' ? 'var(--diff-med-text)'   :
    '#bbb'};
  margin-top: 0.2rem;
`

const NudgeLine = styled.p`
  font-size: 0.8rem;
  color: var(--neutral-700);
  background: var(--purple-50);
  border-radius: 4px;
  padding: 0.35rem 0.6rem;
  margin: 0;
`

const ConfLegend = styled.p`
  font-size: 0.72rem;
  color: var(--neutral-600);
  margin: var(--space-1) 0 0;
`

const RealWpmEmpty = styled.p`
  color: var(--neutral-600);
  font-size: 0.9rem;
  margin: 0;
`

// ── Personal bests ────────────────────────────────────────────────────────────

const BestCard = styled.div`
  background: #fff;
  border: 1px solid var(--neutral-200);
  border-radius: 8px;
  padding: var(--space-3);
  height: 100%;
`

const BestGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`

const BestRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const BestDiffLabel = styled.span<{ $diff: DifficultyBin }>`
  background: ${p => DIFF_BG[p.$diff]};
  color: ${p => DIFF_COLOR[p.$diff]};
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  text-transform: capitalize;
`

const BestValue = styled.span`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--neutral-900);
`

const BestUnit = styled.span`
  font-size: 0.75rem;
  color: var(--neutral-600);
  margin-left: 0.25rem;
`

// ── Trend chart ────────────────────────────────────────────────────────────────

const ChartSection = styled.div`
  margin-bottom: var(--space-3);
`

const ChartWrap = styled.div`
  background: #fff;
  border: 1px solid var(--neutral-200);
  border-radius: 8px;
  padding: var(--space-2);
  overflow: hidden;
`

// ── History table ─────────────────────────────────────────────────────────────

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
  flex-wrap: wrap;
  gap: var(--space-1);
`

const ToolbarCount = styled.span`
  font-size: 0.85rem;
  color: var(--neutral-600);
`

const ToolbarActions = styled.div`
  display: flex;
  gap: var(--space-1);
  flex-wrap: wrap;
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--neutral-200);
`

const Th = styled.th`
  text-align: left;
  padding: 0.6rem var(--space-2);
  background: var(--neutral-50);
  border-bottom: 1px solid var(--neutral-200);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--neutral-600);
  white-space: nowrap;
`

const Td = styled.td<{ $dim?: boolean }>`
  padding: 0.55rem var(--space-2);
  border-bottom: 1px solid #f3f4f6;
  color: ${p => p.$dim ? 'var(--neutral-600)' : 'var(--neutral-900)'};
`

const DiffBadgeSmall = styled.span<{ $diff: DifficultyBin }>`
  background: ${p => DIFF_BG[p.$diff]};
  color: ${p => DIFF_COLOR[p.$diff]};
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 20px;
  text-transform: capitalize;
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

function confLabel(c: Confidence): string {
  return c === 'high' ? '●●●' : c === 'medium' ? '●●○' : '●○○'
}

function personalBests(results: StoredResult[]): Partial<Record<DifficultyBin, number>> {
  const bests: Partial<Record<DifficultyBin, number>> = {}
  for (const r of results) {
    if (!r.difficultyBin) continue
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
  const chartable = results.slice().reverse()
  if (chartable.length < 2) {
    return (
      <ChartWrap>
        <p style={{ textAlign: 'center', color: 'var(--neutral-600)', margin: '2rem 0', fontSize: '0.875rem' }}>
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

  const byDiff: Record<DifficultyBin, Array<{ x: number; y: number }>> = {
    easy: [], medium: [], hard: [],
  }
  const DIFF_SVG_COLOR: Record<DifficultyBin, string> = {
    easy: '#166534', medium: '#854d0e', hard: '#991b1b',
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
      <svg viewBox={`0 0 ${CW} ${CH}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {ticks.map(v => (
          <g key={v}>
            <line x1={PAD.left} y1={yPos(v)} x2={PAD.left + IW} y2={yPos(v)}
              stroke="#f3f4f6" strokeWidth="1" />
            <text x={PAD.left - 6} y={yPos(v)} textAnchor="end" dominantBaseline="middle"
              fontSize="11" fill="#9ca3af">{v}</text>
          </g>
        ))}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + IH} stroke="#e5e7eb" strokeWidth="1" />
        <line x1={PAD.left} y1={PAD.top + IH} x2={PAD.left + IW} y2={PAD.top + IH} stroke="#e5e7eb" strokeWidth="1" />
        <text x={10} y={PAD.top + IH / 2} textAnchor="middle" dominantBaseline="middle"
          fontSize="11" fill="#9ca3af" transform={`rotate(-90, 10, ${PAD.top + IH / 2})`}>WPM</text>

        {(['easy', 'medium', 'hard'] as DifficultyBin[]).map(bin => {
          const pts = byDiff[bin]
          if (pts.length < 2) return null
          return (
            <path key={bin} d={polyPath(pts)} fill="none"
              stroke={DIFF_SVG_COLOR[bin]} strokeWidth="1.5" strokeOpacity="0.5" />
          )
        })}

        {chartable.map((r, i) => (
          <circle key={r.id} cx={xPos(i).toFixed(1)} cy={yPos(r.wpm).toFixed(1)} r="4"
            fill={r.difficultyBin ? DIFF_SVG_COLOR[r.difficultyBin] : '#9ca3af'} opacity="0.85" />
        ))}

        {(['easy', 'medium', 'hard'] as DifficultyBin[]).map((bin, i) => (
          <g key={bin} transform={`translate(${PAD.left + i * 80}, ${CH - 14})`}>
            <circle cx="5" cy="5" r="4" fill={DIFF_SVG_COLOR[bin]} />
            <text x="14" y="9" fontSize="11" fill="#6b7280" dominantBaseline="middle" textAnchor="start">
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
  const hasResults = results.length > 0

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
    a.href = url
    a.download = `sst-history-${new Date().toISOString().slice(0, 10)}.json`
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
    e.target.value = ''
  }

  return (
    <div>
      <h1 style={{
        fontSize: '1.6rem',
        fontWeight: 700,
        color: 'var(--neutral-900)',
        borderLeft: '4px solid var(--purple-600)',
        paddingLeft: 'var(--space-2)',
        marginBottom: 'var(--space-3)',
      }}>History</h1>

      {!storageOk && (
        <StorageBanner>Storage is unavailable (private mode?) — results are not being saved.</StorageBanner>
      )}
      {importError && (
        <ErrorBanner>{importError}</ErrorBanner>
      )}

      {!hasResults ? (
        /* ── Empty state ─────────────────────────────────────── */
        <>
          <EmptyState>
            <EmptyIcon>🎙</EmptyIcon>
            <EmptyTitle>No tests recorded yet</EmptyTitle>
            <EmptyDesc>
              Complete a Speed Test to see your Real WPM, personal bests, and trend chart.
            </EmptyDesc>
            <EmptyActions>
              <PrimaryButton onClick={() => navigate('/')}>Start a test</PrimaryButton>
              <OutlineButton onClick={() => fileInputRef.current?.click()}>Import history</OutlineButton>
            </EmptyActions>
          </EmptyState>
          <input ref={fileInputRef} type="file" accept=".json,application/json"
            style={{ display: 'none' }} onChange={handleImportFile} />
        </>
      ) : (
        /* ── Stats + table ───────────────────────────────────── */
        <>
          {/* Two-column stats */}
          <StatsGrid>
            {/* Left: Real WPM */}
            <div>
              <SectionTitle>Your Real WPM</SectionTitle>
              <RealWpmCard>
                {realWpm === null ? (
                  <RealWpmEmpty>Take a test with composition data to see your Real WPM.</RealWpmEmpty>
                ) : (
                  <>
                    <RealWpmHeadline>
                      <RealWpmValue>{realWpm.realWpm}</RealWpmValue>
                      <RealWpmUnit>Real WPM</RealWpmUnit>
                    </RealWpmHeadline>
                    <TierGrid>
                      {([
                        { key: 's', label: 'T1',  est: realWpm.s },
                        { key: 'm', label: 'T2',  est: realWpm.m },
                        { key: 'l', label: 'T3',  est: realWpm.l },
                        { key: 'f', label: 'T4',  est: realWpm.f },
                      ] as const).map(({ key, label, est }) => (
                        <TierCell key={key}>
                          <TierSpeed>{est.speed}</TierSpeed>
                          <TierName>{label}</TierName>
                          <TierConf $conf={est.confidence}>{confLabel(est.confidence)}</TierConf>
                        </TierCell>
                      ))}
                    </TierGrid>
                    <ConfLegend>
                      Based on {realWpm.contributing} result{realWpm.contributing !== 1 ? 's' : ''}.{' '}
                      ●●● direct · ●●○ moderate · ●○○ prior
                    </ConfLegend>
                    {realWpm.nudge && (
                      <NudgeLine style={{ marginTop: 'var(--space-1)' }}>
                        Take more <strong>{realWpm.nudge}</strong> passages to improve confidence.
                      </NudgeLine>
                    )}
                  </>
                )}
              </RealWpmCard>
            </div>

            {/* Right: Personal Bests */}
            <div>
              <SectionTitle>Personal Bests</SectionTitle>
              <BestCard>
                <BestGrid>
                  {(['easy', 'medium', 'hard'] as DifficultyBin[]).map(bin => (
                    <BestRow key={bin}>
                      <BestDiffLabel $diff={bin}>{bin}</BestDiffLabel>
                      <div>
                        {bests[bin] !== undefined ? (
                          <>
                            <BestValue>{bests[bin]}</BestValue>
                            <BestUnit>WPM</BestUnit>
                          </>
                        ) : (
                          <span style={{ color: 'var(--neutral-600)', fontSize: '0.9rem' }}>—</span>
                        )}
                      </div>
                    </BestRow>
                  ))}
                </BestGrid>
              </BestCard>
            </div>
          </StatsGrid>

          {/* Trend chart */}
          <ChartSection>
            <SectionTitle>Trend</SectionTitle>
            <TrendChart results={results} />
          </ChartSection>

          {/* History table */}
          <div>
            <Toolbar>
              <ToolbarCount>{results.length} result{results.length !== 1 ? 's' : ''}</ToolbarCount>
              <ToolbarActions>
                <OutlineButton onClick={() => navigate('/')}>New Test</OutlineButton>
                <OutlineButton onClick={handleExport}>Export</OutlineButton>
                <OutlineButton onClick={() => fileInputRef.current?.click()}>Import</OutlineButton>
                <input ref={fileInputRef} type="file" accept=".json,application/json"
                  style={{ display: 'none' }} onChange={handleImportFile} />
                {!confirmClear ? (
                  <DangerButton onClick={handleClear}>Clear history</DangerButton>
                ) : (
                  <>
                    <DangerButton onClick={handleClear}>Confirm clear</DangerButton>
                    <OutlineButton onClick={() => setConfirmClear(false)}>Cancel</OutlineButton>
                  </>
                )}
              </ToolbarActions>
            </Toolbar>

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
                      {r.difficultyBin
                        ? <DiffBadgeSmall $diff={r.difficultyBin}>{r.difficultyBin}</DiffBadgeSmall>
                        : '—'}
                    </Td>
                    <Td>{r.mode}</Td>
                    <Td>{r.wpm}</Td>
                    <Td>{r.cpm}</Td>
                    <Td $dim>{formatElapsed(r.elapsedSec)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
