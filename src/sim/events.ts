/**
 * Append-only event log. Captures mission events (impacts, spawn/delete, world
 * changes) into a small ring buffer that the Event Log panel renders. Keeps
 * itself decoupled from React — subscribers attach via plain callbacks.
 */

export type EventKind = 'SYSTEM' | 'PHYSICS' | 'SCENE' | 'IMPACT' | 'WORLD' | 'ERROR'

export interface SimEvent {
  /** monotonically increasing — used as the React key */
  id: number
  /** ms since wall-clock epoch — we format via the sim-time of *capture*. */
  /** sim-time seconds at capture (for `T+HH:MM:SS.mmm` rendering) */
  t: number
  kind: EventKind
  text: string
}

const BUFFER = 256
const buf: SimEvent[] = []
let _seq = 1
let listeners = new Set<() => void>()

import { useSim } from '../store/sim'

function notify() {
  for (const l of listeners) l()
}

export const events = {
  subscribe(cb: () => void) {
    listeners.add(cb)
    return () => {
      listeners.delete(cb)
    }
  },
  snapshot(): readonly SimEvent[] {
    return buf
  },
  emit(kind: EventKind, text: string) {
    const e: SimEvent = {
      id: _seq++,
      t: useSim.getState().simTime,
      kind,
      text,
    }
    buf.push(e)
    if (buf.length > BUFFER) buf.splice(0, buf.length - BUFFER)
    notify()
  },
  clear() {
    buf.length = 0
    notify()
  },
}

// Seed with a few system lines so the panel never looks empty on first paint.
events.emit('SYSTEM', 'gravsim boot complete')
events.emit('PHYSICS', 'rapier wasm online')
