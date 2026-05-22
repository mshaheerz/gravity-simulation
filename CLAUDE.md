# Gravity Simulation — Project Plan

A NASA terminal-style web-based gravity simulator. Sandbox-focused, fully customizable physics, dockable panels, predefined + custom objects.

---

## Decisions locked

- **Platform**: Pure web first (Vite + React). Wrap in Tauri later if desktop app is wanted. Same codebase.
- **Style**: Sandbox-focused (everything tweakable, power-user). Education "Lesson Mode" parked as a v2 addon.
- **Aesthetic**: NASA terminal — black bg, phosphor green, monospace, dockable panels, mission clock, optional CRT scanlines.

---

## Tech stack

```
Vite + React + TypeScript
├─ three + @react-three/fiber + @react-three/drei   (3D rendering)
├─ @react-three/rapier                              (physics, WASM, fast)
├─ dockview-react                                   (dockable / resizable / closable panels)
├─ zustand                                          (state management)
├─ leva                                             (live parameter knobs)
├─ uplot                                            (telemetry charts)
├─ tailwindcss                                      (styling)
└─ lucide-react                                     (icons)
```

---

## Aesthetic spec

```
Bg:        #000000   (true black)
Panel bg:  #0a0e0a
Border:    #1a3a1a   (dim phosphor)
Text:      #b8ffb8   (phosphor green)
Accent:    #00ff66
Warning:   #ffb800   (Apollo amber)
Danger:    #ff3030
Grid:      #0f1f0f
Font:      JetBrains Mono (UI) + Inter (occasional body)
```

- Panel titles wrapped in brackets: `[ TELEMETRY ]`
- Optional CRT scanline overlay (toggle)
- Boot animation: `INIT PHYSICS CORE... OK / LOADING EPHEMERIS... OK / READY.`
- Mission clock top-right: `T+00:00:12.345`

---

## v1 panels (all dockable)

1. **Viewport** — 3D scene, camera controls, gizmos
2. **Scene Tree** — hierarchy, visibility/lock toggles
3. **Inspector** — properties of selected object
4. **Physics Console** — G, time-scale, vacuum, air density
5. **Object Library** — predefined + uploaded assets, drag-to-spawn
6. **Telemetry** — live charts (altitude, velocity, KE, PE, total E)
7. **Timeline** — play / pause / step / reset / time-scale
8. **Terminal** — command line (see commands below)
9. **Event Log** — collisions, impacts, errors

---

## v1 objects

- **Predefined**: Sphere, Cube, Feather, Anvil, Cannonball, Satellite, Rocket, Custom Planet
- **Per-object attributes**: mass, size, material (drag coef, restitution, friction, color)
- **Spawn flow**: pick from library → set altitude / position / initial velocity → Drop or Launch
- **Custom upload**: GLB / GLTF / OBJ (3D model), PNG / JPG (billboard sprite)

---

## v1 physics knobs

- Global G (gravitational constant)
- Per-body gravity override
- Vacuum toggle (kills drag instantly)
- Air density + altitude falloff
- Time-scale (×0.01 to ×10000)
- Substeps (integrator quality)
- Restitution / friction (global + per-object)
- Preset worlds: Earth (9.8), Moon (1.62), Mars (3.71), Jupiter (24.79), Zero-G, Custom

---

## v1 terminal commands

```
spawn <type> [mass=] [alt=] [pos=x,y,z] [vel=x,y,z]
set g <value>
preset earth | moon | mars | jupiter | zerog
pause | play | step | reset
clear
track <id>              # focus camera + telemetry on this body
save <name> | load <name>
```

---

## Build milestones — tick off as we go

> When resuming after a context limit, look for the first unchecked box and continue from there.

- [x] **1. Scaffold** — Vite + React + TS app boots, Tailwind + NASA theme vars wired
- [x] **2. Dock shell** — Dockview renders, 9 placeholder panels drag/resize/close work, NASA theme applied
- [x] **3. 3D viewport** — Earth + Moon rendered with procedural materials + wireframe overlay, orbit camera, drei starfield, HUD overlay (corner brackets, crosshair, labels)
- [x] **4. Physics on** — Rapier wired; surface scene with 3 balls drop & bounce on a grid ground plane; view-mode toggle (SPACE / SURFACE) in HUD; pause + reset wired; gravity, paused, body count flow through Zustand store
- [x] **5. Object library panel** — Click any of 8 presets (sphere/cube/feather/anvil/cannonball/satellite/rocket/planet) to spawn into scene with correct mass/shape/restitution/friction/drag; click-to-select bodies; selection ring in viewport; scene tree lists all bodies with delete buttons; inspector shows full preset attributes for selected body
- [x] **6. Inspector panel** — Editable: live mass/restitution/friction/linDamp sliders (remount preserves live pos+vel), color picker, position teleport (3 axes), velocity write, quick LAUNCH/BOOST/STOP, label rename, live telemetry (speed/altitude/KE) polled at 10 Hz
- [x] **7. Physics console panel** — World preset buttons (Earth/Moon/Mars/Jupiter/0G) snap G+air+vacuum together; G slider 0–30 m/s², vacuum toggle (zeros drag), air density slider 0–10 kg/m³ scales per-body damping vs Earth ref (1.225), log-mapped time-scale slider 0.01×–10000× drives Rapier `timeStep` plus quick ×0.1/0.5/1/2/10/100 buttons; manual edits clear the active world highlight
- [x] **8. Telemetry panel** — uPlot installed + CSS imported; shared 30 Hz sampler with 30 s ring buffers (`src/sim/telemetry.ts`) computes y, |v|, KE = ½mv², PE = mgy, total E per body; pause halts capture; RST flushes buffers; reusable `UPlotChart` (NASA-themed axes, ResizeObserver) drives four stacked charts (altitude / speed / kinetic E / total E); multi-select chip picker auto-tracks the inspector's selected body and overlays multiple bodies on the same x-spine via nearest-earlier resampling
- [x] **9. Timeline panel** — Mission clock driven by a singleton rAF loop (`SimClock`) writing `simTime` to the store (clamped per-frame; freezes on pause); `formatMissionClock` produces `T+HH:MM:SS.mmm`; HUD top-right + Timeline panel both show it (polled at 10 Hz to avoid per-frame React thrash); transport row RST / PSE / PLY / STP with status lamp + pulse; STP fires one Rapier frame via `stepNonce` (SurfaceScene un-pauses for a single rAF) and nudges the clock by `1/60 · timeScale`; log-mapped speed scrubber (0.01×–10000×) plus quick ×0.1/×0.5/×1/×2/×10/×100 chips
- [x] **10. Terminal panel** — Working REPL: pure command executor (`src/sim/commands.ts`) supports `spawn <type> [mass= alt= pos= vel=]`, `set g <v>`, `preset earth/moon/mars/jupiter/zerog`, `pause / play / step / reset`, `track <id|label>`, `list`, `clear`, `help`; `save/load` are placeholders pointing at milestone 11. Terminal UI: scroll-on-append output buffer, color-coded line kinds (ok/err/info/log/in), ↑/↓ history walk with draft-preservation, TAB completion of command names (shows candidates if ambiguous), Ctrl/Cmd+L clears, click-anywhere-to-focus, banner on mount
- [x] **11. Save / load** — Versioned `SimSnapshot` format in `src/sim/save.ts` captures world physics + each body's *live* Rapier pose/velocity (not spawn state). `applySnapshot` swaps state atomically, bumps `resetNonce`, zeroes the mission clock, wipes telemetry, and calls `reserveIds` so future spawns don't collide with restored ids. `.sim` JSON export via `downloadSim`, `.sim` / `.json` import via a file picker, URL-hash share (`#share=<base64url>`) using TextEncoder for non-ASCII safety. `PersistenceBridge` mounted in DockShell does: (a) URL hash → autosave restore-priority on mount, (b) debounced 750 ms autosave writes whenever the persistable surface (bodies/world/selection) changes. Object Library panel grows an EXPORT / IMPORT / SHARE row with status flash. Terminal: `save <name>` writes a LocalStorage slot, `save export` downloads a file, `save share` copies the URL; `load <name>` restores a slot, `load -` lists them
- [x] **12. Custom upload** — In-memory `customAssets` registry (`src/sim/customAssets.ts`) accepts `.glb / .gltf / .obj / .png / .jpg / .webp / .gif`, generates object URLs, and notifies subscribers. Body type grows a `customAssetId`; spawning `'custom'` mounts a `CustomBody` that auto-scales the asset to its bounding sphere (target radius), wraps it in a `BallCollider`, drops a wireframe stand-in if the asset goes missing, and uses Suspense to gate loading. GLTF via drei's `useGLTF`, OBJ via three's `OBJLoader` with a generated MeshStandardMaterial, image via a sprite preserving aspect. Object Library grows a CUSTOM ASSETS section: drag-drop zone + click-to-browse picker, per-asset tile (✕ to remove + click to spawn), graceful Scene Tree labels for custom bodies. Save format carries `customAssetId` through so reloaded scenes rebind to whatever assets are still in the registry
- [x] **13. Boot animation + polish** — CRT scanline shader toggle, sound FX on impact, keyboard shortcuts (Space=pause, F=focus, G=toggle gravity, R=reset), event log wired

---

## v2+ addons (parked)

Picking from these later, in rough priority order:

- **N-body orbital mechanics** — real Sun↔Earth↔Moon mutual gravity (not just point-down)
- **Scripting tab** — JS automation, batch experiments
- **Constraints** — ropes, springs, hinges, pulleys (Rapier supports natively)
- **Wind fields / paint-gravity zones** — paint custom force regions on the scene
- **Trajectory ghost lines** — past path + predicted future arc
- **Force vector arrows** — gravity / drag / normal shown as live arrows on each body
- **Lesson Mode** — curated scenarios (Galileo's tower, Apollo 15 feather+hammer, projectile motion)
- **VR / WebXR mode** — drei has it nearly free
- **Headless batch runs** — "drop 1000 balls with random mass, plot dispersion"
- **Magnetism / buoyancy modules**
- **Sensor objects** — accelerometer, altimeter attached to bodies → graph their output
- **Screenshot + GIF export of a run**
- **Multiple cameras** — top-down, side, chase, free
- **Theme switcher** — NASA green / Apollo amber / JPL blue / modern light
- **PWA install** — installable from browser, offline-first
- **Tauri desktop build** — `.exe` / `.dmg` / `.AppImage`

---

## How to resume after context limit

1. Open this file (`CLAUDE.md`) — already auto-loaded by Claude Code.
2. Find the first unchecked `[ ]` milestone in the "Build milestones" section.
3. Continue from there. Tick `[x]` as each milestone finishes.
4. Stack, aesthetic spec, panels, commands, and addon backlog above are the source of truth — don't re-decide them, just execute.
