import { useRef } from 'react'
import styled from 'styled-components'
import { type Confidence, type RealWpmResult } from '../../corpus/realwpm'
import type { DifficultyBin } from '../../corpus/tiers'
import type { StoredResult } from '../../storage/history'

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
  background: var(--accent-fill);
  color: var(--text-on-accent);
  transition: background 0.15s, box-shadow 0.15s;

  &:hover {
    background: var(--accent-fill-hover);
    box-shadow: 0 0 0 3px var(--accent-muted);
  }
`

const OutlineButton = styled.button`
  padding: 0.5rem 1.1rem;
  font-size: 0.9rem;
  font-weight: 600;
  border: 2px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  background: var(--surface-raised);
  color: var(--text-primary);
  transition: border-color 0.15s, color 0.15s, box-shadow 0.15s;

  &:hover {
    border-color: var(--accent);
    color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-muted);
  }
`

const DangerButton = styled.button`
  padding: 0.5rem 1.1rem;
  font-size: 0.9rem;
  font-weight: 600;
  border: 2px solid var(--diff-hard-bg);
  border-radius: 6px;
  cursor: pointer;
  background: var(--surface-raised);
  color: var(--diff-hard-text);
  transition: border-color 0.15s, box-shadow 0.15s;

  &:hover {
    border-color: var(--diff-hard-text);
    box-shadow: 0 0 0 3px var(--diff-hard-bg);
  }
`

// ── Layout ────────────────────────────────────────────────────────────────────

const StorageBanner = styled.div`
  font-size: 0.85rem;
  color: var(--diff-med-text);
  background: var(--diff-med-bg);
  border: 1px solid var(--diff-med-text);
  border-radius: 6px;
  padding: var(--space-1) var(--space-2);
  margin-bottom: var(--space-3);
`

const ErrorBanner = styled.div`
  font-size: 0.85rem;
  color: var(--diff-hard-text);
  background: var(--diff-hard-bg);
  border: 1px solid var(--diff-hard-text);
  border-radius: 6px;
  padding: var(--space-1) var(--space-2);
  margin-bottom: var(--space-3);
`

const SectionTitle = styled.h2`
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 var(--space-2);
`

// ── Empty state ───────────────────────────────────────────────────────────────

const EmptyState = styled.div`
  background: var(--surface-raised);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: var(--space-5) var(--space-4);
  text-align: center;
  margin-bottom: var(--space-3);
`

const EmptyIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--accent-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  margin: 0 auto var(--space-2);
`

const EmptyTitle = styled.p`
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-1);
`

const EmptyDesc = styled.p`
  font-size: 0.9rem;
  color: var(--text-secondary);
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
  margin-bottom: var(--space-2);

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`

// ── Real WPM ─────────────────────────────────────────────────────────────────

const RealWpmHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
`

const ExplainToggleRow = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: var(--text-secondary);
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  user-select: none;
`

const SwitchTrack = styled.span<{ $on: boolean }>`
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
  border-radius: 10px;
  background: ${p => p.$on ? 'var(--accent-fill)' : 'var(--border)'};
  transition: background 0.2s;
  flex-shrink: 0;
`

const SwitchThumb = styled.span<{ $on: boolean }>`
  position: absolute;
  top: 3px;
  left: ${p => p.$on ? '19px' : '3px'};
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.25);
  transition: left 0.2s;
`

const ExplainSection = styled.div`
  margin-bottom: var(--space-3);
  font-size: 0.8rem;
`

const ExplainBody = styled.div`
  margin-top: var(--space-2);
  padding: var(--space-2);
  background: var(--surface-subtle);
  border-radius: 6px;
  color: var(--text-secondary);
  line-height: 1.6;

  p { margin: 0 0 var(--space-1); }
  p:last-child { margin-bottom: 0; }
`

const ExplainFormula = styled.p`
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 0.78rem;
  background: var(--surface-raised);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0.4rem 0.6rem;
  color: var(--text-primary);
  overflow-x: auto;
  white-space: nowrap;
`

const ExplainTierRow = styled.div`
  display: grid;
  grid-template-columns: 3rem 1fr auto;
  gap: 0.4rem;
  align-items: baseline;
  margin-bottom: 0.2rem;
  font-size: 0.78rem;
`

const TierLabel = styled.span`
  font-weight: 700;
  color: var(--text-primary);
`

const ExplainNote = styled.p`
  font-size: 0.75rem;
  font-style: italic;
  color: var(--diff-med-text);
  background: var(--diff-med-bg);
  border-radius: 4px;
  padding: 0.3rem 0.6rem;
  margin-bottom: var(--space-1);
`

const EXAMPLE = { s: 130, m: 100, l: 72, f: 52, headline: 112.0 }

const RealWpmCard = styled.div`
  background: var(--surface-raised);
  border: 1px solid var(--border);
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
  color: var(--accent);
`

const RealWpmUnit = styled.span`
  font-size: 0.85rem;
  color: var(--text-secondary);
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
  background: var(--surface-subtle);
  border-radius: 6px;
  padding: 0.5rem 0.25rem;
`

const TierSpeed = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
`

const TierName = styled.div`
  font-size: 0.65rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 0.15rem;
`

const TierConf = styled.div<{ $conf: Confidence }>`
  font-size: 0.6rem;
  color: ${p =>
    p.$conf === 'high'   ? 'var(--diff-easy-text)'  :
    p.$conf === 'medium' ? 'var(--diff-med-text)'   :
    'var(--text-secondary)'};
  margin-top: 0.2rem;
`

const NudgeLine = styled.p`
  font-size: 0.8rem;
  color: var(--text-primary);
  background: var(--accent-subtle);
  border-radius: 4px;
  padding: 0.35rem 0.6rem;
  margin: 0;
`

const ConfLegend = styled.p`
  font-size: 0.72rem;
  color: var(--text-secondary);
  margin: var(--space-1) 0 0;
`

const RealWpmEmpty = styled.p`
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0;
`

// ── Personal bests ────────────────────────────────────────────────────────────

const BestCard = styled.div`
  background: var(--surface-raised);
  border: 1px solid var(--border);
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
  color: var(--text-primary);
`

const BestUnit = styled.span`
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-left: 0.25rem;
`

// ── Trend chart ────────────────────────────────────────────────────────────────

const ChartSection = styled.div`
  margin-bottom: var(--space-3);
`

const ChartWrap = styled.div`
  background: var(--surface-raised);
  border: 1px solid var(--border);
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
  color: var(--text-secondary);
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
  background: var(--surface-raised);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border);
`

const Th = styled.th`
  text-align: left;
  padding: 0.6rem var(--space-2);
  background: var(--surface-subtle);
  border-bottom: 1px solid var(--border);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  white-space: nowrap;
`

const Td = styled.td<{ $dim?: boolean }>`
  padding: 0.55rem var(--space-2);
  border-bottom: 1px solid var(--border);
  color: ${p => p.$dim ? 'var(--text-secondary)' : 'var(--text-primary)'};
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
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', margin: '2rem 0', fontSize: '0.875rem' }}>
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
    easy:   'var(--diff-easy-text)',
    medium: 'var(--diff-med-text)',
    hard:   'var(--diff-hard-text)',
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
              stroke="var(--chart-grid)" strokeWidth="1" />
            <text x={PAD.left - 6} y={yPos(v)} textAnchor="end" dominantBaseline="middle"
              fontSize="11" fill="var(--chart-axis)">{v}</text>
          </g>
        ))}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + IH} stroke="var(--chart-grid)" strokeWidth="1" />
        <line x1={PAD.left} y1={PAD.top + IH} x2={PAD.left + IW} y2={PAD.top + IH} stroke="var(--chart-grid)" strokeWidth="1" />
        <text x={10} y={PAD.top + IH / 2} textAnchor="middle" dominantBaseline="middle"
          fontSize="11" fill="var(--chart-axis)" transform={`rotate(-90, 10, ${PAD.top + IH / 2})`}>WPM</text>

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
            fill={r.difficultyBin ? DIFF_SVG_COLOR[r.difficultyBin] : 'var(--chart-axis)'} opacity="0.85" />
        ))}

        {(['easy', 'medium', 'hard'] as DifficultyBin[]).map((bin, i) => (
          <g key={bin} transform={`translate(${PAD.left + i * 80}, ${CH - 14})`}>
            <circle cx="5" cy="5" r="4" fill={DIFF_SVG_COLOR[bin]} />
            <text x="14" y="9" fontSize="11" fill="var(--chart-axis)" dominantBaseline="middle" textAnchor="start">
              {bin.charAt(0).toUpperCase() + bin.slice(1)}
            </text>
          </g>
        ))}
      </svg>
    </ChartWrap>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface HistoryScreenViewProps {
  storageOk: boolean
  results: StoredResult[]
  realWpm: RealWpmResult | null
  bests: Partial<Record<DifficultyBin, number>>
  confirmClear: boolean
  importError: string | null
  explainerOpen: boolean
  onToggleExplainer: () => void
  onClear: () => void
  onCancelClear: () => void
  onExport: () => void
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void
  onNavigateTest: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function HistoryScreenView({
  storageOk,
  results,
  realWpm,
  bests,
  confirmClear,
  importError,
  explainerOpen,
  onToggleExplainer,
  onClear,
  onCancelClear,
  onExport,
  onImportFile,
  onNavigateTest,
}: HistoryScreenViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hasResults = results.length > 0

  return (
    <div>
      <h1 style={{
        fontSize: '1.6rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        borderLeft: '4px solid var(--accent)',
        paddingLeft: 'var(--space-2)',
        marginBottom: 'var(--space-3)',
      }}>History</h1>

      {!storageOk && (
        <StorageBanner>Storage is unavailable (private mode?) — results are not being saved.</StorageBanner>
      )}
      {importError && (
        <ErrorBanner>{importError}</ErrorBanner>
      )}

      <input ref={fileInputRef} type="file" accept=".json,application/json"
        style={{ display: 'none' }} onChange={onImportFile} />

      {!hasResults ? (
        <EmptyState>
          <EmptyIcon>🎙</EmptyIcon>
          <EmptyTitle>No tests recorded yet</EmptyTitle>
          <EmptyDesc>
            Complete a Speed Test to see your Real WPM, personal bests, and trend chart.
          </EmptyDesc>
          <EmptyActions>
            <PrimaryButton onClick={onNavigateTest}>Start a test</PrimaryButton>
            <OutlineButton onClick={() => fileInputRef.current?.click()}>Import history</OutlineButton>
          </EmptyActions>
        </EmptyState>
      ) : (
        <>
          <StatsGrid>
            <div>
              <RealWpmHeader>
                <SectionTitle style={{ margin: 0 }}>Your Real WPM</SectionTitle>
                <ExplainToggleRow onClick={onToggleExplainer}>
                  Explain
                  <SwitchTrack $on={explainerOpen}>
                    <SwitchThumb $on={explainerOpen} />
                  </SwitchTrack>
                </ExplainToggleRow>
              </RealWpmHeader>
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
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>—</span>
                        )}
                      </div>
                    </BestRow>
                  ))}
                </BestGrid>
              </BestCard>
            </div>
          </StatsGrid>

          {explainerOpen && (
            <ExplainSection>
              <ExplainBody>
                {realWpm === null && (
                  <ExplainNote>
                    Example numbers shown below — they will be replaced with your actual speeds
                    once you have completed enough tests with composition data.
                  </ExplainNote>
                )}
                <p>
                  Each word in a passage belongs to one of four frequency tiers based on the
                  Google top-10,000 English words list. You speak faster on familiar words,
                  so each tier gets its own speed estimate:
                </p>
                <div style={{ margin: 'var(--space-1) 0' }}>
                  <ExplainTierRow>
                    <TierLabel>T1</TierLabel>
                    <span>top-100 words ("the", "is", "and"…)</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{realWpm?.s.speed ?? EXAMPLE.s} WPM</span>
                  </ExplainTierRow>
                  <ExplainTierRow>
                    <TierLabel>T2</TierLabel>
                    <span>ranks 101–1,000 ("city", "answer"…)</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{realWpm?.m.speed ?? EXAMPLE.m} WPM</span>
                  </ExplainTierRow>
                  <ExplainTierRow>
                    <TierLabel>T3</TierLabel>
                    <span>ranks 1,001–9,894 (less common)</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{realWpm?.l.speed ?? EXAMPLE.l} WPM</span>
                  </ExplainTierRow>
                  <ExplainTierRow>
                    <TierLabel>T4</TierLabel>
                    <span>not in top 10,000 (rare / technical)</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{realWpm?.f.speed ?? EXAMPLE.f} WPM</span>
                  </ExplainTierRow>
                </div>
                {realWpm !== null ? (
                  <p>
                    T1 speed is estimated from your {realWpm.contributing} test
                    result{realWpm.contributing !== 1 ? 's' : ''} using their word-frequency
                    compositions. T2–T4 are derived from fixed ratios (×1.3, ×1.8, ×2.5 slower).
                  </p>
                ) : (
                  <p>
                    T1 speed is estimated from your test results using their word-frequency
                    compositions. T2–T4 are derived from fixed ratios (×1.3, ×1.8, ×2.5 slower).
                  </p>
                )}
                <p>The headline is a weighted average matching typical passage composition:</p>
                <ExplainFormula>
                  0.50 × {realWpm?.s.speed ?? EXAMPLE.s} + 0.40 × {realWpm?.m.speed ?? EXAMPLE.m} + 0.09 × {realWpm?.l.speed ?? EXAMPLE.l} + 0.01 × {realWpm?.f.speed ?? EXAMPLE.f} = {realWpm?.realWpm ?? EXAMPLE.headline}
                </ExplainFormula>
              </ExplainBody>
            </ExplainSection>
          )}

          <ChartSection>
            <SectionTitle>Trend</SectionTitle>
            <TrendChart results={results} />
          </ChartSection>

          <div>
            <Toolbar>
              <ToolbarCount>{results.length} result{results.length !== 1 ? 's' : ''}</ToolbarCount>
              <ToolbarActions>
                <OutlineButton onClick={onNavigateTest}>New Test</OutlineButton>
                <OutlineButton onClick={onExport}>Export</OutlineButton>
                <OutlineButton onClick={() => fileInputRef.current?.click()}>Import</OutlineButton>
                {!confirmClear ? (
                  <DangerButton onClick={onClear}>Clear history</DangerButton>
                ) : (
                  <>
                    <DangerButton onClick={onClear}>Confirm clear</DangerButton>
                    <OutlineButton onClick={onCancelClear}>Cancel</OutlineButton>
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
