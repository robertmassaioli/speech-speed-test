import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { computeRealWpm } from '../../corpus/realwpm'
import type { DifficultyBin } from '../../corpus/tiers'
import {
  clearHistory,
  exportStore,
  importStore,
  isStorageAvailable,
  loadResults,
  type StoredResult,
} from '../../storage/history'
import { loadSettings, saveSettings } from '../../storage/settings'
import { HistoryScreenView } from './HistoryScreenView'

function personalBests(results: StoredResult[]): Partial<Record<DifficultyBin, number>> {
  const bests: Partial<Record<DifficultyBin, number>> = {}
  for (const r of results) {
    if (!r.difficultyBin) continue
    const cur = bests[r.difficultyBin]
    if (cur === undefined || r.wpm > cur) bests[r.difficultyBin] = r.wpm
  }
  return bests
}

export function HistoryScreen() {
  const navigate = useNavigate()
  const storageOk = isStorageAvailable()
  const [results, setResults] = useState<StoredResult[]>(() => loadResults())
  const [confirmClear, setConfirmClear] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [explainerOpen, setExplainerOpen] = useState(() => loadSettings().explainerOpen)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleToggleExplainer = useCallback(() => {
    setExplainerOpen(prev => {
      const next = !prev
      const settings = loadSettings()
      saveSettings({ ...settings, explainerOpen: next })
      return next
    })
  }, [])

  const realWpm = computeRealWpm(results)
  const bests = personalBests(results)

  function handleClear() {
    if (!confirmClear) { setConfirmClear(true); return }
    clearHistory()
    setResults([])
    setConfirmClear(false)
  }

  function handleExport() {
    const blob = new Blob([exportStore()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sst-history-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      if (!importStore(text)) {
        setImportError('Import failed — file is not a valid history export.')
      } else {
        setImportError(null)
        setResults(loadResults())
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <HistoryScreenView
      storageOk={storageOk}
      results={results}
      realWpm={realWpm}
      bests={bests}
      confirmClear={confirmClear}
      importError={importError}
      explainerOpen={explainerOpen}
      onToggleExplainer={handleToggleExplainer}
      onClear={handleClear}
      onCancelClear={() => setConfirmClear(false)}
      onExport={handleExport}
      onImportFile={handleImportFile}
      onNavigateTest={() => navigate('/')}
    />
  )
}
