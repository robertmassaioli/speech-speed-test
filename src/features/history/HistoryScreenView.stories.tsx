import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { computeRealWpm } from '../../corpus/realwpm'
import type { DifficultyBin } from '../../corpus/tiers'
import type { StoredResult } from '../../storage/history'
import { HistoryScreenView, type HistoryScreenViewProps } from './HistoryScreenView'

const FREQ_LIST_ID = 'google-10k-no-swears@bdf4c221'
const NOW = 1749254400000 // 2025-06-07T00:00:00.000Z — fixed so snapshots are stable

// wpm = traditional (charsRaw/5/elapsedSec*60); spokenWpm = actual words/elapsedSec*60
const NINE_RESULTS_WITH_COMPOSITION: StoredResult[] = [
  { id: 'r1', ts: NOW - 9 * 86400000, passageId: 'easy-1', mode: 'lexical', elapsedSec: 36, words: 120, charsRaw: 640, wpm: 213, spokenWpm: 200, cpm: 1067, composition: [0.55, 0.37, 0.07, 0.01], difficultyBin: 'easy', frequencyListId: FREQ_LIST_ID },
  { id: 'r2', ts: NOW - 8 * 86400000, passageId: 'easy-2', mode: 'lexical', elapsedSec: 38, words: 118, charsRaw: 630, wpm: 199, spokenWpm: 186, cpm: 995, composition: [0.54, 0.38, 0.07, 0.01], difficultyBin: 'easy', frequencyListId: FREQ_LIST_ID },
  { id: 'r3', ts: NOW - 7 * 86400000, passageId: 'easy-3', mode: 'lexical', elapsedSec: 35, words: 115, charsRaw: 620, wpm: 213, spokenWpm: 197, cpm: 1063, composition: [0.56, 0.36, 0.07, 0.01], difficultyBin: 'easy', frequencyListId: FREQ_LIST_ID },
  { id: 'r4', ts: NOW - 6 * 86400000, passageId: 'bunny-and-duck', mode: 'lexical', elapsedSec: 52, words: 130, charsRaw: 720, wpm: 166, spokenWpm: 150, cpm: 831, composition: [0.50, 0.40, 0.09, 0.01], difficultyBin: 'medium', frequencyListId: FREQ_LIST_ID },
  { id: 'r5', ts: NOW - 5 * 86400000, passageId: 'medium-2', mode: 'lexical', elapsedSec: 54, words: 132, charsRaw: 730, wpm: 162, spokenWpm: 147, cpm: 811, composition: [0.51, 0.39, 0.09, 0.01], difficultyBin: 'medium', frequencyListId: FREQ_LIST_ID },
  { id: 'r6', ts: NOW - 4 * 86400000, passageId: 'medium-3', mode: 'strict', elapsedSec: 50, words: 128, charsRaw: 710, wpm: 170, spokenWpm: 154, cpm: 852, composition: [0.50, 0.40, 0.09, 0.01], difficultyBin: 'medium', frequencyListId: FREQ_LIST_ID },
  { id: 'r7', ts: NOW - 3 * 86400000, passageId: 'hard-1', mode: 'lexical', elapsedSec: 68, words: 135, charsRaw: 810, wpm: 143, spokenWpm: 119, cpm: 714, composition: [0.42, 0.38, 0.15, 0.05], difficultyBin: 'hard', frequencyListId: FREQ_LIST_ID },
  { id: 'r8', ts: NOW - 2 * 86400000, passageId: 'hard-2', mode: 'lexical', elapsedSec: 70, words: 138, charsRaw: 820, wpm: 141, spokenWpm: 118, cpm: 703, composition: [0.43, 0.37, 0.15, 0.05], difficultyBin: 'hard', frequencyListId: FREQ_LIST_ID },
  { id: 'r9', ts: NOW - 1 * 86400000, passageId: 'hard-3', mode: 'lexical', elapsedSec: 65, words: 133, charsRaw: 795, wpm: 147, spokenWpm: 123, cpm: 734, composition: [0.42, 0.38, 0.14, 0.06], difficultyBin: 'hard', frequencyListId: FREQ_LIST_ID },
]

const RESULTS_WITHOUT_COMPOSITION: StoredResult[] = [
  { id: 'r1', ts: NOW - 2 * 86400000, passageId: 'bunny-and-duck', mode: 'lexical', elapsedSec: 52, words: 132, charsRaw: 720, wpm: 166, spokenWpm: 152, cpm: 831 },
  { id: 'r2', ts: NOW - 1 * 86400000, passageId: 'bunny-and-duck', mode: 'strict', elapsedSec: 55, words: 132, charsRaw: 720, wpm: 157, spokenWpm: 144, cpm: 785 },
]

function personalBests(results: StoredResult[]): Partial<Record<DifficultyBin, number>> {
  const bests: Partial<Record<DifficultyBin, number>> = {}
  for (const r of results) {
    if (!r.difficultyBin) continue
    const cur = bests[r.difficultyBin]
    if (cur === undefined || r.wpm > cur) bests[r.difficultyBin] = r.wpm
  }
  return bests
}

const defaultCallbacks = {
  onToggleExplainer: fn(),
  onClear: fn(),
  onCancelClear: fn(),
  onExport: fn(),
  onImportFile: fn(),
  onNavigateTest: fn(),
}

const emptyArgs: HistoryScreenViewProps = {
  storageOk: true,
  results: [],
  realWpm: null,
  bests: {},
  confirmClear: false,
  importError: null,
  explainerOpen: false,
  ...defaultCallbacks,
}

const withResultsArgs: HistoryScreenViewProps = {
  storageOk: true,
  results: NINE_RESULTS_WITH_COMPOSITION,
  realWpm: computeRealWpm(NINE_RESULTS_WITH_COMPOSITION),
  bests: personalBests(NINE_RESULTS_WITH_COMPOSITION),
  confirmClear: false,
  importError: null,
  explainerOpen: false,
  ...defaultCallbacks,
}

const meta: Meta<typeof HistoryScreenView> = {
  title: 'Features/HistoryScreenView',
  component: HistoryScreenView,
}
export default meta

type Story = StoryObj<typeof HistoryScreenView>

export const Empty: Story = {
  args: emptyArgs,
}

export const EmptyStorageUnavailable: Story = {
  args: { ...emptyArgs, storageOk: false },
}

export const NoRealWpm: Story = {
  args: {
    ...emptyArgs,
    results: RESULTS_WITHOUT_COMPOSITION,
    realWpm: computeRealWpm(RESULTS_WITHOUT_COMPOSITION),
    bests: personalBests(RESULTS_WITHOUT_COMPOSITION),
  },
}

export const WithRealWpm: Story = {
  args: withResultsArgs,
}

export const ExplainerOpen: Story = {
  args: { ...withResultsArgs, explainerOpen: true },
}

export const ExplainerOpenNoData: Story = {
  args: {
    ...emptyArgs,
    results: RESULTS_WITHOUT_COMPOSITION,
    realWpm: computeRealWpm(RESULTS_WITHOUT_COMPOSITION),
    bests: personalBests(RESULTS_WITHOUT_COMPOSITION),
    explainerOpen: true,
  },
}

export const ConfirmingClear: Story = {
  args: { ...withResultsArgs, confirmClear: true },
}

export const WithImportError: Story = {
  args: {
    ...emptyArgs,
    importError: 'Import failed — file is not a valid history export.',
  },
}
