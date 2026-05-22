/**
 * Theme system — defines color palettes for different visual modes.
 * Each theme is a set of CSS custom properties applied to :root.
 */

export type ThemeId = 'default' | 'nasa' | 'apollo' | 'jpl' | 'day'

export interface Theme {
  id: ThemeId
  label: string
  colors: {
    bg: string
    panel: string
    border: string
    text: string
    accent: string
    warn: string
    danger: string
    grid: string
    dim: string
  }
}

export const THEMES: Record<ThemeId, Theme> = {
  default: {
    id: 'default',
    label: 'Default (Dark)',
    colors: {
      bg: '#1e1e1e',
      panel: '#252526',
      border: '#3e3e42',
      text: '#e8e8e8',
      accent: '#007acc',
      warn: '#dcdcaa',
      danger: '#f48771',
      grid: '#2d2d30',
      dim: '#6a6a6a',
    },
  },
  nasa: {
    id: 'nasa',
    label: 'NASA Green',
    colors: {
      bg: '#000000',
      panel: '#0a0e0a',
      border: '#1a3a1a',
      text: '#b8ffb8',
      accent: '#00ff66',
      warn: '#ffb800',
      danger: '#ff3030',
      grid: '#0f1f0f',
      dim: '#3a6a3a',
    },
  },
  apollo: {
    id: 'apollo',
    label: 'Apollo Amber',
    colors: {
      bg: '#1a1410',
      panel: '#2a1f15',
      border: '#4a3020',
      text: '#ffc966',
      accent: '#ffb800',
      warn: '#ff8c42',
      danger: '#ff4444',
      grid: '#3a2820',
      dim: '#8a6a4a',
    },
  },
  jpl: {
    id: 'jpl',
    label: 'JPL Blue',
    colors: {
      bg: '#0a1f4a',
      panel: '#122b5a',
      border: '#1a3a7a',
      text: '#a0c8ff',
      accent: '#00b8ff',
      warn: '#ffaa00',
      danger: '#ff6b6b',
      grid: '#1a2a5a',
      dim: '#4a7aaa',
    },
  },
  day: {
    id: 'day',
    label: 'Daylight Sky',
    colors: {
      bg: '#87c6ff',
      panel: '#f4f9ff',
      border: '#a8c9e8',
      text: '#16283a',
      accent: '#1e73d8',
      warn: '#b06a00',
      danger: '#c2352b',
      grid: '#d6e7f8',
      dim: '#5b7690',
    },
  },
}

function hexToRgbTuple(hex: string): string | null {
  const value = hex.trim()
  const short = /^#([0-9a-f]{3})$/i.exec(value)
  if (short) {
    const [r, g, b] = short[1].split('').map((c) => parseInt(c + c, 16))
    return `${r}, ${g}, ${b}`
  }

  const full = /^#([0-9a-f]{6})$/i.exec(value)
  if (!full) return null

  const int = parseInt(full[1], 16)
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255
  return `${r}, ${g}, ${b}`
}

/**
 * Apply a theme by setting CSS custom properties.
 */
export function applyTheme(themeId: ThemeId) {
  const theme = THEMES[themeId]
  if (!theme) return

  const root = document.documentElement
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--theme-${key}`, value)
  })

  // For Tailwind compatibility — update NASA variables too.
  root.style.setProperty('--nasa-bg', theme.colors.bg)
  root.style.setProperty('--nasa-bg-rgb', hexToRgbTuple(theme.colors.bg) ?? '30, 30, 30')
  root.style.setProperty('--nasa-panel', theme.colors.panel)
  root.style.setProperty('--nasa-panel-rgb', hexToRgbTuple(theme.colors.panel) ?? '37, 37, 38')
  root.style.setProperty('--nasa-border', theme.colors.border)
  root.style.setProperty('--nasa-border-rgb', hexToRgbTuple(theme.colors.border) ?? '62, 62, 66')
  root.style.setProperty('--nasa-text', theme.colors.text)
  root.style.setProperty('--nasa-text-rgb', hexToRgbTuple(theme.colors.text) ?? '232, 232, 232')
  root.style.setProperty('--nasa-accent', theme.colors.accent)
  root.style.setProperty('--nasa-accent-rgb', hexToRgbTuple(theme.colors.accent) ?? '0, 122, 204')
  root.style.setProperty('--nasa-warn', theme.colors.warn)
  root.style.setProperty('--nasa-warn-rgb', hexToRgbTuple(theme.colors.warn) ?? '220, 220, 170')
  root.style.setProperty('--nasa-danger', theme.colors.danger)
  root.style.setProperty('--nasa-danger-rgb', hexToRgbTuple(theme.colors.danger) ?? '244, 135, 113')
  root.style.setProperty('--nasa-grid', theme.colors.grid)
  root.style.setProperty('--nasa-grid-rgb', hexToRgbTuple(theme.colors.grid) ?? '45, 45, 48')
  root.style.setProperty('--nasa-dim', theme.colors.dim)
  root.style.setProperty('--nasa-dim-rgb', hexToRgbTuple(theme.colors.dim) ?? '106, 106, 106')
  root.style.setProperty('color-scheme', themeId === 'day' ? 'light' : 'dark')
}
