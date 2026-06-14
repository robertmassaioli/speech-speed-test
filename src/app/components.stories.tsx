import type { Meta, StoryObj } from '@storybook/react'
import styled from 'styled-components'

// ── Inline showcase components ────────────────────────────────────────────────
// These are not extracted from the screen files — they mirror the styles used
// in TestScreen/HistoryScreen to demonstrate the theme token system.

const PrimaryButton = styled.button`
  padding: 0.65rem 1.75rem;
  font-size: 1rem;
  font-weight: 600;
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  background: var(--accent-fill);
  color: var(--text-on-accent);
  transition: background 0.15s;
  &:hover { background: var(--accent-fill-hover); }
`

const OutlineButton = styled.button`
  padding: 0.6rem 1.4rem;
  font-size: 0.95rem;
  font-weight: 600;
  border: 2px solid var(--accent);
  border-radius: 6px;
  cursor: pointer;
  background: transparent;
  color: var(--accent);
  transition: background 0.15s;
  &:hover { background: var(--accent-subtle); }
`

const DangerButton = styled.button`
  padding: 0.5rem 1.1rem;
  font-size: 0.9rem;
  font-weight: 600;
  border: 2px solid var(--diff-hard-bg);
  border-radius: 6px;
  cursor: pointer;
  background: var(--surface-raised);
  color: var(--diff-hard-text);
  transition: border-color 0.15s;
  &:hover { border-color: var(--diff-hard-text); }
`

const ToggleGroup = styled.div`
  display: flex;
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
  background: var(--surface-raised);
`

const ToggleButton = styled.button<{ $active: boolean }>`
  padding: 0.4rem 0.9rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  background: ${p => p.$active ? 'var(--accent-fill)' : 'transparent'};
  color: ${p => p.$active ? 'var(--text-on-accent)' : 'var(--text-secondary)'};
  transition: background 0.15s, color 0.15s;
`

const DiffBadge = styled.span<{ $color: string; $bg: string }>`
  background: ${p => p.$bg};
  color: ${p => p.$color};
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
`

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1rem 0;
  border-bottom: 1px solid var(--border);

  &:last-child { border-bottom: none; }
`

const Label = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  min-width: 100px;
`

const Showcase = styled.div`
  background: var(--surface-raised);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
`

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'App/Components',
}
export default meta

type Story = StoryObj

// ── Stories ───────────────────────────────────────────────────────────────────

export const Buttons: Story = {
  render: () => (
    <Showcase>
      <Row>
        <Label>Primary</Label>
        <PrimaryButton>Start Test</PrimaryButton>
      </Row>
      <Row>
        <Label>Outline</Label>
        <OutlineButton>New Passage</OutlineButton>
        <OutlineButton>History</OutlineButton>
      </Row>
      <Row>
        <Label>Danger</Label>
        <DangerButton>Clear history</DangerButton>
      </Row>
    </Showcase>
  ),
}

export const Toggles: Story = {
  render: () => (
    <Showcase>
      <Row>
        <Label>Mode</Label>
        <ToggleGroup>
          <ToggleButton $active>Lexical</ToggleButton>
          <ToggleButton $active={false}>Strict</ToggleButton>
        </ToggleGroup>
      </Row>
      <Row>
        <Label>Difficulty</Label>
        <ToggleGroup>
          <ToggleButton $active>All</ToggleButton>
          <ToggleButton $active={false}>Easy</ToggleButton>
          <ToggleButton $active={false}>Medium</ToggleButton>
          <ToggleButton $active={false}>Hard</ToggleButton>
        </ToggleGroup>
      </Row>
    </Showcase>
  ),
}

export const DifficultyBadges: Story = {
  render: () => (
    <Showcase>
      <Row>
        <Label>Difficulty</Label>
        <DiffBadge $color="var(--diff-easy-text)" $bg="var(--diff-easy-bg)">easy</DiffBadge>
        <DiffBadge $color="var(--diff-med-text)"  $bg="var(--diff-med-bg)">medium</DiffBadge>
        <DiffBadge $color="var(--diff-hard-text)" $bg="var(--diff-hard-bg)">hard</DiffBadge>
      </Row>
    </Showcase>
  ),
}
