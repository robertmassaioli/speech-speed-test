import type { MatchMode } from '../engine/types'
import type { DifficultyBin } from '../corpus/tiers'
import type { SizeVariant } from '../corpus/passages'

export type DifficultyFilter = 'all' | DifficultyBin
export type SizeFilter = SizeVariant  // no 'all' — size always has a specific value

export interface AppSettings {
  mode: MatchMode
  difficulty: DifficultyFilter
  passageSize: SizeFilter
  explainerOpen: boolean
}

const SETTINGS_KEY = 'sst-settings'
const DEFAULTS: AppSettings = { mode: 'lexical', difficulty: 'all', passageSize: 'medium', explainerOpen: false }

const VALID_MODES = new Set<MatchMode>(['lexical', 'strict'])
const VALID_DIFFICULTIES = new Set<DifficultyFilter>(['all', 'easy', 'medium', 'hard'])
const VALID_SIZES = new Set<SizeFilter>(['small', 'medium', 'large', 'xlarge'])

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULTS }
    const p = JSON.parse(raw) as Partial<AppSettings>
    return {
      mode:          VALID_MODES.has(p.mode as MatchMode) ? p.mode as MatchMode : DEFAULTS.mode,
      difficulty:    VALID_DIFFICULTIES.has(p.difficulty as DifficultyFilter) ? p.difficulty as DifficultyFilter : DEFAULTS.difficulty,
      passageSize:   VALID_SIZES.has(p.passageSize as SizeFilter) ? p.passageSize as SizeFilter : DEFAULTS.passageSize,
      explainerOpen: typeof p.explainerOpen === 'boolean' ? p.explainerOpen : DEFAULTS.explainerOpen,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveSettings(s: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
  } catch {
    // quota exceeded or storage unavailable
  }
}
