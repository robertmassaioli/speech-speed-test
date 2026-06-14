import { countTokens } from '../engine/tokenize'
import { type Composition, type DifficultyBin, difficultyBin } from './tiers'
import rawPassages from '../../data/passages.json'

export type { DifficultyBin }

export type SizeVariant = 'small' | 'medium' | 'large' | 'xlarge'

export interface Passage {
  id: string
  sizeVariant: SizeVariant
  text: string
  wordCount: number
  charCount: number
  composition: Composition
  difficulty: DifficultyBin
}

interface PassageRaw {
  id: string
  sizeVariant: SizeVariant
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
    sizeVariant: p.sizeVariant,
    text: p.text,
    wordCount: countTokens(p.text),
    charCount: p.text.length,
    composition,
    difficulty: difficultyBin(composition),
  }
})

export const DIFFICULTIES: DifficultyBin[] = ['easy', 'medium', 'hard']
export const SIZES: SizeVariant[] = ['small', 'medium', 'large', 'xlarge']

export function passagesForDifficulty(difficulty: DifficultyBin): Passage[] {
  return PASSAGES.filter(p => p.difficulty === difficulty)
}

export function passagesForSize(size: SizeVariant, difficulty?: DifficultyBin): Passage[] {
  const bySize = PASSAGES.filter(p => p.sizeVariant === size)
  return difficulty ? bySize.filter(p => p.difficulty === difficulty) : bySize
}

export function getRandomPassage(size?: SizeVariant, difficulty?: DifficultyBin): Passage {
  const sizePool = size ? PASSAGES.filter(p => p.sizeVariant === size) : PASSAGES
  const pool = difficulty ? sizePool.filter(p => p.difficulty === difficulty) : sizePool
  // Fall back to size-only pool rather than crossing the size boundary
  const effective = pool.length > 0 ? pool : (sizePool.length > 0 ? sizePool : PASSAGES)
  return effective[Math.floor(Math.random() * effective.length)]
}
