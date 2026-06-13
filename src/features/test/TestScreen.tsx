import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import {
  DIFFICULTIES,
  getRandomPassage,
  passagesForDifficulty,
  type DifficultyBin,
  type Passage,
} from '../../corpus/passages'
import { compareTokens } from '../../engine/match'
import { calcCpm, calcWpm } from '../../engine/metrics'
import { normalizeTokens } from '../../engine/normalize'
import { tokenize } from '../../engine/tokenize'
import type { MatchMode } from '../../engine/types'
import { saveResult, FREQ_LIST_ID } from '../../storage/history'

type TestState = 'idle' | 'running' | 'completed'
type DifficultyFilter = 'all' | DifficultyBin

interface CompletedResult {
  wpm: number
  cpm: number
  elapsedSec: number
}

// ── Styled components ─────────────────────────────────────────────────────────

const PassageBox = styled.div`
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  font-size: 1.1rem;
  line-height: 1.9;
  margin-bottom: 1.5rem;
`

const Word = styled.span<{ $state: 'matched' | 'mismatch' | 'upcoming' | 'idle' }>`
  color: ${p =>
    p.$state === 'matched'  ? '#2a7a2a' :
    p.$state === 'mismatch' ? '#c0392b' :
    p.$state === 'upcoming' ? '#999'    :
    'inherit'};
  font-weight: ${p => p.$state === 'mismatch' ? '600' : 'inherit'};
`

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`

const ToggleGroup = styled.div`
  display: flex;
  border: 1px solid #ccc;
  border-radius: 6px;
  overflow: hidden;
`

const ToggleButton = styled.button<{ $active: boolean; $disabled: boolean }>`
  padding: 0.45rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  border: none;
  cursor: ${p => p.$disabled ? 'default' : 'pointer'};
  background: ${p => p.$active ? '#1a1a1a' : '#f5f5f5'};
  color: ${p => p.$active ? '#fff' : p.$disabled ? '#bbb' : '#555'};
  opacity: ${p => p.$disabled && !p.$active ? 0.5 : 1};
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: ${p => p.$disabled || p.$active ? undefined : '#e8e8e8'};
  }
`

const ModeHint = styled.p`
  font-size: 0.8rem;
  color: #888;
  margin: 0 0 1rem;
`

const Button = styled.button`
  padding: 0.6rem 1.4rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: #1a1a1a;
  color: #fff;

  &:hover { background: #333; }
`

const SecondaryButton = styled(Button)`
  background: #e8e8e8;
  color: #1a1a1a;

  &:hover { background: #d4d4d4; }
`

const Progress = styled.span`
  font-size: 0.9rem;
  color: #666;
`

const InputArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 0.75rem;
  font-size: 1rem;
  line-height: 1.6;
  border: 2px solid #1a1a1a;
  border-radius: 6px;
  resize: vertical;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #555;
  }
`

const Label = styled.p`
  font-size: 0.85rem;
  color: #666;
  margin: 0 0 0.4rem;
`

const TimerDisplay = styled.div`
  font-size: 2.4rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.03em;
  color: #1a1a1a;
  margin-bottom: 1rem;
`

const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  color: #666;
`

// ── Results card ──────────────────────────────────────────────────────────────

const ResultsCard = styled.div`
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem 2rem;
  margin-bottom: 1.5rem;
`

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 1rem;
`

const Metric = styled.div`
  text-align: center;
`

const MetricValue = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
`

const MetricLabel = styled.div`
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.3rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const ResultDetail = styled.p`
  font-size: 0.85rem;
  color: #888;
  margin: 0 0 1.25rem;
`

const ResultActions = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`

// ── Logic ─────────────────────────────────────────────────────────────────────

interface MatchState {
  matchedCount: number
  inputCount: number
  isComplete: boolean
}

const IDLE_MATCH: MatchState = { matchedCount: 0, inputCount: 0, isComplete: false }

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

// ── Component ─────────────────────────────────────────────────────────────────

export function TestScreen() {
  const navigate = useNavigate()
  const [passage, setPassage] = useState<Passage>(() => getRandomPassage())
  const [testState, setTestState] = useState<TestState>('idle')
  const [mode, setMode] = useState<MatchMode>('lexical')
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all')
  const [input, setInput] = useState('')
  const [matchState, setMatchState] = useState<MatchState>(IDLE_MATCH)
  const [completedResult, setCompletedResult] = useState<CompletedResult | null>(null)
  const startTimeRef = useRef<number>(0)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [elapsedMs, setElapsedMs] = useState(0)

  const availablePerDifficulty = useMemo(
    () => Object.fromEntries(
      DIFFICULTIES.map(d => [d, passagesForDifficulty(d).length])
    ) as Record<DifficultyBin, number>,
    [],
  )

  const rawTokens = useMemo(() => tokenize(passage.text), [passage.text])
  const refTokens = useMemo(
    () => normalizeTokens(rawTokens, mode),
    [rawTokens, mode],
  )

  useEffect(() => {
    setPassage(getRandomPassage())
  }, [])

  useEffect(() => {
    if (testState !== 'running') {
      setElapsedMs(0)
      return
    }
    const id = setInterval(() => {
      setElapsedMs(performance.now() - startTimeRef.current)
    }, 100)
    return () => clearInterval(id)
  }, [testState])

  const resetToIdle = useCallback((nextPassage: Passage) => {
    setPassage(nextPassage)
    setTestState('idle')
    setInput('')
    setMatchState(IDLE_MATCH)
    setCompletedResult(null)
  }, [])

  const handleStart = useCallback(() => {
    setInput('')
    setMatchState(IDLE_MATCH)
    setCompletedResult(null)
    startTimeRef.current = performance.now()
    setTestState('running')
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [])

  const handleNewPassage = useCallback(() => {
    const pool = difficultyFilter === 'all' ? undefined : (difficultyFilter as DifficultyBin)
    resetToIdle(getRandomPassage(pool))
  }, [difficultyFilter, resetToIdle])

  const handleTryAgain = useCallback(() => {
    resetToIdle(passage)
  }, [passage, resetToIdle])

  const handleFilterChange = useCallback((d: DifficultyFilter) => {
    if (testState === 'running') return
    setDifficultyFilter(d)
    const pool = d === 'all' ? undefined : (d as DifficultyBin)
    resetToIdle(getRandomPassage(pool))
  }, [testState, resetToIdle])

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value
      setInput(value)

      const inputTokens = normalizeTokens(tokenize(value), mode)
      const result = compareTokens(refTokens, inputTokens)
      setMatchState(result)

      if (result.isComplete) {
        const elapsedSec = (performance.now() - startTimeRef.current) / 1000
        const wpm = calcWpm(passage.wordCount, elapsedSec)
        const cpm = calcCpm(passage.charCount, elapsedSec)
        saveResult({
          passageId: passage.id,
          mode,
          elapsedSec,
          words: passage.wordCount,
          charsRaw: passage.charCount,
          wpm,
          cpm,
          composition: [
            passage.composition.p1,
            passage.composition.p2,
            passage.composition.p3,
            passage.composition.p4,
          ],
          difficultyBin: passage.difficulty,
          frequencyListId: FREQ_LIST_ID,
        })
        setCompletedResult({ wpm, cpm, elapsedSec })
        setTestState('completed')
      }
    },
    [passage, refTokens, mode],
  )

  const isRunning   = testState === 'running'
  const isCompleted = testState === 'completed'
  const isIdle      = testState === 'idle'
  const { matchedCount, inputCount } = matchState
  const hasMismatch = isRunning && inputCount > matchedCount

  return (
    <div>
      <h1>Speed Test</h1>

      <PassageBox>
        {rawTokens.map((token, i) => {
          const wordState =
            isCompleted                               ? 'matched'  :
            !isRunning                                ? 'idle'     :
            i < matchedCount                          ? 'matched'  :
            i === matchedCount && hasMismatch         ? 'mismatch' :
                                                        'upcoming'
          return (
            <Word key={i} $state={wordState}>
              {token}{' '}
            </Word>
          )
        })}
      </PassageBox>

      {/* Completed: inline results */}
      {isCompleted && completedResult && (
        <ResultsCard>
          <MetricsGrid>
            <Metric>
              <MetricValue>{completedResult.wpm}</MetricValue>
              <MetricLabel>WPM</MetricLabel>
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
            <Button onClick={handleNewPassage}>New Passage</Button>
            <SecondaryButton onClick={handleTryAgain}>Try Again</SecondaryButton>
            <SecondaryButton onClick={() => navigate('/history')}>History</SecondaryButton>
          </ResultActions>
        </ResultsCard>
      )}

      {/* Running / idle controls */}
      {!isCompleted && (
        <Controls>
          <ToggleGroup>
            {(['lexical', 'strict'] as MatchMode[]).map(m => (
              <ToggleButton
                key={m}
                $active={mode === m}
                $disabled={isRunning}
                onClick={() => { if (!isRunning) setMode(m) }}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </ToggleButton>
            ))}
          </ToggleGroup>

          {isIdle && (
            <>
              <Button onClick={handleStart}>Start Test</Button>
              <Button onClick={handleNewPassage} style={{ background: '#666' }}>
                New Passage
              </Button>
            </>
          )}

          {isRunning && (
            <>
              <Progress>{matchedCount} / {passage.wordCount} words matched</Progress>
              <Button onClick={handleNewPassage} style={{ background: '#666' }}>
                Abandon
              </Button>
            </>
          )}
        </Controls>
      )}

      {isIdle && (
        <>
          <FilterRow>
            <span>Difficulty:</span>
            <ToggleGroup>
              {(['all', ...DIFFICULTIES] as DifficultyFilter[]).map(d => {
                const isEmpty = d !== 'all' && availablePerDifficulty[d as DifficultyBin] === 0
                return (
                  <ToggleButton
                    key={d}
                    $active={difficultyFilter === d}
                    $disabled={isEmpty}
                    onClick={() => handleFilterChange(d)}
                    title={isEmpty ? 'No passages available at this difficulty' : undefined}
                  >
                    {DIFFICULTY_LABELS[d]}
                  </ToggleButton>
                )
              })}
            </ToggleGroup>
          </FilterRow>
          <ModeHint>{MODE_HINTS[mode]}</ModeHint>
        </>
      )}

      {isRunning && (
        <>
          <TimerDisplay>{formatTimer(elapsedMs)}</TimerDisplay>
          <Label>Dictate the passage above into the box:</Label>
          <InputArea
            ref={inputRef}
            value={input}
            onChange={handleInput}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
        </>
      )}
    </div>
  )
}
