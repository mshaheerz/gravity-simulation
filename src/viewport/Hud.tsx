import { useEffect, useState } from 'react'
import { useSim } from '../store/sim'
import { formatMissionClock } from '../sim/SimClock'

export function ViewportHud() {
  const viewMode = useSim((s) => s.viewMode)
  const setViewMode = useSim((s) => s.setViewMode)
  const paused = useSim((s) => s.paused)
  const setPaused = useSim((s) => s.setPaused)
  const bumpReset = useSim((s) => s.bumpReset)
  const gravity = useSim((s) => s.gravity)
  const bodyCount = useSim((s) => s.bodies.length)
  const volumetricClouds = useSim((s) => s.volumetricClouds)
  const setVolumetricClouds = useSim((s) => s.setVolumetricClouds)
  const dayNight = useSim((s) => s.dayNight)
  const setDayNight = useSim((s) => s.setDayNight)
  const cameraMode = useSim((s) => s.cameraMode)
  const setCameraMode = useSim((s) => s.setCameraMode)
  const gameMode = useSim((s) => s.gameMode)
  const setGameMode = useSim((s) => s.setGameMode)

  // Mission clock — poll the store at 10 Hz so the HUD doesn't re-render on
  // every rAF tick. Spec calls for `T+00:00:12.345` top-right.
  const [clock, setClock] = useState(() => useSim.getState().simTime)
  useEffect(() => {
    const id = setInterval(() => setClock(useSim.getState().simTime), 100)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 font-mono text-[10px] text-nasa-accent select-none">
      {/* Corner brackets */}
      <span className="absolute top-1 left-1 phosphor-glow">┌─</span>
      <span className="absolute top-1 right-1 phosphor-glow">─┐</span>
      <span className="absolute bottom-1 left-1 phosphor-glow">└─</span>
      <span className="absolute bottom-1 right-1 phosphor-glow">─┘</span>

      {/* Crosshair */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30">
        <div className="w-6 h-px bg-nasa-accent" />
        <div className="h-6 w-px bg-nasa-accent absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Top-left labels */}
      <div className="absolute top-2 left-3 leading-tight">
        <div>CAM ▸ ORBIT</div>
        <div>FOV ▸ 50°</div>
        <div className="text-nasa-dim">BODIES ▸ {bodyCount}</div>
      </div>

      {/* Top-right labels */}
      <div className="absolute top-2 right-3 text-right leading-tight">
        <div className="phosphor-glow tracking-wider text-[11px]">
          {formatMissionClock(clock)}
        </div>
        <div>MODE ▸ {viewMode.toUpperCase()}</div>
        <div className="text-nasa-warn">G ▸ {gravity.toFixed(2)} m/s²</div>
        <div className="text-nasa-dim">
          {viewMode === 'surface' ? 'UNITS ▸ m' : 'UNITS ▸ ER (1 = 6371 km)'}
        </div>
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-2 left-3 text-nasa-dim">
        DRAG ▸ ROTATE · SCROLL ▸ ZOOM · RMB ▸ PAN
      </div>

      {/* Quick action chips (interactive) */}
      <div className="pointer-events-auto absolute bottom-2 right-3 flex gap-1 text-[10px]">
        <button
          onClick={() => setViewMode(viewMode === 'surface' ? 'space' : 'surface')}
          className="border border-nasa-border hover:border-nasa-accent hover:bg-nasa-border/30 px-2 py-0.5 text-nasa-text transition"
        >
          [ MODE: {viewMode === 'surface' ? 'SURFACE' : 'SPACE'} ]
        </button>
        <button
          onClick={() => {
            if (cameraMode === 'orbit') setCameraMode('free')
            else if (cameraMode === 'free') setCameraMode('fpp')
            else if (cameraMode === 'fpp') setCameraMode('tpp')
            else setCameraMode('orbit')
          }}
          className={
            'border px-2 py-0.5 transition ' +
            (cameraMode !== 'orbit'
              ? 'border-nasa-accent text-nasa-accent hover:bg-nasa-accent/10'
              : 'border-nasa-border text-nasa-text hover:border-nasa-accent hover:bg-nasa-border/30')
          }
        >
          [ {cameraMode.toUpperCase()} ]
        </button>
        <button
          onClick={() => setGameMode(!gameMode)}
          className={
            'border px-2 py-0.5 transition ' +
            (gameMode
              ? 'border-nasa-accent text-nasa-accent hover:bg-nasa-accent/10'
              : 'border-nasa-border text-nasa-text hover:border-nasa-accent hover:bg-nasa-border/30')
          }
        >
          [ GAME: {gameMode ? 'ON' : 'OFF'} ]
        </button>
        <button
          onClick={() => setDayNight(dayNight === 'day' ? 'night' : 'day')}
          className={
            'border px-2 py-0.5 transition ' +
            (dayNight === 'day'
              ? 'border-nasa-accent text-nasa-accent hover:bg-nasa-accent/10'
              : 'border-nasa-border text-nasa-text hover:border-nasa-accent hover:bg-nasa-border/30')
          }
        >
          [ {dayNight.toUpperCase()} ]
        </button>
        <button
          onClick={() => setPaused(!paused)}
          className={
            'border px-2 py-0.5 transition ' +
            (paused
              ? 'border-nasa-warn text-nasa-warn hover:bg-nasa-warn/10'
              : 'border-nasa-border text-nasa-text hover:border-nasa-accent hover:bg-nasa-border/30')
          }
        >
          [ {paused ? 'PAUSED' : 'RUNNING'} ]
        </button>
        <button
          onClick={() => setVolumetricClouds(!volumetricClouds)}
          className={
            'border px-2 py-0.5 transition ' +
            (volumetricClouds
              ? 'border-nasa-accent text-nasa-accent hover:bg-nasa-accent/10'
              : 'border-nasa-border text-nasa-text hover:border-nasa-accent hover:bg-nasa-border/30')
          }
        >
          [ CLOUDS: {volumetricClouds ? 'ON' : 'OFF'} ]
        </button>
        <button
          onClick={() => bumpReset()}
          className="border border-nasa-border hover:border-nasa-accent hover:bg-nasa-border/30 px-2 py-0.5 text-nasa-text transition"
        >
          [ RESET ]
        </button>
      </div>
    </div>
  )
}
