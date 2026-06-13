export function calcWpm(wordCount: number, elapsedSec: number): number {
  if (elapsedSec <= 0) return 0
  return Math.round((wordCount / elapsedSec) * 60)
}

export function calcCpm(charCount: number, elapsedSec: number): number {
  if (elapsedSec <= 0) return 0
  return Math.round((charCount / elapsedSec) * 60)
}
