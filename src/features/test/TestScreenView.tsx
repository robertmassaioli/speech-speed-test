import { useMemo } from 'react'
import styled from 'styled-components'
import {
  DIFFICULTIES,
  SIZES,
  type DifficultyBin,
  type Passage,
  type SizeVariant,
} from '../../corpus/passages'
import { compareTokens } from '../../engine/match'
import { normalizeTokens } from '../../engine/normalize'
import { tokenize } from '../../engine/tokenize'
import type { MatchMode } from '../../engine/types'
import type { DifficultyFilter, SizeFilter } from '../../storage/settings'

type TestState = 'idle' | 'running' | 'completed'

export interface CompletedResult {
  wpm: number
  cpm: number
  elapsedSec: number
}

// ── Difficulty colours ────────────────────────────────────────────────────────

const DIFF_BG: Record<DifficultyBin, string> = {
  easy:   'var(--diff-easy-bg)',
  medium: 'var(--diff-med-bg)',
  hard:   'var(--diff-hard-bg)',
}
const DIFF_TEXT: Record<DifficultyBin, string> = {
  easy:   'var(--diff-easy-text)',
  medium: 'var(--diff-med-text)',
  hard:   'var(--diff-hard-text)',
}

// ── Passage area ─────────────────────────────────────────────────────────────

const PassageMeta = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
  min-height: 1.75rem;
`

const DiffBadge = styled.span<{ $diff: DifficultyBin }>`
  background: ${p => DIFF_BG[p.$diff]};
  color: ${p => DIFF_TEXT[p.$diff]};
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
`

const MetaText = styled.span`
  font-size: 0.82rem;
  color: var(--text-secondary);
`

const TimerBadge = styled.div`
  margin-left: auto;
  font-size: 0.9rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.03em;
  background: var(--accent-fill);
  color: var(--text-on-accent);
  padding: 0.2rem 0.7rem;
  border-radius: 20px;
`

const PassageBox = styled.div`
  background: var(--surface-raised);
  border: 1px solid var(--border);
  border-left: 4px solid var(--accent-muted);
  border-radius: 8px;
  padding: var(--space-3);
  font-size: 1.15rem;
  font-family: Georgia, ui-serif, serif;
  line-height: 1.7;
  max-height: 420px;
  overflow-y: auto;
`

const Word = styled.span<{ $state: 'matched' | 'mismatch' | 'upcoming' | 'idle' }>`
  color: ${p =>
    p.$state === 'matched'  ? 'var(--word-matched)'  :
    p.$state === 'mismatch' ? 'var(--word-mismatch)' :
    p.$state === 'upcoming' ? 'var(--text-primary)'   :
    'inherit'};
  text-decoration: ${p => p.$state === 'matched' ? 'underline' : 'none'};
  text-decoration-color: ${p => p.$state === 'matched' ? 'var(--word-matched)' : 'transparent'};
  text-underline-offset: 2px;
  font-weight: ${p => p.$state === 'mismatch' ? '600' : 'inherit'};
`

const ProgressTrack = styled.div`
  height: 4px;
  background: var(--border);
  border-radius: 0 0 6px 6px;
  overflow: hidden;
  margin-bottom: var(--space-3);
`

const ProgressFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${p => p.$pct}%;
  background: var(--accent-fill);
  border-radius: inherit;
  transition: width 0.15s ease;
`

// ── Buttons ───────────────────────────────────────────────────────────────────

const PrimaryButton = styled.button`
  padding: 0.65rem 1.75rem;
  font-size: 1rem;
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
  padding: 0.6rem 1.4rem;
  font-size: 0.95rem;
  font-weight: 600;
  border: 2px solid var(--accent);
  border-radius: 6px;
  cursor: pointer;
  background: transparent;
  color: var(--accent);
  transition: background 0.15s, box-shadow 0.15s;

  &:hover {
    background: var(--accent-subtle);
    box-shadow: 0 0 0 3px var(--accent-muted);
  }
`

const AbandonLink = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--text-secondary);
  padding: 0.3rem 0.5rem;
  border-radius: 4px;
  transition: color 0.15s;

  &:hover { color: var(--text-primary); }
`

// ── Segmented controls ────────────────────────────────────────────────────────

const ToggleGroup = styled.div`
  display: flex;
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
  background: var(--surface-raised);
`

const ToggleButton = styled.button<{ $active: boolean; $disabled: boolean }>`
  padding: 0.4rem 0.9rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  cursor: ${p => p.$disabled ? 'default' : 'pointer'};
  background: ${p => p.$active ? 'var(--accent-fill)' : 'transparent'};
  color: ${p => p.$active ? 'var(--text-on-accent)' : 'var(--text-secondary)'};
  opacity: ${p => p.$disabled && !p.$active ? 0.5 : 1};
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: ${p => p.$disabled || p.$active ? undefined : 'var(--accent-subtle)'};
  }
`

// ── Controls row ─────────────────────────────────────────────────────────────

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
  flex-wrap: wrap;
`

const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin-bottom: var(--space-2);
  font-size: 0.85rem;
  color: var(--text-secondary);
`

const ModeHint = styled.p`
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin: 0 0 var(--space-2);
`

const Label = styled.p`
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0 0 var(--space-1);
`

const InputArea = styled.textarea`
  width: 100%;
  min-height: 110px;
  padding: var(--space-2);
  font-size: 1rem;
  line-height: 1.6;
  border: 2px solid var(--border);
  border-radius: 6px;
  resize: vertical;
  font-family: inherit;
  background: var(--surface-raised);
  color: var(--text-primary);
  transition: border-color 0.15s;

  &:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-muted);
  }
`

// ── Results card ─────────────────────────────────────────────────────────────

const ResultsCard = styled.div`
  background: var(--accent-subtle);
  border: 1px solid var(--accent-muted);
  border-top: 4px solid var(--accent);
  border-radius: 8px;
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-3);
`

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
`

const Metric = styled.div`
  text-align: center;
`

const MetricValue = styled.div<{ $primary?: boolean }>`
  font-size: ${p => p.$primary ? '3rem' : '2.2rem'};
  font-weight: 700;
  line-height: 1;
  color: ${p => p.$primary ? 'var(--accent)' : 'var(--text-primary)'};
`

const MetricLabel = styled.div`
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.3rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
`

const ResultDetail = styled.p`
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0 0 var(--space-3);
  text-align: center;
`

const ResultActions = styled.div`
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  justify-content: center;
`

// ── Helpers ───────────────────────────────────────────────────────────────────

const MODE_HINTS: Record<MatchMode, string> = {
  lexical: 'Ignores case, punctuation, and number formatting — measures dictation speed.',
  strict:  'Exact match: case, punctuation, and spacing must be verbatim.',
}

const DIFFICULTY_LABELS: Record<DifficultyFilter, string> = {
  all:    'All',
  easy:   'Easy',
  medium: 'Medium',
  hard:   'Hard',
}

const SIZE_LABELS: Record<SizeVariant, string> = {
  small:   'Small',
  medium:  'Medium',
  large:   'Large',
  xlarge:  'XL',
}

function formatTimer(ms: number): string {
  const s = ms / 1000
  const m = Math.floor(s / 60)
  const ss = String(Math.floor(s % 60)).padStart(2, '0')
  const f = Math.floor((s % 1) * 10)
  return `${m}:${ss}.${f}`
}

function formatElapsed(sec: number): string {
  return sec < 60 ? `${sec.toFixed(1)}s` : `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface TestScreenViewProps {
  passage: Passage
  testState: TestState
  mode: MatchMode
  difficultyFilter: DifficultyFilter
  sizeFilter: SizeFilter
  availablePerSizeAndDifficulty: Record<SizeVariant, Record<DifficultyBin, number>>
  input: string
  completedResult: CompletedResult | null
  elapsedMs: number
  inputRef?: React.RefObject<HTMLTextAreaElement | null>
  onModeChange: (mode: MatchMode) => void
  onDifficultyFilterChange: (d: DifficultyFilter) => void
  onSizeFilterChange: (s: SizeFilter) => void
  onStart: () => void
  onInput: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onNewPassage: () => void
  onTryAgain: () => void
  onNavigateHistory: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TestScreenView({
  passage,
  testState,
  mode,
  difficultyFilter,
  sizeFilter,
  availablePerSizeAndDifficulty,
  input,
  completedResult,
  elapsedMs,
  inputRef,
  onModeChange,
  onDifficultyFilterChange,
  onSizeFilterChange,
  onStart,
  onInput,
  onNewPassage,
  onTryAgain,
  onNavigateHistory,
}: TestScreenViewProps) {
  const rawTokens = useMemo(() => tokenize(passage.text), [passage.text])
  const refTokens = useMemo(() => normalizeTokens(rawTokens, mode), [rawTokens, mode])
  const matchState = useMemo(() => {
    const inputTokens = normalizeTokens(tokenize(input), mode)
    return compareTokens(refTokens, inputTokens)
  }, [refTokens, input, mode])

  const isRunning   = testState === 'running'
  const isCompleted = testState === 'completed'
  const isIdle      = testState === 'idle'
  const { matchedCount, inputCount } = matchState
  const hasMismatch = isRunning && inputCount > matchedCount
  const progressPct = passage.wordCount > 0 ? (matchedCount / passage.wordCount) * 100 : 0

  return (
    <div>
      {isIdle && (
        <>
          <FilterRow>
            <span>Mode:</span>
            <ToggleGroup>
              {(['lexical', 'strict'] as MatchMode[]).map(m => (
                <ToggleButton
                  key={m}
                  $active={mode === m}
                  $disabled={false}
                  onClick={() => onModeChange(m)}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </ToggleButton>
              ))}
            </ToggleGroup>
          </FilterRow>

          <FilterRow>
            <span>Size:</span>
            <ToggleGroup>
              {SIZES.map(size => {
                // Dim if no passages exist for this size given the current difficulty filter
                const count = difficultyFilter === 'all'
                  ? DIFFICULTIES.reduce((sum, d) => sum + availablePerSizeAndDifficulty[size][d], 0)
                  : availablePerSizeAndDifficulty[size][difficultyFilter as DifficultyBin]
                const isEmpty = count === 0
                return (
                  <ToggleButton
                    key={size}
                    $active={sizeFilter === size}
                    $disabled={isEmpty}
                    onClick={() => !isEmpty && onSizeFilterChange(size)}
                    title={isEmpty ? 'No passages available at this size' : undefined}
                  >
                    {SIZE_LABELS[size]}
                  </ToggleButton>
                )
              })}
            </ToggleGroup>
          </FilterRow>

          <FilterRow>
            <span>Difficulty:</span>
            <ToggleGroup>
              {(['all', ...DIFFICULTIES] as DifficultyFilter[]).map(d => {
                // Dim if no passages exist for this difficulty given the current size filter
                const count = d === 'all'
                  ? DIFFICULTIES.reduce((sum, diff) => sum + availablePerSizeAndDifficulty[sizeFilter][diff], 0)
                  : availablePerSizeAndDifficulty[sizeFilter][d as DifficultyBin]
                const isEmpty = count === 0
                return (
                  <ToggleButton
                    key={d}
                    $active={difficultyFilter === d}
                    $disabled={isEmpty}
                    onClick={() => !isEmpty && onDifficultyFilterChange(d)}
                    title={isEmpty ? 'No passages available at this difficulty' : undefined}
                  >
                    {DIFFICULTY_LABELS[d]}
                  </ToggleButton>
                )
              })}
            </ToggleGroup>
          </FilterRow>
        </>
      )}

      <PassageMeta>
        <DiffBadge $diff={passage.difficulty}>{passage.difficulty}</DiffBadge>
        <MetaText>{passage.wordCount} words</MetaText>
        {isRunning && (
          <TimerBadge>{formatTimer(elapsedMs)}</TimerBadge>
        )}
      </PassageMeta>

      <PassageBox>
        {rawTokens.map((token, i) => {
          const wordState =
            isCompleted                           ? 'matched'  :
            !isRunning                            ? 'idle'     :
            i < matchedCount                      ? 'matched'  :
            i === matchedCount && hasMismatch     ? 'mismatch' :
                                                    'upcoming'
          return (
            <Word key={i} $state={wordState}>
              {token}{' '}
            </Word>
          )
        })}
      </PassageBox>

      {isRunning && (
        <ProgressTrack>
          <ProgressFill $pct={progressPct} />
        </ProgressTrack>
      )}

      {isCompleted && completedResult && (
        <ResultsCard>
          <MetricsGrid>
            <Metric>
              <MetricValue $primary>{completedResult.wpm}</MetricValue>
              <MetricLabel>✓ WPM</MetricLabel>
            </Metric>
            <Metric>
              <MetricValue>{completedResult.cpm}</MetricValue>
              <MetricLabel>CPM</MetricLabel>
            </Metric>
            <Metric>
              <MetricValue>{formatElapsed(completedResult.elapsedSec)}</MetricValue>
              <MetricLabel>Time</MetricLabel>
            </Metric>
          </MetricsGrid>
          <ResultDetail>
            {passage.wordCount} words · {passage.charCount} chars · {mode} mode · {passage.difficulty}
          </ResultDetail>
          <ResultActions>
            <PrimaryButton onClick={onNewPassage}>New Passage</PrimaryButton>
            <OutlineButton onClick={onTryAgain}>Try Again</OutlineButton>
            <OutlineButton onClick={onNavigateHistory}>History</OutlineButton>
          </ResultActions>
        </ResultsCard>
      )}

      {isIdle && (
        <>
          <Controls>
            <PrimaryButton onClick={onStart}>Start Test</PrimaryButton>
            <OutlineButton onClick={onNewPassage}>New Passage</OutlineButton>
          </Controls>
          <ModeHint>{MODE_HINTS[mode]}</ModeHint>
        </>
      )}

      {isRunning && (
        <>
          <Label>Dictate the passage above into the box:</Label>
          <InputArea
            ref={inputRef}
            value={input}
            onChange={onInput}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
          <Controls>
            <AbandonLink onClick={onNewPassage}>✕ Abandon</AbandonLink>
          </Controls>
        </>
      )}
    </div>
  )
}
