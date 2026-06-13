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
  {
    id: 'sunny-hillside-stream',
    text: 'The sun comes up slowly over the green hills and light falls across the wide field below. A soft wind moves through the long grass and the tops of the trees begin to sway. Birds sit in the high branches and call out into the clear air. A small stream runs along the far edge of the field where the ground is wet and dark. Tall reeds grow by the water and bend when the wind picks up. The sky turns a deep blue and the few white clouds drift toward the far hills. The whole place feels still and calm. Now and then a leaf falls and turns as it goes down to the ground.',
  },
  {
    id: 'morning-tea-table',
    text: 'Every morning she makes a cup of tea and sits at the table by the window. She puts her hands around the warm cup and looks out at the street. The light comes in slow and soft. After a few minutes she gets up and goes to the kitchen to make some food. She takes bread from the bag on the counter and puts it in the pan. When the bread is ready she puts it on a plate and takes it back to the table. She sits down again and eats in the quiet of the room. Then she picks up her book and reads for a while before the day gets going.',
  },
  {
    id: 'harbour-morning',
    text: 'Every morning the fishermen carried their boats down to the water and pushed out into the harbour before the town had properly woken. The sea was grey and still, broken only by the gentle movement of the buoys and the occasional diving bird. By the time the sun came over the hill, the men had already pulled in their first nets and sorted the fish into large baskets. Gulls circled and called above them, waiting for scraps. The smell of salt and fish drifted up the old street to the bakery, where the owner was sliding fresh bread into the oven. A few early walkers stopped on the pier to watch the boats return, their bright hulls catching the pale morning light. It was a slow, steady rhythm that the town had kept for many years.',
  },
  {
    id: 'coral-reef-biome',
    text: 'Beneath the photic zone of a coral reef, calcified skeletons of colonial polyps form intricate aragonite frameworks that accrete over millennia. Each polyp secretes a calcareous exoskeleton, anchoring itself to the substrate while symbiotic zooxanthellae photosynthesise within its gastrodermal tissue. When seawater temperatures rise anomalously, the polyps expel their endosymbiotic algae, triggering bleaching events that destabilise the entire biome. Coralline algae encrust the interstices between corallites, binding the reef matrix and resisting hydrodynamic scour. Storm-generated turbulence fragments branching acroporid colonies, yet these dislodged thalli can propagate vegetatively on rubble substrates. Parrotfish graze the epilithic algal matrix with fused beaklike dentition, excreting fine carbonate sediment that accumulates as biogenic sand. Sponges and crinoids filter particulate organic matter from the plankton-rich thermocline, while mantis shrimp excavate burrows in the unconsolidated calcareous substrate beneath the reef crest.',
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
