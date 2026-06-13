import { describe, expect, test } from 'vitest'
import { normalizeTokens } from './normalize'

describe('normalizeTokens — lexical: non-terminator punctuation', () => {
  test('lowercases tokens', () => {
    expect(normalizeTokens(['Hello', 'World'], 'lexical')).toEqual(['hello', 'world'])
  })

  test('strips commas', () => {
    expect(normalizeTokens(['hello,', 'world'], 'lexical')).toEqual(['hello', 'world'])
  })

  test('strips apostrophes from possessives', () => {
    expect(normalizeTokens(["Pip's"], 'lexical')).toEqual(['pips'])
  })

  test('strips apostrophes from contractions', () => {
    expect(normalizeTokens(["don't", "can't"], 'lexical')).toEqual(['dont', 'cant'])
  })

  test('strips hyphens (hyphenated compound becomes single token)', () => {
    expect(normalizeTokens(['well-known'], 'lexical')).toEqual(['wellknown'])
  })

  test('drops tokens that are pure non-terminator punctuation', () => {
    expect(normalizeTokens([',', ';', 'hello'], 'lexical')).toEqual(['hello'])
  })

  test('preserves digits', () => {
    expect(normalizeTokens(['3', 'things'], 'lexical')).toEqual(['3', 'things'])
  })

  test('decimal point is stripped (not a sentence terminator)', () => {
    expect(normalizeTokens(['3.14'], 'lexical')).toEqual(['314'])
  })
})

describe('normalizeTokens — lexical: sentence terminators', () => {
  test('period at end of word is preserved as statement terminator', () => {
    expect(normalizeTokens(['meadow.'], 'lexical')).toEqual(['meadow.'])
  })

  test('exclamation mark normalised to period (statement class)', () => {
    expect(normalizeTokens(['Stop!'], 'lexical')).toEqual(['stop.'])
  })

  test('question mark preserved as distinct class', () => {
    expect(normalizeTokens(['Why?'], 'lexical')).toEqual(['why?'])
  })

  test('standalone ! is filtered (no word body)', () => {
    expect(normalizeTokens(['!', 'hello'], 'lexical')).toEqual(['hello'])
  })

  test('standalone ? is filtered (no word body)', () => {
    expect(normalizeTokens(['?', 'hello'], 'lexical')).toEqual(['hello'])
  })

  test('abbreviation Dr. — dot stripped, not treated as sentence end', () => {
    expect(normalizeTokens(['Dr.'], 'lexical')).toEqual(['dr'])
  })

  test('abbreviation Mr. — dot stripped', () => {
    expect(normalizeTokens(['Mr.'], 'lexical')).toEqual(['mr'])
  })

  test('abbreviation etc. — dot stripped', () => {
    expect(normalizeTokens(['etc.'], 'lexical')).toEqual(['etc'])
  })

  test('U.S. abbreviation with internal dots — dots stripped', () => {
    expect(normalizeTokens(['U.S.'], 'lexical')).toEqual(['us'])
  })

  test('ellipsis-style token hello... — dots stripped, no terminator', () => {
    expect(normalizeTokens(['hello...'], 'lexical')).toEqual(['hello'])
  })

  test('trailing quote before period handled — world." → world.', () => {
    // The quote is stripped before terminator detection
    expect(normalizeTokens(['world."'], 'lexical')).toEqual(['world.'])
  })
})

describe('normalizeTokens — lexical: number canonicalization', () => {
  test('spelled number: twenty five → 25', () => {
    expect(normalizeTokens(['twenty', 'five'], 'lexical')).toEqual(['25'])
  })

  test('ordinal: third → 3rd', () => {
    expect(normalizeTokens(['third'], 'lexical')).toEqual(['3rd'])
  })

  test('ordinal: first → 1st', () => {
    expect(normalizeTokens(['first'], 'lexical')).toEqual(['1st'])
  })

  test('digit string already in canonical form passes through', () => {
    expect(normalizeTokens(['3rd'], 'lexical')).toEqual(['3rd'])
  })

  test('number at sentence end carries terminator: five. → 5.', () => {
    expect(normalizeTokens(['five.'], 'lexical')).toEqual(['5.'])
  })

  test('multi-word number at sentence end: twenty five. → 25.', () => {
    expect(normalizeTokens(['twenty', 'five.'], 'lexical')).toEqual(['25.'])
  })
})

describe('normalizeTokens — strict', () => {
  test('preserves case', () => {
    expect(normalizeTokens(['Hello', 'World'], 'strict')).toEqual(['Hello', 'World'])
  })

  test('preserves all punctuation', () => {
    expect(normalizeTokens(['hello,', 'world.'], 'strict')).toEqual(['hello,', 'world.'])
  })

  test('preserves apostrophes', () => {
    expect(normalizeTokens(["Pip's"], 'strict')).toEqual(["Pip's"])
  })

  test('does not canonicalize numbers', () => {
    expect(normalizeTokens(['twenty', 'five'], 'strict')).toEqual(['twenty', 'five'])
  })
})
