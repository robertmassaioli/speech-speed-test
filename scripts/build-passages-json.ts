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
  // ── Batch 2 — easy ────────────────────────────────────────────────────────
  {
    id: 'quiet-night-sky',
    text: 'The sky grows dark and the stars come out one by one. The moon is low and its light falls soft on the land below. A cold wind moves through the long grass and the trees stand still at the edge of the field. Far above, the deep black of night stretches wide from one end of the sky to the other. No clouds pass and no birds call. The air is clear and the stars shine bright and hard. The moon moves slow across the sky and its pale light covers the ground in a thin white glow. All things rest and the world is still and quiet under the wide night sky.',
  },
  {
    id: 'children-in-the-park',
    text: 'Children run across the wide green field, and their feet kick up small clouds of dust as they go. Some of them stop near the big oak tree to catch their breath, while others keep going all the way to the far end of the park. A few kids sit on the grass and pull at long blades with their fingers. One boy throws a red ball high into the air and watches it fall back down. A girl runs fast to catch it before it hits the ground. They call out to each other with loud, bright voices that fill the open air. Some children swing back and forth on the swings, pushing their feet up toward the blue sky. The day is warm and the sun is out, and no one wants to go home yet.',
  },
  {
    id: 'cat-at-the-window',
    text: 'The cat walks slowly across the floor and finds a warm spot near the window. It turns around once and then lies down in the soft light. Its eyes close and it rests there for a long time. Now and then its ears move when a sound comes from outside. In the afternoon it gets up and stretches out its front legs, then its back legs. It walks to the kitchen and sits near its bowl. After it eats it goes back to the window and sits up tall, looking out at the garden. A bird lands on the grass and the cat watches it very closely. Its tail moves from side to side. The bird flies away and the cat turns and walks down the hall to find another quiet place to sleep.',
  },
  {
    id: 'garden-rain',
    text: 'Rain falls soft and steady on the garden. Each drop lands on a leaf and runs down to the ground below. The soil turns dark as it gets wet and water starts to pool in the low spots. Flowers bend their heads under the weight of the drops. The air feels cool and clean. A light mist rises from the earth where the rain hits the dry ground hard. The sound is soft at first, then grows as more rain comes down fast. Puddles form along the edges of the path. The garden looks greener and fresher with each passing moment. Every plant drinks in the water and the whole place feels alive again after a long dry spell.',
  },
  // ── Batch 2 — medium ──────────────────────────────────────────────────────
  {
    id: 'autumn-forest-walk',
    text: 'The leaves had turned to copper and gold and they drifted down through the still morning air. She walked along the narrow path between the oaks, her boots pressing softly into the wet leaf litter below. Pale light filtered through the canopy above and fell in scattered patches on the forest floor. The scent of damp earth and fallen leaves drifted on the breeze. Here and there a branch had fallen in the night and lay across the path. Somewhere deeper in the trees a bird was calling in a slow and steady way. The air was crisp and cool against her face. The morning felt unhurried and she walked on without any rush, glad to be out among the tall trees on such a calm and golden autumn day.',
  },
  {
    id: 'used-bookshop-browse',
    // "second-hand" removed: normaliser collapses hyphenated compounds to one token that STT cannot reproduce
    text: 'The used bookshop had a quiet feeling that invited lingering. Shelves of books lined every wall from floor to ceiling, their worn covers faded to soft colours. A man browsed slowly down the central aisle, scanning the titles on each spine as he passed. He pulled out a slim volume, glanced at the opening page, then slid it back and moved on. Some of the books had short notes written inside the front cover in faint pencil. A long table near the window held stacks of paperbacks arranged by subject. Dust drifted in the pale light that came through the glass. The man had not planned to stay long, but the shelves kept drawing him deeper into the shop. He found a novel he had been searching for over several years and carried it to the counter feeling quietly pleased.',
  },
  {
    id: 'village-in-winter',
    text: 'In winter the village streets are cold and still before dawn. Frost covers the cobblestones and the rooftops, and thin curls of smoke rise from the chimneys along the lane. The baker is already at work, and the smell of fresh bread drifts out into the frozen air. A few villagers pull their coats tight and walk quickly across the square to the market, where vendors stamp their feet and breathe into their cold hands. The pond at the edge of the village has frozen over, and children gather there after school to slide across its surface. By dusk the shutters are drawn and lanterns glow behind frosted glass. The village settles into a quiet that only winter brings, and the snow that falls through the night covers every stone and rooftop.',
  },
  {
    id: 'farmer-planting-field',
    text: 'The farmer rose early and walked out to the field while the air was still cold. He had spent the previous days ploughing the soil until each furrow lay straight and even across the plot. Now he raked the seedbed smooth and broke up the larger clods of earth by hand. He scattered compost along each row before pressing seeds into the moist ground at careful intervals. The irrigation channel at the edge of the field would carry water to the roots once the dry weather returned. By midday he had planted the last of the crop and stood back to survey the fresh rows stretching toward the far hedge. The season had begun and the harvest was now only a matter of patience and steady care.',
  },
  // ── Batch 2 — hard ────────────────────────────────────────────────────────
  {
    id: 'medieval-masonry-stonework',
    // "wedge-shaped" → "wedge shaped", "load-bearing" → "load bearing" to avoid single-token compound mismatch
    text: 'Medieval masons dressed each block of ashlar with iron chisels, working each face to a flat and even surface before setting it in lime mortar. At corners, large quoins were laid in alternating stretcher and header bond to tie the wall and resist lateral thrust. Above doorways and window openings, a lintel of dressed stone or a row of wedge shaped voussoirs formed an arch that transferred the load to the piers on either side. Corbels of projecting masonry supported timber floor beams where no column could stand below. The mortar, mixed from quicklime and coarse sand, was allowed to cure slowly so that it hardened into a matrix binding each course to the next. Skilled stonecutters gauged the grain of each block before cutting, working with the natural bed of the stone to prevent future spalling under compressive stress.',
  },
  {
    id: 'blacksmith-forging-iron',
    // "yellow-white" → "pale yellow" to avoid single-token compound mismatch
    text: 'The blacksmith gripped the pig iron billet with heavy tongs and thrust it into the forge where the bellows fed the fire to a bright orange heat. When the metal reached a pale yellow glow, he carried it to the anvil and began to draw it out with firm hammer blows, working the fuller down the bar to thin and lengthen the stock. Slag fell away in bright sparks with each strike. He returned the piece to the fire twice, watching the colour rise. Then he dressed the edges on the hardy, used a swage to round the profile, and applied flux before a final weld heat. The quench came last, a sharp hiss as the wrought iron plunged into the brine trough. Correct temper showed in the pale straw colour that spread along the cooled blade.',
  },
  {
    id: 'lava-and-igneous-rock',
    // "Low-viscosity", "Higher-viscosity", "silica-rich" rewritten to remove hyphens
    text: 'When magma reaches the surface it becomes lava, and the way it cools determines the texture of the resulting igneous rock. Basaltic lava of low viscosity spreads rapidly in thin sheets, sometimes flowing through lava tubes that insulate the molten interior from cooling air above. As the outer crust solidifies, the tube preserves a channel of flowing material far from the volcanic vent. Rhyolitic and andesitic magmas of higher viscosity can trap gases, producing pyroclastic flows and scoria when erupted violently. Rapid quenching at the surface produces obsidian, a volcanic glass with a conchoidal fracture. Where subduction drives oceanic crust beneath a continent, the melting of hydrated basalt generates magmas rich in silica that feed stratovolcanoes. Over time, erupted tephra and lava accumulate, building the flanks of the edifice layer by layer until a caldera collapses above the emptied magma chamber.',
  },
  {
    id: 'silk-textile-weaving',
    text: 'Sericulture begins when silkworm cocoons are harvested and submerged in hot water for degumming, softening the sericin protein that binds each filament. The reeling operator draws several filaments together onto a bobbin, producing thrown silk of consistent denier. On the loom, the weaver first threads the warp yarns through the heddles and then through the reed, fixing the width and selvedge of the cloth. Each pass of the shuttle carries the weft thread across the shed, and the treadle controls which heddle rises to form the next opening. A plain weave interlaces each weft thread over and under single warp ends, while a twill or satin weave skips multiple ends to create a smoother, more lustrous surface. Once woven, the cloth is mordanted so that dye fixes permanently to the fibre.',
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
