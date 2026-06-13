import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { getRandomPassage, type Passage } from '../../corpus/passages'
import { compareTokens } from '../../engine/match'
import { calcCpm, calcWpm } from '../../engine/metrics'
import { normalizeTokens } from '../../engine/normalize'
import { tokenize } from '../../engine/tokenize'
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

interface MatchState {
  matchedCount: number
  inputCount: number
  isComplete: boolean
}

const IDLE_MATCH: MatchState = { matchedCount: 0, inputCount: 0, isComplete: false }

export function TestScreen() {
  const navigate = useNavigate()
  const [passage, setPassage] = useState<Passage>(() => getRandomPassage())
  const [testState, setTestState] = useState<TestState>('idle')
  const [input, setInput] = useState('')
  const [matchState, setMatchState] = useState<MatchState>(IDLE_MATCH)
  const startTimeRef = useRef<number>(0)
  const prevMatchedRef = useRef<number>(0)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Pre-compute the reference token stream once per passage
  const rawTokens = useMemo(() => tokenize(passage.text), [passage.text])
  const refTokens = useMemo(
    () => normalizeTokens(rawTokens, 'lexical'),
    [rawTokens],
  )

  useEffect(() => {
    setPassage(getRandomPassage())
  }, [])

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

      const inputTokens = normalizeTokens(tokenize(value), 'lexical')
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
          mode: 'lexical',
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
          mode: 'lexical',
          suspect,
        }
        navigate('/results', { state: testResult })
      }
    },
    [passage, navigate, refTokens],
  )

  const handleNewPassage = useCallback(() => {
    setPassage(getRandomPassage())
    setTestState('idle')
    setInput('')
    setMatchState(IDLE_MATCH)
  }, [])

  const { matchedCount, inputCount } = matchState
  const hasMismatch = testState === 'running' && inputCount > matchedCount

  return (
    <div>
      <h1>Speed Test</h1>

      <PassageBox>
        {rawTokens.map((token, i) => {
          const wordState =
            testState === 'idle'       ? 'idle' :
            i < matchedCount           ? 'matched' :
            i === matchedCount && hasMismatch ? 'mismatch' :
            testState === 'running'    ? 'upcoming' :
            'idle'
          return (
            <Word key={i} $state={wordState}>
              {token}{' '}
            </Word>
          )
        })}
      </PassageBox>

      {testState === 'idle' && (
        <Controls>
          <Button onClick={handleStart}>Start Test</Button>
          <Button onClick={handleNewPassage} style={{ background: '#666' }}>
            New Passage
          </Button>
        </Controls>
      )}

      {testState === 'running' && (
        <>
          <Controls>
            <Progress>
              {matchedCount} / {passage.wordCount} words matched
            </Progress>
            <Button onClick={handleNewPassage} style={{ background: '#666' }}>
              Abandon
            </Button>
          </Controls>
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
