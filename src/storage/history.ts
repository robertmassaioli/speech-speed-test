import type { MatchMode } from '../engine/types'

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
