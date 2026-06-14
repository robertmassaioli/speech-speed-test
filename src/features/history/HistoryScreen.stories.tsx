import type { Meta, StoryObj } from '@storybook/react'
import { MemoryRouter } from 'react-router-dom'
import { userEvent, within } from 'storybook/test'
import { HistoryScreen } from './HistoryScreen'

const meta: Meta<typeof HistoryScreen> = {
  title: 'Features/HistoryScreen',
  component: HistoryScreen,
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/history']}>
        <Story />
      </MemoryRouter>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof HistoryScreen>

const FREQ_LIST_ID = 'google-10k-no-swears@bdf4c221'
const NOW = 1749254400000 // 2025-06-07T00:00:00.000Z — fixed so snapshots are stable

// Nine results with full composition data spanning all three difficulty bins,
// giving the Real WPM model enough signal to compute high-confidence estimates.
const NINE_RESULTS_WITH_COMPOSITION = [
  // Easy — simple vocabulary, faster dictation
  { id: 'r1', ts: NOW - 9 * 86400000, passageId: 'easy-1', mode: 'lexical', elapsedSec: 36, words: 120, charsRaw: 640, wpm: 200, cpm: 1067, composition: [0.55, 0.37, 0.07, 0.01] as const, difficultyBin: 'easy' as const, frequencyListId: FREQ_LIST_ID },
  { id: 'r2', ts: NOW - 8 * 86400000, passageId: 'easy-2', mode: 'lexical', elapsedSec: 38, words: 118, charsRaw: 630, wpm: 186, cpm: 995, composition: [0.54, 0.38, 0.07, 0.01] as const, difficultyBin: 'easy' as const, frequencyListId: FREQ_LIST_ID },
  { id: 'r3', ts: NOW - 7 * 86400000, passageId: 'easy-3', mode: 'lexical', elapsedSec: 35, words: 115, charsRaw: 620, wpm: 197, cpm: 1063, composition: [0.56, 0.36, 0.07, 0.01] as const, difficultyBin: 'easy' as const, frequencyListId: FREQ_LIST_ID },
  // Medium
  { id: 'r4', ts: NOW - 6 * 86400000, passageId: 'bunny-and-duck', mode: 'lexical', elapsedSec: 52, words: 130, charsRaw: 720, wpm: 150, cpm: 831, composition: [0.50, 0.40, 0.09, 0.01] as const, difficultyBin: 'medium' as const, frequencyListId: FREQ_LIST_ID },
  { id: 'r5', ts: NOW - 5 * 86400000, passageId: 'medium-2', mode: 'lexical', elapsedSec: 54, words: 132, charsRaw: 730, wpm: 147, cpm: 811, composition: [0.51, 0.39, 0.09, 0.01] as const, difficultyBin: 'medium' as const, frequencyListId: FREQ_LIST_ID },
  { id: 'r6', ts: NOW - 4 * 86400000, passageId: 'medium-3', mode: 'strict', elapsedSec: 50, words: 128, charsRaw: 710, wpm: 154, cpm: 852, composition: [0.50, 0.40, 0.09, 0.01] as const, difficultyBin: 'medium' as const, frequencyListId: FREQ_LIST_ID },
  // Hard — uncommon vocab, slower dictation
  { id: 'r7', ts: NOW - 3 * 86400000, passageId: 'hard-1', mode: 'lexical', elapsedSec: 68, words: 135, charsRaw: 810, wpm: 119, cpm: 714, composition: [0.42, 0.38, 0.15, 0.05] as const, difficultyBin: 'hard' as const, frequencyListId: FREQ_LIST_ID },
  { id: 'r8', ts: NOW - 2 * 86400000, passageId: 'hard-2', mode: 'lexical', elapsedSec: 70, words: 138, charsRaw: 820, wpm: 118, cpm: 703, composition: [0.43, 0.37, 0.15, 0.05] as const, difficultyBin: 'hard' as const, frequencyListId: FREQ_LIST_ID },
  { id: 'r9', ts: NOW - 1 * 86400000, passageId: 'hard-3', mode: 'lexical', elapsedSec: 65, words: 133, charsRaw: 795, wpm: 123, cpm: 734, composition: [0.42, 0.38, 0.14, 0.06] as const, difficultyBin: 'hard' as const, frequencyListId: FREQ_LIST_ID },
]

// Results without composition data — Real WPM cannot be computed.
const RESULTS_WITHOUT_COMPOSITION = [
  { id: 'r1', ts: NOW - 2 * 86400000, passageId: 'bunny-and-duck', mode: 'lexical', elapsedSec: 52, words: 132, charsRaw: 720, wpm: 152, cpm: 831 },
  { id: 'r2', ts: NOW - 1 * 86400000, passageId: 'bunny-and-duck', mode: 'strict', elapsedSec: 55, words: 132, charsRaw: 720, wpm: 144, cpm: 785 },
]

export const Empty: Story = {
  parameters: { storage: null },
}

export const NoRealWpm: Story = {
  parameters: {
    storage: { version: 1, results: RESULTS_WITHOUT_COMPOSITION },
  },
}

export const WithRealWpm: Story = {
  parameters: {
    storage: { version: 1, results: NINE_RESULTS_WITH_COMPOSITION },
  },
}

export const ExplainerOpen: Story = {
  ...WithRealWpm,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByText('How is this calculated?'))
  },
}
