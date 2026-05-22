import { useEffect, useState } from 'react'
import { Panel } from '../components/Panel'
import { useSim } from '../store/sim'
import { formatMissionClock } from '../sim/SimClock'

/** Quick-pick time-scale presets. Same set as the Physics Console for muscle memory. */
const SPEED_PRESETS = [0.1, 0.5, 1, 2, 10, 100]

function TransportButton({
  label,
  hint,
  active,
  variant = 'normal',
  onClick,
}: {
  label: string
  hint: string
  active?: boolean
  variant?: 'normal' | 'warn' | 'danger'
  onClick: () => void
}) {
  const color =
    variant === 'warn'
      ? 'text-nasa-warn'
      : variant === 'danger'
        ? 'text-nasa-danger'
        : 'text-nasa-text'
  const borderActive =
    variant === 'warn'
      ? 'border-nasa-warn bg-nasa-warn/10'
      : variant === 'danger'
        ? 'border-nasa-danger bg-nasa-danger/10'
        : 'border-nasa-accent bg-nasa-accent/10'
  return (
    <button
      onClick={onClick}
      title={hint}
      className={
        'flex-1 border px-2 py-1.5 text-[11px] transition ' +
        color +
        ' ' +
        (active
          ? borderActive
          : 'border-nasa-border hover:border-nasa-accent hover:bg-nasa-border/30')
      }
    >
      {label}
    </button>
  )
}

/** Smooth log-mapped time-scale slider (0.01× ↔ 10000×). */
function LogScrubber({
  value,
  onChange,
  min = 0.01,
  max = 10000,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}) {
  const lmin = Math.log(min)
  const lmax = Math.log(max)
  const norm = (Math.log(Math.max(value, min)) - lmin) / (lmax - lmin)
  return (
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
      className="nasa-range flex-1"
    />
  )
}

/** A tiny pulsing dot — green when RUN, amber when PAUSED. Cribbed mission-control vibe. */
function StatusLamp({ paused }: { paused: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={
          'inline-block w-2 h-2 rounded-full ' +
          (paused ? 'bg-nasa-warn animate-pulse' : 'bg-nasa-accent')
        }
        style={{
          boxShadow: paused
            ? '0 0 6px var(--nasa-warn)'
            : '0 0 6px var(--nasa-accent)',
        }}
      />
      <span
        className={
          'text-[10px] tracking-wider ' +
          (paused ? 'text-nasa-warn' : 'text-nasa-accent')
        }
      >
        {paused ? 'PAUSED' : 'RUN'}
      </span>
    </span>
  )
}

export function TimelinePanel() {
  const paused = useSim((s) => s.paused)
  const setPaused = useSim((s) => s.setPaused)
  const bumpReset = useSim((s) => s.bumpReset)
  const step = useSim((s) => s.step)
  const timeScale = useSim((s) => s.timeScale)
  const setTimeScale = useSim((s) => s.setTimeScale)

  // Mission clock — store updates at rAF rate, but selecting through zustand
  // would re-render the whole panel every frame. Instead snapshot at 10 Hz so
  // text updates feel live without thrashing React.
  const [clock, setClock] = useState(() => useSim.getState().simTime)
  useEffect(() => {
    const id = setInterval(() => setClock(useSim.getState().simTime), 100)
    return () => clearInterval(id)
  }, [])

  return (
    <Panel scroll={false}>
      <div className="h-full flex flex-col gap-2 text-[11px]">
        {/* Mission clock + status */}
        <div className="flex items-center justify-between border border-nasa-border bg-black/60 px-2 py-1.5">
          <StatusLamp paused={paused} />
          <span className="font-mono text-nasa-accent text-[13px] tracking-wider phosphor-glow">
            {formatMissionClock(clock)}
          </span>
          <span className="text-nasa-warn text-[10px]">×{timeScale < 1 ? timeScale.toFixed(3) : timeScale < 100 ? timeScale.toFixed(2) : timeScale.toFixed(0)}</span>
        </div>

        {/* Transport row */}
        <div className="flex items-center gap-1">
          <TransportButton
            label="⏮ RST"
            hint="Reset positions & mission clock"
            variant="danger"
            onClick={() => bumpReset()}
          />
          <TransportButton
            label="⏸ PSE"
            hint="Pause simulation"
            variant="warn"
            active={paused}
            onClick={() => setPaused(true)}
          />
          <TransportButton
            label="▶ PLY"
            hint="Resume simulation"
            active={!paused}
            onClick={() => setPaused(false)}
          />
          <TransportButton
            label="⏭ STP"
            hint="Single-frame step (1/60s × time-scale) — only while paused"
            onClick={() => step()}
          />
        </div>

        {/* Scrubber */}
        <div className="flex items-center gap-2">
          <span className="text-nasa-dim text-[10px] w-12">SPEED</span>
          <LogScrubber value={timeScale} onChange={setTimeScale} />
          <button
            onClick={() => setTimeScale(1)}
            className="border border-nasa-border hover:border-nasa-accent text-nasa-dim hover:text-nasa-accent px-1.5 py-0.5 text-[10px]"
            title="Reset to real-time (×1)"
          >
            ×1
          </button>
        </div>

        {/* Quick-pick speeds */}
        <div className="flex gap-1">
          {SPEED_PRESETS.map((t) => {
            const active = Math.abs(timeScale - t) < 1e-6
            return (
              <button
                key={t}
                onClick={() => setTimeScale(t)}
                className={
                  'flex-1 border px-1 py-0.5 text-[10px] transition ' +
                  (active
                    ? 'border-nasa-accent text-nasa-accent bg-nasa-accent/10'
                    : 'border-nasa-border text-nasa-text hover:border-nasa-accent')
                }
              >
                ×{t}
              </button>
            )
          })}
        </div>

        <div className="text-nasa-dim text-[10px] italic mt-auto">
          // mission clock freezes when paused · STP advances one Rapier frame
        </div>
      </div>
    </Panel>
  )
}
