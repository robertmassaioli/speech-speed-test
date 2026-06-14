import type { Meta, StoryObj } from '@storybook/react'
import { expect, fn, within } from 'storybook/test'
import { PASSAGES } from '../../corpus/passages'
import { TestScreenView, type TestScreenViewProps } from './TestScreenView'

const BUNNY_PASSAGE = PASSAGES.find(p => p.id === 'bunny-and-duck')!

const AVAILABLE: TestScreenViewProps['availablePerSizeAndDifficulty'] = {
  small:  { easy: 10, medium: 6, hard: 10 },
  medium: { easy: 10, medium: 10, hard: 10 },
  large:  { easy: 5, medium: 5, hard: 5 },
  xlarge: { easy: 3, medium: 3, hard: 3 },
}

const defaultCallbacks = {
  onModeChange: fn(),
  onDifficultyFilterChange: fn(),
  onSizeFilterChange: fn(),
  onStart: fn(),
  onInput: fn(),
  onNewPassage: fn(),
  onTryAgain: fn(),
  onNavigateHistory: fn(),
}

const defaultArgs: TestScreenViewProps = {
  passage: BUNNY_PASSAGE,
  testState: 'idle',
  mode: 'lexical',
  difficultyFilter: 'all',
  sizeFilter: 'medium',
  availablePerSizeAndDifficulty: AVAILABLE,
  input: '',
  completedResult: null,
  elapsedMs: 0,
  ...defaultCallbacks,
}

const meta: Meta<typeof TestScreenView> = {
  title: 'Features/TestScreenView',
  component: TestScreenView,
}
export default meta

type Story = StoryObj<typeof TestScreenView>

export const Idle: Story = {
  args: defaultArgs,
}

export const Running: Story = {
  args: {
    ...defaultArgs,
    testState: 'running',
    elapsedMs: 3200,
  },
}

export const RunningWithPartialMatch: Story = {
  args: {
    ...defaultArgs,
    testState: 'running',
    elapsedMs: 5000,
    input: 'Bella the bunny lived',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const textarea = canvas.getByRole('textbox')
    await expect(textarea).toHaveValue('Bella the bunny lived')
    // "Bella" appears multiple times in the bunny passage — verify at least one is rendered
    const bellaSpans = canvas.getAllByText('Bella')
    await expect(bellaSpans.length).toBeGreaterThan(0)
  },
}

export const RunningWithMismatch: Story = {
  args: {
    ...defaultArgs,
    testState: 'running',
    elapsedMs: 4100,
    input: 'this text does not match any passage',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const textarea = canvas.getByRole('textbox')
    await expect(textarea).toHaveValue('this text does not match any passage')
  },
}

export const Completed: Story = {
  args: {
    ...defaultArgs,
    testState: 'completed',
    // 132 words / 66 s × 60 = 120 WPM; 688 chars / 66 s × 60 ≈ 626 CPM
    completedResult: { wpm: 120, cpm: 626, elapsedSec: 66 },
  },
}
