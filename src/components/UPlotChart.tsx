import uPlot from 'uplot'
import { useEffect, useMemo, useRef } from 'react'

export interface SeriesSpec {
  label: string
  color: string
}

/**
 * Thin wrapper around uPlot. Keeps a single plot instance for the lifetime of
 * the component and feeds it new data via setData on every prop change.
 * Resizes via ResizeObserver so it plays nice with the dock layout.
 */
export function UPlotChart({
  data,
  series,
  yLabel,
  height = 120,
}: {
  /** uPlot data: [xs, ...ys]. xs and each ys must be the same length. */
  data: uPlot.AlignedData
  series: SeriesSpec[]
  yLabel: string
  height?: number
}) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const plotRef = useRef<uPlot | null>(null)

  // Build an opts object — recomputed only when the series spec changes shape.
  const opts = useMemo<uPlot.Options>(
    () => ({
      width: 100,
      height,
      // No legend strip — keep panels dense.
      legend: { show: false },
      cursor: {
        drag: { x: false, y: false },
        points: { size: 4 },
      },
      scales: {
        x: { time: false },
        y: { auto: true },
      },
      axes: [
        {
          stroke: '#3a6a3a',
          grid: { stroke: '#0f1f0f', width: 1 },
          ticks: { stroke: '#1a3a1a' },
          font: '10px JetBrains Mono, monospace',
          values: (_u, vs) => vs.map((v) => v.toFixed(1) + 's'),
        },
        {
          stroke: '#3a6a3a',
          grid: { stroke: '#0f1f0f', width: 1 },
          ticks: { stroke: '#1a3a1a' },
          font: '10px JetBrains Mono, monospace',
          label: yLabel,
          labelFont: '10px JetBrains Mono, monospace',
          labelSize: 14,
          size: 44,
        },
      ],
      series: [
        { label: 't' },
        ...series.map((s) => ({
          label: s.label,
          stroke: s.color,
          width: 1.25,
          points: { show: false },
        })),
      ],
    }),
    [series, yLabel, height],
  )

  // Create / destroy the chart on mount/unmount and when the opts shape changes.
  useEffect(() => {
    if (!hostRef.current) return
    const host = hostRef.current
    const initial: uPlot.AlignedData = data ?? [[]]
    const sized: uPlot.Options = { ...opts, width: host.clientWidth || 200, height }
    const plot = new uPlot(sized, initial, host)
    plotRef.current = plot

    const ro = new ResizeObserver(() => {
      const w = host.clientWidth
      const h = host.clientHeight || height
      plot.setSize({ width: w, height: h })
    })
    ro.observe(host)

    return () => {
      ro.disconnect()
      plot.destroy()
      plotRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts])

  // Push new data on every render — uPlot.setData is fast and avoids re-creating the chart.
  useEffect(() => {
    plotRef.current?.setData(data, true)
  }, [data])

  return (
    <div
      ref={hostRef}
      className="w-full bg-black/60 border border-nasa-border"
      style={{ height }}
    />
  )
}
