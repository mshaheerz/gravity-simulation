import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import type uPlot from 'uplot'
import { Panel } from '../components/Panel'
import { UPlotChart, type SeriesSpec } from '../components/UPlotChart'
import { useSim } from '../store/sim'
import { PRESETS_BY_ID } from '../sim/presets'
import { telemetry, linearize } from '../sim/telemetry'

/**
 * Build a stable nonce that changes whenever any subscribed trace gets a new
 * sample, so React knows to re-render. We compose head counters across the
 * selected ids.
 */
function useTelemetrySnapshot(ids: string[]) {
  const getSnapshot = useCallback(() => {
    // Compose a small string so React shallow-compares correctly.
    const snap = telemetry.snapshot()
    let key = ''
    for (const id of ids) {
      const tr = snap.get(id)
      key += id + ':' + (tr ? tr.count + '@' + tr.head : 'none') + ';'
    }
    return key
  }, [ids.join(',')])  // Stable dependency based on a serialized version of ids
  
  return useSyncExternalStore(
    telemetry.subscribe,
    getSnapshot,
  )
}

export function TelemetryPanel() {
  const bodies = useSim((s) => s.bodies)
  const selectedId = useSim((s) => s.selectedId)

  // Local multi-select state — defaults to the globally-selected body.
  const [picked, setPicked] = useState<Set<string>>(() =>
    selectedId ? new Set([selectedId]) : new Set(),
  )

  // When the user picks a different body in the scene tree / viewport, auto-add it.
  useEffect(() => {
    if (!selectedId) return
    setPicked((prev) => {
      if (prev.has(selectedId)) return prev
      const next = new Set(prev)
      next.add(selectedId)
      return next
    })
  }, [selectedId])

  // Drop ids that no longer exist.
  useEffect(() => {
    setPicked((prev) => {
      const live = new Set(bodies.map((b) => b.id))
      let changed = false
      const next = new Set<string>()
      for (const id of prev) {
        if (live.has(id)) next.add(id)
        else changed = true
      }
      return changed ? next : prev
    })
  }, [bodies])

  const pickedIds = useMemo(() => Array.from(picked), [picked])

  // Subscribe — re-renders whenever any selected trace ticks.
  useTelemetrySnapshot(pickedIds)

  // Build aligned uPlot datasets. uPlot needs a single x-axis shared by all
  // series, so we pick the longest selected trace as the spine and resample
  // the others onto its timestamps (nearest-earlier sample). For a single
  // selection this is just identity.
  const built = useMemo(() => {
    const snap = telemetry.snapshot()
    const linearized = pickedIds.map((id) => ({
      id,
      data: snap.get(id) ? linearize(snap.get(id)!) : null,
    }))

    // Pick spine = longest trace.
    let spineIdx = -1
    let spineLen = 0
    linearized.forEach((l, i) => {
      const n = l.data?.t.length ?? 0
      if (n > spineLen) {
        spineLen = n
        spineIdx = i
      }
    })

    if (spineIdx < 0 || spineLen === 0) {
      return null
    }

    const spineT = linearized[spineIdx].data!.t

    const align = (
      other: number[] | null,
      otherT: number[] | null,
    ): number[] => {
      if (!other || !otherT || other.length === 0) return spineT.map(() => NaN)
      // Both arrays are sorted ascending; walk a pointer.
      const out = new Array<number>(spineT.length)
      let j = 0
      for (let i = 0; i < spineT.length; i++) {
        const tx = spineT[i]
        while (j + 1 < otherT.length && otherT[j + 1] <= tx) j++
        if (otherT[j] > tx) {
          out[i] = NaN // before the other trace started
        } else {
          out[i] = other[j]
        }
      }
      return out
    }

    const altitude: uPlot.AlignedData = [spineT]
    const speed: uPlot.AlignedData = [spineT]
    const ke: uPlot.AlignedData = [spineT]
    const totalE: uPlot.AlignedData = [spineT]

    for (const l of linearized) {
      if (!l.data) {
        ;(altitude as number[][]).push(spineT.map(() => NaN))
        ;(speed as number[][]).push(spineT.map(() => NaN))
        ;(ke as number[][]).push(spineT.map(() => NaN))
        ;(totalE as number[][]).push(spineT.map(() => NaN))
        continue
      }
      ;(altitude as number[][]).push(align(l.data.altitude, l.data.t))
      ;(speed as number[][]).push(align(l.data.speed, l.data.t))
      ;(ke as number[][]).push(align(l.data.ke, l.data.t))
      ;(totalE as number[][]).push(align(l.data.totalE, l.data.t))
    }

    const series: SeriesSpec[] = pickedIds.map((id) => {
      const body = bodies.find((b) => b.id === id)
      const preset = body ? PRESETS_BY_ID[body.presetId] : undefined
      return {
        label: body?.label ?? id,
        color: body?.color ?? preset?.color ?? 'var(--nasa-accent)',
      }
    })

    return { altitude, speed, ke, totalE, series }
  }, [pickedIds, bodies])

  return (
    <Panel>
      <div className="space-y-2 text-[11px]">
        {/* Body chip picker */}
        <div>
          <div className="text-nasa-dim mb-1">[ TRACKING ]</div>
          {bodies.length === 0 ? (
            <div className="text-nasa-dim italic">// no bodies in scene</div>
          ) : (
            <div className="flex flex-wrap gap-1">
              {bodies.map((b) => {
                const preset = PRESETS_BY_ID[b.presetId]
                const on = picked.has(b.id)
                return (
                  <button
                    key={b.id}
                    onClick={() => {
                      setPicked((prev) => {
                        const next = new Set(prev)
                        if (next.has(b.id)) next.delete(b.id)
                        else next.add(b.id)
                        return next
                      })
                    }}
                    style={{ borderColor: on ? (b.color ?? preset?.color) : undefined }}
                    className={
                      'border px-1.5 py-0.5 text-[10px] transition ' +
                      (on
                        ? 'bg-nasa-border/40 text-nasa-text'
                        : 'border-nasa-border text-nasa-dim hover:text-nasa-text hover:border-nasa-accent')
                    }
                  >
                    <span style={{ color: b.color ?? preset?.color }}>{preset?.emoji ?? '●'}</span>{' '}
                    {b.label ?? b.id}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Charts */}
        {built ? (
          <>
            <div>
              <div className="text-nasa-dim text-[10px] mb-0.5">▸ ALTITUDE (m) vs t (s)</div>
              <UPlotChart data={built.altitude} series={built.series} yLabel="m" />
            </div>
            <div>
              <div className="text-nasa-dim text-[10px] mb-0.5">▸ SPEED |v| (m/s) vs t</div>
              <UPlotChart data={built.speed} series={built.series} yLabel="m/s" />
            </div>
            <div>
              <div className="text-nasa-dim text-[10px] mb-0.5">▸ KINETIC E (J) vs t</div>
              <UPlotChart data={built.ke} series={built.series} yLabel="J" />
            </div>
            <div>
              <div className="text-nasa-dim text-[10px] mb-0.5">▸ TOTAL E = KE + PE (J)</div>
              <UPlotChart data={built.totalE} series={built.series} yLabel="J" />
            </div>
          </>
        ) : (
          <div className="text-nasa-dim italic text-[11px] py-6 text-center">
            // pick a body above — buffers fill as the sim runs
          </div>
        )}

        <div className="text-nasa-dim text-[10px] italic pt-1">
          // 30 Hz sample · last 30 s · pause halts capture
        </div>
      </div>
    </Panel>
  )
}
