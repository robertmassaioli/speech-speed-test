import katex from 'katex'
import 'katex/dist/katex.min.css'
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


const ExplainNote = styled.p`
  font-size: 0.75rem;
  font-style: italic;
  color: var(--diff-med-text);
  background: var(--diff-med-bg);
  border-radius: 4px;
  padding: 0.3rem 0.6rem;
  margin-bottom: var(--space-2);
`

const StepList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`

const StepCard = styled.div`
  display: flex;
  gap: var(--space-2);
  background: var(--surface-raised);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: var(--space-2);
`

const StepNumber = styled.div`
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--accent-fill);
  color: var(--text-on-accent);
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.1rem;
`

const StepContent = styled.div`
  flex: 1;
  font-size: 0.8rem;
  line-height: 1.6;
  color: var(--text-secondary);

  p { margin: 0 0 var(--space-1); }
  p:last-child { margin-bottom: 0; }
`

const StepHighlight = styled.strong`
  color: var(--text-primary);
  font-weight: 700;
`

function headlineLatex(v1: number, v2: number, v3: number, v4: number, headline: number): string {
  return [
    '\\begin{aligned}',
    '\\text{Spoken WPM} &= \\frac{1}{\\dfrac{0.50}{T_1} + \\dfrac{0.40}{T_2} + \\dfrac{0.09}{T_3} + \\dfrac{0.01}{T_4}} \\\\[8pt]',
    `&= \\frac{1}{\\dfrac{0.50}{${v1}} + \\dfrac{0.40}{${v2}} + \\dfrac{0.09}{${v3}} + \\dfrac{0.01}{${v4}}} \\\\[4pt]`,
    `&\\approx ${headline}`,
    '\\end{aligned}',
  ].join('\n')
}

const KatexWrap = styled.div`
  overflow-x: auto;
  .katex-display { text-align: left; margin: 0.4em 0; }
  .katex-html { width: fit-content; }
`

function KatexDisplay({ tex }: { tex: string }) {
  const html = katex.renderToString(tex, {
    throwOnError: false,
    displayMode: true,
    output: 'htmlAndMathml',
  })
  return <KatexWrap dangerouslySetInnerHTML={{ __html: html }} />
}

const EXAMPLE = { s: 130, m: 100, l: 72, f: 52, headline: 107.7 }

const RealWpmCard = styled.div`
  background: var(--surface-raised);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: var(--space-3);
  flex: 1;
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
  flex: 1;
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

const InfoIcon = styled.span`
  cursor: help;
  color: var(--text-secondary);
  font-size: 0.75em;
  margin-left: 0.25em;
  vertical-align: super;
  line-height: 1;
  user-select: none;
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
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <RealWpmHeader>
                <SectionTitle style={{ margin: 0 }}>
                  Your Spoken WPM
                  <InfoIcon title="Spoken WPM: actual dictionary words per minute. This personalised estimate uses a weighted harmonic mean across difficulty tiers.">ⓘ</InfoIcon>
                </SectionTitle>
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
                      <RealWpmUnit>Spoken WPM</RealWpmUnit>
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

            <div style={{ display: 'flex', flexDirection: 'column' }}>
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
                            <BestUnit>
                              WPM<InfoIcon title="Traditional WPM: 1 word = 5 characters. Comparable to Monkeytype and TypeRacer.">ⓘ</InfoIcon>
                            </BestUnit>
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

          {explainerOpen && (() => {
            const v1 = realWpm?.s.speed ?? EXAMPLE.s
            const v2 = realWpm?.m.speed ?? EXAMPLE.m
            const v3 = realWpm?.l.speed ?? EXAMPLE.l
            const v4 = realWpm?.f.speed ?? EXAMPLE.f
            const headline = realWpm?.realWpm ?? EXAMPLE.headline
            const latest = results.find(r => r.composition != null && r.difficultyBin != null)
            const pct = (p: number) => Math.round(p * 100)
            return (
              <ExplainSection>
                <ExplainBody>
                  {realWpm === null && (
                    <ExplainNote>
                      Example numbers shown below — complete more tests to see your actual speeds.
                    </ExplainNote>
                  )}
                  <p style={{ margin: '0 0 var(--space-2)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                    Words are ranked by frequency in the Google top-10,000 list and split into four tiers:{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>T1</strong> (top 100: "the", "and", "is"),{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>T2</strong> (101–1,000: "city", "water"),{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>T3</strong> (1,001–9,894: less common),{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>T4</strong> (not in the list: rare or technical).
                  </p>
                  <StepList>
                    <StepCard>
                      <StepNumber>1</StepNumber>
                      <StepContent>
                        {latest ? (
                          <>
                            <p>
                              Every passage has a pre-counted word composition. Your most
                              recent <strong style={{ color: 'var(--text-primary)' }}>{latest.difficultyBin}</strong> test
                              ran at <StepHighlight>{latest.spokenWpm ?? Math.round(latest.words / latest.elapsedSec * 60)} Spoken WPM</StepHighlight> on a passage
                              that was{' '}
                              {pct(latest.composition![0])}% T1,{' '}
                              {pct(latest.composition![1])}% T2,{' '}
                              {pct(latest.composition![2])}% T3,{' '}
                              {pct(latest.composition![3])}% T4.
                              The app uses that known mix and your overall speed to work
                              backwards: it finds the T1 speed that — combined with fixed
                              ratios for T2–T4 (1.3×, 1.8×, 2.5× slower) — would produce
                              exactly your recorded WPM on that passage.
                            </p>
                            <p>
                              Each of your{' '}
                              <StepHighlight>{realWpm!.contributing} test result{realWpm!.contributing !== 1 ? 's' : ''}</StepHighlight>{' '}
                              with composition data produces its own T1 estimate this way.
                              The T1 speed you see is the median of all of them, which
                              smooths out unusually fast or slow runs. T2, T3, and T4 are
                              then derived from that median using the same fixed ratios.
                            </p>
                          </>
                        ) : (
                          <>
                            <p>
                              Every passage has a pre-counted word composition — for example,
                              50% T1, 40% T2, 9% T3, 1% T4. The app uses that known mix and
                              your overall WPM to work backwards: it finds the T1 speed that
                              — combined with fixed ratios for T2–T4 (1.3×, 1.8×, 2.5×
                              slower) — would produce exactly your recorded WPM on that
                              passage.
                            </p>
                            <p>
                              Each test result with composition data produces its own T1
                              estimate this way. The T1 speed you see is the median of all
                              of them. T2, T3, and T4 are then derived from that median
                              using the same fixed ratios.
                            </p>
                          </>
                        )}
                      </StepContent>
                    </StepCard>

                    <StepCard>
                      <StepNumber>2</StepNumber>
                      <StepContent>
                        <p>
                          You dictate the 100 most common English words at about{' '}
                          <StepHighlight>{v1} WPM</StepHighlight>. These words — "the", "of",
                          "and", "is" — make up roughly half of everything you ever dictate.
                        </p>
                      </StepContent>
                    </StepCard>

                    <StepCard>
                      <StepNumber>3</StepNumber>
                      <StepContent>
                        <p>
                          Words outside the top 10,000 (T4) come in at{' '}
                          <StepHighlight>{v4} WPM</StepHighlight> — 2.5× slower. That ratio
                          is borrowed from speech research on syllable frequency, and the app
                          holds it fixed rather than trying to measure it directly (there
                          aren't enough rare words in any single passage to estimate it
                          reliably).
                        </p>
                      </StepContent>
                    </StepCard>

                    <StepCard>
                      <StepNumber>4</StepNumber>
                      <StepContent>
                        <p>
                          A typical passage is 50% T1, 40% T2, 9% T3, 1% T4. Your headline
                          is the speed you would achieve on exactly that mix. Because faster
                          tiers save less time than slower tiers cost —{' '}
                          <StepHighlight>time adds, speed doesn't</StepHighlight> — the
                          correct formula inverts a weighted sum of time-per-word values
                          (the harmonic mean):
                        </p>
                        <KatexDisplay tex={headlineLatex(v1, v2, v3, v4, headline)} />
                      </StepContent>
                    </StepCard>
                  </StepList>
                </ExplainBody>
              </ExplainSection>
            )
          })()}

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
                  <Th title="Traditional WPM: 1 word = 5 characters. Comparable to Monkeytype and TypeRacer." style={{ cursor: 'help' }}>WPM ⓘ</Th>
                  <Th title="Spoken WPM: actual dictionary words dictated per minute." style={{ cursor: 'help' }}>Spoken WPM ⓘ</Th>
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
                    <Td>{r.spokenWpm ?? '—'}</Td>
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
