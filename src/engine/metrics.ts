// Traditional: 1 word = 5 characters (industry standard — same as Monkeytype, TypeRacer)
export function calcWpm(charCount: number, elapsedSec: number): number {
  if (elapsedSec <= 0) return 0
  return Math.round((charCount / 5 / elapsedSec) * 60)
}

// Speech-native: actual dictionary words per minute
export function calcSpokenWpm(wordCount: number, elapsedSec: number): number {
  if (elapsedSec <= 0) return 0
  return Math.round((wordCount / elapsedSec) * 60)
}

export function calcCpm(charCount: number, elapsedSec: number): number {
  if (elapsedSec <= 0) return 0
  return Math.round((charCount / elapsedSec) * 60)
}
