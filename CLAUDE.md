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
- [ ] **7. Physics console panel** — Sliders change G, vacuum toggle, time-scale, air density; preset world buttons (Earth/Moon/Mars/Jupiter/0G)
- [ ] **8. Telemetry panel** — Live uPlot charts of altitude, velocity, KE, PE, total E for selected body; multi-select overlay
- [ ] **9. Timeline panel** — Play / pause / step / reset; time-scale slider; mission clock
- [ ] **10. Terminal panel** — All v1 commands above functional
- [ ] **11. Save / load** — Export & import `.sim` JSON; LocalStorage autosave; URL-hash share
- [ ] **12. Custom upload** — Drop GLB/OBJ or PNG → appears in library → spawnable
- [ ] **13. Boot animation + polish** — CRT scanline shader toggle, sound FX on impact, keyboard shortcuts (Space=pause, F=focus, G=toggle gravity, R=reset), event log wired

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
