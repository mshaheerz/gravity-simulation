import { useEffect } from 'react'
import { useSim } from '../store/sim'
import { events } from './events'

/**
 * Global keyboard shortcuts. Mounted once near the root.
 *
 *  Space  →  toggle pause/play
 *  R      →  reset positions + clock
 *  G      →  cycle gravity: current → 0G → 9.81 → current
 *  F      →  focus camera on selected body (handled by the viewport — we just
 *            fire a `gravsim:focus` custom event so OrbitControls can listen)
 *  .      →  single-frame step (only while paused)
 *  M      →  toggle CRT scanlines (App.tsx listens for `gravsim:toggle-crt`)
 *
 * Skipped when an editable element has focus, so typing 'g' in the inspector
 * label box doesn't toggle gravity.
 */
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (target.isContentEditable) return true
  return false
}

export function KeyboardShortcuts() {
  useEffect(() => {
    let prevGravity: number | null = null
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const s = useSim.getState()
      switch (e.key) {
        case ' ': {
          e.preventDefault()
          s.setPaused(!s.paused)
          break
        }
        case 'r':
        case 'R':
          e.preventDefault()
          s.bumpReset()
          break
        case 'g':
        case 'G': {
          e.preventDefault()
          if (s.gravity > 0.01) {
            prevGravity = s.gravity
            s.setGravity(0)
            events.emit('WORLD', 'gravity disabled (G key)')
          } else {
            const restore = prevGravity ?? 9.81
            s.setGravity(restore)
            prevGravity = null
            events.emit('WORLD', `gravity restored to ${restore.toFixed(2)} m/s²`)
          }
          break
        }
        case 'f':
        case 'F': {
          e.preventDefault()
          if (!s.selectedId) return
          window.dispatchEvent(new CustomEvent('gravsim:focus', { detail: { bodyId: s.selectedId } }))
          break
        }
        case '.':
          e.preventDefault()
          if (s.paused) s.step()
          break
        case 'm':
        case 'M':
          e.preventDefault()
          window.dispatchEvent(new CustomEvent('gravsim:toggle-crt'))
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return null
}
