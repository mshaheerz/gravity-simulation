import { create } from 'zustand'
import { PRESETS_BY_ID, type Preset } from '../sim/presets'

export type ViewMode = 'space' | 'surface'

export interface Body {
  id: string
  presetId: string
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

  gravity: number
  vacuum: boolean
  timeScale: number
  paused: boolean

  setGravity: (g: number) => void
  setVacuum: (v: boolean) => void
  setTimeScale: (t: number) => void
  setPaused: (p: boolean) => void

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
}

let _nextId = 1
const nextId = () => `b${_nextId++}`

const seedSurface = (): Body[] => [
  { id: nextId(), presetId: 'sphere', pos: [0, 8, 0], vel: [0, 0, 0], remountNonce: 0 },
  { id: nextId(), presetId: 'cube', pos: [1.6, 12, 0], vel: [0, 0, 0], remountNonce: 0 },
  { id: nextId(), presetId: 'cannonball', pos: [-1.6, 10, 1], vel: [0, 0, 0], remountNonce: 0 },
]

export const useSim = create<SimState>((set) => ({
  viewMode: 'surface',
  setViewMode: (m) => set({ viewMode: m }),

  gravity: 9.81,
  vacuum: false,
  timeScale: 1,
  paused: false,

  setGravity: (g) => set({ gravity: g }),
  setVacuum: (v) => set({ vacuum: v }),
  setTimeScale: (t) => set({ timeScale: t }),
  setPaused: (p) => set({ paused: p }),

  bodies: seedSurface(),
  selectedId: null,

  spawn: (presetId, opts) => {
    const preset: Preset | undefined = PRESETS_BY_ID[presetId]
    if (!preset) return ''
    const id = nextId()
    const body: Body = {
      id,
      presetId,
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
  bumpReset: () => set((s) => ({ resetNonce: s.resetNonce + 1 })),
}))
