import { useEffect, useRef } from 'react'
import { useSim, WORLD_PRESETS_BY_ID } from '../store/sim'
import { PRESETS_BY_ID } from './presets'
import { events } from './events'

/**
 * Side-channel that translates zustand store transitions into Event Log lines.
 * Mounted once near the root — keeps the store itself free of UI concerns.
 */
export function EventBridge() {
  // We need the previous snapshot to diff body lists, world presets, etc.
  const prevRef = useRef(useSim.getState())

  useEffect(() => {
    const unsub = useSim.subscribe((s, prev) => {
      // ── body diffs ──
      if (s.bodies !== prev.bodies) {
        const prevIds = new Set(prev.bodies.map((b) => b.id))
        const nextIds = new Set(s.bodies.map((b) => b.id))
        for (const b of s.bodies) {
          if (!prevIds.has(b.id)) {
            const preset = PRESETS_BY_ID[b.presetId]
            events.emit('SCENE', `spawned ${preset?.label ?? b.presetId} #${b.id}`)
          }
        }
        for (const b of prev.bodies) {
          if (!nextIds.has(b.id)) {
            events.emit('SCENE', `removed #${b.id}`)
          }
        }
      }

      // ── world preset transitions ──
      if (s.worldPreset && s.worldPreset !== prev.worldPreset) {
        const w = WORLD_PRESETS_BY_ID[s.worldPreset]
        if (w) events.emit('WORLD', `applied ${w.label} (G=${w.gravity}, vacuum=${w.vacuum})`)
      }

      // ── pause / resume ──
      if (s.paused !== prev.paused) {
        events.emit('SYSTEM', s.paused ? 'simulation paused' : 'simulation resumed')
      }

      // ── reset ──
      if (s.resetNonce !== prev.resetNonce) {
        events.emit('SYSTEM', 'mission clock reset — bodies returned to spawn')
      }

      prevRef.current = s
    })
    return unsub
  }, [])

  return null
}
