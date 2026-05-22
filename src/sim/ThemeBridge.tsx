import { useEffect } from 'react'
import { useSim } from '../store/sim'
import { applyTheme, type ThemeId } from './themes'

/**
 * Theme manager bridge. On mount, restores the saved theme from localStorage.
 * On theme change, applies the new theme to the DOM and persists it.
 */
export function ThemeBridge() {
  const theme = useSim((s) => s.theme)
  const setTheme = useSim((s) => s.setTheme)

  // On mount, restore saved theme from localStorage or apply default
  useEffect(() => {
    const saved = localStorage.getItem('gravsim:theme') as ThemeId | null
    if (saved && ['default', 'nasa', 'apollo', 'jpl', 'day'].includes(saved)) {
      setTheme(saved)
      applyTheme(saved)
    } else {
      // Apply default theme on first visit
      applyTheme('default')
    }
  }, [setTheme])

  // When theme changes, apply it and persist
  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem('gravsim:theme', theme)
  }, [theme])

  return null
}
