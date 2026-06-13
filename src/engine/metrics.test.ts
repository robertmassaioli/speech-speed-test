import { describe, expect, test } from 'vitest'
import { calcWpm, calcCpm } from './metrics'

describe('calcWpm', () => {
  test('100 words in 60 s = 100 wpm', () => {
    expect(calcWpm(100, 60)).toBe(100)
  })

  test('50 words in 30 s = 100 wpm', () => {
    expect(calcWpm(50, 30)).toBe(100)
  })

  test('150 words in 60 s = 150 wpm', () => {
    expect(calcWpm(150, 60)).toBe(150)
  })

  test('zero elapsed returns 0', () => {
    expect(calcWpm(100, 0)).toBe(0)
  })

  test('negative elapsed returns 0', () => {
    expect(calcWpm(100, -1)).toBe(0)
  })
})

describe('calcCpm', () => {
  test('600 chars in 60 s = 600 cpm', () => {
    expect(calcCpm(600, 60)).toBe(600)
  })

  test('300 chars in 30 s = 600 cpm', () => {
    expect(calcCpm(300, 30)).toBe(600)
  })

  test('zero elapsed returns 0', () => {
    expect(calcCpm(600, 0)).toBe(0)
  })
})
