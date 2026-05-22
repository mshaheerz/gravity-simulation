import { reserveIds, useSim, type Body, type WorldPresetId } from '../store/sim'
import { bodyRefs } from './bodyRefs'
import { telemetry } from './telemetry'

/**
 * Save/load format. We serialize each body's *live* Rapier pose and velocity
 * (when available) so reloading reproduces the current frame, not the original
 * spawn state. Format is versioned for future migrations.
 */

export const SAVE_VERSION = 1
export const SAVE_FILE_EXT = '.sim'
export const LS_AUTOSAVE_KEY = 'gravsim:autosave'
export const LS_SLOT_PREFIX = 'gravsim:slot:'

export interface SavedBody {
  id: string
  presetId: string
  /** for presetId === 'custom' — references a customAssets entry */
  customAssetId?: string
  pos: [number, number, number]
  vel: [number, number, number]
  mass?: number
  restitution?: number
  friction?: number
  linearDamping?: number
  color?: string
  label?: string
}

export interface SimSnapshot {
  v: number
  /** unix-ms when the snapshot was taken — for "saved 12s ago" UX. */
  savedAt: number
  world: {
    gravity: number
    vacuum: boolean
    airDensity: number
    timeScale: number
    worldPreset: WorldPresetId | null
  }
  selectedId: string | null
  bodies: SavedBody[]
}

/** Snapshot a single body — preferring its live Rapier pose if available. */
function snapshotBody(b: Body): SavedBody {
  const rb = bodyRefs.get(b.id)
  let pos = b.pos
  let vel = b.vel
  if (rb) {
    const t = rb.translation()
    const v = rb.linvel()
    pos = [t.x, t.y, t.z]
    vel = [v.x, v.y, v.z]
  }
  return {
    id: b.id,
    presetId: b.presetId,
    customAssetId: b.customAssetId,
    pos,
    vel,
    mass: b.mass,
    restitution: b.restitution,
    friction: b.friction,
    linearDamping: b.linearDamping,
    color: b.color,
    label: b.label,
  }
}

/** Capture current sim state to a JSON-safe object. */
export function serialize(): SimSnapshot {
  const s = useSim.getState()
  return {
    v: SAVE_VERSION,
    savedAt: Date.now(),
    world: {
      gravity: s.gravity,
      vacuum: s.vacuum,
      airDensity: s.airDensity,
      timeScale: s.timeScale,
      worldPreset: s.worldPreset,
    },
    selectedId: s.selectedId,
    bodies: s.bodies.map(snapshotBody),
  }
}

/** Validate-and-narrow a parsed JSON blob. Throws on garbage. */
export function validate(input: unknown): SimSnapshot {
  if (!input || typeof input !== 'object') throw new Error('not an object')
  const o = input as Record<string, unknown>
  if (typeof o.v !== 'number') throw new Error('missing version')
  if (o.v > SAVE_VERSION) throw new Error(`unsupported save version ${o.v}`)
  if (!Array.isArray(o.bodies)) throw new Error('bodies must be an array')
  if (!o.world || typeof o.world !== 'object') throw new Error('missing world')
  return input as SimSnapshot
}

/** Apply a snapshot to the store. Atomic — uses zustand's setState. */
export function applySnapshot(snap: SimSnapshot) {
  // Make sure future spawns don't collide with restored ids.
  reserveIds(snap.bodies.map((b) => b.id))
  useSim.setState((s) => ({
    ...s,
    gravity: snap.world.gravity,
    vacuum: snap.world.vacuum,
    airDensity: snap.world.airDensity,
    timeScale: snap.world.timeScale,
    worldPreset: snap.world.worldPreset,
    selectedId: snap.selectedId,
    bodies: snap.bodies.map((b) => ({
      id: b.id,
      presetId: b.presetId,
      customAssetId: b.customAssetId,
      pos: b.pos,
      vel: b.vel,
      mass: b.mass,
      restitution: b.restitution,
      friction: b.friction,
      linearDamping: b.linearDamping,
      color: b.color,
      label: b.label,
      // Bump nonce so any pre-existing Body mounts are recreated cleanly.
      remountNonce: 0,
    })),
    // Bump the reset nonce so Rapier hard-resets all bodies into their new
    // spawn poses, and zero the mission clock.
    resetNonce: s.resetNonce + 1,
    simTime: 0,
  }))
  // Telemetry buffers are tied to the old run — wipe.
  telemetry.reset()
}

/* ──────────────── encoding helpers ──────────────── */

/** Pretty JSON for downloads / `.sim` files. */
export function toJsonString(snap: SimSnapshot, pretty = true): string {
  return pretty ? JSON.stringify(snap, null, 2) : JSON.stringify(snap)
}

export function fromJsonString(text: string): SimSnapshot {
  return validate(JSON.parse(text))
}

/** Base64-url encode (no padding, safe in URL hashes). */
function b64urlEncode(text: string): string {
  // btoa needs latin-1; route through TextEncoder so non-ASCII (rare here, but
  // possible in body labels) survives the round trip.
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(token: string): string {
  const padded = token.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((token.length + 3) % 4)
  const bin = atob(padded)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

export function encodeForUrl(snap: SimSnapshot): string {
  return b64urlEncode(toJsonString(snap, false))
}

export function decodeFromUrl(token: string): SimSnapshot {
  return validate(JSON.parse(b64urlDecode(token)))
}

/* ──────────────── browser-side helpers ──────────────── */

/** Trigger a download of the current state as a `.sim` file. */
export function downloadSim(filename = 'scene' + SAVE_FILE_EXT) {
  const snap = serialize()
  const blob = new Blob([toJsonString(snap)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith(SAVE_FILE_EXT) ? filename : filename + SAVE_FILE_EXT
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

/** Open a file picker and load the chosen `.sim` (or `.json`) file. */
export function uploadSim(): Promise<SimSnapshot> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = SAVE_FILE_EXT + ',application/json,.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) {
        reject(new Error('no file selected'))
        return
      }
      try {
        const text = await file.text()
        resolve(fromJsonString(text))
      } catch (e) {
        reject(e)
      }
    }
    input.click()
  })
}

/* ──────────────── LocalStorage slots + autosave ──────────────── */

export function saveSlot(name: string): SimSnapshot {
  const snap = serialize()
  try {
    localStorage.setItem(LS_SLOT_PREFIX + name, toJsonString(snap, false))
  } catch {
    /* quota or disabled — best-effort */
  }
  return snap
}

export function loadSlot(name: string): SimSnapshot | null {
  try {
    const text = localStorage.getItem(LS_SLOT_PREFIX + name)
    if (!text) return null
    return fromJsonString(text)
  } catch {
    return null
  }
}

export function listSlots(): string[] {
  const out: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(LS_SLOT_PREFIX)) out.push(k.slice(LS_SLOT_PREFIX.length))
  }
  return out.sort()
}

export function deleteSlot(name: string) {
  try {
    localStorage.removeItem(LS_SLOT_PREFIX + name)
  } catch {
    /* ignore */
  }
}

/** Write the current state to the autosave key. */
export function writeAutosave() {
  try {
    localStorage.setItem(LS_AUTOSAVE_KEY, toJsonString(serialize(), false))
  } catch {
    /* ignore */
  }
}

/** Read the autosave slot — or null if none / corrupted. */
export function readAutosave(): SimSnapshot | null {
  try {
    const text = localStorage.getItem(LS_AUTOSAVE_KEY)
    if (!text) return null
    return fromJsonString(text)
  } catch {
    return null
  }
}

export function clearAutosave() {
  try {
    localStorage.removeItem(LS_AUTOSAVE_KEY)
  } catch {
    /* ignore */
  }
}
