import type { MatchMode } from '../engine/types'
import type { DifficultyBin } from '../corpus/tiers'

export type DifficultyFilter = 'all' | DifficultyBin

export interface AppSettings {
  mode: MatchMode
  difficulty: DifficultyFilter
}

const SETTINGS_KEY = 'sst-settings'
const DEFAULTS: AppSettings = { mode: 'lexical', difficulty: 'all' }

const VALID_MODES = new Set<MatchMode>(['lexical', 'strict'])
const VALID_DIFFICULTIES = new Set<DifficultyFilter>(['all', 'easy', 'medium', 'hard'])

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULTS }
    const p = JSON.parse(raw) as Partial<AppSettings>
    return {
      mode:       VALID_MODES.has(p.mode as MatchMode) ? p.mode as MatchMode : DEFAULTS.mode,
      difficulty: VALID_DIFFICULTIES.has(p.difficulty as DifficultyFilter) ? p.difficulty as DifficultyFilter : DEFAULTS.difficulty,
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
