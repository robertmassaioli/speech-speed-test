import { describe, expect, test } from 'vitest'
import { canonicalizeNumbers } from './numbers'

function cn(tokens: string[]): string[] {
  return canonicalizeNumbers(tokens)
}

describe('canonicalizeNumbers — cardinal ones', () => {
  test('zero', () => expect(cn(['zero'])).toEqual(['0']))
  test('one', () => expect(cn(['one'])).toEqual(['1']))
  test('five', () => expect(cn(['five'])).toEqual(['5']))
  test('ten', () => expect(cn(['ten'])).toEqual(['10']))
  test('eleven', () => expect(cn(['eleven'])).toEqual(['11']))
  test('nineteen', () => expect(cn(['nineteen'])).toEqual(['19']))
})

describe('canonicalizeNumbers — cardinal tens', () => {
  test('twenty', () => expect(cn(['twenty'])).toEqual(['20']))
  test('thirty', () => expect(cn(['thirty'])).toEqual(['30']))
  test('ninety', () => expect(cn(['ninety'])).toEqual(['90']))
})

describe('canonicalizeNumbers — compound tens+ones', () => {
  test('twenty one', () => expect(cn(['twenty', 'one'])).toEqual(['21']))
  test('twenty five', () => expect(cn(['twenty', 'five'])).toEqual(['25']))
  test('thirty two', () => expect(cn(['thirty', 'two'])).toEqual(['32']))
  test('ninety nine', () => expect(cn(['ninety', 'nine'])).toEqual(['99']))
})

describe('canonicalizeNumbers — ordinals', () => {
  test('first → 1st', () => expect(cn(['first'])).toEqual(['1st']))
  test('second → 2nd', () => expect(cn(['second'])).toEqual(['2nd']))
  test('third → 3rd', () => expect(cn(['third'])).toEqual(['3rd']))
  test('fourth → 4th', () => expect(cn(['fourth'])).toEqual(['4th']))
  test('fifth → 5th', () => expect(cn(['fifth'])).toEqual(['5th']))
  test('eleventh → 11th', () => expect(cn(['eleventh'])).toEqual(['11th']))
  test('twelfth → 12th', () => expect(cn(['twelfth'])).toEqual(['12th']))
  test('twentieth → 20th', () => expect(cn(['twentieth'])).toEqual(['20th']))
  test('thirtieth → 30th', () => expect(cn(['thirtieth'])).toEqual(['30th']))
})

describe('canonicalizeNumbers — compound ordinals', () => {
  test('twenty first → 21st', () => expect(cn(['twenty', 'first'])).toEqual(['21st']))
  test('twenty second → 22nd', () => expect(cn(['twenty', 'second'])).toEqual(['22nd']))
  test('twenty third → 23rd', () => expect(cn(['twenty', 'third'])).toEqual(['23rd']))
  test('thirty first → 31st', () => expect(cn(['thirty', 'first'])).toEqual(['31st']))
})

describe('canonicalizeNumbers — hundreds', () => {
  test('one hundred → 100', () => expect(cn(['one', 'hundred'])).toEqual(['100']))
  test('two hundred → 200', () => expect(cn(['two', 'hundred'])).toEqual(['200']))
  test('one hundred five → 105', () =>
    expect(cn(['one', 'hundred', 'five'])).toEqual(['105']))
  test('one hundred and five → 105', () =>
    expect(cn(['one', 'hundred', 'and', 'five'])).toEqual(['105']))
  test('three hundred and twenty five → 325', () =>
    expect(cn(['three', 'hundred', 'and', 'twenty', 'five'])).toEqual(['325']))
})

describe('canonicalizeNumbers — thousands', () => {
  test('one thousand → 1000', () => expect(cn(['one', 'thousand'])).toEqual(['1000']))
  test('two thousand → 2000', () => expect(cn(['two', 'thousand'])).toEqual(['2000']))
  test('one thousand five → 1005', () =>
    expect(cn(['one', 'thousand', 'five'])).toEqual(['1005']))
  test('one thousand and one → 1001', () =>
    expect(cn(['one', 'thousand', 'and', 'one'])).toEqual(['1001']))
  test('two thousand and twenty five → 2025', () =>
    expect(cn(['two', 'thousand', 'and', 'twenty', 'five'])).toEqual(['2025']))
  test('nine thousand nine hundred and ninety nine → 9999', () =>
    expect(cn(['nine','thousand','nine','hundred','and','ninety','nine'])).toEqual(['9999']))
  test('thirty thousand → 30000', () =>
    expect(cn(['thirty', 'thousand'])).toEqual(['30000']))
})

describe('canonicalizeNumbers — sentence terminators', () => {
  test('terminator on single number token is preserved', () => {
    expect(cn(['five.'])).toEqual(['5.'])
  })

  test('terminator on last token of multi-word number is preserved', () => {
    expect(cn(['twenty', 'five.'])).toEqual(['25.'])
  })

  test('question terminator preserved on ordinal', () => {
    expect(cn(['third?'])).toEqual(['3rd?'])
  })

  test('sentence boundary stops run: twenty. five → 20. 5', () => {
    expect(cn(['twenty.', 'five'])).toEqual(['20.', '5'])
  })

  test('sentence boundary in hundreds: one hundred. five → 100. 5', () => {
    expect(cn(['one', 'hundred.', 'five'])).toEqual(['100.', '5'])
  })
})

describe('canonicalizeNumbers — non-number tokens', () => {
  test('non-number words are unchanged', () => {
    expect(cn(['hello', 'world'])).toEqual(['hello', 'world'])
  })

  test('digit strings already in form pass through', () => {
    expect(cn(['25', 'cats'])).toEqual(['25', 'cats'])
  })

  test('mixed: number words within sentence', () => {
    expect(cn(['the', 'five', 'cats'])).toEqual(['the', '5', 'cats'])
  })

  test('mixed: number at end with terminator', () => {
    expect(cn(['count', 'is', 'twenty.'])).toEqual(['count', 'is', '20.'])
  })

  test('empty array', () => expect(cn([])).toEqual([]))
})

describe('canonicalizeNumbers — greedy parsing', () => {
  test('"twenty twenty" → "2020" (greedy, not "20 20")', () => {
    // twenty(20) + twenty(20) — second twenty is NOT in range 1-9 so won't combine
    // Result: two separate 20s
    expect(cn(['twenty', 'twenty'])).toEqual(['20', '20'])
  })

  test('"one two" → "1 2" (ones do not greedily chain)', () => {
    expect(cn(['one', 'two'])).toEqual(['1', '2'])
  })
})
