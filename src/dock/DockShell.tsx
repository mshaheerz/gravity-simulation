import { useCallback } from 'react'
import { DockviewReact, type DockviewReadyEvent, type IDockviewPanelProps } from 'dockview-react'
import 'dockview-react/dist/styles/dockview.css'
import './dockview-nasa.css'

import {
  ViewportPanel,
  SceneTreePanel,
  InspectorPanel,
  PhysicsConsolePanel,
  ObjectLibraryPanel,
  TelemetryPanel,
  TimelinePanel,
  TerminalPanel,
  EventLogPanel,
} from '../panels'

const wrap = (Comp: React.FC) => (_: IDockviewPanelProps) => <Comp />

const components: Record<string, React.FC<IDockviewPanelProps>> = {
  viewport: wrap(ViewportPanel),
  sceneTree: wrap(SceneTreePanel),
  inspector: wrap(InspectorPanel),
  physics: wrap(PhysicsConsolePanel),
  library: wrap(ObjectLibraryPanel),
  telemetry: wrap(TelemetryPanel),
  timeline: wrap(TimelinePanel),
  terminal: wrap(TerminalPanel),
  events: wrap(EventLogPanel),
}

export function DockShell() {
  const onReady = useCallback((event: DockviewReadyEvent) => {
    const api = event.api

    const viewport = api.addPanel({
      id: 'viewport',
      component: 'viewport',
      title: 'VIEWPORT',
    })

    const sceneTree = api.addPanel({
      id: 'sceneTree',
      component: 'sceneTree',
      title: 'SCENE TREE',
      position: { referencePanel: viewport.id, direction: 'left' },
      initialWidth: 220,
    })

    api.addPanel({
      id: 'library',
      component: 'library',
      title: 'OBJECT LIBRARY',
      position: { referencePanel: sceneTree.id, direction: 'below' },
    })

    const inspector = api.addPanel({
      id: 'inspector',
      component: 'inspector',
      title: 'INSPECTOR',
      position: { referencePanel: viewport.id, direction: 'right' },
      initialWidth: 260,
    })

    api.addPanel({
      id: 'physics',
      component: 'physics',
      title: 'PHYSICS',
      position: { referencePanel: inspector.id, direction: 'below' },
    })

    api.addPanel({
      id: 'telemetry',
      component: 'telemetry',
      title: 'TELEMETRY',
      position: { referencePanel: inspector.id, direction: 'below' },
    })

    const terminal = api.addPanel({
      id: 'terminal',
      component: 'terminal',
      title: 'TERMINAL',
      position: { referencePanel: viewport.id, direction: 'below' },
      initialHeight: 180,
    })

    api.addPanel({
      id: 'events',
      component: 'events',
      title: 'EVENT LOG',
      position: { referencePanel: terminal.id, direction: 'right' },
    })

    api.addPanel({
      id: 'timeline',
      component: 'timeline',
      title: 'TIMELINE',
      position: { referencePanel: terminal.id, direction: 'right' },
    })
  }, [])

  return (
    <div className="h-full w-full">
      <DockviewReact
        components={components}
        onReady={onReady}
        className="dockview-theme-nasa"
      />
    </div>
  )
}
