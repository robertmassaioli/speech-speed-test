import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildTierMap } from '../src/corpus/tiers.ts'
import { tokenize } from '../src/engine/tokenize.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const freqPath = resolve(ROOT, 'data', 'google-10000-english-no-swears.txt')
const tierMap = buildTierMap(readFileSync(freqPath, 'utf-8').split('\n'))

const arg = process.argv[2]
const text = readFileSync(arg, 'utf-8')
const tokens = tokenize(text)

const t4words: string[] = []
for (const tok of tokens) {
  const tier = tierMap.get(tok.toLowerCase()) ?? 4
  if (tier === 4) {
    t4words.push(tok)
  }
}
console.log('T4 words:', t4words.join(', '))
