export interface TestResult {
  passageId: string
  wpm: number
  cpm: number
  elapsedSec: number
  wordCount: number
  charCount: number
  mode: 'lexical' | 'strict'
}
