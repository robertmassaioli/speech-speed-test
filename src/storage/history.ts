import type { MatchMode } from '../engine/types'
import type { DifficultyBin } from '../corpus/tiers'

export const FREQ_LIST_ID = 'google-10k-no-swears@bdf4c221'

export interface StoredResult {
  id: string
  ts: number
  passageId: string
  mode: MatchMode
  elapsedSec: number
  words: number
  charsRaw: number
  wpm: number
  cpm: number
  suspect: boolean
  // Added in Phase 2 — optional so old stored results remain valid.
  composition?: readonly [number, number, number, number]  // [p1, p2, p3, p4]
  difficultyBin?: DifficultyBin
  frequencyListId?: string
}

interface StorageSchema {
  version: 1
  results: StoredResult[]
}

const STORAGE_KEY = 'sst.v1'

function emptyStore(): StorageSchema {
  return { version: 1, results: [] }
}

function readStore(): StorageSchema {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyStore()
    const parsed = JSON.parse(raw) as StorageSchema
    if (parsed.version !== 1) return emptyStore()
    return parsed
  } catch {
    return emptyStore()
  }
}

function writeStore(store: StorageSchema): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Quota exceeded or storage disabled — silently drop
  }
}

export function saveResult(result: Omit<StoredResult, 'id' | 'ts'>): StoredResult {
  const store = readStore()
  const entry: StoredResult = {
    ...result,
    id: crypto.randomUUID(),
    ts: Date.now(),
  }
  store.results.push(entry)
  writeStore(store)
  return entry
}

export function loadResults(): StoredResult[] {
  return readStore().results.slice().reverse()
}

export function clearHistory(): void {
  writeStore(emptyStore())
}

export function exportStore(): string {
  return JSON.stringify(readStore(), null, 2)
}

export function importStore(json: string): boolean {
  try {
    const parsed = JSON.parse(json) as StorageSchema
    if (parsed.version !== 1 || !Array.isArray(parsed.results)) return false
    writeStore(parsed)
    return true
  } catch {
    return false
  }
}

export function isStorageAvailable(): boolean {
  try {
    const key = '__sst_test__'
    localStorage.setItem(key, '1')
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}
