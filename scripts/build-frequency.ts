import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildTierMap, type Tier } from '../src/corpus/tiers.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DATA_DIR = resolve(ROOT, 'data')

const freqPath = resolve(DATA_DIR, 'google-10000-english-no-swears.txt')
const rankedWords = readFileSync(freqPath, 'utf-8').split('\n')

const tierMap = buildTierMap(rankedWords)

// Build word→tier object for JSON serialization.
// Tier 4 is the implicit default for any word not in the map, so we omit it.
const frequency: Record<string, Tier> = {}
for (const [word, tier] of tierMap) {
  frequency[word] = tier
}

const meta = {
  source: 'google-10000-english-no-swears.txt',
  sourceUrl:
    'https://github.com/first20hours/google-10000-english/blob/master/google-10000-english-no-swears.txt',
  // Fill in the git commit hash from first20hours/google-10000-english that you vendored.
  sourceCommit: null as string | null,
  wordCount: tierMap.size,
  tierThresholds: { T1_max: 100, T2_max: 1000, T3_max: null },
  generatedAt: new Date().toISOString(),
}

const frequencyOut = resolve(DATA_DIR, 'frequency.json')
const metaOut = resolve(DATA_DIR, 'frequency-meta.json')

writeFileSync(frequencyOut, JSON.stringify(frequency) + '\n')
writeFileSync(metaOut, JSON.stringify(meta, null, 2) + '\n')

console.log(`Wrote ${tierMap.size} words → ${frequencyOut}`)
console.log(`Wrote metadata       → ${metaOut}`)
console.log('NOTE: set sourceCommit in frequency-meta.json to the vendored git hash.')
