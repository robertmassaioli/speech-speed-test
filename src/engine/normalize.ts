import type { MatchMode } from './types'
import { canonicalizeNumbers } from './numbers'

// Abbreviations whose trailing dot is NOT a sentence terminator.
const ABBREV_SET = new Set([
  'dr', 'mr', 'mrs', 'ms', 'jr', 'sr', 'st', 'prof',
  'rev', 'gen', 'col', 'lt', 'sgt', 'capt', 'maj', 'brig',
  'ave', 'blvd', 'vs', 'etc', 'approx', 'dept', 'govt', 'inc', 'ltd',
])

// In lexical mode:
//   - Strip all punctuation that isn't a sentence terminator candidate (.!?)
//   - Sentence terminators at end of token are preserved as class markers:
//       . and ! (statement class) → normalised to .
//       ?       (question class)  → kept as ?
//   - Exceptions: abbreviations (Dr., Mr., etc.) and decimals (3.14)
//     have their dot stripped rather than treated as a terminator.
//
// Strict mode: pass token through unchanged.
//
// Note: in lexical mode refTokens.length may differ from rawTokens.length
// when number canonicalization collapses multi-word spans (e.g. "twenty five"
// → "25"). The highlighting index in TestScreen is therefore only reliable
// for passages that contain no spelled-out numbers (see Phase 1f roadmap note).
function normalizeToken(token: string, mode: MatchMode): string {
  if (mode === 'strict') return token

  // 1. Strip everything except alphanumeric and terminator candidates.
  const stripped = token.toLowerCase().replace(/[^a-z0-9.!?]/g, '')
  if (!stripped) return ''

  const last = stripped[stripped.length - 1]

  if (last === '.' || last === '!' || last === '?') {
    const body = stripped.slice(0, -1)
    const alphaNum = body.replace(/[^a-z0-9]/g, '')

    if (last === '?') {
      return alphaNum ? alphaNum + '?' : ''
    }

    // Statement class (. or !)
    if (!alphaNum) return ''  // standalone terminator → filter

    // Internal dots indicate abbreviation (U.S., e.g.) or decimal (3.14)
    if (body.includes('.')) return alphaNum

    // Known abbreviation list (Dr., Mr., etc.)
    if (ABBREV_SET.has(alphaNum)) return alphaNum

    // Genuine statement terminator — normalise ! → .
    return alphaNum + '.'
  }

  // No trailing terminator: strip remaining punctuation
  return stripped.replace(/[^a-z0-9]/g, '')
}

export function normalizeTokens(tokens: string[], mode: MatchMode): string[] {
  const normalized = tokens
    .map(t => normalizeToken(t, mode))
    .filter(t => t.length > 0)

  if (mode === 'lexical') {
    return canonicalizeNumbers(normalized)
  }
  return normalized
}
