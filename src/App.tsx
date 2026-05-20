import { useEffect, useRef, useState } from 'react'
import { DockShell } from './dock/DockShell'
import { useSim } from './store/sim'

const BOOT_LINES = [
  'INIT PHYSICS CORE........... OK',
  'LOADING EPHEMERIS........... OK',
  'CALIBRATING IMU............. OK',
  'LINK TO GROUND STATION...... OK',
  'GRAVSIM v0.0.1 READY.',
]

function useMissionClock(startedAt: number, active: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), 53)
    return () => clearInterval(id)
  }, [active])
  const elapsed = Math.max(0, now - startedAt) / 1000
  const h = Math.floor(elapsed / 3600).toString().padStart(2, '0')
  const m = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0')
  const s = Math.floor(elapsed % 60).toString().padStart(2, '0')
  const ms = Math.floor((elapsed % 1) * 1000).toString().padStart(3, '0')
  return `T+${h}:${m}:${s}.${ms}`
}

function BootSequence({ onDone }: { onDone: () => void }) {
  const [shown, setShown] = useState<string[]>([])
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    let i = 0
    setShown([BOOT_LINES[0]])
    i = 1
    const id = setInterval(() => {
      if (i >= BOOT_LINES.length) {
        clearInterval(id)
        setTimeout(() => onDoneRef.current(), 500)
        return
      }
      const line = BOOT_LINES[i]
      i += 1
      setShown((s) => [...s, line])
    }, 320)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="h-full w-full flex items-center justify-center bg-nasa-bg">
      <div className="font-mono text-nasa-text text-[13px] leading-relaxed">
        {shown.map((line, i) => (
          <div key={i} className="phosphor-glow">
            <span className="text-nasa-dim">[ {String(i).padStart(2, '0')} ]</span>{' '}
            {line}
          </div>
        ))}
        <span className="inline-block animate-pulse text-nasa-accent">_</span>
      </div>
    </div>
  )
}

function App() {
  const [booted, setBooted] = useState(false)
  const [scanlines, setScanlines] = useState(true)
  const [startedAt, setStartedAt] = useState(() => Date.now())
  const clock = useMissionClock(startedAt, booted)
  const bodyCount = useSim((s) => s.bodies.length)
  const gravity = useSim((s) => s.gravity)
  const paused = useSim((s) => s.paused)

  const handleBootDone = () => {
    setBooted(true)
    setStartedAt(Date.now())
  }

  if (!booted) {
    return (
      <div className={scanlines ? 'scanlines h-full' : 'h-full'}>
        <BootSequence onDone={handleBootDone} />
      </div>
    )
  }

  return (
    <div className={scanlines ? 'scanlines h-full flex flex-col' : 'h-full flex flex-col'}>
      <header className="flex items-center justify-between px-3 py-1 border-b border-nasa-border bg-nasa-panel">
        <div className="flex items-center gap-3">
          <span className="text-nasa-accent phosphor-glow font-bold tracking-widest">▲ GRAVSIM</span>
          <span className="text-nasa-dim">| ORBITAL MECHANICS CONSOLE</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-nasa-warn">{clock}</span>
          <button
            onClick={() => setScanlines((v) => !v)}
            className="text-nasa-dim hover:text-nasa-accent transition-colors"
          >
            [ CRT: {scanlines ? 'ON' : 'OFF'} ]
          </button>
        </div>
      </header>

      <main className="flex-1 min-h-0">
        <DockShell />
      </main>

      <footer className="px-3 py-1 border-t border-nasa-border bg-nasa-panel flex justify-between text-nasa-dim">
        <span>
          STATUS:{' '}
          <span className={paused ? 'text-nasa-warn' : 'text-nasa-accent'}>
            {paused ? 'PAUSED' : 'NOMINAL'}
          </span>
        </span>
        <span>
          BODIES: {bodyCount} | G: {gravity.toFixed(3)} m/s²
        </span>
        <span>MEM OK · GPU OK · NET OK</span>
      </footer>
    </div>
  )
}

export default App
