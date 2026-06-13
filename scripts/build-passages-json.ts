import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildTierMap, computeComposition } from '../src/corpus/tiers.ts'
import { tokenize } from '../src/engine/tokenize.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const tierMap = buildTierMap(
  readFileSync(resolve(ROOT, 'data/google-10000-english-no-swears.txt'), 'utf-8').split('\n'),
)

// Source of truth for passage texts.  Composition is computed from the tier map;
// wordCount and charCount are derived at browser load time from text.
const SOURCES = [
  {
    id: 'bunny-and-duck',
    text: 'Bella the bunny lived at the edge of a wide green meadow. Every morning she would hop down to the pond to watch the sun rise over the water. One day she found a small duck sitting alone on the bank. His name was Pip, and he looked very sad. So the two of them set off together. Bella hopped through the tall grass and Pip waddled along beside her. They crossed a little wooden bridge and followed the stream around a bend. Then Pip stopped. He lifted his head and listened. From somewhere ahead came the soft sound of splashing and quacking. Bella smiled and waved her paw. From that day on, the bunny and the duck met every morning at the pond, and neither of them was ever lonely again.',
  },
]

const passages = SOURCES.map(({ id, text }) => {
  const comp = computeComposition(tokenize(text), tierMap)
  return {
    id,
    text,
    composition: { t1: comp.t1, t2: comp.t2, t3: comp.t3, t4: comp.t4, total: comp.total },
  }
})

const outPath = resolve(ROOT, 'data/passages.json')
writeFileSync(outPath, JSON.stringify(passages, null, 2) + '\n')
console.log(`Wrote ${passages.length} passage(s) → ${outPath}`)
for (const p of passages) {
  const { t1, t2, t3, t4, total } = p.composition
  console.log(`  ${p.id}: T1=${t1} T2=${t2} T3=${t3} T4=${t4} total=${total}`)
}
