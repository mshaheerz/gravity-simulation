import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Panel, Stub } from '../components/Panel'
import { Viewport } from '../viewport/Viewport'
import { useSim, WORLD_PRESETS, type WorldPresetId } from '../store/sim'
import { PRESETS, PRESETS_BY_ID } from '../sim/presets'
import {
  applySnapshot,
  downloadSim,
  encodeForUrl,
  serialize,
  uploadSim,
} from '../sim/save'
import { customAssets, type CustomAsset } from '../sim/customAssets'
import { events, type SimEvent } from '../sim/events'
import { formatMissionClock } from '../sim/SimClock'

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
          const custom = b.customAssetId ? customAssets.get(b.customAssetId) : undefined
          const swatchColor = preset?.color ?? '#9fc8ff'
          const swatchGlyph = preset?.emoji ?? custom?.emoji ?? '?'
          const typeLabel =
            preset?.label.toLowerCase() ??
            (custom ? `${custom.kind} · ${custom.name}` : 'custom')
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
                ▸ <span style={{ color: swatchColor }}>{swatchGlyph}</span>{' '}
                <span className="text-nasa-text">{b.label ?? b.id}</span>{' '}
                <span className="text-nasa-dim">// {typeLabel}</span>
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

function ConsoleSlider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix = '',
  decimals,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  suffix?: string
  decimals?: number
}) {
  const d = decimals ?? (step < 0.01 ? 3 : step < 0.1 ? 2 : step < 1 ? 1 : 0)
  return (
    <label className="flex flex-col gap-0.5">
      <div className="flex justify-between text-[11px]">
        <span className="text-nasa-dim">{label}</span>
        <span className="text-nasa-text">
          {value.toFixed(d)}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="nasa-range"
      />
    </label>
  )
}

// Log-slider for time-scale: linear UI 0..1 mapped to 0.01..10000 logarithmically.
function LogSlider({
  label,
  value,
  onChange,
  min,
  max,
  suffix = '',
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  suffix?: string
}) {
  const lmin = Math.log(min)
  const lmax = Math.log(max)
  const norm = (Math.log(Math.max(value, min)) - lmin) / (lmax - lmin)
  return (
    <label className="flex flex-col gap-0.5">
      <div className="flex justify-between text-[11px]">
        <span className="text-nasa-dim">{label}</span>
        <span className="text-nasa-text">
          ×{value < 1 ? value.toFixed(3) : value < 100 ? value.toFixed(2) : value.toFixed(0)}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.001}
        value={norm}
        onChange={(e) => {
          const n = parseFloat(e.target.value)
          onChange(Math.exp(lmin + n * (lmax - lmin)))
        }}
        className="nasa-range"
      />
    </label>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-nasa-border bg-black/40 p-2">
      <div className="panel-title text-[10px] mb-2">[ {title} ]</div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

export function PhysicsConsolePanel() {
  const gravity = useSim((s) => s.gravity)
  const vacuum = useSim((s) => s.vacuum)
  const airDensity = useSim((s) => s.airDensity)
  const timeScale = useSim((s) => s.timeScale)
  const worldPreset = useSim((s) => s.worldPreset)

  const setGravity = useSim((s) => s.setGravity)
  const setVacuum = useSim((s) => s.setVacuum)
  const setAirDensity = useSim((s) => s.setAirDensity)
  const setTimeScale = useSim((s) => s.setTimeScale)
  const applyWorldPreset = useSim((s) => s.applyWorldPreset)

  return (
    <Panel>
      <div className="space-y-3 text-[12px]">
        <Section title="WORLD PRESETS">
          <div className="grid grid-cols-3 gap-1">
            {WORLD_PRESETS.map((w) => {
              const active = worldPreset === w.id
              return (
                <button
                  key={w.id}
                  onClick={() => applyWorldPreset(w.id as WorldPresetId)}
                  title={`${w.description}\nG=${w.gravity} · ρ=${w.airDensity}`}
                  className={
                    'border px-1.5 py-1 text-[10px] text-left transition ' +
                    (active
                      ? 'border-nasa-accent bg-nasa-accent/15 text-nasa-accent'
                      : 'border-nasa-border hover:border-nasa-accent hover:bg-nasa-border/30 text-nasa-text')
                  }
                >
                  <div className="font-bold">{w.label}</div>
                  <div className="text-nasa-dim">g={w.gravity}</div>
                </button>
              )
            })}
          </div>
        </Section>

        <Section title="GRAVITY">
          <ConsoleSlider
            label="G"
            value={gravity}
            min={0}
            max={30}
            step={0.01}
            suffix=" m/s²"
            onChange={setGravity}
          />
        </Section>

        <Section title="ATMOSPHERE">
          <div className="flex items-center justify-between">
            <span className="text-nasa-dim text-[11px]">VACUUM</span>
            <button
              onClick={() => setVacuum(!vacuum)}
              className={
                'border px-2 py-0.5 text-[10px] transition ' +
                (vacuum
                  ? 'border-nasa-accent text-nasa-accent bg-nasa-accent/10'
                  : 'border-nasa-border text-nasa-text hover:border-nasa-accent')
              }
            >
              {vacuum ? '[ ON ]' : '[ OFF ]'}
            </button>
          </div>
          <ConsoleSlider
            label="AIR DENSITY"
            value={airDensity}
            min={0}
            max={10}
            step={0.001}
            suffix=" kg/m³"
            onChange={setAirDensity}
          />
          <div className="text-nasa-dim text-[10px] italic">
            // earth ≈ 1.225 · mars ≈ 0.020 · vacuum kills all drag
          </div>
        </Section>

        <Section title="TIME">
          <LogSlider
            label="TIME-SCALE"
            value={timeScale}
            min={0.01}
            max={10000}
            onChange={setTimeScale}
          />
          <div className="flex gap-1">
            {[0.1, 0.5, 1, 2, 10, 100].map((t) => (
              <button
                key={t}
                onClick={() => setTimeScale(t)}
                className={
                  'flex-1 border px-1 py-0.5 text-[10px] transition ' +
                  (Math.abs(timeScale - t) < 1e-6
                    ? 'border-nasa-accent text-nasa-accent bg-nasa-accent/10'
                    : 'border-nasa-border text-nasa-text hover:border-nasa-accent')
                }
              >
                ×{t}
              </button>
            ))}
          </div>
        </Section>
      </div>
    </Panel>
  )
}

function useCustomAssetList(): CustomAsset[] {
  // customAssets.list() now returns a stable array reference that only changes
  // when assets are added/removed, so useSyncExternalStore won't loop.
  return useSyncExternalStore(
    customAssets.subscribe,
    () => customAssets.list(),
  )
}

export function ObjectLibraryPanel() {
  const spawn = useSim((s) => s.spawn)
  const bumpReset = useSim((s) => s.bumpReset)
  const clearBodies = useSim((s) => s.clearBodies)
  const assets = useCustomAssetList()
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const flash = (kind: 'ok' | 'err', text: string) => {
    setStatus({ kind, text })
    window.setTimeout(() => setStatus(null), 2200)
  }

  const ingest = (files: FileList | File[]) => {
    const res = customAssets.ingestFiles(files)
    if (res.accepted > 0 && res.rejected.length === 0) {
      flash('ok', `loaded ${res.accepted} asset${res.accepted === 1 ? '' : 's'}`)
    } else if (res.accepted > 0) {
      flash('ok', `loaded ${res.accepted} · rejected ${res.rejected.length} (.glb/.gltf/.obj/.png/.jpg only)`)
    } else {
      flash('err', `unsupported format — accepts .glb / .gltf / .obj / .png / .jpg`)
    }
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files?.length) ingest(e.dataTransfer.files)
  }

  const handleExport = () => {
    downloadSim()
    flash('ok', 'exported scene.sim')
  }
  const handleImport = async () => {
    try {
      const snap = await uploadSim()
      applySnapshot(snap)
      flash('ok', `loaded ${snap.bodies.length} bodies`)
    } catch (e) {
      flash('err', e instanceof Error ? e.message : 'load failed')
    }
  }
  const handleShare = async () => {
    const url = window.location.origin + window.location.pathname + '#share=' + encodeForUrl(serialize())
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url)
        flash('ok', 'share URL copied to clipboard')
      } else {
        // Fall back to navigating so the user can copy from the address bar.
        window.prompt('Share URL — copy & paste:', url)
        flash('ok', 'share URL shown')
      }
    } catch {
      flash('err', 'clipboard blocked')
    }
  }

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

      <div className="mt-2 pt-2 border-t border-nasa-border">
        <div className="flex justify-between items-center mb-1">
          <div className="panel-title text-[10px]">[ CUSTOM ASSETS ]</div>
          <span className="text-nasa-dim text-[10px]">{assets.length} loaded</span>
        </div>
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={
            'cursor-pointer border-2 border-dashed text-center px-2 py-3 text-[10px] transition ' +
            (dragOver
              ? 'border-nasa-accent bg-nasa-accent/10 text-nasa-accent'
              : 'border-nasa-border bg-black/30 text-nasa-dim hover:text-nasa-text hover:border-nasa-accent')
          }
        >
          ⇡ drop .glb / .gltf / .obj / .png / .jpg here
          <br />
          <span className="opacity-70">or click to browse</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".glb,.gltf,.obj,.png,.jpg,.jpeg,.webp,.gif,model/gltf-binary,model/gltf+json"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) ingest(e.target.files)
            // Clear so re-selecting the same file fires onChange again.
            e.target.value = ''
          }}
        />
        {assets.length > 0 && (
          <div className="grid grid-cols-2 gap-1 mt-1">
            {assets.map((a) => (
              <div
                key={a.id}
                className="border border-nasa-border bg-black/40 hover:bg-nasa-border/30 hover:border-nasa-accent transition px-2 py-1.5 text-left group relative"
              >
                <button
                  onClick={() => {
                    spawn('custom', { customAssetId: a.id, label: a.name })
                  }}
                  className="w-full text-left"
                  title={`Spawn ${a.name}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-nasa-warn text-base">{a.emoji}</span>
                    <span className="text-nasa-accent text-[11px] truncate">
                      {a.name}
                    </span>
                  </div>
                  <div className="text-nasa-dim text-[10px] mt-0.5 uppercase">
                    {a.kind} · r={a.defaultRadius}m
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    customAssets.remove(a.id)
                  }}
                  title="Remove from library"
                  className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 text-nasa-danger px-1 text-[10px] hover:underline"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-2 pt-2 border-t border-nasa-border">
        <div className="panel-title text-[10px] mb-1">[ SAVE / LOAD ]</div>
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={handleExport}
            title="Download current scene as a .sim file"
            className="border border-nasa-border hover:border-nasa-accent hover:bg-nasa-border/30 text-nasa-text px-1 py-1 text-[10px] transition"
          >
            ⇣ EXPORT
          </button>
          <button
            onClick={handleImport}
            title="Load a .sim / .json file from disk"
            className="border border-nasa-border hover:border-nasa-accent hover:bg-nasa-border/30 text-nasa-text px-1 py-1 text-[10px] transition"
          >
            ⇡ IMPORT
          </button>
          <button
            onClick={handleShare}
            title="Copy a shareable URL with the whole scene encoded in the hash"
            className="border border-nasa-border hover:border-nasa-accent hover:bg-nasa-border/30 text-nasa-text px-1 py-1 text-[10px] transition"
          >
            ⌁ SHARE
          </button>
        </div>
        {status && (
          <div
            className={
              'mt-1 text-[10px] ' +
              (status.kind === 'ok' ? 'text-nasa-accent' : 'text-nasa-danger')
            }
          >
            {status.kind === 'ok' ? '✓ ' : '✗ '}
            {status.text}
          </div>
        )}
      </div>
      <div className="text-nasa-dim text-[10px] mt-2 italic">
        {'// autosave runs in background · terminal: `save <name>` / `load -`'}
      </div>
    </Panel>
  )
}

export { TelemetryPanel } from './TelemetryPanel'

export { TimelinePanel } from './TimelinePanel'

export { TerminalPanel } from './TerminalPanel'

const kindColor = (k: SimEvent['kind']) =>
  k === 'IMPACT'
    ? 'text-nasa-warn'
    : k === 'ERROR'
      ? 'text-nasa-danger'
      : k === 'SCENE'
        ? 'text-nasa-accent'
        : k === 'WORLD'
          ? 'text-nasa-accent'
          : k === 'PHYSICS'
            ? 'text-nasa-warn'
            : 'text-nasa-text'

export function EventLogPanel() {
  // useSyncExternalStore — re-renders only when events fire.
  // events.snapshot() returns a stable array reference.
  const list = useSyncExternalStore(
    events.subscribe,
    () => events.snapshot(),
  )
  const scrollRef = useRef<HTMLDivElement | null>(null)
  // Auto-scroll to newest. Run as an effect tied to list length so we only
  // snap when new lines arrive — not on every parent re-render.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [list.length])

  return (
    <Panel scroll={false}>
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-1 text-[10px]">
          <span className="text-nasa-dim">{list.length} events</span>
          <button
            onClick={() => events.clear()}
            className="text-nasa-danger hover:underline"
          >
            [ CLEAR ]
          </button>
        </div>
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto space-y-0.5 text-[11px] font-mono pr-1">
          {list.length === 0 && <Stub label="event log empty" />}
          {list.map((e) => (
            <div key={e.id} className="whitespace-pre-wrap break-words">
              <span className="text-nasa-dim">[{formatMissionClock(e.t)}]</span>{' '}
              <span className={kindColor(e.kind)}>{e.kind}</span>{' '}
              <span className="text-nasa-text">{e.text}</span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  )
}
