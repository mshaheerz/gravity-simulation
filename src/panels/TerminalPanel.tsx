import { useEffect, useRef, useState } from 'react'
import { Panel } from '../components/Panel'
import { execCommand, COMMAND_NAMES, type OutputLine } from '../sim/commands'
import { useSim } from '../store/sim'

const BANNER: OutputLine[] = [
  { kind: 'info', text: 'GRAVSIM SHELL v0.1.0' },
  { kind: 'info', text: "type 'help' for commands · ↑/↓ history · TAB completes" },
]

const ERRORISH_RE = /\b(error|failed|invalid|unknown|exception|panic|fatal)\b/i

function toneFor(line: OutputLine, nasaMode: boolean): { className: string; style?: React.CSSProperties } {
  if (line.kind === 'err') return { className: 'text-nasa-danger', style: { color: 'var(--terminal-error)' } }
  if (line.kind === 'log' && ERRORISH_RE.test(line.text)) {
    return { className: 'text-nasa-danger', style: { color: 'var(--terminal-error)' } }
  }
  if (line.kind === 'in') return { className: nasaMode ? 'text-nasa-accent' : 'text-nasa-text' }
  if (line.kind === 'ok') return { className: 'text-nasa-text' }
  if (line.kind === 'log') return { className: 'text-nasa-text' }
  return { className: 'text-nasa-dim' }
}

export function TerminalPanel() {
  const theme = useSim((s) => s.theme)
  const nasaMode = theme === 'nasa'
  const [lines, setLines] = useState<OutputLine[]>(() => BANNER)
  const [input, setInput] = useState('')
  // history of submitted commands; index = how many entries back we've scrolled (-1 = current draft)
  const [history, setHistory] = useState<string[]>([])
  const [histIdx, setHistIdx] = useState<number>(-1)
  const [draft, setDraft] = useState('') // remembers what was typed before history-scrolling

  const inputRef = useRef<HTMLInputElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // Auto-scroll to bottom whenever the buffer grows.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines])

  const focusInput = () => inputRef.current?.focus()

  const submit = () => {
    const raw = input
    if (raw.trim().length === 0) return
    const { lines: out, effect } = execCommand(raw)
    setLines((prev) => {
      if (effect === 'clear') return []
      return [...prev, { kind: 'in', text: 'gravsim> ' + raw }, ...out]
    })
    setHistory((h) => (h[h.length - 1] === raw ? h : [...h, raw]))
    setHistIdx(-1)
    setDraft('')
    setInput('')
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
      return
    }
    if (e.key === 'ArrowUp') {
      if (history.length === 0) return
      e.preventDefault()
      if (histIdx === -1) setDraft(input)
      const next = histIdx < 0 ? history.length - 1 : Math.max(0, histIdx - 1)
      setHistIdx(next)
      setInput(history[next])
      return
    }
    if (e.key === 'ArrowDown') {
      if (histIdx === -1) return
      e.preventDefault()
      const next = histIdx + 1
      if (next >= history.length) {
        setHistIdx(-1)
        setInput(draft)
      } else {
        setHistIdx(next)
        setInput(history[next])
      }
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      // Only complete the first token (command name) — argument completion is overkill for v1.
      const tokens = input.split(/\s+/)
      if (tokens.length !== 1) return
      const prefix = tokens[0].toLowerCase()
      if (!prefix) return
      const matches = COMMAND_NAMES.filter((c) => c.startsWith(prefix))
      if (matches.length === 1) {
        setInput(matches[0] + ' ')
      } else if (matches.length > 1) {
        // Show candidates without submitting.
        setLines((prev) => [
          ...prev,
          { kind: 'in', text: 'gravsim> ' + input },
          { kind: 'info', text: matches.join('  ') },
        ])
      }
      return
    }
    if (e.key === 'l' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      setLines([])
    }
  }

  return (
    <Panel scroll={false}>
      <div
        onClick={focusInput}
        className="h-full flex flex-col font-mono text-[12px] cursor-text"
      >
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-auto space-y-0.5 pr-1"
        >
          {lines.map((l, i) => {
            const tone = toneFor(l, nasaMode)
            return (
              <div key={i} className={tone.className + ' whitespace-pre-wrap break-words'} style={tone.style}>
                {l.text}
              </div>
            )
          })}
        </div>
        <div className="flex items-center border-t border-nasa-border pt-1 mt-1">
          <span className={(nasaMode ? 'text-nasa-accent' : 'text-nasa-text') + ' mr-1 select-none'}>gravsim&gt;</span>
          <input
            ref={inputRef}
            value={input}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            onChange={(e) => {
              setInput(e.target.value)
              if (histIdx !== -1) setHistIdx(-1) // user edited mid-history-scroll → back to draft mode
            }}
            onKeyDown={onKeyDown}
            placeholder="type a command — try 'help'"
            className="flex-1 bg-transparent outline-none text-nasa-text placeholder:text-nasa-dim caret-nasa-accent"
          />
        </div>
      </div>
    </Panel>
  )
}
