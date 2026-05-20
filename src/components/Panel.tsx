import type { ReactNode } from 'react'

export function Panel({
  title,
  children,
  scroll = true,
}: {
  title?: string
  children: ReactNode
  scroll?: boolean
}) {
  return (
    <div className="h-full w-full bg-nasa-panel text-nasa-text flex flex-col">
      {title && (
        <div className="panel-title text-[11px] px-2 py-1 border-b border-nasa-border bg-black/50">
          [ {title} ]
        </div>
      )}
      <div className={'flex-1 min-h-0 p-2 ' + (scroll ? 'overflow-auto' : 'overflow-hidden')}>
        {children}
      </div>
    </div>
  )
}

export function Stub({ label }: { label: string }) {
  return (
    <div className="text-nasa-dim italic text-[12px]">
      // {label} — content lands in a future milestone
    </div>
  )
}
