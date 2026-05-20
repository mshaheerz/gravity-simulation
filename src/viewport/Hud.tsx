import { useSim } from '../store/sim'

export function ViewportHud() {
  const viewMode = useSim((s) => s.viewMode)
  const setViewMode = useSim((s) => s.setViewMode)
  const paused = useSim((s) => s.paused)
  const setPaused = useSim((s) => s.setPaused)
  const bumpReset = useSim((s) => s.bumpReset)
  const gravity = useSim((s) => s.gravity)
  const bodyCount = useSim((s) => s.bodies.length)

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
          onClick={() => bumpReset()}
          className="border border-nasa-border hover:border-nasa-accent hover:bg-nasa-border/30 px-2 py-0.5 text-nasa-text transition"
        >
          [ RESET ]
        </button>
      </div>
    </div>
  )
}
