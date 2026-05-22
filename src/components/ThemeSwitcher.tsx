import { useSim } from '../store/sim'
import { THEMES } from '../sim/themes'

/**
 * Theme switcher UI — dropdown or button row to pick a theme.
 * Compact enough to fit in a header.
 */
export function ThemeSwitcher() {
  const theme = useSim((s) => s.theme)
  const setTheme = useSim((s) => s.setTheme)

  return (
    <div className="flex items-center gap-1">
      <span className="text-nasa-dim text-[11px]">THEME:</span>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as any)}
        className="px-2 py-1 bg-nasa-panel border border-nasa-border text-nasa-text text-[11px] cursor-pointer hover:border-nasa-accent transition rounded"
      >
        {Object.values(THEMES).map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  )
}
