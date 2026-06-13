export function tokenize(text: string): string[] {
  return text.trim().split(/\s+/).filter(t => t.length > 0)
}

export function countTokens(text: string): number {
  return tokenize(text).length
}
