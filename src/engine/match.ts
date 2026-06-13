import type { MatchMode, TokenMatch } from './types'
import { tokenize } from './tokenize'
import { normalizeTokens } from './normalize'

export function compareTokens(refTokens: string[], inputTokens: string[]): TokenMatch {
  const total = refTokens.length
  let matchedCount = 0

  for (let i = 0; i < Math.min(total, inputTokens.length); i++) {
    if (refTokens[i] === inputTokens[i]) {
      matchedCount++
    } else {
      break
    }
  }

  const isComplete = matchedCount === total && inputTokens.length === total

  return {
    matchedCount,
    totalCount: total,
    inputCount: inputTokens.length,
    isComplete,
    firstMismatchIndex: isComplete ? null : matchedCount,
  }
}

export function matchText(ref: string, input: string, mode: MatchMode): TokenMatch {
  const refTokens = normalizeTokens(tokenize(ref), mode)
  const inputTokens = normalizeTokens(tokenize(input), mode)
  return compareTokens(refTokens, inputTokens)
}
