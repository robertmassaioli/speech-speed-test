import { countTokens } from '../engine/tokenize'

export interface Passage {
  id: string
  text: string
  wordCount: number
  charCount: number
}

const RAW_PASSAGES = [
  {
    id: 'bunny-and-duck',
    text: 'Bella the bunny lived at the edge of a wide green meadow. Every morning she would hop down to the pond to watch the sun rise over the water. One day she found a small duck sitting alone on the bank. His name was Pip, and he looked very sad. So the two of them set off together. Bella hopped through the tall grass and Pip waddled along beside her. They crossed a little wooden bridge and followed the stream around a bend. Then Pip stopped. He lifted his head and listened. From somewhere ahead came the soft sound of splashing and quacking. Bella smiled and waved her paw. From that day on, the bunny and the duck met every morning at the pond, and neither of them was ever lonely again.',
  },
]

export const PASSAGES: Passage[] = RAW_PASSAGES.map(p => ({
  ...p,
  wordCount: countTokens(p.text),
  charCount: p.text.length,
}))

export function getRandomPassage(): Passage {
  return PASSAGES[Math.floor(Math.random() * PASSAGES.length)]
}
