import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { getRandomPassage, type Passage } from '../../corpus/passages'
import { matchText } from '../../engine/match'
import { calcCpm, calcWpm } from '../../engine/metrics'
import type { TestResult } from '../results/types'

type TestState = 'idle' | 'running'

const PassageBox = styled.div`
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  font-size: 1.1rem;
  line-height: 1.7;
  margin-bottom: 1.5rem;
  white-space: pre-wrap;
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

export function TestScreen() {
  const navigate = useNavigate()
  const [passage, setPassage] = useState<Passage>(() => getRandomPassage())
  const [state, setState] = useState<TestState>('idle')
  const [input, setInput] = useState('')
  const [matchedCount, setMatchedCount] = useState(0)
  const startTimeRef = useRef<number>(0)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setPassage(getRandomPassage())
  }, [])

  const handleStart = useCallback(() => {
    setInput('')
    setMatchedCount(0)
    startTimeRef.current = performance.now()
    setState('running')
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [])

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value
      setInput(value)

      const result = matchText(passage.text, value, 'lexical')
      setMatchedCount(result.matchedCount)

      if (result.isComplete) {
        const elapsedSec = (performance.now() - startTimeRef.current) / 1000
        const testResult: TestResult = {
          passageId: passage.id,
          wpm: calcWpm(passage.wordCount, elapsedSec),
          cpm: calcCpm(passage.charCount, elapsedSec),
          elapsedSec,
          wordCount: passage.wordCount,
          charCount: passage.charCount,
          mode: 'lexical',
        }
        navigate('/results', { state: testResult })
      }
    },
    [passage, navigate],
  )

  const handleNewPassage = useCallback(() => {
    setPassage(getRandomPassage())
    setState('idle')
    setInput('')
    setMatchedCount(0)
  }, [])

  return (
    <div>
      <h1>Speed Test</h1>
      <PassageBox>{passage.text}</PassageBox>

      {state === 'idle' && (
        <Controls>
          <Button onClick={handleStart}>Start Test</Button>
          <Button onClick={handleNewPassage} style={{ background: '#666' }}>
            New Passage
          </Button>
        </Controls>
      )}

      {state === 'running' && (
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
