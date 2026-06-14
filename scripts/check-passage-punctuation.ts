import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

interface PassageRaw {
  id: string
  sizeVariant: string
  text: string
}

type Warning = {
  code: string
  label: string
  test: (text: string) => boolean
}

const WARNINGS: Warning[] = [
  {
    code: 'hyphen',
    label: 'intra-word hyphen (normalizer joins → one token; STT emits two)',
    test: t => /[A-Za-z]-[A-Za-z]/.test(t),
  },
  {
    code: 'emdash-nospace',
    label: 'no-space em-dash (normalizer joins adjacent words into one token)',
    test: t => /[A-Za-z]—[A-Za-z]/.test(t),
  },
  {
    code: 'slash-word',
    label: 'intra-word slash (normalizer joins → one token; STT emits two)',
    test: t => /[A-Za-z]\/[A-Za-z]/.test(t),
  },
  {
    code: 'quotes',
    label: 'dialogue quotes (STT rarely emits quotation marks)',
    test: t => /[""""«»„]/.test(t) || /"[^"]*"/.test(t),
  },
  {
    code: 'emdash',
    label: 'em-dash or en-dash (STT typically omits)',
    test: t => /[—–]|--/.test(t),
  },
  {
    code: 'ellipsis',
    label: 'ellipsis (may confuse sentence-boundary detection)',
    test: t => /\.{3}|…/.test(t),
  },
  {
    code: 'parens',
    label: 'parentheses or brackets (STT usually omits)',
    test: t => /[()[\]{}]/.test(t),
  },
  {
    code: 'semicolon',
    label: 'semicolon (STT rarely emits)',
    test: t => /;/.test(t),
  },
  {
    code: 'colon',
    label: 'colon (STT rarely emits)',
    test: t => /:/.test(t),
  },
]

const passages: PassageRaw[] = JSON.parse(
  readFileSync(resolve(ROOT, 'data/passages.json'), 'utf-8')
)

// Only check medium variants — they are the source text; small/large/xlarge are derived
const mediumPassages = passages.filter(p => p.sizeVariant === 'medium')

type Result = { id: string; warnings: string[] }
const blocking: Result[] = []
const advisory: Result[] = []

const BLOCKING_CODES = new Set(['hyphen', 'emdash-nospace', 'slash-word'])

for (const p of mediumPassages) {
  const hits = WARNINGS.filter(w => w.test(p.text))
  if (hits.length === 0) continue

  const isBlocking = hits.some(w => BLOCKING_CODES.has(w.code))
  const target = isBlocking ? blocking : advisory
  target.push({ id: p.id, warnings: hits.map(w => `[${w.code}] ${w.label}`) })
}

const total = mediumPassages.length
const clean = total - blocking.length - advisory.length

console.log(`Checked ${total} medium passages\n`)

if (blocking.length > 0) {
  console.log(`BLOCKING (${blocking.length}) — scoring bugs, must fix:`)
  for (const r of blocking) {
    console.log(`  ${r.id}`)
    for (const w of r.warnings) console.log(`    ! ${w}`)
  }
  console.log()
}

if (advisory.length > 0) {
  console.log(`ADVISORY (${advisory.length}) — cosmetic/minor, acceptable:`)
  for (const r of advisory) {
    console.log(`  ${r.id}`)
    for (const w of r.warnings) console.log(`    ~ ${w}`)
  }
  console.log()
}

console.log(`Clean (${clean}): no punctuation issues`)
