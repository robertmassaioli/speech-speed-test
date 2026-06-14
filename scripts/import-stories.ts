import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

type StoryEntry = { id: string; text: string }

const ONES = [
  '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen',
]
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty']

function numToWords(n: number): string {
  if (n < 20) return ONES[n]
  const tens = TENS[Math.floor(n / 10)]
  const ones = ONES[n % 10]
  return ones ? `${tens} ${ones}` : tens
}

function timeToWords(h: string, m: string): string {
  const mins = parseInt(m)
  const hw = numToWords(parseInt(h))
  if (mins === 0) return hw
  if (mins < 10) return `${hw} oh ${numToWords(mins)}`
  return `${hw} ${numToWords(mins)}`
}

function timePeriod(hour: number, isPM: boolean): string {
  if (!isPM) return 'in the morning'
  if (hour === 12 || hour < 6) return 'in the afternoon'
  if (hour < 9) return 'in the evening'
  return 'at night'
}

// Fix all text issues that affect scoring or produce punctuation STT cannot emit:
// - Intra-word hyphens: "last-minute" → "last minute"
// - No-space em-dash: "word—word" → "word word"
// - Intra-word slashes: "and/or" → "and or"
// - Ellipsis: "Just… different" → "Just different"
// - Time colons: "4:52 PM" → "four fifty two in the afternoon"
// - List-introducing colons: "features: project" → "features, project"
function cleanText(raw: string): string {
  return raw
    .replace(/([A-Za-z])-([A-Za-z])/g, '$1 $2')
    .replace(/([A-Za-z])—([A-Za-z])/g, '$1 $2')
    .replace(/([A-Za-z])\/([A-Za-z])/g, '$1 $2')
    .replace(/…/g, '')
    .replace(/\.{3}/g, '')
    // Times with am/pm: "11:00 am" → "eleven in the morning"
    .replace(/\b(\d{1,2}):(\d{2})\s*(am|pm)\b/gi, (_, h, m, period) =>
      `${timeToWords(h, m)} ${timePeriod(parseInt(h), /pm/i.test(period))}`)
    // Times without am/pm: "11:59" → "eleven fifty nine"
    .replace(/\b(\d{1,2}):(\d{2})\b/g, (_, h, m) => timeToWords(h, m))
    .replace(/\s+/g, ' ')
    // List-introducing colons after letters/digits: "priorities: X" → "priorities, X"
    .replace(/([A-Za-z0-9]): /g, '$1, ')
    .trim()
}

function splitSections(content: string): string[] {
  return content.split(/\n\s*\*\*\*\s*\n/).map(s => s.trim()).filter(Boolean)
}

// ── Children's stories ──────────────────────────────────────────────────────
// Format: intro paragraph, then ### Title / body / Message: line sections

function parseChildrensStories(content: string): StoryEntry[] {
  const sections = splitSections(content)
  const stories: StoryEntry[] = []

  for (const section of sections) {
    const lines = section.split('\n')
    if (!lines[0].startsWith('### ')) continue

    const title = lines[0].replace(/^###\s+/, '')
    const id = title
      .toLowerCase()
      .replace(/^the\s+/, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')

    const body = lines
      .slice(1)
      .filter(l => !l.startsWith('Message:'))
      .join('\n')

    stories.push({ id, text: cleanText(body) })
  }

  return stories
}

// ── Teen stories ─────────────────────────────────────────────────────────────
// Format: intro paragraph, then plain narrative blocks (no titles)

const TEEN_IDS = [
  'teen-anonymous-app',
  'teen-viral-stunts',
  'teen-scholarship',
  'teen-gaming-identity',
  'teen-ai-shortcuts',
  'teen-new-school',
  'teen-overcommitted',
  'teen-group-chat',
  'teen-avoiding-failure',
  'teen-misjudging',
]

function parseTeenStories(content: string): StoryEntry[] {
  const sections = splitSections(content)
  const stories: StoryEntry[] = []
  let idx = 0

  for (const section of sections) {
    if (section.startsWith('Here are')) continue
    if (idx >= TEEN_IDS.length) break
    stories.push({ id: TEEN_IDS[idx++], text: cleanText(section) })
  }

  return stories
}

// ── Real stories ─────────────────────────────────────────────────────────────
// Format: sections start with bare number "1." on its own line

const REAL_IDS = [
  'real-accidental-feature',
  'real-planned-spontaneity',
  'real-honest-feedback',
  'real-apartment-traces',
  'real-getting-a-dog',
  'real-delivery-driver',
  'real-app-detox',
  'real-online-colleague',
  'real-3d-print',
  'real-group-trip',
  'real-no-spend-month',
  'real-gaming-after-baby',
  'real-wedding-alone',
  'real-startup-pivot',
  'real-online-to-real',
]

function parseRealStories(content: string): StoryEntry[] {
  const sections = splitSections(content)
  const stories: StoryEntry[] = []
  let idx = 0

  for (const section of sections) {
    if (idx >= REAL_IDS.length) break
    const lines = section.split('\n')
    // Strip leading bare number line like "1." or "15."
    const startIdx = /^\d+\.?\s*$/.test(lines[0].trim()) ? 1 : 0
    const body = lines.slice(startIdx).join('\n')
    stories.push({ id: REAL_IDS[idx++], text: cleanText(body) })
  }

  return stories
}

// ── Example messages ──────────────────────────────────────────────────────────
// Format: intro paragraph, then sections with "N. Role description" header

const MSG_IDS = [
  'msg-sprint-planning',
  'msg-blood-test-results',
  'msg-teacher-email',
  'msg-project-status',
  'msg-property-inspection',
  'msg-customer-support',
  'msg-sales-pricing',
  'msg-nurse-discharge',
  'msg-lecturer-assignment',
  'msg-release-notes',
  'msg-portfolio-review',
  'msg-lawyer-status',
  'msg-safety-briefing',
  'msg-ux-findings',
  'msg-campaign-results',
]

function parseExampleMessages(content: string): StoryEntry[] {
  const sections = splitSections(content)
  const stories: StoryEntry[] = []
  let idx = 0

  for (const section of sections) {
    if (section.startsWith('Here are')) continue
    if (idx >= MSG_IDS.length) break

    const lines = section.split('\n')
    // Strip numbered role-description header: "1. Software engineering manager..."
    const startIdx = /^\d+\.\s+\S/.test(lines[0]) ? 1 : 0
    const body = lines.slice(startIdx).join('\n')
    stories.push({ id: MSG_IDS[idx++], text: cleanText(body) })
  }

  return stories
}

// ── Main ─────────────────────────────────────────────────────────────────────

const storiesDir = resolve(ROOT, 'stories')

const allStories: StoryEntry[] = [
  ...parseChildrensStories(readFileSync(resolve(storiesDir, 'childrens-stories.md'), 'utf-8')),
  ...parseTeenStories(readFileSync(resolve(storiesDir, 'teen-stories.md'), 'utf-8')),
  ...parseRealStories(readFileSync(resolve(storiesDir, 'real-stories.md'), 'utf-8')),
  ...parseExampleMessages(readFileSync(resolve(storiesDir, 'example-messages.md'), 'utf-8')),
]

const outPath = resolve(ROOT, 'data/story-passages.json')
writeFileSync(outPath, JSON.stringify(allStories, null, 2) + '\n')

console.log(`Wrote ${allStories.length} stories → ${outPath}`)
console.log()
for (const s of allStories) {
  const wc = s.text.split(/\s+/).filter(Boolean).length
  console.log(`  ${s.id.padEnd(38)} wc=${String(wc).padStart(3)}`)
}
