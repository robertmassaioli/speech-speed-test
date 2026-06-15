import type { DifficultyBin } from './tiers'

export type Confidence = 'high' | 'medium' | 'low'

export interface TierEstimate {
  speed: number        // words per minute
  confidence: Confidence
}

export interface RealWpmResult {
  realWpm: number
  s: TierEstimate      // T1 (top 100)
  m: TierEstimate      // T2 (101–1,000)
  l: TierEstimate      // T3 (1,001–9,894)
  f: TierEstimate      // T4 (not in list)
  contributing: number // non-suspect results with composition data
  nudge: DifficultyBin | null
}

export interface WpmInput {
  elapsedSec: number
  charsRaw: number
  difficultyBin?: DifficultyBin
  composition?: readonly [number, number, number, number]  // [p1, p2, p3, p4]
}

// All prior ratios are relative to β1 = 1/v1 (time-per-word for T1).
// Only the β4 ratio is specified in the doc (f ≈ 0.4·s → v4 = 0.4·v1 → β4 = 2.5·β1).
// β2 and β3 ratios are engineering priors, always flagged low-confidence.
//
// Why single free parameter: natural passages have nearly proportional p2/p3 across
// difficulty bins, so the 2-param (β1, β2) system is near-singular in practice.
// Method A explicitly avoids free multi-parameter regression.
const B2_RATIO = 1.3   // m slightly slower than s
const B3_RATIO = 1.8   // l slower
const B4_RATIO = 2.5   // f ≈ 0.4·s (doc-specified)

const W1 = 0.50
const W2 = 0.40
const W3 = 0.09
const W4 = 0.01

const MIN_SPEED = 5    // WPM floor — clamp unrealistic estimates
const MIN_RESULTS_FOR_HIGH = 3

// Word count below which a result contributes reduced bin coverage.
// Small passages (~50 words) produce noisier β1 estimates (noise ∝ 1/√words).
const SMALL_WORD_THRESHOLD = 70
const SMALL_BIN_WEIGHT = 0.5  // counts as half a bin for confidence purposes

// Weighted harmonic mean: time adds linearly, speed does not.
// 1/WPM = p1/v1 + p2/v2 + p3/v3 + p4/v4
export function computeHeadline(s: number, m: number, l: number, f: number): number {
  return 1 / (W1 / s + W2 / m + W3 / l + W4 / f)
}

export function computeRealWpm(inputs: WpmInput[]): RealWpmResult | null {
  const eligible = inputs.filter(r => r.difficultyBin != null && r.composition != null)
  if (eligible.length === 0) return null

  // Estimate β1 from each result individually.
  // With full prior system (β2=B2·β1, β3=B3·β1, β4=B4·β1):
  //   tpw ≈ (p1 + B2·p2 + B3·p3 + B4·p4) · β1
  //   → β1 ≈ tpw / effectiveWeight
  // Uses traditional word units (1 word = 5 chars) so tier speeds are in traditional WPM.
  const β1Estimates = eligible.map(r => {
    const [p1, p2, p3, p4] = r.composition!
    const w = p1 + B2_RATIO * p2 + B3_RATIO * p3 + B4_RATIO * p4
    return (r.elapsedSec / (r.charsRaw / 5)) / w
  })

  // Traditional-word-weighted mean: larger passages contribute more since they produce
  // more accurate β1 estimates (noise ∝ 1/√traditionalWords).
  const totalWeight = eligible.reduce((sum, r) => sum + r.charsRaw / 5, 0)
  const β1 = Math.max(
    totalWeight > 0
      ? β1Estimates.reduce((sum, est, i) => sum + est * (eligible[i].charsRaw / 5), 0) / totalWeight
      : β1Estimates[0],
    1 / 500,
  )

  const v1 = Math.max(MIN_SPEED, 60 / β1)
  const v2 = Math.max(MIN_SPEED, 60 / (B2_RATIO * β1))
  const v3 = Math.max(MIN_SPEED, 60 / (B3_RATIO * β1))
  const v4 = Math.max(MIN_SPEED, 60 / (B4_RATIO * β1))

  const rawHeadline = computeHeadline(v1, v2, v3, v4)

  // s confidence: bin diversity weighted by passage length.
  // Short passages (<70 words) contribute 0.5 rather than 1.0 per bin because their
  // β1 estimates carry higher variance and should not fully satisfy bin coverage.
  const binContributions = new Map<DifficultyBin, number>()
  for (const r of eligible) {
    const contrib = r.charsRaw / 5 < SMALL_WORD_THRESHOLD ? SMALL_BIN_WEIGHT : 1.0
    const existing = binContributions.get(r.difficultyBin!) ?? 0
    binContributions.set(r.difficultyBin!, Math.max(existing, contrib))
  }
  const totalCoverage = [...binContributions.values()].reduce((a, b) => a + b, 0)
  const sConf: Confidence =
    totalCoverage >= 3 ? 'high' :
    totalCoverage >= 2 ? 'medium' :
    'low'

  const binCounts = new Map<DifficultyBin, number>()
  for (const r of eligible) {
    const bin = r.difficultyBin!
    binCounts.set(bin, (binCounts.get(bin) ?? 0) + 1)
  }

  const nudge: DifficultyBin | null =
    (binCounts.get('hard')   ?? 0) < MIN_RESULTS_FOR_HIGH ? 'hard'   :
    (binCounts.get('medium') ?? 0) < MIN_RESULTS_FOR_HIGH ? 'medium' :
    (binCounts.get('easy')   ?? 0) < MIN_RESULTS_FOR_HIGH ? 'easy'   :
    null

  return {
    realWpm: Math.round(rawHeadline * 10) / 10,
    s: { speed: Math.round(v1), confidence: sConf },
    m: { speed: Math.round(v2), confidence: 'low' },
    l: { speed: Math.round(v3), confidence: 'low' },
    f: { speed: Math.round(v4), confidence: 'low' },
    contributing: eligible.length,
    nudge,
  }
}
