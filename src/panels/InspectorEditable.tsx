import { useEffect, useState } from 'react'
import { Panel, Stub } from '../components/Panel'
import { useSim, type Body } from '../store/sim'
import { PRESETS_BY_ID } from '../sim/presets'
import { bodyRefs } from '../sim/bodyRefs'

function snapshotLive(id: string): { pos: [number, number, number]; vel: [number, number, number] } | null {
  const rb = bodyRefs.get(id)
  if (!rb) return null
  const t = rb.translation()
  const v = rb.linvel()
  return { pos: [t.x, t.y, t.z], vel: [v.x, v.y, v.z] }
}

function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix = '',
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  suffix?: string
}) {
  return (
    <label className="flex flex-col gap-0.5">
      <div className="flex justify-between text-[11px]">
        <span className="text-nasa-dim">{label}</span>
        <span className="text-nasa-text">
          {value.toFixed(step < 0.1 ? 2 : step < 1 ? 1 : 0)}
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

function Num({
  value,
  onChange,
  step = 0.1,
}: {
  value: number
  onChange: (v: number) => void
  step?: number
}) {
  return (
    <input
      type="number"
      step={step}
      value={value}
      onChange={(e) => {
        const n = parseFloat(e.target.value)
        if (!Number.isNaN(n)) onChange(n)
      }}
      className="w-16 bg-black border border-nasa-border px-1 py-0.5 text-nasa-text text-[11px] focus:border-nasa-accent outline-none"
    />
  )
}

export function InspectorPanelEditable() {
  const selectedId = useSim((s) => s.selectedId)
  const bodies = useSim((s) => s.bodies)
  const updateBody = useSim((s) => s.updateBody)
  const updateBodyPhysics = useSim((s) => s.updateBodyPhysics)
  const body = bodies.find((b) => b.id === selectedId)

  // Live readout of position / velocity from Rapier — polled at ~10 Hz
  const [live, setLive] = useState<{ pos: [number, number, number]; vel: [number, number, number] } | null>(null)
  useEffect(() => {
    if (!body) return
    const id = setInterval(() => {
      setLive(snapshotLive(body.id))
    }, 100)
    return () => clearInterval(id)
  }, [body?.id])

  if (!body) {
    return (
      <Panel>
        <Stub label="select a body in the viewport or scene tree" />
      </Panel>
    )
  }

  const preset = PRESETS_BY_ID[body.presetId]
  const mass = body.mass ?? preset?.mass ?? 1
  const rest = body.restitution ?? preset?.restitution ?? 0.3
  const fric = body.friction ?? preset?.friction ?? 0.5
  const drag = body.linearDamping ?? preset?.linearDamping ?? 0.05
  const color = body.color ?? preset?.color ?? '#ffffff'

  // Helpers that snapshot live state so physics edits don't teleport the body to spawn.
  const setPhysics = (patch: Partial<Body>) => {
    const snap = snapshotLive(body.id)
    updateBodyPhysics(body.id, {
      ...(snap ? { pos: snap.pos, vel: snap.vel } : {}),
      ...patch,
    })
  }

  // Position teleport — directly mutate the rigid body, no remount.
  const teleport = (i: 0 | 1 | 2, v: number) => {
    const rb = bodyRefs.get(body.id)
    if (!rb) return
    const t = rb.translation()
    const next = { x: t.x, y: t.y, z: t.z }
    if (i === 0) next.x = v
    if (i === 1) next.y = v
    if (i === 2) next.z = v
    rb.setTranslation(next, true)
    // also clear linear velocity to give a clean nudge
    // (do not — user may want to retain velocity; leave alone)
    updateBody(body.id, { pos: [next.x, next.y, next.z] })
  }

  // Velocity write
  const setVel = (i: 0 | 1 | 2, v: number) => {
    const rb = bodyRefs.get(body.id)
    const cur = rb?.linvel() ?? { x: body.vel[0], y: body.vel[1], z: body.vel[2] }
    const next = { x: cur.x, y: cur.y, z: cur.z }
    if (i === 0) next.x = v
    if (i === 1) next.y = v
    if (i === 2) next.z = v
    if (rb) rb.setLinvel(next, true)
    updateBody(body.id, { vel: [next.x, next.y, next.z] })
  }

  const launch = (speed: number, vy: number) => {
    const rb = bodyRefs.get(body.id)
    if (!rb) return
    const t = rb.translation()
    // launch outward in +X with optional upward component
    rb.setLinvel({ x: speed, y: vy, z: 0 }, true)
    updateBody(body.id, { vel: [speed, vy, 0], pos: [t.x, t.y, t.z] })
  }

  const stop = () => {
    const rb = bodyRefs.get(body.id)
    if (!rb) return
    rb.setLinvel({ x: 0, y: 0, z: 0 }, true)
    rb.setAngvel({ x: 0, y: 0, z: 0 }, true)
    updateBody(body.id, { vel: [0, 0, 0] })
  }

  return (
    <Panel>
      <div className="space-y-3 text-[12px]">
        <div className="flex items-center gap-2">
          <span style={{ color }} className="text-lg">{preset?.emoji}</span>
          <input
            value={body.label ?? ''}
            placeholder={preset?.label ?? '??'}
            onChange={(e) => updateBody(body.id, { label: e.target.value })}
            className="flex-1 bg-transparent border-b border-nasa-border text-nasa-accent font-bold focus:border-nasa-accent outline-none"
          />
          <span className="text-nasa-dim text-[10px]">#{body.id}</span>
        </div>

        <div className="text-nasa-dim italic text-[11px]">{preset?.description}</div>

        <Section title="MATERIAL">
          <Slider label="MASS" value={mass} min={0.001} max={500} step={0.001} suffix=" kg" onChange={(v) => setPhysics({ mass: v })} />
          <Slider label="RESTITUTION" value={rest} min={0} max={1} step={0.01} onChange={(v) => setPhysics({ restitution: v })} />
          <Slider label="FRICTION" value={fric} min={0} max={2} step={0.01} onChange={(v) => setPhysics({ friction: v })} />
          <Slider label="LIN DAMP" value={drag} min={0} max={5} step={0.01} onChange={(v) => setPhysics({ linearDamping: v })} />
          <div className="flex items-center gap-2 mt-1">
            <span className="text-nasa-dim text-[11px]">COLOR</span>
            <input
              type="color"
              value={color}
              onChange={(e) => updateBody(body.id, { color: e.target.value })}
              className="w-8 h-5 bg-transparent border border-nasa-border cursor-pointer"
            />
            <span className="text-nasa-text text-[10px]">{color.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-nasa-dim text-[11px]">GRAVITY</span>
            <button
              onClick={() => setPhysics({ gravityEnabled: !(body.gravityEnabled ?? true) })}
              className={
                'flex-1 border px-2 py-0.5 text-[10px] transition ' +
                ((body.gravityEnabled ?? true)
                  ? 'border-nasa-accent text-nasa-accent hover:bg-nasa-accent/10'
                  : 'border-nasa-border text-nasa-text hover:border-nasa-accent hover:bg-nasa-border/30')
              }
            >
              [ {body.gravityEnabled ?? true ? 'ON' : 'OFF'} ]
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-nasa-dim text-[11px]">FIXED</span>
            <button
              onClick={() => setPhysics({ fixed: !(body.fixed ?? false) })}
              className={
                'flex-1 border px-2 py-0.5 text-[10px] transition ' +
                ((body.fixed ?? false)
                  ? 'border-nasa-accent text-nasa-accent hover:bg-nasa-accent/10'
                  : 'border-nasa-border text-nasa-text hover:border-nasa-accent hover:bg-nasa-border/30')
              }
            >
              [ {body.fixed ?? false ? 'ON' : 'OFF'} ]
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-nasa-dim text-[11px]">TERRAIN</span>
            <button
              onClick={() => setPhysics({ terrain: !(body.terrain ?? false) })}
              className={
                'flex-1 border px-2 py-0.5 text-[10px] transition ' +
                ((body.terrain ?? false)
                  ? 'border-nasa-warn text-nasa-warn hover:bg-nasa-warn/10'
                  : 'border-nasa-border text-nasa-text hover:border-nasa-warn hover:bg-nasa-border/30')
              }
            >
              [ {body.terrain ?? false ? 'YES' : 'NO'} ]
            </button>
          </div>
          <div className="mt-1">
            <Slider
              label="SCALE"
              value={body.scale ?? 1}
              min={0.1}
              max={100}
              step={0.1}
              onChange={(v) => setPhysics({ scale: v })}
            />
            <div className="flex gap-1 mt-1">
              <button
                onClick={() => setPhysics({ scale: 1 })}
                className="flex-1 border border-nasa-border hover:border-nasa-accent hover:bg-nasa-border/30 text-nasa-text px-1 py-0.5 text-[10px] transition"
              >
                ×1
              </button>
              <button
                onClick={() => setPhysics({ scale: (body.scale ?? 1) * 2 })}
                className="flex-1 border border-nasa-border hover:border-nasa-accent hover:bg-nasa-border/30 text-nasa-text px-1 py-0.5 text-[10px] transition"
              >
                ×2
              </button>
              <button
                onClick={() => setPhysics({ scale: (body.scale ?? 1) * 5 })}
                className="flex-1 border border-nasa-border hover:border-nasa-accent hover:bg-nasa-border/30 text-nasa-text px-1 py-0.5 text-[10px] transition"
              >
                ×5
              </button>
              <button
                onClick={() => setPhysics({ scale: (body.scale ?? 1) * 10 })}
                className="flex-1 border border-nasa-border hover:border-nasa-accent hover:bg-nasa-border/30 text-nasa-text px-1 py-0.5 text-[10px] transition"
              >
                ×10
              </button>
            </div>
          </div>
        </Section>

        <Section title="POSITION (m)">
          <div className="grid grid-cols-3 gap-1">
            {(['X', 'Y', 'Z'] as const).map((ax, i) => (
              <div key={ax} className="flex items-center gap-1">
                <span className="text-nasa-dim text-[10px]">{ax}</span>
                <Num
                  value={live?.pos[i] ?? body.pos[i]}
                  onChange={(v) => teleport(i as 0 | 1 | 2, v)}
                  step={0.1}
                />
              </div>
            ))}
          </div>
        </Section>

        <Section title="VELOCITY (m/s)">
          <div className="grid grid-cols-3 gap-1">
            {(['VX', 'VY', 'VZ'] as const).map((ax, i) => (
              <div key={ax} className="flex items-center gap-1">
                <span className="text-nasa-dim text-[10px]">{ax}</span>
                <Num
                  value={live?.vel[i] ?? body.vel[i]}
                  onChange={(v) => setVel(i as 0 | 1 | 2, v)}
                  step={0.1}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-1 mt-1">
            <button
              onClick={() => launch(5, 8)}
              className="flex-1 border border-nasa-border hover:border-nasa-accent hover:bg-nasa-border/30 px-2 py-0.5 text-[10px]"
            >
              [ LAUNCH ↗ ]
            </button>
            <button
              onClick={() => launch(0, 10)}
              className="flex-1 border border-nasa-border hover:border-nasa-accent hover:bg-nasa-border/30 px-2 py-0.5 text-[10px]"
            >
              [ BOOST ↑ ]
            </button>
            <button
              onClick={stop}
              className="flex-1 border border-nasa-border hover:border-nasa-danger hover:bg-nasa-danger/10 px-2 py-0.5 text-[10px]"
            >
              [ STOP ]
            </button>
          </div>
        </Section>

        <Section title="LIVE TELEMETRY">
          <Field k="SPEED" v={live ? Math.hypot(...live.vel).toFixed(3) + ' m/s' : '–'} />
          <Field k="ALTITUDE" v={live ? live.pos[1].toFixed(3) + ' m' : '–'} />
          <Field k="KE" v={live ? (0.5 * mass * (live.vel[0] ** 2 + live.vel[1] ** 2 + live.vel[2] ** 2)).toFixed(2) + ' J' : '–'} />
        </Section>
      </div>
    </Panel>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-nasa-border bg-black/40 p-2">
      <div className="panel-title text-[10px] mb-2">[ {title} ]</div>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between text-[11px]">
      <span className="text-nasa-dim">{k}</span>
      <span className="text-nasa-text">{v}</span>
    </div>
  )
}
