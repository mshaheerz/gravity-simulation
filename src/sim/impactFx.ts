/**
 * Impact sound + event-log emission. Single lazy-initialised AudioContext;
 * each impact gets a short attack/decay envelope on a square wave whose pitch
 * is tied to the impact speed — low thud for hard hits, ping for soft ones.
 */

import { events } from './events'
import { PRESETS_BY_ID } from './presets'
import { useSim } from '../store/sim'

let ctx: AudioContext | null = null
let muted = false
/** Stops audio spam: at most one tone per ~80 ms. */
let lastPlay = 0

function ac(): AudioContext | null {
  if (muted) return null
  if (ctx) return ctx
  try {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    return ctx
  } catch {
    muted = true
    return null
  }
}

export function setImpactMuted(v: boolean) {
  muted = v
}

export function isImpactMuted() {
  return muted
}

function playTone(speed: number) {
  const now = performance.now()
  if (now - lastPlay < 80) return
  lastPlay = now
  const a = ac()
  if (!a) return
  if (a.state === 'suspended') void a.resume().catch(() => undefined)

  // Map speed → pitch. Hard impacts (high m/s) sound lower & louder.
  const clamped = Math.min(Math.max(speed, 0.2), 30)
  const freq = 1200 - clamped * 30 // 30 m/s ⇒ ~300 Hz; 1 m/s ⇒ ~1170 Hz
  const gainPeak = Math.min(0.25, 0.04 + clamped * 0.012)

  const osc = a.createOscillator()
  const gain = a.createGain()
  osc.type = 'square'
  osc.frequency.value = freq
  gain.gain.value = 0
  osc.connect(gain).connect(a.destination)

  const t0 = a.currentTime
  gain.gain.setValueAtTime(0, t0)
  gain.gain.linearRampToValueAtTime(gainPeak, t0 + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18)
  osc.start(t0)
  osc.stop(t0 + 0.2)
}

/**
 * Called by Body / CustomBody on collision-enter. Speed is the local body's
 * linear-velocity magnitude *at the instant of contact* — we use it as a proxy
 * for impact energy. We deliberately ignore the other body's id because Rapier
 * fires the event on both sides.
 */
export function reportImpact(bodyId: string, speed: number) {
  // Tiny grazing contacts aren't interesting; gate at 0.6 m/s.
  if (speed < 0.6) return
  const body = useSim.getState().bodies.find((b) => b.id === bodyId)
  const preset = body ? PRESETS_BY_ID[body.presetId] : undefined
  const label = body?.label ?? preset?.label ?? bodyId
  events.emit('IMPACT', `${label} struck at ${speed.toFixed(2)} m/s`)
  playTone(speed)
}
