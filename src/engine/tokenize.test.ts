import { describe, expect, test } from 'vitest'
import { tokenize, countTokens } from './tokenize'

describe('tokenize', () => {
  test('splits on whitespace', () => {
    expect(tokenize('hello world')).toEqual(['hello', 'world'])
  })

  test('trims leading/trailing whitespace', () => {
    expect(tokenize('  hello world  ')).toEqual(['hello', 'world'])
  })

  test('collapses multiple spaces', () => {
    expect(tokenize('hello   world')).toEqual(['hello', 'world'])
  })

  test('preserves punctuation attached to words', () => {
    expect(tokenize('Hello, world!')).toEqual(['Hello,', 'world!'])
  })

  test('handles newlines as whitespace', () => {
    expect(tokenize('hello\nworld')).toEqual(['hello', 'world'])
  })

  test('empty string returns empty array', () => {
    expect(tokenize('')).toEqual([])
  })

  test('whitespace-only string returns empty array', () => {
    expect(tokenize('   ')).toEqual([])
  })
})

describe('countTokens', () => {
  test('counts words correctly', () => {
    expect(countTokens('one two three')).toBe(3)
  })

  test('empty string is zero', () => {
    expect(countTokens('')).toBe(0)
  })
})
