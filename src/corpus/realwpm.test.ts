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
      { elapsedSec: 30, charsRaw: 500, difficultyBin: 'easy' },
    ])).toBeNull()
  })

  test('returns a result with one qualifying input', () => {
    const result = computeRealWpm([
      { elapsedSec: 60, charsRaw: 650, difficultyBin: 'easy', composition: [0.40, 0.26, 0.30, 0.04] },
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
      { elapsedSec: 45, charsRaw: 600, difficultyBin: 'easy',   composition: [0.42, 0.24, 0.30, 0.04] },
      { elapsedSec: 55, charsRaw: 650, difficultyBin: 'medium', composition: [0.38, 0.18, 0.33, 0.11] },
      { elapsedSec: 70, charsRaw: 675, difficultyBin: 'hard',   composition: [0.37, 0.14, 0.30, 0.19] },
    ])
    expect(result).not.toBeNull()
    expect(result!.s.speed).toBeGreaterThan(0)
    expect(result!.m.speed).toBeGreaterThan(0)
    expect(result!.l.speed).toBeGreaterThan(0)
    expect(result!.f.speed).toBeGreaterThan(0)
  })

  test('two bins (≥70 trad-words each): s is medium confidence, m/l/f always low', () => {
    const result = computeRealWpm([
      { elapsedSec: 45, charsRaw: 600, difficultyBin: 'easy', composition: [0.42, 0.24, 0.30, 0.04] },
      { elapsedSec: 65, charsRaw: 650, difficultyBin: 'hard', composition: [0.37, 0.14, 0.30, 0.19] },
    ])
    expect(result).not.toBeNull()
    expect(result!.s.confidence).toBe('medium')
    expect(result!.m.confidence).toBe('low')
    expect(result!.l.confidence).toBe('low')
    expect(result!.f.confidence).toBe('low')
  })

  test('three bins (≥70 trad-words each): s is high confidence, m/l/f always low', () => {
    const result = computeRealWpm([
      { elapsedSec: 45, charsRaw: 600, difficultyBin: 'easy',   composition: [0.42, 0.24, 0.30, 0.04] },
      { elapsedSec: 55, charsRaw: 650, difficultyBin: 'medium', composition: [0.38, 0.18, 0.33, 0.11] },
      { elapsedSec: 65, charsRaw: 650, difficultyBin: 'hard',   composition: [0.37, 0.14, 0.30, 0.19] },
    ])
    expect(result).not.toBeNull()
    expect(result!.s.confidence).toBe('high')
    expect(result!.m.confidence).toBe('low')
  })

  test('tier speed ordering: s > m > l > f (prior ratios)', () => {
    const result = computeRealWpm([
      { elapsedSec: 60, charsRaw: 650, difficultyBin: 'easy', composition: [0.40, 0.26, 0.30, 0.04] },
    ])
    expect(result).not.toBeNull()
    expect(result!.s.speed).toBeGreaterThan(result!.m.speed)
    expect(result!.m.speed).toBeGreaterThan(result!.l.speed)
    expect(result!.l.speed).toBeGreaterThan(result!.f.speed)
  })

  test('nudge prefers hard when hard bin is undersampled', () => {
    const easy:   WpmInput = { elapsedSec: 45, charsRaw: 600, difficultyBin: 'easy',   composition: [0.42, 0.24, 0.30, 0.04] }
    const medium: WpmInput = { elapsedSec: 55, charsRaw: 650, difficultyBin: 'medium', composition: [0.38, 0.18, 0.33, 0.11] }
    const result = computeRealWpm([easy, easy, easy, medium, medium, medium])
    expect(result!.nudge).toBe('hard')
  })

  test('nudge is null when all bins have enough results', () => {
    const easy:   WpmInput = { elapsedSec: 45, charsRaw: 600, difficultyBin: 'easy',   composition: [0.42, 0.24, 0.30, 0.04] }
    const medium: WpmInput = { elapsedSec: 55, charsRaw: 650, difficultyBin: 'medium', composition: [0.38, 0.18, 0.33, 0.11] }
    const hard:   WpmInput = { elapsedSec: 65, charsRaw: 650, difficultyBin: 'hard',   composition: [0.37, 0.14, 0.30, 0.19] }
    const result = computeRealWpm([easy, easy, easy, medium, medium, medium, hard, hard, hard])
    expect(result!.nudge).toBeNull()
  })

  test('results without difficultyBin are ignored', () => {
    const result = computeRealWpm([
      { elapsedSec: 45, charsRaw: 600, composition: [0.42, 0.24, 0.30, 0.04] },
    ])
    expect(result).toBeNull()
  })

  // ── Weighted mean ─────────────────────────────────────────────────────────

  test('weighted mean: larger passage gets more weight in β1 estimate', () => {
    const comp: [number, number, number, number] = [0.40, 0.26, 0.30, 0.04]
    // Two results in same bin: one 250-char (faster apparent speed), one 1000-char (slower)
    const small: WpmInput = { elapsedSec: 20, charsRaw: 250,  difficultyBin: 'easy', composition: comp }
    const large: WpmInput = { elapsedSec: 90, charsRaw: 1000, difficultyBin: 'easy', composition: comp }
    const weighted = computeRealWpm([small, large])
    // Unweighted mean would treat both equally; weighted mean pulls toward large result
    // We verify it's different from a single-result estimate using only the small passage
    const smallOnly = computeRealWpm([small])
    expect(weighted).not.toBeNull()
    expect(weighted!.s.speed).not.toBe(smallOnly!.s.speed)
    // Large passage produces lower WPM (90s/200 trad-words is slower than 20s/50 trad-words)
    expect(weighted!.s.speed).toBeLessThan(smallOnly!.s.speed)
  })

  // ── Small-passage confidence ──────────────────────────────────────────────

  test('three small passages from different bins → low confidence (coverage = 1.5)', () => {
    const easy:   WpmInput = { elapsedSec: 15, charsRaw: 250, difficultyBin: 'easy',   composition: [0.42, 0.24, 0.30, 0.04] }
    const medium: WpmInput = { elapsedSec: 18, charsRaw: 250, difficultyBin: 'medium', composition: [0.38, 0.18, 0.33, 0.11] }
    const hard:   WpmInput = { elapsedSec: 22, charsRaw: 250, difficultyBin: 'hard',   composition: [0.37, 0.14, 0.30, 0.19] }
    const result = computeRealWpm([easy, medium, hard])
    expect(result).not.toBeNull()
    // 3 bins × 0.5 weight = 1.5 total coverage → low (threshold: ≥2 for medium)
    expect(result!.s.confidence).toBe('low')
  })

  test('two large passages from different bins → medium confidence (coverage = 2.0)', () => {
    const easy: WpmInput = { elapsedSec: 60, charsRaw: 1000, difficultyBin: 'easy', composition: [0.42, 0.24, 0.30, 0.04] }
    const hard: WpmInput = { elapsedSec: 90, charsRaw: 1000, difficultyBin: 'hard', composition: [0.37, 0.14, 0.30, 0.19] }
    const result = computeRealWpm([easy, hard])
    expect(result).not.toBeNull()
    // 2 bins × 1.0 weight = 2.0 coverage → medium
    expect(result!.s.confidence).toBe('medium')
  })

  test('one small + two large from same bin = coverage 1.0 → low confidence', () => {
    const comp: [number, number, number, number] = [0.42, 0.24, 0.30, 0.04]
    const small: WpmInput = { elapsedSec: 15, charsRaw: 250,  difficultyBin: 'easy', composition: comp }
    const lg1:   WpmInput = { elapsedSec: 60, charsRaw: 1000, difficultyBin: 'easy', composition: comp }
    const lg2:   WpmInput = { elapsedSec: 61, charsRaw: 1000, difficultyBin: 'easy', composition: comp }
    const result = computeRealWpm([small, lg1, lg2])
    expect(result).not.toBeNull()
    // All in the same bin → coverage = max(0.5, 1.0) = 1.0 → low
    expect(result!.s.confidence).toBe('low')
  })
})
