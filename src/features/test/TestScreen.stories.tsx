import type { Meta, StoryObj } from '@storybook/react'
import { MemoryRouter } from 'react-router-dom'
import { userEvent, within } from 'storybook/test'
import { TestScreen } from './TestScreen'

const meta: Meta<typeof TestScreen> = {
  title: 'Features/TestScreen',
  component: TestScreen,
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/']}>
        <Story />
      </MemoryRouter>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof TestScreen>

export const Idle: Story = {}

export const Running: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByText('Start Test'))
  },
}

// Shows matched (green) and mismatch (red) word states while dictating.
// The partial text is from the first passage — if a different passage is
// selected randomly it will show all-mismatch, which is still a valid
// visual state to see.
export const RunningWithPartialMatch: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByText('Start Test'))
    const textarea = await canvas.findByRole('textbox')
    await userEvent.type(textarea, 'Bella the bunny lived', { delay: 0 })
  },
}

export const RunningWithMismatch: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByText('Start Test'))
    const textarea = await canvas.findByRole('textbox')
    await userEvent.type(textarea, 'this text does not match any passage', { delay: 0 })
  },
}
