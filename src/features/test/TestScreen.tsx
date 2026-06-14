import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DIFFICULTIES,
  SIZES,
  getRandomPassage,
  passagesForSize,
  type DifficultyBin,
  type Passage,
  type SizeVariant,
} from '../../corpus/passages'
import { compareTokens } from '../../engine/match'
import { calcCpm, calcWpm } from '../../engine/metrics'
import { normalizeTokens } from '../../engine/normalize'
import { tokenize } from '../../engine/tokenize'
import type { MatchMode } from '../../engine/types'
import { saveResult, FREQ_LIST_ID } from '../../storage/history'
import { loadSettings, saveSettings, type DifficultyFilter, type SizeFilter } from '../../storage/settings'
import { type CompletedResult, TestScreenView } from './TestScreenView'

type TestState = 'idle' | 'running' | 'completed'

export function TestScreen() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<MatchMode>(() => loadSettings().mode)
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>(() => loadSettings().difficulty)
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>(() => loadSettings().passageSize)
  const [passage, setPassage] = useState<Passage>(() => {
    const s = loadSettings()
    return getRandomPassage(
      s.passageSize,
      s.difficulty === 'all' ? undefined : s.difficulty as DifficultyBin,
    )
  })
  const [testState, setTestState] = useState<TestState>('idle')
  const [input, setInput] = useState('')
  const [completedResult, setCompletedResult] = useState<CompletedResult | null>(null)
  const startTimeRef = useRef<number>(0)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [elapsedMs, setElapsedMs] = useState(0)

  // Pre-compute availability: how many passages exist for each (size, difficulty) combo.
  // Used by the view to dim unavailable filter combinations.
  const availablePerSizeAndDifficulty = useMemo(
    () => Object.fromEntries(
      SIZES.map(size => [
        size,
        Object.fromEntries(
          DIFFICULTIES.map(d => [d, passagesForSize(size, d).length])
        ) as Record<DifficultyBin, number>,
      ])
    ) as Record<SizeVariant, Record<DifficultyBin, number>>,
    [],
  )

  const refTokens = useMemo(
    () => normalizeTokens(tokenize(passage.text), mode),
    [passage.text, mode],
  )

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

  useEffect(() => {
    saveSettings({ ...loadSettings(), mode, difficulty: difficultyFilter, passageSize: sizeFilter })
  }, [mode, difficultyFilter, sizeFilter])

  const resetToIdle = useCallback((nextPassage: Passage) => {
    setPassage(nextPassage)
    setTestState('idle')
    setInput('')
    setCompletedResult(null)
  }, [])

  const handleStart = useCallback(() => {
    setInput('')
    setCompletedResult(null)
    startTimeRef.current = performance.now()
    setTestState('running')
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [])

  const handleNewPassage = useCallback(() => {
    const diff = difficultyFilter === 'all' ? undefined : difficultyFilter as DifficultyBin
    resetToIdle(getRandomPassage(sizeFilter, diff))
  }, [difficultyFilter, sizeFilter, resetToIdle])

  const handleTryAgain = useCallback(() => {
    resetToIdle(passage)
  }, [passage, resetToIdle])

  const handleFilterChange = useCallback((d: DifficultyFilter) => {
    if (testState === 'running') return
    setDifficultyFilter(d)
    const diff = d === 'all' ? undefined : d as DifficultyBin
    resetToIdle(getRandomPassage(sizeFilter, diff))
  }, [testState, sizeFilter, resetToIdle])

  const handleSizeChange = useCallback((size: SizeFilter) => {
    if (testState === 'running') return
    setSizeFilter(size)
    const diff = difficultyFilter === 'all' ? undefined : difficultyFilter as DifficultyBin
    resetToIdle(getRandomPassage(size, diff))
  }, [testState, difficultyFilter, resetToIdle])

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value
      setInput(value)

      const inputTokens = normalizeTokens(tokenize(value), mode)
      const result = compareTokens(refTokens, inputTokens)

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

  return (
    <TestScreenView
      passage={passage}
      testState={testState}
      mode={mode}
      difficultyFilter={difficultyFilter}
      sizeFilter={sizeFilter}
      availablePerSizeAndDifficulty={availablePerSizeAndDifficulty}
      input={input}
      completedResult={completedResult}
      elapsedMs={elapsedMs}
      inputRef={inputRef}
      onModeChange={setMode}
      onDifficultyFilterChange={handleFilterChange}
      onSizeFilterChange={handleSizeChange}
      onStart={handleStart}
      onInput={handleInput}
      onNewPassage={handleNewPassage}
      onTryAgain={handleTryAgain}
      onNavigateHistory={() => navigate('/history')}
    />
  )
}
