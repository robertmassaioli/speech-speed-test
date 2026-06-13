import { countTokens } from '../engine/tokenize'
import { type Composition, type DifficultyBin, difficultyBin } from './tiers'
import rawPassages from '../../data/passages.json'

export type { DifficultyBin }

export interface Passage {
  id: string
  text: string
  wordCount: number
  charCount: number
  composition: Composition
  difficulty: DifficultyBin
}

interface PassageRaw {
  id: string
  text: string
  composition: { t1: number; t2: number; t3: number; t4: number; total: number }
}

function fromCounts(c: PassageRaw['composition']): Composition {
  const { t1, t2, t3, t4, total } = c
  if (total === 0) return { t1: 0, t2: 0, t3: 0, t4: 0, total: 0, p1: 0, p2: 0, p3: 0, p4: 0 }
  return { t1, t2, t3, t4, total, p1: t1/total, p2: t2/total, p3: t3/total, p4: t4/total }
}

export const PASSAGES: Passage[] = (rawPassages as PassageRaw[]).map(p => {
  const composition = fromCounts(p.composition)
  return {
    id: p.id,
    text: p.text,
    wordCount: countTokens(p.text),
    charCount: p.text.length,
    composition,
    difficulty: difficultyBin(composition),
  }
})

export const DIFFICULTIES: DifficultyBin[] = ['easy', 'medium', 'hard']

export function passagesForDifficulty(difficulty: DifficultyBin): Passage[] {
  return PASSAGES.filter(p => p.difficulty === difficulty)
}

export function getRandomPassage(difficulty?: DifficultyBin): Passage {
  const pool = difficulty ? passagesForDifficulty(difficulty) : PASSAGES
  const effective = pool.length > 0 ? pool : PASSAGES
  return effective[Math.floor(Math.random() * effective.length)]
}
