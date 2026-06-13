export type Tier = 1 | 2 | 3 | 4
export type TierMap = ReadonlyMap<string, Tier>

export interface Composition {
  t1: number
  t2: number
  t3: number
  t4: number
  total: number
  p1: number
  p2: number
  p3: number
  p4: number
}

export type DifficultyBin = 'easy' | 'medium' | 'hard'

// Provisional thresholds — calibrate once a varied corpus exists (Phase 1f).
// Inflected verb forms (hopped, listened, smiled) are absent from the surface-form
// frequency list, inflating p4 structurally for all narrative prose.  Proper nouns
// add further inflation; both are accepted and documented (Q5: no lemmatization).
// Empirical baseline: bunny-and-duck passage = p4 0.114 → medium.
const P4_EASY   = 0.08
const P4_MEDIUM = 0.14

export function buildTierMap(rankedWords: readonly string[]): TierMap {
  const map = new Map<string, Tier>()
  let rank = 0
  for (const raw of rankedWords) {
    const word = raw.trim().toLowerCase()
    if (!word) continue
    rank++
    const tier: Tier = rank <= 100 ? 1 : rank <= 1000 ? 2 : 3
    map.set(word, tier)
  }
  return map
}

export function getTier(map: TierMap, word: string): Tier {
  return map.get(word.toLowerCase()) ?? 4
}

// Counts alphabetic-only tokens (digits excluded from vector;
// numbers carry their own difficulty dimension via 1c canonicalization).
export function computeComposition(words: readonly string[], map: TierMap): Composition {
  let t1 = 0, t2 = 0, t3 = 0, t4 = 0
  for (const raw of words) {
    const word = raw.replace(/[^a-z]/g, '')
    if (!word) continue
    const tier = getTier(map, word)
    if (tier === 1)      t1++
    else if (tier === 2) t2++
    else if (tier === 3) t3++
    else                 t4++
  }
  const total = t1 + t2 + t3 + t4
  if (total === 0) return { t1: 0, t2: 0, t3: 0, t4: 0, total: 0, p1: 0, p2: 0, p3: 0, p4: 0 }
  return {
    t1, t2, t3, t4, total,
    p1: t1 / total,
    p2: t2 / total,
    p3: t3 / total,
    p4: t4 / total,
  }
}

export function difficultyBin(comp: Composition): DifficultyBin {
  if (comp.p4 <= P4_EASY)   return 'easy'
  if (comp.p4 <= P4_MEDIUM) return 'medium'
  return 'hard'
}
