import { useEffect, useState } from 'react'

const HUES = ['purple', 'blue', 'orange', 'red'] as const
const DARK_PREFS = ['auto', 'light', 'dark'] as const

export type HueTheme = typeof HUES[number]
export type DarkPref = typeof DARK_PREFS[number]

function isHue(v: string | null): v is HueTheme {
  return HUES.includes(v as HueTheme)
}
function isDarkPref(v: string | null): v is DarkPref {
  return DARK_PREFS.includes(v as DarkPref)
}

export function useTheme() {
  const [hue, setHueState] = useState<HueTheme>(() => {
    const stored = localStorage.getItem('sst-theme')
    return isHue(stored) ? stored : 'purple'
  })

  const [darkPref, setDarkPrefState] = useState<DarkPref>(() => {
    const stored = localStorage.getItem('sst-dark')
    return isDarkPref(stored) ? stored : 'auto'
  })

  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const effectiveDark = darkPref === 'dark' || (darkPref === 'auto' && systemDark)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', hue)
    if (effectiveDark) {
      document.documentElement.setAttribute('data-dark', '')
    } else {
      document.documentElement.removeAttribute('data-dark')
    }
  }, [hue, effectiveDark])

  function setHue(h: HueTheme) {
    setHueState(h)
    localStorage.setItem('sst-theme', h)
  }

  function cycleDarkPref() {
    const next: DarkPref =
      darkPref === 'auto'  ? 'dark'  :
      darkPref === 'dark'  ? 'light' : 'auto'
    setDarkPrefState(next)
    localStorage.setItem('sst-dark', next)
  }

  return { hue, darkPref, effectiveDark, setHue, cycleDarkPref }
}

export const HUE_FILLS: Record<HueTheme, string> = {
  purple: '#7c3aed',
  blue:   '#2563eb',
  orange: '#c2410c',
  red:    '#dc2626',
}

export const DARK_ICONS: Record<DarkPref, string> = {
  auto:  '◐',
  dark:  '☽',
  light: '☀',
}
