import { describe, expect, test } from 'vitest'
import { compareTokens, matchText } from './match'

describe('compareTokens', () => {
  test('complete match', () => {
    const r = compareTokens(['a', 'b', 'c'], ['a', 'b', 'c'])
    expect(r.isComplete).toBe(true)
    expect(r.matchedCount).toBe(3)
    expect(r.firstMismatchIndex).toBeNull()
  })

  test('partial match — input shorter than ref', () => {
    const r = compareTokens(['a', 'b', 'c'], ['a', 'b'])
    expect(r.isComplete).toBe(false)
    expect(r.matchedCount).toBe(2)
    expect(r.firstMismatchIndex).toBe(2)
  })

  test('mismatch at position 0', () => {
    const r = compareTokens(['a', 'b', 'c'], ['x', 'b', 'c'])
    expect(r.isComplete).toBe(false)
    expect(r.matchedCount).toBe(0)
    expect(r.firstMismatchIndex).toBe(0)
  })

  test('mismatch mid-stream stops prefix count', () => {
    const r = compareTokens(['a', 'b', 'c'], ['a', 'x', 'c'])
    expect(r.matchedCount).toBe(1)
    expect(r.firstMismatchIndex).toBe(1)
  })

  test('extra input tokens prevent completion', () => {
    const r = compareTokens(['a', 'b'], ['a', 'b', 'c'])
    expect(r.isComplete).toBe(false)
    expect(r.matchedCount).toBe(2)
    expect(r.firstMismatchIndex).toBe(2)
  })

  test('empty input', () => {
    const r = compareTokens(['a', 'b'], [])
    expect(r.isComplete).toBe(false)
    expect(r.matchedCount).toBe(0)
    expect(r.firstMismatchIndex).toBe(0)
  })

  test('both empty completes', () => {
    const r = compareTokens([], [])
    expect(r.isComplete).toBe(true)
    expect(r.matchedCount).toBe(0)
  })
})

describe('matchText — lexical', () => {
  test('matches case-insensitively', () => {
    expect(matchText('Hello World', 'hello world', 'lexical').isComplete).toBe(true)
  })

  test('ignores punctuation in reference', () => {
    expect(matchText('Hello, world.', 'hello world', 'lexical').isComplete).toBe(true)
  })

  test('ignores punctuation in input', () => {
    expect(matchText('Hello world', 'hello, world.', 'lexical').isComplete).toBe(true)
  })

  test('possessives match stripped form', () => {
    expect(matchText("Pip's pond", 'pips pond', 'lexical').isComplete).toBe(true)
  })

  test('partial input returns correct matchedCount', () => {
    const r = matchText('the cat sat on the mat', 'the cat', 'lexical')
    expect(r.matchedCount).toBe(2)
    expect(r.isComplete).toBe(false)
  })
})

describe('matchText — strict', () => {
  test('is case-sensitive', () => {
    expect(matchText('Hello', 'hello', 'strict').isComplete).toBe(false)
  })

  test('exact match completes', () => {
    expect(matchText('Hello World', 'Hello World', 'strict').isComplete).toBe(true)
  })

  test('punctuation must match', () => {
    expect(matchText('Hello, world.', 'Hello world', 'strict').isComplete).toBe(false)
  })
})
