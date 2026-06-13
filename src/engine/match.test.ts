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

describe('matchText — lexical: non-terminator punctuation', () => {
  test('matches case-insensitively', () => {
    expect(matchText('Hello World', 'hello world', 'lexical').isComplete).toBe(true)
  })

  test('comma in reference is stripped', () => {
    expect(matchText('Hello, world.', 'hello world.', 'lexical').isComplete).toBe(true)
  })

  test('comma in input is stripped', () => {
    expect(matchText('Hello world.', 'hello, world.', 'lexical').isComplete).toBe(true)
  })

  test('possessives match stripped form', () => {
    expect(matchText("Pip's pond.", 'pips pond.', 'lexical').isComplete).toBe(true)
  })

  test('partial input returns correct matchedCount', () => {
    const r = matchText('the cat sat on the mat.', 'the cat', 'lexical')
    expect(r.matchedCount).toBe(2)
    expect(r.isComplete).toBe(false)
  })
})

describe('matchText — lexical: sentence terminators', () => {
  test('statement class: . and ! are interchangeable', () => {
    expect(matchText('Stop.', 'Stop!', 'lexical').isComplete).toBe(true)
    expect(matchText('Stop!', 'Stop.', 'lexical').isComplete).toBe(true)
  })

  test('question class: ? is distinct and must match ?', () => {
    expect(matchText('Why?', 'Why?', 'lexical').isComplete).toBe(true)
    expect(matchText('Why?', 'Why.', 'lexical').isComplete).toBe(false)
    expect(matchText('Why?', 'Why!', 'lexical').isComplete).toBe(false)
    expect(matchText('Why.', 'Why?', 'lexical').isComplete).toBe(false)
  })

  test('missing terminator in input does not complete', () => {
    expect(matchText('hello.', 'hello', 'lexical').isComplete).toBe(false)
  })

  test('extra terminator in input does not complete if reference has none', () => {
    expect(matchText('hello', 'hello.', 'lexical').isComplete).toBe(false)
  })

  test('multi-sentence: terminators must align', () => {
    expect(matchText('Hello. World.', 'hello! world.', 'lexical').isComplete).toBe(true)
    expect(matchText('Hello. World?', 'hello. world.', 'lexical').isComplete).toBe(false)
  })

  test('abbreviation does not create false sentence boundary', () => {
    expect(matchText('Dr. Smith arrived.', 'dr smith arrived.', 'lexical').isComplete).toBe(true)
  })
})

describe('matchText — lexical: number canonicalization', () => {
  test('spelled number matches digit form', () => {
    expect(matchText('twenty five', '25', 'lexical').isComplete).toBe(true)
    expect(matchText('25', 'twenty five', 'lexical').isComplete).toBe(true)
  })

  test('ordinal: third matches 3rd', () => {
    expect(matchText('in third place.', 'in 3rd place.', 'lexical').isComplete).toBe(true)
  })
})

describe('matchText — strict', () => {
  test('is case-sensitive', () => {
    expect(matchText('Hello', 'hello', 'strict').isComplete).toBe(false)
  })

  test('exact match completes', () => {
    expect(matchText('Hello World', 'Hello World', 'strict').isComplete).toBe(true)
  })

  test('punctuation must match exactly', () => {
    expect(matchText('Hello, world.', 'Hello world', 'strict').isComplete).toBe(false)
  })

  test('period and exclamation are distinct in strict mode', () => {
    expect(matchText('Stop.', 'Stop!', 'strict').isComplete).toBe(false)
  })
})
