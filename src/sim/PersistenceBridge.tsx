import { useEffect, useRef } from 'react'
import { useSim } from '../store/sim'
import {
  applySnapshot,
  decodeFromUrl,
  readAutosave,
  writeAutosave,
} from './save'

/**
 * Glue component that hooks the sim store up to LocalStorage + URL hash:
 *   - On mount: prefer a #share=... URL hash → otherwise restore autosave.
 *   - On any meaningful state change: debounced autosave write.
 *
 * Renders nothing; mounted once near the root.
 */
export function PersistenceBridge() {
  const restored = useRef(false)

  // ── one-shot restore on mount ──
  useEffect(() => {
    if (restored.current) return
    restored.current = true

    // 1) URL hash takes precedence — shareable links should override autosave.
    const hash = window.location.hash || ''
    const m = hash.match(/(?:^|[#&])share=([^&]+)/)
    if (m) {
      try {
        const snap = decodeFromUrl(decodeURIComponent(m[1]))
        applySnapshot(snap)
        // Strip the share token so subsequent autosave URLs don't re-trigger it.
        history.replaceState(null, '', window.location.pathname + window.location.search)
        return
      } catch (e) {
        console.warn('[gravsim] bad share token:', e)
      }
    }

    // 2) Otherwise, replay the latest autosave (if any).
    const snap = readAutosave()
    if (snap) {
      try {
        applySnapshot(snap)
      } catch (e) {
        console.warn('[gravsim] autosave restore failed:', e)
      }
    }
  }, [])

  // ── debounced autosave writes ──
  // Subscribe to anything that affects the persisted shape; ignore live runtime
  // state like simTime / paused / resetNonce / stepNonce (those would write
  // every frame).
  useEffect(() => {
    let timer: number | null = null
    const schedule = () => {
      if (timer != null) window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        writeAutosave()
        timer = null
      }, 750)
    }
    const unsub = useSim.subscribe((s, prev) => {
      if (!restored.current) return
      // Persist only when the persistable surface changes.
      if (
        s.bodies !== prev.bodies ||
        s.gravity !== prev.gravity ||
        s.vacuum !== prev.vacuum ||
        s.airDensity !== prev.airDensity ||
        s.timeScale !== prev.timeScale ||
        s.worldPreset !== prev.worldPreset ||
        s.selectedId !== prev.selectedId
      ) {
        schedule()
      }
    })
    return () => {
      unsub()
      if (timer != null) window.clearTimeout(timer)
    }
  }, [])

  return null
}
