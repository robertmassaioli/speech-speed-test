export type MatchMode = 'lexical' | 'strict'

export interface TokenMatch {
  matchedCount: number
  totalCount: number
  inputCount: number
  isComplete: boolean
  firstMismatchIndex: number | null
}
