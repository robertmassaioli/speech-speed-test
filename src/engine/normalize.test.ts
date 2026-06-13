import { describe, expect, test } from 'vitest'
import { normalizeTokens } from './normalize'

describe('normalizeTokens — lexical', () => {
  test('lowercases tokens', () => {
    expect(normalizeTokens(['Hello', 'World'], 'lexical')).toEqual(['hello', 'world'])
  })

  test('strips trailing punctuation', () => {
    expect(normalizeTokens(['hello,', 'world!'], 'lexical')).toEqual(['hello', 'world'])
  })

  test('strips periods', () => {
    expect(normalizeTokens(['meadow.'], 'lexical')).toEqual(['meadow'])
  })

  test('drops tokens that are pure punctuation', () => {
    expect(normalizeTokens([',', '!', 'hello'], 'lexical')).toEqual(['hello'])
  })

  test('strips apostrophes from possessives', () => {
    expect(normalizeTokens(["Pip's"], 'lexical')).toEqual(['pips'])
  })

  test('strips apostrophes from contractions', () => {
    expect(normalizeTokens(["don't", "can't"], 'lexical')).toEqual(['dont', 'cant'])
  })

  test('preserves digits', () => {
    expect(normalizeTokens(['3', 'things'], 'lexical')).toEqual(['3', 'things'])
  })
})

describe('normalizeTokens — strict', () => {
  test('preserves case', () => {
    expect(normalizeTokens(['Hello', 'World'], 'strict')).toEqual(['Hello', 'World'])
  })

  test('preserves punctuation', () => {
    expect(normalizeTokens(['hello,', 'world.'], 'strict')).toEqual(['hello,', 'world.'])
  })

  test('preserves apostrophes', () => {
    expect(normalizeTokens(["Pip's"], 'strict')).toEqual(["Pip's"])
  })
})
