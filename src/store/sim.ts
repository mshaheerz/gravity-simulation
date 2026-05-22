import { create } from 'zustand'
import { PRESETS_BY_ID, type Preset } from '../sim/presets'
import type { ThemeId } from '../sim/themes'

export type ViewMode = 'space' | 'surface'

export type WorldPresetId = 'earth' | 'moon' | 'mars' | 'jupiter' | 'zerog'

export interface WorldPreset {
  id: WorldPresetId
  label: string
  gravity: number
  airDensity: number
  vacuum: boolean
  description: string
}

export const WORLD_PRESETS: WorldPreset[] = [
  { id: 'earth',   label: 'EARTH',   gravity: 9.81,  airDensity: 1.225, vacuum: false, description: 'Sea level, standard atmosphere' },
  { id: 'moon',    label: 'MOON',    gravity: 1.62,  airDensity: 0,     vacuum: true,  description: 'Lunar surface, hard vacuum' },
  { id: 'mars',    label: 'MARS',    gravity: 3.71,  airDensity: 0.020, vacuum: false, description: 'Thin CO₂ atmosphere' },
  { id: 'jupiter', label: 'JUPITER', gravity: 24.79, airDensity: 0.16,  vacuum: false, description: 'Upper cloud deck, crushing g' },
  { id: 'zerog',   label: '0-G',     gravity: 0,     airDensity: 0,     vacuum: true,  description: 'Microgravity, free float' },
]

export const WORLD_PRESETS_BY_ID: Record<WorldPresetId, WorldPreset> = Object.fromEntries(
  WORLD_PRESETS.map((w) => [w.id, w]),
) as Record<WorldPresetId, WorldPreset>

export interface Body {
  id: string
  presetId: string
  /** when presetId === 'custom', this is the id of the entry in customAssets */
  customAssetId?: string
  // initial spawn state — physics integrates from here
  pos: [number, number, number]
  vel: [number, number, number]
  // overrides — fall back to preset if undefined
  mass?: number
  restitution?: number
  friction?: number
  linearDamping?: number
  color?: string
  label?: string
  // bumped to force a Rapier remount when physical attributes change
  remountNonce: number
}

export interface SimState {
  viewMode: ViewMode
  setViewMode: (m: ViewMode) => void

  theme: ThemeId
  setTheme: (themeId: ThemeId) => void

  gravity: number
  vacuum: boolean
  /** ambient air density, kg/m³. Earth sea level ≈ 1.225. */
  airDensity: number
  timeScale: number
  paused: boolean
  /** id of the most recently applied world preset (for highlight) */
  worldPreset: WorldPresetId | null

  setGravity: (g: number) => void
  setVacuum: (v: boolean) => void
  setAirDensity: (d: number) => void
  setTimeScale: (t: number) => void
  setPaused: (p: boolean) => void
  applyWorldPreset: (id: WorldPresetId) => void

  bodies: Body[]
  selectedId: string | null
  spawn: (presetId: string, opts?: Partial<Omit<Body, 'id' | 'presetId' | 'remountNonce'>>) => string
  removeBody: (id: string) => void
  clearBodies: () => void
  selectBody: (id: string | null) => void
  updateBody: (id: string, patch: Partial<Body>) => void
  /** Update fields that map to Rapier construction props — bumps remountNonce so the body restarts with new physics. */
  updateBodyPhysics: (id: string, patch: Partial<Body>) => void

  resetNonce: number
  bumpReset: () => void

  /** seconds of sim-time accumulated since last reset (scaled by timeScale, freezes when paused) */
  simTime: number
  /** advance the mission clock by dt seconds; clock loop calls this each rAF */
  tickSimTime: (dt: number) => void

  /** bumped when the user single-steps; SurfaceScene watches this to unpause for one frame */
  stepNonce: number
  step: () => void
}

let _nextId = 1
const nextId = () => `b${_nextId++}`

/** Bump the id allocator past every supplied id so future spawns don't collide. */
export function reserveIds(ids: string[]) {
  for (const id of ids) {
    const m = /^b(\d+)$/.exec(id)
    if (m) {
      const n = parseInt(m[1], 10)
      if (Number.isFinite(n) && n >= _nextId) _nextId = n + 1
    }
  }
}

const seedSurface = (): Body[] => [
  { id: nextId(), presetId: 'sphere', pos: [0, 8, 0], vel: [0, 0, 0], remountNonce: 0 },
  { id: nextId(), presetId: 'cube', pos: [1.6, 12, 0], vel: [0, 0, 0], remountNonce: 0 },
  { id: nextId(), presetId: 'cannonball', pos: [-1.6, 10, 1], vel: [0, 0, 0], remountNonce: 0 },
]

export const useSim = create<SimState>((set) => ({
  theme: 'default',
  setTheme: (theme) => set({ theme }),

  viewMode: 'surface',
  setViewMode: (m) => set({ viewMode: m }),

  gravity: 9.81,
  vacuum: false,
  airDensity: 1.225,
  timeScale: 1,
  paused: false,
  worldPreset: 'earth',

  // Setting any single physics value invalidates the world-preset highlight.
  setGravity: (g) => set({ gravity: g, worldPreset: null }),
  setVacuum: (v) => set({ vacuum: v, worldPreset: null }),
  setAirDensity: (d) => set({ airDensity: d, worldPreset: null }),
  setTimeScale: (t) => set({ timeScale: t }),
  setPaused: (p) => set({ paused: p }),
  applyWorldPreset: (id) => {
    const w = WORLD_PRESETS_BY_ID[id]
    if (!w) return
    set({
      gravity: w.gravity,
      airDensity: w.airDensity,
      vacuum: w.vacuum,
      worldPreset: id,
    })
  },

  bodies: seedSurface(),
  selectedId: null,

  spawn: (presetId, opts) => {
    // Custom assets piggy-back on the synthetic 'custom' preset id — only a
    // *real* preset id has an entry in PRESETS_BY_ID.
    if (presetId !== 'custom') {
      const preset: Preset | undefined = PRESETS_BY_ID[presetId]
      if (!preset) return ''
    }
    const id = nextId()
    const body: Body = {
      id,
      presetId,
      customAssetId: opts?.customAssetId,
      pos: opts?.pos ?? [
        (Math.random() - 0.5) * 4,
        8 + Math.random() * 6,
        (Math.random() - 0.5) * 4,
      ],
      vel: opts?.vel ?? [0, 0, 0],
      mass: opts?.mass,
      restitution: opts?.restitution,
      friction: opts?.friction,
      linearDamping: opts?.linearDamping,
      color: opts?.color,
      label: opts?.label,
      remountNonce: 0,
    }
    set((s) => ({ bodies: [...s.bodies, body], selectedId: id }))
    return id
  },

  removeBody: (id) =>
    set((s) => ({
      bodies: s.bodies.filter((b) => b.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),

  clearBodies: () => set({ bodies: [], selectedId: null }),

  selectBody: (id) => set({ selectedId: id }),

  updateBody: (id, patch) =>
    set((s) => ({
      bodies: s.bodies.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    })),

  updateBodyPhysics: (id, patch) =>
    set((s) => ({
      bodies: s.bodies.map((b) =>
        b.id === id ? { ...b, ...patch, remountNonce: b.remountNonce + 1 } : b
      ),
    })),

  resetNonce: 0,
  bumpReset: () =>
    set((s) => ({ resetNonce: s.resetNonce + 1, simTime: 0 })),

  simTime: 0,
  tickSimTime: (dt) => set((s) => ({ simTime: s.simTime + dt })),

  stepNonce: 0,
  step: () =>
    set((s) => ({
      stepNonce: s.stepNonce + 1,
      // advance the mission clock by one fixed Rapier step (1/60s · timeScale)
      simTime: s.simTime + (1 / 60) * s.timeScale,
    })),
}))
