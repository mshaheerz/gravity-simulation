import { useMemo } from 'react'
import { useSim } from '../store/sim'
import { THEMES } from './themes'

export function useThemeColors() {
  const themeId = useSim((s) => s.theme)
  return useMemo(() => THEMES[themeId]?.colors ?? THEMES.default.colors, [themeId])
}
