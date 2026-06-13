const ONES_CARD = [
  'zero','one','two','three','four','five','six','seven','eight','nine',
  'ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen',
  'seventeen','eighteen','nineteen',
] as const

const TENS_CARD = [
  '','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety',
] as const

const ONES_ORD = [
  'zeroth','first','second','third','fourth','fifth','sixth','seventh',
  'eighth','ninth','tenth','eleventh','twelfth','thirteenth','fourteenth',
  'fifteenth','sixteenth','seventeenth','eighteenth','nineteenth',
] as const

const TENS_ORD = [
  '','','twentieth','thirtieth','fortieth','fiftieth',
  'sixtieth','seventieth','eightieth','ninetieth',
] as const

function ordSuffix(n: number): string {
  const t = n % 100, u = n % 10
  if (t >= 11 && t <= 13) return 'th'
  if (u === 1) return 'st'
  if (u === 2) return 'nd'
  if (u === 3) return 'rd'
  return 'th'
}

// Strip trailing sentence terminator from a normalized token.
function splitTerm(tok: string): [string, string] {
  const last = tok.length > 0 ? tok[tok.length - 1] : ''
  return (last === '.' || last === '?') ? [tok.slice(0, -1), last] : [tok, '']
}

// Parse 0–99 (or an ordinal in that range) starting at tokens[start].
// Sentence terminators on non-last tokens abort extension.
function parseTens(tokens: string[], start: number): [number, number, boolean] | null {
  if (start >= tokens.length) return null
  const [b, ] = splitTerm(tokens[start])
  if (!b) return null

  const oo = ONES_ORD.indexOf(b as typeof ONES_ORD[number])
  if (oo !== -1) return [oo, 1, true]

  const to = TENS_ORD.indexOf(b as typeof TENS_ORD[number])
  if (to >= 2) return [to * 10, 1, true]

  const oc = ONES_CARD.indexOf(b as typeof ONES_CARD[number])
  if (oc !== -1) {
    // Do not extend cardinal ones (0-19) to tens/hundreds here
    return [oc, 1, false]
  }

  const tc = TENS_CARD.indexOf(b as typeof TENS_CARD[number])
  if (tc < 2) return null

  const val = tc * 10
  const [, tFirst] = splitTerm(tokens[start])
  if (tFirst) return [val, 1, false]

  if (start + 1 < tokens.length) {
    const [b1,] = splitTerm(tokens[start + 1])
    const oc1 = ONES_CARD.indexOf(b1 as typeof ONES_CARD[number])
    if (oc1 >= 1 && oc1 <= 9) return [val + oc1, 2, false]
    const oo1 = ONES_ORD.indexOf(b1 as typeof ONES_ORD[number])
    if (oo1 >= 1 && oo1 <= 9) return [val + oo1, 2, true]
  }
  return [val, 1, false]
}

// Parse 0–999 (or ordinal) starting at tokens[start].
function parseHundreds(tokens: string[], start: number): [number, number, boolean] | null {
  const tens = parseTens(tokens, start)
  if (!tens) return null
  const [tensVal, tensN, tensOrd] = tens
  if (tensOrd || tensVal === 0) return tens

  // Guard: last token of the tens group must not end a sentence to allow extension
  const [, tLast] = splitTerm(tokens[start + tensN - 1])
  if (tLast) return tens

  if (start + tensN >= tokens.length) return tens
  const [b1, t1] = splitTerm(tokens[start + tensN])
  if (b1 !== 'hundred') return tens

  let val = tensVal * 100
  let n = tensN + 1
  if (t1) return [val, n, false]

  // Optional "and" connector
  let m = n
  if (start + m < tokens.length) {
    const [b2, t2] = splitTerm(tokens[start + m])
    if (b2 === 'and') {
      if (t2) return [val, n, false]
      m++
    }
    const sub = parseTens(tokens, start + m)
    if (sub && sub[0] > 0 && sub[0] < 100) {
      val += sub[0]
      return [val, m + sub[1], sub[2]]
    }
  }
  return [val, n, false]
}

// Parse 0–9999 (or ordinal) starting at tokens[start].
function parseRun(tokens: string[], start: number): [number, number, boolean] | null {
  const hundreds = parseHundreds(tokens, start)
  if (!hundreds) return null
  const [hVal, hN, hOrd] = hundreds
  if (hOrd || hVal === 0) return hundreds

  const [, tLast] = splitTerm(tokens[start + hN - 1])
  if (tLast) return hundreds

  if (start + hN >= tokens.length) return hundreds
  const [b1, t1] = splitTerm(tokens[start + hN])
  if (b1 !== 'thousand') return hundreds

  let val = hVal * 1000
  let n = hN + 1
  if (t1) return [val, n, false]

  let m = n
  if (start + m < tokens.length) {
    const [b2, t2] = splitTerm(tokens[start + m])
    if (b2 === 'and') {
      if (t2) return [val, n, false]
      m++
    }
    const sub = parseHundreds(tokens, start + m)
    if (sub && sub[0] > 0 && sub[0] < 1000) {
      val += sub[0]
      return [val, m + sub[1], sub[2]]
    }
  }
  return [val, n, false]
}

// Replace runs of number words with their digit equivalents.
// Preserves sentence terminators (. or ?) on the last token of each run.
export function canonicalizeNumbers(tokens: string[]): string[] {
  const result: string[] = []
  let i = 0

  while (i < tokens.length) {
    const run = parseRun(tokens, i)
    if (run) {
      const [value, consumed, isOrdinal] = run
      const [, term] = splitTerm(tokens[i + consumed - 1])
      const suffix = isOrdinal ? ordSuffix(value) : ''
      result.push(String(value) + suffix + term)
      i += consumed
    } else {
      result.push(tokens[i])
      i++
    }
  }

  return result
}
