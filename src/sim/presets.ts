export type ShapeKind = 'sphere' | 'cuboid' | 'capsule' | 'cone'

export interface Preset {
  id: string
  label: string
  shape: ShapeKind
  // dimensions (meters)
  // sphere: radius
  // cuboid: half-extents x,y,z
  // capsule: [radius, halfHeight]
  // cone:    [radius, halfHeight]
  dims: number[]
  mass: number // kg
  restitution: number // 0..1 (bouncy)
  friction: number // 0..1
  linearDamping: number // pseudo-drag
  color: string
  emoji?: string
  description?: string
}

export const PRESETS: Preset[] = [
  {
    id: 'sphere',
    label: 'SPHERE',
    shape: 'sphere',
    dims: [0.3],
    mass: 1,
    restitution: 0.55,
    friction: 0.4,
    linearDamping: 0.05,
    color: '#ff6633',
    emoji: '●',
    description: 'Generic 30cm rubber ball',
  },
  {
    id: 'cube',
    label: 'CUBE',
    shape: 'cuboid',
    dims: [0.35, 0.35, 0.35],
    mass: 2,
    restitution: 0.18,
    friction: 0.7,
    linearDamping: 0.05,
    color: '#ffb800',
    emoji: '■',
    description: 'Solid wooden crate',
  },
  {
    id: 'feather',
    label: 'FEATHER',
    shape: 'cuboid',
    dims: [0.15, 0.02, 0.05],
    mass: 0.001,
    restitution: 0.05,
    friction: 0.9,
    linearDamping: 2.5,
    color: '#e0e0e0',
    emoji: '⌒',
    description: 'Drag-dominated, drifts down slowly',
  },
  {
    id: 'anvil',
    label: 'ANVIL',
    shape: 'cuboid',
    dims: [0.25, 0.18, 0.15],
    mass: 80,
    restitution: 0.02,
    friction: 0.95,
    linearDamping: 0.0,
    color: '#3a3a3a',
    emoji: '⌬',
    description: '80kg cast-iron, terminal thuds',
  },
  {
    id: 'cannonball',
    label: 'CANNONBALL',
    shape: 'sphere',
    dims: [0.12],
    mass: 12,
    restitution: 0.3,
    friction: 0.5,
    linearDamping: 0.0,
    color: '#222222',
    emoji: '⬤',
    description: 'Iron, dense; bounces hard',
  },
  {
    id: 'satellite',
    label: 'SATELLITE',
    shape: 'cuboid',
    dims: [0.4, 0.15, 0.3],
    mass: 50,
    restitution: 0.0,
    friction: 0.6,
    linearDamping: 0.1,
    color: '#9fc8ff',
    emoji: '✦',
    description: 'CubeSat-style, fragile chassis',
  },
  {
    id: 'rocket',
    label: 'ROCKET',
    shape: 'capsule',
    dims: [0.18, 0.6],
    mass: 25,
    restitution: 0.1,
    friction: 0.4,
    linearDamping: 0.04,
    color: '#ff3030',
    emoji: '▲',
    description: 'Slender stage; tips over easily',
  },
  {
    id: 'planet',
    label: 'PLANET',
    shape: 'sphere',
    dims: [0.8],
    mass: 500,
    restitution: 0.2,
    friction: 0.8,
    linearDamping: 0.0,
    color: '#6fa86f',
    emoji: '◉',
    description: 'Custom test planet (small-scale)',
  },
]

export const PRESETS_BY_ID: Record<string, Preset> = Object.fromEntries(
  PRESETS.map((p) => [p.id, p])
)
