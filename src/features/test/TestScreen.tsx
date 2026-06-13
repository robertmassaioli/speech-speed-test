import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { getRandomPassage, type Passage } from '../../corpus/passages'
import { compareTokens } from '../../engine/match'
import { calcCpm, calcWpm } from '../../engine/metrics'
import { normalizeTokens } from '../../engine/normalize'
import { tokenize } from '../../engine/tokenize'
import type { MatchMode } from '../../engine/types'
import { saveResult } from '../../storage/history'
import type { TestResult } from '../results/types'

type TestState = 'idle' | 'running'

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
`

const ModeToggle = styled.div`
  display: flex;
  border: 1px solid #ccc;
  border-radius: 6px;
  overflow: hidden;
`

const ModeButton = styled.button<{ $active: boolean; $disabled: boolean }>`
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

  &:hover {
    background: #333;
  }
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

export function TestScreen() {
  const navigate = useNavigate()
  const [passage, setPassage] = useState<Passage>(() => getRandomPassage())
  const [testState, setTestState] = useState<TestState>('idle')
  const [mode, setMode] = useState<MatchMode>('lexical')
  const [input, setInput] = useState('')
  const [matchState, setMatchState] = useState<MatchState>(IDLE_MATCH)
  const startTimeRef = useRef<number>(0)
  const prevMatchedRef = useRef<number>(0)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [elapsedMs, setElapsedMs] = useState(0)

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

  const handleStart = useCallback(() => {
    setInput('')
    setMatchState(IDLE_MATCH)
    prevMatchedRef.current = 0
    startTimeRef.current = performance.now()
    setTestState('running')
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [])

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value
      setInput(value)

      const inputTokens = normalizeTokens(tokenize(value), mode)
      const result = compareTokens(refTokens, inputTokens)
      const suspect = result.isComplete && prevMatchedRef.current < 5
      prevMatchedRef.current = result.matchedCount
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
          suspect,
        })
        const testResult: TestResult = {
          passageId: passage.id,
          wpm,
          cpm,
          elapsedSec,
          wordCount: passage.wordCount,
          charCount: passage.charCount,
          mode,
          suspect,
        }
        navigate('/results', { state: testResult })
      }
    },
    [passage, navigate, refTokens, mode],
  )

  const handleNewPassage = useCallback(() => {
    setPassage(getRandomPassage())
    setTestState('idle')
    setInput('')
    setMatchState(IDLE_MATCH)
  }, [])

  const { matchedCount, inputCount } = matchState
  const hasMismatch = testState === 'running' && inputCount > matchedCount

  function formatTimer(ms: number): string {
    const s = ms / 1000
    const m = Math.floor(s / 60)
    const ss = String(Math.floor(s % 60)).padStart(2, '0')
    const f = Math.floor((s % 1) * 10)
    return `${m}:${ss}.${f}`
  }
  const isRunning = testState === 'running'

  return (
    <div>
      <h1>Speed Test</h1>

      <PassageBox>
        {rawTokens.map((token, i) => {
          const wordState =
            !isRunning                            ? 'idle' :
            i < matchedCount                      ? 'matched' :
            i === matchedCount && hasMismatch     ? 'mismatch' :
                                                    'upcoming'
          return (
            <Word key={i} $state={wordState}>
              {token}{' '}
            </Word>
          )
        })}
      </PassageBox>

      <Controls>
        <ModeToggle>
          {(['lexical', 'strict'] as MatchMode[]).map(m => (
            <ModeButton
              key={m}
              $active={mode === m}
              $disabled={isRunning}
              onClick={() => { if (!isRunning) setMode(m) }}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </ModeButton>
          ))}
        </ModeToggle>

        {!isRunning && (
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

      {!isRunning && (
        <ModeHint>{MODE_HINTS[mode]}</ModeHint>
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
