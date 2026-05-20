import { Panel, Stub } from '../components/Panel'
import { Viewport } from '../viewport/Viewport'
import { useSim } from '../store/sim'
import { PRESETS, PRESETS_BY_ID } from '../sim/presets'

export function ViewportPanel() {
  return (
    <div className="h-full w-full bg-black">
      <Viewport />
    </div>
  )
}

export function SceneTreePanel() {
  const bodies = useSim((s) => s.bodies)
  const selectedId = useSim((s) => s.selectedId)
  const selectBody = useSim((s) => s.selectBody)
  const removeBody = useSim((s) => s.removeBody)
  const clearBodies = useSim((s) => s.clearBodies)

  return (
    <Panel>
      <div className="space-y-1 text-[12px]">
        <div className="flex justify-between items-center text-nasa-accent">
          <span>▾ SCENE · BODIES ({bodies.length})</span>
          {bodies.length > 0 && (
            <button
              onClick={() => clearBodies()}
              className="text-nasa-danger text-[10px] hover:underline"
            >
              [ CLEAR ALL ]
            </button>
          )}
        </div>
        {bodies.length === 0 && (
          <div className="text-nasa-dim italic pl-3">
            // empty — spawn from OBJECT LIBRARY
          </div>
        )}
        {bodies.map((b) => {
          const preset = PRESETS_BY_ID[b.presetId]
          const isSelected = selectedId === b.id
          return (
            <div
              key={b.id}
              onClick={() => selectBody(b.id)}
              className={
                'flex items-center justify-between pl-3 pr-1 py-0.5 cursor-pointer group ' +
                (isSelected
                  ? 'bg-nasa-border/40 border-l-2 border-nasa-accent text-nasa-accent'
                  : 'border-l-2 border-transparent hover:bg-nasa-border/20')
              }
            >
              <span>
                ▸ <span style={{ color: preset?.color ?? '#fff' }}>{preset?.emoji ?? '?'}</span>{' '}
                <span className="text-nasa-text">{b.label ?? b.id}</span>{' '}
                <span className="text-nasa-dim">// {preset?.label.toLowerCase()}</span>
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeBody(b.id)
                }}
                className="opacity-0 group-hover:opacity-100 text-nasa-danger px-1 hover:underline"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

export { InspectorPanelEditable as InspectorPanel } from './InspectorEditable'

export function PhysicsConsolePanel() {
  const gravity = useSim((s) => s.gravity)
  const vacuum = useSim((s) => s.vacuum)
  const timeScale = useSim((s) => s.timeScale)
  return (
    <Panel>
      <div className="space-y-2 text-[12px]">
        <div>
          <span className="text-nasa-dim">G =</span>{' '}
          <span className="text-nasa-warn">{gravity.toFixed(3)} m/s²</span>
        </div>
        <div>
          <span className="text-nasa-dim">VACUUM =</span>{' '}
          <span className={vacuum ? 'text-nasa-accent' : 'text-nasa-danger'}>
            {vacuum ? 'ON' : 'OFF'}
          </span>
        </div>
        <div>
          <span className="text-nasa-dim">TIMESCALE =</span>{' '}
          <span className="text-nasa-accent">×{timeScale.toFixed(2)}</span>
        </div>
        <Stub label="sliders + preset world buttons (milestone 7)" />
      </div>
    </Panel>
  )
}

export function ObjectLibraryPanel() {
  const spawn = useSim((s) => s.spawn)
  const bumpReset = useSim((s) => s.bumpReset)
  const clearBodies = useSim((s) => s.clearBodies)

  return (
    <Panel>
      <div className="grid grid-cols-2 gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => spawn(p.id)}
            title={p.description}
            className="border border-nasa-border bg-black/40 hover:bg-nasa-border/30 hover:border-nasa-accent transition px-2 py-2 text-left active:bg-nasa-accent/20"
          >
            <div className="flex items-center gap-2">
              <span style={{ color: p.color }} className="text-base">{p.emoji}</span>
              <span className="text-nasa-accent text-[12px]">{p.label}</span>
            </div>
            <div className="text-nasa-dim text-[10px] mt-0.5">
              m={p.mass}kg · e={p.restitution}
            </div>
          </button>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-nasa-border flex gap-1">
        <button
          onClick={() => bumpReset()}
          className="flex-1 border border-nasa-border hover:border-nasa-accent hover:bg-nasa-border/30 text-nasa-text px-2 py-1 text-[11px] transition"
        >
          [ RESET POSITIONS ]
        </button>
        <button
          onClick={() => clearBodies()}
          className="flex-1 border border-nasa-border hover:border-nasa-danger hover:bg-nasa-danger/10 text-nasa-text px-2 py-1 text-[11px] transition"
        >
          [ CLEAR ALL ]
        </button>
      </div>
      <div className="text-nasa-dim text-[10px] mt-2 italic">
        // click a preset to spawn at a random altitude · custom GLB/PNG upload in milestone 12
      </div>
    </Panel>
  )
}

export function TelemetryPanel() {
  return (
    <Panel>
      <div className="h-32 border border-nasa-border bg-black/60 mb-2 flex items-center justify-center text-nasa-dim text-[10px]">
        // uPlot chart slot — altitude vs t
      </div>
      <div className="h-32 border border-nasa-border bg-black/60 flex items-center justify-center text-nasa-dim text-[10px]">
        // uPlot chart slot — velocity vs t
      </div>
      <Stub label="live charts wire up in milestone 8" />
    </Panel>
  )
}

export function TimelinePanel() {
  const paused = useSim((s) => s.paused)
  const setPaused = useSim((s) => s.setPaused)
  const bumpReset = useSim((s) => s.bumpReset)
  const timeScale = useSim((s) => s.timeScale)

  return (
    <Panel scroll={false}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => bumpReset()}
          className="border border-nasa-border px-2 py-1 hover:border-nasa-accent"
        >
          ⏮ RST
        </button>
        <button
          onClick={() => setPaused(true)}
          className={
            'border px-2 py-1 ' +
            (paused
              ? 'border-nasa-warn text-nasa-warn'
              : 'border-nasa-border hover:border-nasa-accent')
          }
        >
          ⏸ PSE
        </button>
        <button
          onClick={() => setPaused(false)}
          className={
            'border px-2 py-1 ' +
            (!paused
              ? 'border-nasa-accent text-nasa-accent'
              : 'border-nasa-border hover:border-nasa-accent')
          }
        >
          ▶ PLY
        </button>
        <button className="border border-nasa-border px-2 py-1 hover:border-nasa-accent">⏭ STP</button>
        <div className="flex-1 h-1 bg-nasa-border mx-2 relative">
          <div className="absolute inset-y-0 left-0 w-1/4 bg-nasa-accent" />
        </div>
        <span className="text-nasa-warn text-[11px]">×{timeScale.toFixed(2)}</span>
      </div>
    </Panel>
  )
}

export function TerminalPanel() {
  return (
    <Panel scroll={false}>
      <div className="h-full flex flex-col font-mono text-[12px]">
        <div className="flex-1 overflow-auto space-y-0.5">
          <div className="text-nasa-dim">GRAVSIM SHELL v0.0.1 — type 'help' (milestone 10)</div>
          <div>
            <span className="text-nasa-accent">gravsim&gt;</span>{' '}
            <span className="text-nasa-dim">// awaiting input</span>
          </div>
        </div>
        <div className="flex items-center border-t border-nasa-border pt-1 mt-1">
          <span className="text-nasa-accent mr-1">gravsim&gt;</span>
          <input
            disabled
            placeholder="commands enabled in milestone 10"
            className="flex-1 bg-transparent outline-none text-nasa-text placeholder:text-nasa-dim disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </Panel>
  )
}

export function EventLogPanel() {
  const bodies = useSim((s) => s.bodies)
  return (
    <Panel>
      <div className="space-y-0.5 text-[11px] font-mono">
        <div>
          <span className="text-nasa-dim">[T+00:00:00.000]</span>{' '}
          <span className="text-nasa-accent">SYSTEM</span> gravsim boot complete
        </div>
        <div>
          <span className="text-nasa-dim">[T+00:00:00.020]</span>{' '}
          <span className="text-nasa-warn">PHYSICS</span> rapier wasm online
        </div>
        <div>
          <span className="text-nasa-dim">[T+00:00:00.140]</span>{' '}
          <span className="text-nasa-accent">SCENE</span> seeded with {bodies.length} bodies
        </div>
        <Stub label="impact / collision / error events (milestone 13)" />
      </div>
    </Panel>
  )
}
