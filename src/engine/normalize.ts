import type { MatchMode } from './types'

function normalizeToken(token: string, mode: MatchMode): string {
  if (mode === 'strict') return token
  return token.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function normalizeTokens(tokens: string[], mode: MatchMode): string[] {
  return tokens.map(t => normalizeToken(t, mode)).filter(t => t.length > 0)
}
