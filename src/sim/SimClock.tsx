import { useEffect } from 'react'
import { useSim } from '../store/sim'

/**
 * Mission clock driver. A single requestAnimationFrame loop ticks the store's
 * simTime by (wall-dt * timeScale) while not paused. Rendered once near the
 * root so it's always alive — no UI of its own.
 */
export function SimClock() {
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      const s = useSim.getState()
      if (!s.paused) {
        // Clamp the per-frame jump so a backgrounded tab doesn't shove the
        // clock forward by an hour on resume.
        const stepped = Math.min(dt, 0.25) * s.timeScale
        s.tickSimTime(stepped)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])
  return null
}

/** Formats simTime → "T+HH:MM:SS.mmm" (the standard NASA mission-elapsed display). */
export function formatMissionClock(simTime: number): string {
  const negative = simTime < 0
  const t = Math.abs(simTime)
  const totalMs = Math.floor(t * 1000)
  const ms = totalMs % 1000
  const totalSeconds = Math.floor(totalMs / 1000)
  const seconds = totalSeconds % 60
  const totalMinutes = Math.floor(totalSeconds / 60)
  const minutes = totalMinutes % 60
  const hours = Math.floor(totalMinutes / 60)
  const pad2 = (n: number) => n.toString().padStart(2, '0')
  const pad3 = (n: number) => n.toString().padStart(3, '0')
  return `${negative ? 'T-' : 'T+'}${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}.${pad3(ms)}`
}
