import { useSim, WORLD_PRESETS_BY_ID, type WorldPresetId } from '../store/sim'
import { PRESETS, PRESETS_BY_ID } from './presets'
import { telemetry } from './telemetry'
import {
  applySnapshot,
  downloadSim,
  encodeForUrl,
  listSlots,
  loadSlot,
  saveSlot,
  serialize,
} from './save'

/**
 * Terminal command executor. Pure-ish: takes a string, mutates the sim store
 * via the existing actions, returns an array of output lines.
 */

export type LineKind = 'in' | 'ok' | 'err' | 'log' | 'info'

export interface OutputLine {
  kind: LineKind
  text: string
}

const CMD_NAMES = [
  'help',
  'spawn',
  'set',
  'preset',
  'pause',
  'play',
  'step',
  'reset',
  'clear',
  'track',
  'save',
  'load',
  'list',
] as const

export const COMMAND_NAMES: readonly string[] = CMD_NAMES

const HELP_LINES: string[] = [
  'GRAVSIM SHELL — available commands:',
  '  spawn <type> [mass=N] [alt=N] [pos=x,y,z] [vel=x,y,z]',
  '  set g <value>',
  '  preset earth | moon | mars | jupiter | zerog',
  '  pause | play | step | reset',
  '  track <id>          // focus telemetry + selection on this body',
  '  list                // show all bodies in scene',
  '  clear               // clear console output',
  '  save <name>         // store scene in browser slot',
  '  save export         // download current scene as .sim file',
  '  save share          // copy a shareable URL to the clipboard',
  '  load <name>         // restore a saved slot',
  '  load -              // list saved slots',
  '  help',
  '',
  'types: ' + PRESETS.map((p) => p.id).join(' / '),
]

/**
 * Parse a token like "pos=1,2,3" into [1,2,3]. Returns null if invalid.
 */
function parseTriple(value: string): [number, number, number] | null {
  const parts = value.split(',').map((s) => s.trim())
  if (parts.length !== 3) return null
  const nums = parts.map((p) => parseFloat(p))
  if (nums.some((n) => Number.isNaN(n))) return null
  return [nums[0], nums[1], nums[2]]
}

/**
 * Pull `key=value` flags from a list of tokens. Returns the flags as a plain
 * object plus any positional tokens left over.
 */
function splitFlags(tokens: string[]): { flags: Record<string, string>; positional: string[] } {
  const flags: Record<string, string> = {}
  const positional: string[] = []
  for (const tok of tokens) {
    const eq = tok.indexOf('=')
    if (eq > 0) {
      flags[tok.slice(0, eq).toLowerCase()] = tok.slice(eq + 1)
    } else {
      positional.push(tok)
    }
  }
  return { flags, positional }
}

const ok = (text: string): OutputLine => ({ kind: 'ok', text })
const err = (text: string): OutputLine => ({ kind: 'err', text })
const info = (text: string): OutputLine => ({ kind: 'info', text })
const log = (text: string): OutputLine => ({ kind: 'log', text })

/**
 * Execute a raw input line. Returns the lines to append AND a sentinel for
 * special UI effects the panel needs to handle (e.g. clearing the buffer).
 */
export function execCommand(input: string): {
  lines: OutputLine[]
  effect?: 'clear'
} {
  const trimmed = input.trim()
  if (!trimmed) return { lines: [] }

  const tokens = trimmed.split(/\s+/)
  const cmd = tokens[0].toLowerCase()
  const rest = tokens.slice(1)

  switch (cmd) {
    case 'help':
      return { lines: HELP_LINES.map((l) => info(l)) }

    case 'clear':
      return { lines: [], effect: 'clear' }

    case 'pause':
      useSim.getState().setPaused(true)
      return { lines: [ok('paused')] }

    case 'play':
      useSim.getState().setPaused(false)
      return { lines: [ok('running')] }

    case 'step':
      useSim.getState().step()
      return { lines: [ok('stepped 1 frame')] }

    case 'reset':
      useSim.getState().bumpReset()
      telemetry.reset()
      return { lines: [ok('reset — bodies & mission clock cleared')] }

    case 'list': {
      const bodies = useSim.getState().bodies
      if (bodies.length === 0) return { lines: [info('// scene empty')] }
      const lines: OutputLine[] = [info(`bodies: ${bodies.length}`)]
      for (const b of bodies) {
        const p = PRESETS_BY_ID[b.presetId]
        lines.push(
          log(
            `  #${b.id.padEnd(4)} ${p?.label ?? '???'}  ${
              b.label ? `"${b.label}"  ` : ''
            }m=${(b.mass ?? p?.mass ?? 1).toFixed(3)}kg  pos=(${b.pos.map((n) => n.toFixed(2)).join(', ')})`,
          ),
        )
      }
      return { lines }
    }

    case 'set': {
      if (rest[0]?.toLowerCase() === 'g') {
        const v = parseFloat(rest[1])
        if (Number.isNaN(v)) return { lines: [err('set g: expected a number — e.g. `set g 9.81`')] }
        useSim.getState().setGravity(v)
        return { lines: [ok(`G = ${v.toFixed(3)} m/s²`)] }
      }
      return { lines: [err(`set: unknown target '${rest[0] ?? ''}' — try 'set g <value>'`)] }
    }

    case 'preset': {
      const id = rest[0]?.toLowerCase() as WorldPresetId | undefined
      if (!id || !WORLD_PRESETS_BY_ID[id]) {
        return {
          lines: [
            err(
              `preset: expected one of earth/moon/mars/jupiter/zerog, got '${rest[0] ?? ''}'`,
            ),
          ],
        }
      }
      useSim.getState().applyWorldPreset(id)
      const w = WORLD_PRESETS_BY_ID[id]
      return { lines: [ok(`world → ${w.label}  ·  G=${w.gravity}  ρ=${w.airDensity}  vacuum=${w.vacuum}`)] }
    }

    case 'spawn': {
      const type = rest[0]?.toLowerCase()
      if (!type) {
        return { lines: [err('spawn: expected a type — try `spawn sphere` or run `help`')] }
      }
      const preset = PRESETS_BY_ID[type]
      if (!preset) {
        return {
          lines: [
            err(
              `spawn: unknown type '${type}' — valid: ${PRESETS.map((p) => p.id).join(', ')}`,
            ),
          ],
        }
      }
      const { flags } = splitFlags(rest.slice(1))

      let pos: [number, number, number] | undefined
      if (flags.pos) {
        const t = parseTriple(flags.pos)
        if (!t) return { lines: [err('spawn: pos= expected x,y,z numbers')] }
        pos = t
      }
      if (flags.alt) {
        const a = parseFloat(flags.alt)
        if (Number.isNaN(a)) return { lines: [err('spawn: alt= expected a number')] }
        pos = pos ? [pos[0], a, pos[2]] : [0, a, 0]
      }

      let vel: [number, number, number] | undefined
      if (flags.vel) {
        const t = parseTriple(flags.vel)
        if (!t) return { lines: [err('spawn: vel= expected vx,vy,vz numbers')] }
        vel = t
      }

      let mass: number | undefined
      if (flags.mass) {
        const m = parseFloat(flags.mass)
        if (Number.isNaN(m) || m <= 0) return { lines: [err('spawn: mass= expected a positive number')] }
        mass = m
      }

      const id = useSim.getState().spawn(type, { pos, vel, mass })
      if (!id) return { lines: [err('spawn: failed')] }
      return {
        lines: [
          ok(
            `spawned ${preset.label} #${id}` +
              (pos ? `  pos=(${pos.join(', ')})` : '') +
              (vel ? `  vel=(${vel.join(', ')})` : '') +
              (mass != null ? `  m=${mass}kg` : ''),
          ),
        ],
      }
    }

    case 'track': {
      const id = rest[0]
      if (!id) return { lines: [err('track: expected a body id — try `list` first')] }
      const body = useSim.getState().bodies.find((b) => b.id === id || b.label === id)
      if (!body) return { lines: [err(`track: no body matches '${id}'`)] }
      useSim.getState().selectBody(body.id)
      return { lines: [ok(`tracking #${body.id} (${body.label ?? PRESETS_BY_ID[body.presetId]?.label ?? '?'})`)] }
    }

    case 'save': {
      const target = rest[0]?.toLowerCase()
      if (!target) return { lines: [err('save: expected a name, or `export` / `share`')] }
      if (target === 'export') {
        downloadSim()
        return { lines: [ok('exported scene.sim to your downloads')] }
      }
      if (target === 'share') {
        const url = window.location.origin + window.location.pathname + '#share=' + encodeForUrl(serialize())
        // Best-effort clipboard copy — fall back to printing the URL.
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(url).catch(() => undefined)
          return {
            lines: [
              ok('shareable URL copied to clipboard'),
              log(url.length > 96 ? url.slice(0, 93) + '...' : url),
            ],
          }
        }
        return { lines: [ok('share URL:'), log(url)] }
      }
      saveSlot(target)
      return { lines: [ok(`saved → slot '${target}'`)] }
    }

    case 'load': {
      const target = rest[0]
      if (!target || target === '-') {
        const slots = listSlots()
        if (slots.length === 0) return { lines: [info('// no saved slots — use `save <name>` first')] }
        return { lines: [info('saved slots:'), ...slots.map((s) => log('  ' + s))] }
      }
      const snap = loadSlot(target)
      if (!snap) return { lines: [err(`load: no slot named '${target}' — try \`load -\``)] }
      applySnapshot(snap)
      return { lines: [ok(`loaded slot '${target}' — ${snap.bodies.length} bodies`)] }
    }

    default:
      return { lines: [err(`unknown command: '${cmd}' — type 'help'`)] }
  }
}
