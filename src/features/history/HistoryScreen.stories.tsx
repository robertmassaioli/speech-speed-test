import type { Meta, StoryObj } from '@storybook/react'
import { MemoryRouter } from 'react-router-dom'
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
const NOW = 1749254400000

export const Empty: Story = {
  parameters: { storage: null },
}

export const WithResults: Story = {
  parameters: {
    storage: {
      version: 1,
      results: [
        { id: 'r1', ts: NOW - 2 * 86400000, passageId: 'bunny-and-duck', mode: 'lexical', elapsedSec: 52, words: 130, charsRaw: 720, wpm: 150, cpm: 831, composition: [0.50, 0.40, 0.09, 0.01], difficultyBin: 'medium', frequencyListId: FREQ_LIST_ID },
        { id: 'r2', ts: NOW - 1 * 86400000, passageId: 'easy-1', mode: 'lexical', elapsedSec: 36, words: 120, charsRaw: 640, wpm: 200, cpm: 1067, composition: [0.55, 0.37, 0.07, 0.01], difficultyBin: 'easy', frequencyListId: FREQ_LIST_ID },
      ],
    },
  },
}
