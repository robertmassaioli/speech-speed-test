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
