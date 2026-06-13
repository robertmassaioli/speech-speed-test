import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildTierMap, computeComposition, difficultyBin } from '../src/corpus/tiers.ts'
import { tokenize } from '../src/engine/tokenize.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const freqPath = resolve(ROOT, 'data', 'google-10000-english-no-swears.txt')
const tierMap = buildTierMap(readFileSync(freqPath, 'utf-8').split('\n'))

// Read passage text: first CLI arg = file path; otherwise read stdin (fd 0).
const arg = process.argv[2]
const text = arg ? readFileSync(arg, 'utf-8') : readFileSync(0, 'utf-8')

const tokens = tokenize(text)
const comp = computeComposition(tokens, tierMap)
const bin = difficultyBin(comp)

// ── Punctuation complexity checks ──────────────────────────────────────────

const warnings: string[] = []

if (/[""“”«»„]/.test(text) || /"[^"]*"/.test(text)) {
  warnings.push('dialogue quotes — STT rarely emits quotation marks')
}
if (/[—–—–]|--/.test(text)) {
  warnings.push('em-dash or en-dash — STT typically omits these')
}
if (/\.{3}|…/.test(text)) {
  warnings.push('ellipsis — may confuse sentence-boundary detection')
}
if (/[()[\]{}]/.test(text)) {
  warnings.push('parentheses or brackets — STT usually omits these')
}
if (/;/.test(text)) {
  warnings.push('semicolons — STT rarely emits these')
}
if (/:/.test(text)) {
  warnings.push('colons — STT rarely emits these')
}

// ── Report ──────────────────────────────────────────────────────────────────

function pct(n: number): string {
  return (n * 100).toFixed(1).padStart(5) + '%'
}

function pad(n: number, w: number): string {
  return String(n).padStart(w)
}

const W = 48
const SEP = '─'.repeat(W)

console.log(SEP)
console.log('  Passage Classification Report')
console.log(SEP)
console.log()
console.log(`  Words (alphabetic)   ${pad(comp.total, 6)}`)
console.log(`  Characters (raw)     ${pad(text.trim().length, 6)}`)
console.log()
console.log('  Tier composition')
console.log(`    T1  top 100          ${pad(comp.t1, 4)} words  ${pct(comp.p1)}`)
console.log(`    T2  101–1,000        ${pad(comp.t2, 4)} words  ${pct(comp.p2)}`)
console.log(`    T3  1,001–9,894      ${pad(comp.t3, 4)} words  ${pct(comp.p3)}`)
console.log(`    T4  not in list      ${pad(comp.t4, 4)} words  ${pct(comp.p4)}`)
console.log()
console.log(`  Vector  [${comp.p1.toFixed(3)}, ${comp.p2.toFixed(3)}, ${comp.p3.toFixed(3)}, ${comp.p4.toFixed(3)}]`)
console.log(`  Difficulty  ${bin}`)
console.log()
console.log('  Punctuation warnings')
if (warnings.length === 0) {
  console.log('    ✓ none')
} else {
  for (const w of warnings) {
    console.log(`    ! ${w}`)
  }
}
console.log(SEP)
