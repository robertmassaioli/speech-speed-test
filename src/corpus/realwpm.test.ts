import { describe, expect, test } from 'vitest'
import { computeHeadline, computeRealWpm, type WpmInput } from './realwpm'

describe('computeHeadline', () => {
  test('harmonic mean: s=70 m=40 l=10 f=50 → ~37.96', () => {
    // 1 / (0.50/70 + 0.40/40 + 0.09/10 + 0.01/50) ≈ 37.962
    expect(computeHeadline(70, 40, 10, 50)).toBeCloseTo(37.962, 2)
  })

  test('uniform 100 WPM across all tiers → 100', () => {
    expect(computeHeadline(100, 100, 100, 100)).toBeCloseTo(100, 5)
  })

  test('weights sum to 1 (verified via uniform input)', () => {
    expect(computeHeadline(1, 1, 1, 1)).toBeCloseTo(1, 10)
  })
})

describe('computeRealWpm', () => {
  test('returns null with no inputs', () => {
    expect(computeRealWpm([])).toBeNull()
  })

  test('returns null when composition is missing', () => {
    expect(computeRealWpm([
      { elapsedSec: 30, words: 100, difficultyBin: 'easy' },
    ])).toBeNull()
  })

  test('returns a result with one qualifying input', () => {
    const result = computeRealWpm([
      { elapsedSec: 60, words: 130, difficultyBin: 'easy', composition: [0.40, 0.26, 0.30, 0.04] },
    ])
    expect(result).not.toBeNull()
    expect(result!.contributing).toBe(1)
    expect(result!.realWpm).toBeGreaterThan(0)
    // Single bin → s is low confidence; m, l, f always low
    expect(result!.s.confidence).toBe('low')
    expect(result!.m.confidence).toBe('low')
    expect(result!.l.confidence).toBe('low')
    expect(result!.f.confidence).toBe('low')
  })

  test('all tier speeds are positive', () => {
    const result = computeRealWpm([
      { elapsedSec: 45, words: 120, difficultyBin: 'easy',   composition: [0.42, 0.24, 0.30, 0.04] },
      { elapsedSec: 55, words: 130, difficultyBin: 'medium', composition: [0.38, 0.18, 0.33, 0.11] },
      { elapsedSec: 70, words: 135, difficultyBin: 'hard',   composition: [0.37, 0.14, 0.30, 0.19] },
    ])
    expect(result).not.toBeNull()
    expect(result!.s.speed).toBeGreaterThan(0)
    expect(result!.m.speed).toBeGreaterThan(0)
    expect(result!.l.speed).toBeGreaterThan(0)
    expect(result!.f.speed).toBeGreaterThan(0)
  })

  test('two bins: s is medium confidence, m/l/f always low', () => {
    const result = computeRealWpm([
      { elapsedSec: 45, words: 120, difficultyBin: 'easy', composition: [0.42, 0.24, 0.30, 0.04] },
      { elapsedSec: 65, words: 130, difficultyBin: 'hard', composition: [0.37, 0.14, 0.30, 0.19] },
    ])
    expect(result).not.toBeNull()
    expect(result!.s.confidence).toBe('medium')
    expect(result!.m.confidence).toBe('low')
    expect(result!.l.confidence).toBe('low')
    expect(result!.f.confidence).toBe('low')
  })

  test('three bins: s is high confidence, m/l/f always low', () => {
    const result = computeRealWpm([
      { elapsedSec: 45, words: 120, difficultyBin: 'easy',   composition: [0.42, 0.24, 0.30, 0.04] },
      { elapsedSec: 55, words: 130, difficultyBin: 'medium', composition: [0.38, 0.18, 0.33, 0.11] },
      { elapsedSec: 65, words: 130, difficultyBin: 'hard',   composition: [0.37, 0.14, 0.30, 0.19] },
    ])
    expect(result).not.toBeNull()
    expect(result!.s.confidence).toBe('high')
    expect(result!.m.confidence).toBe('low')
  })

  test('tier speed ordering: s > m > l > f (prior ratios)', () => {
    const result = computeRealWpm([
      { elapsedSec: 60, words: 130, difficultyBin: 'easy', composition: [0.40, 0.26, 0.30, 0.04] },
    ])
    expect(result).not.toBeNull()
    expect(result!.s.speed).toBeGreaterThan(result!.m.speed)
    expect(result!.m.speed).toBeGreaterThan(result!.l.speed)
    expect(result!.l.speed).toBeGreaterThan(result!.f.speed)
  })

  test('nudge prefers hard when hard bin is undersampled', () => {
    const easy:   WpmInput = { elapsedSec: 45, words: 120, difficultyBin: 'easy',   composition: [0.42, 0.24, 0.30, 0.04] }
    const medium: WpmInput = { elapsedSec: 55, words: 130, difficultyBin: 'medium', composition: [0.38, 0.18, 0.33, 0.11] }
    const result = computeRealWpm([easy, easy, easy, medium, medium, medium])
    expect(result!.nudge).toBe('hard')
  })

  test('nudge is null when all bins have enough results', () => {
    const easy:   WpmInput = { elapsedSec: 45, words: 120, difficultyBin: 'easy',   composition: [0.42, 0.24, 0.30, 0.04] }
    const medium: WpmInput = { elapsedSec: 55, words: 130, difficultyBin: 'medium', composition: [0.38, 0.18, 0.33, 0.11] }
    const hard:   WpmInput = { elapsedSec: 65, words: 130, difficultyBin: 'hard',   composition: [0.37, 0.14, 0.30, 0.19] }
    const result = computeRealWpm([easy, easy, easy, medium, medium, medium, hard, hard, hard])
    expect(result!.nudge).toBeNull()
  })

  test('results without difficultyBin are ignored', () => {
    const result = computeRealWpm([
      { elapsedSec: 45, words: 120, composition: [0.42, 0.24, 0.30, 0.04] },
    ])
    expect(result).toBeNull()
  })
})
