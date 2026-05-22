import { bodyRefs } from './bodyRefs'
import { useSim } from '../store/sim'
import { PRESETS_BY_ID } from './presets'

/**
 * Telemetry sampler. A single setInterval samples every live body's pose
 * and velocity, computes KE/PE/E, and stores them in fixed-size ring buffers.
 * Telemetry panels subscribe via useSyncExternalStore — no re-render per tick
 * unless they're actually mounted.
 */

export const SAMPLE_HZ = 30 // 30 Hz feels smooth without burning CPU
export const BUFFER_SECONDS = 30 // keep last 30 seconds
export const BUFFER_LEN = SAMPLE_HZ * BUFFER_SECONDS

export interface BodyTrace {
  /** wall-clock-derived sim seconds since first sample */
  t: Float64Array
  altitude: Float32Array // y, meters
  speed: Float32Array // |v|, m/s
  ke: Float32Array // joules
  pe: Float32Array // joules, m·g·h (h = y, ref ground)
  totalE: Float32Array
  /** sliding write head — newest sample sits at (head - 1 + N) % N */
  head: number
  /** total samples ever written; clamp display window to min(count, BUFFER_LEN) */
  count: number
}

const traces = new Map<string, BodyTrace>()
let startedAt = 0
let elapsed = 0
let listeners = new Set<() => void>()
let intervalId: number | null = null
let lastTick = 0

function newTrace(): BodyTrace {
  return {
    t: new Float64Array(BUFFER_LEN),
    altitude: new Float32Array(BUFFER_LEN),
    speed: new Float32Array(BUFFER_LEN),
    ke: new Float32Array(BUFFER_LEN),
    pe: new Float32Array(BUFFER_LEN),
    totalE: new Float32Array(BUFFER_LEN),
    head: 0,
    count: 0,
  }
}

function tick() {
  const sim = useSim.getState()
  if (sim.paused) {
    lastTick = performance.now()
    return
  }
  const now = performance.now()
  if (startedAt === 0) startedAt = now
  // Accrue scaled sim time so the chart x-axis matches what the user sees.
  if (lastTick !== 0) {
    elapsed += ((now - lastTick) / 1000) * sim.timeScale
  }
  lastTick = now

  const g = sim.gravity
  const live = bodyRefs.all()

  // Drop traces for bodies that no longer exist.
  for (const id of traces.keys()) {
    if (!live.has(id)) traces.delete(id)
  }

  for (const body of sim.bodies) {
    const rb = bodyRefs.get(body.id)
    if (!rb) continue
    const t = rb.translation()
    const v = rb.linvel()
    const mass = body.mass ?? PRESETS_BY_ID[body.presetId]?.mass ?? 1
    const speedSq = v.x * v.x + v.y * v.y + v.z * v.z
    const ke = 0.5 * mass * speedSq
    const pe = mass * g * t.y
    let trace = traces.get(body.id)
    if (!trace) {
      trace = newTrace()
      traces.set(body.id, trace)
    }
    const h = trace.head
    trace.t[h] = elapsed
    trace.altitude[h] = t.y
    trace.speed[h] = Math.sqrt(speedSq)
    trace.ke[h] = ke
    trace.pe[h] = pe
    trace.totalE[h] = ke + pe
    trace.head = (h + 1) % BUFFER_LEN
    trace.count = Math.min(trace.count + 1, BUFFER_LEN)
  }

  for (const l of listeners) l()
}

function start() {
  if (intervalId != null) return
  lastTick = 0
  intervalId = window.setInterval(tick, 1000 / SAMPLE_HZ)
}

function stop() {
  if (intervalId == null) return
  window.clearInterval(intervalId)
  intervalId = null
}

export const telemetry = {
  /** Subscribe to sample-tick events (for useSyncExternalStore). */
  subscribe(cb: () => void) {
    listeners.add(cb)
    if (listeners.size === 1) start()
    return () => {
      listeners.delete(cb)
      if (listeners.size === 0) stop()
    }
  },
  /** Snapshot — returns the full Map. Identity is stable; consumers should
   *  read trace.head/count to drive their own change detection. */
  snapshot() {
    return traces
  },
  /** Total elapsed sim time since first sample, seconds. */
  elapsed() {
    return elapsed
  },
  /** Reset all buffers — called when the user hits RST. */
  reset() {
    traces.clear()
    startedAt = 0
    elapsed = 0
    lastTick = 0
    for (const l of listeners) l()
  },
}

// Clear telemetry buffers whenever the simulation reset nonce bumps.
let _lastResetNonce = useSim.getState().resetNonce
useSim.subscribe((s) => {
  if (s.resetNonce !== _lastResetNonce) {
    _lastResetNonce = s.resetNonce
    telemetry.reset()
  }
})

/** Linearize a ring-buffer trace into oldest→newest plain arrays for uPlot. */
export function linearize(trace: BodyTrace): {
  t: number[]
  altitude: number[]
  speed: number[]
  ke: number[]
  pe: number[]
  totalE: number[]
} {
  const n = trace.count
  const t = new Array<number>(n)
  const altitude = new Array<number>(n)
  const speed = new Array<number>(n)
  const ke = new Array<number>(n)
  const pe = new Array<number>(n)
  const totalE = new Array<number>(n)
  // Oldest sample is at head if buffer is full, else at 0.
  const start = trace.count < BUFFER_LEN ? 0 : trace.head
  for (let i = 0; i < n; i++) {
    const idx = (start + i) % BUFFER_LEN
    t[i] = trace.t[idx]
    altitude[i] = trace.altitude[idx]
    speed[i] = trace.speed[idx]
    ke[i] = trace.ke[idx]
    pe[i] = trace.pe[idx]
    totalE[i] = trace.totalE[idx]
  }
  return { t, altitude, speed, ke, pe, totalE }
}
