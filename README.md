# Gravity Simulation

A NASA terminal-style web-based gravity simulator with sandbox physics, dockable panels, and real-time visualization.

![GitHub last commit](https://img.shields.io/github/last-commit/mshaheerz/gravity-simulation)
![GitHub issues](https://img.shields.io/github/issues/mshaheerz/gravity-simulation)
![GitHub license](https://img.shields.io/github/license/mshaheerz/gravity-simulation)
![Built with Vite](https://img.shields.io/badge/Built%20with-Vite%206.0-brightgreen)
![Built with React](https://img.shields.io/badge/Built%20with-React%2019-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## 🚀 Live Demo

Experience the simulation live: [https://gravity-simulation.onrender.com](https://gravity-simulation.onrender.com)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

## 🌌 Overview

Gravity Simulation is an interactive physics sandbox that lets you experiment with gravitational forces, object interactions, and celestial mechanics in a visually striking NASA terminal-inspired interface. Built with modern web technologies, it combines realistic physics simulation with an intuitive, customizable user interface.

The project follows a strict aesthetic specification:
- **Background**: Pure black (`#000000`)
- **Panel background**: Dark green (`#0a0e0a`)
- **Borders**: Dim phosphor (`#1a3a1a`)
- **Text**: Phosphor green (`#b8ffb8`)
- **Accent colors**: Green (`#00ff66`), Amber (`#ffb800`), Red (`#ff3030`)
- **Font**: JetBrains Mono (UI) + Inter (body)

## ✨ Features

### ✅ Implemented Features (v1 Milestones)
- **Scaffold & Styling**: Vite + React + TS foundation with NASA theme
- **Dockable Interface**: Resizable, movable panels using dockview-react
- **3D Viewport**: Earth & Moon rendering with procedural materials, wireframe overlay, starfield, and HUD
- **Physics Engine**: Rapier-powered physics with bouncing balls on ground plane
- **Object Library**: 8 preset objects (Sphere, Cube, Feather, Anvil, Cannonball, Satellite, Rocket, Custom Planet) with correct physical properties
- **Inspector Panel**: Real-time editing of mass, restitution, friction, color, position, velocity with live telemetry
- **Object Selection**: Click-to-select with visual selection ring and scene tree hierarchy

### 🛠️ In Progress
- Physics Console panel (gravity controls, time-scale, vacuum toggle)
- Telemetry panel (live charts for kinetic/potential energy)
- Timeline panel (play/pause/step controls, mission clock)
- Terminal panel (command-line interface)
- Save/load functionality
- Custom 3D model upload

### 🎮 Core Functionality
- **Spawn Objects**: Choose from preset library and place in scene
- **Physics Controls**: Adjust gravity, time-scale, and material properties
- **Camera Controls**: Orbit, pan, and zoom in 3D space
- **Real-time Telemetry**: Monitor velocity, altitude, and energy metrics
- **Terminal Commands**: 
  ```bash
  spawn <type> [mass=] [alt=] [pos=x,y,z] [vel=x,y,z]
  set g <value>
  preset earth | moon | mars | jupiter | zerog
  pause | play | step | reset
  clear
  track <id>
  save <name> | load <name>
  ```

## 🛠️ Technology Stack

```mermaid
graph TD
    A[Gravity Simulation] --> B[Vite 6]
    A --> C[React 19]
    A --> D[TypeScript 5]
    A --> E[Three.js]
    A --> F[@react-three/fiber]
    A --> G[@react-three/drei]
    A --> H[@react-three/rapier]
    A --> I[dockview-react]
    A --> J[Zustand]
    A --> K[Lever]
    A --> L[uPlot]
    A --> M[Tailwind CSS]
    A --> N[Lucide React]
```

- **Framework**: Vite + React + TypeScript
- **3D Rendering**: Three.js with `@react-three/fiber` and `@react-three/drei`
- **Physics**: `@react-three/rapier` (WebAssembly-powered Rapier physics engine)
- **UI Components**: 
  - Dockable panels: `dockview-react`
  - Icon library: `lucide-react`
  - Form controls: `leva`
- **State Management**: `zustand`
- **Data Visualization**: `uPlot` for real-time telemetry charts
- **Styling**: Tailwind CSS with custom NASA theme
- **Build Tool**: Vite with TypeScript support

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mshaheerz/gravity-simulation.git
   cd gravity-simulation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`

4. **Build for production**
   ```bash
   npm run build
   ```
   Output files will be in the `dist/` directory

5. **Preview production build**
   ```bash
   npm run preview
   ```

## 🎮 Usage

### Basic Controls
- **Left Mouse**: Rotate camera
- **Right Mouse**: Pan camera
- **Scroll**: Zoom in/out
- **Click on object**: Select object for inspection
- **Spacebar**: Pause/resume simulation
- **R**: Reset simulation

### Terminal Commands
Access the terminal panel (when implemented) to execute:
- `spawn sphere mass=5 alt=10 pos=0,0,0 vel=0,0,0` - Spawn a sphere
- `set g 9.8` - Set gravitational acceleration
- `preset earth` - Load Earth gravity preset
- `track 42` - Focus camera and telemetry on object ID 42
- `save mysim` - Save current simulation state

## 📂 Project Structure

```
gravity-simulation/
├── src/
│   ├── components/     # React components (panels, UI elements)
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions and physics helpers
│   ├── store/          # Zustand state management
│   ├── styles/         # CSS and Tailwind configurations
│   ├── types/          # TypeScript interfaces and types
│   ├── App.tsx         # Main application component
│   └── main.tsx        # Application entry point
├── public/             # Static assets
├── dist/               # Built production files
├── .vite/              # Vite configuration
├── index.html          # HTML template
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite configuration
└── tailwind.config.js  # Tailwind CSS configuration
```

## 🗺️ Roadmap

See [CLAUDE.md](CLAUDE.md) for the detailed development roadmap with checked/unchecked milestones.

### Completed Milestones
- [x] 1. Scaffold
- [x] 2. Dock shell
- [x] 3. 3D viewport
- [x] 4. Physics on
- [x] 5. Object library panel
- [x] 6. Inspector panel

### In Progress
- [ ] 7. Physics console panel
- [ ] 8. Telemetry panel
- [ ] 9. Timeline panel
- [ ] 10. Terminal panel
- [ ] 11. Save / load
- [ ] 12. Custom upload
- [ ] 13. Boot animation + polish

### Future Enhancements (v2+)
- N-body orbital mechanics
- Scripting tab for JS automation
- Constraints (ropes, springs, hinges)
- Wind fields / paint-gravity zones
- Trajectory ghost lines
- Force vector arrows
- Lesson Mode with curated scenarios
- VR / WebXR support
- Screenshot and GIF export
- Multiple camera views
- Theme switcher
- PWA installation
- Tauri desktop build

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

Please ensure your code follows the existing style and includes appropriate tests where applicable.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- [Three.js](https://threejs.org/) - 3D library
- [React Three Fiber](https://github.com/pmndrs/react-three-fiber) - React renderer for Three.js
- [Rapier Physics Engine](https://rapier.rs/) - Fast physics simulation
- [DockView](https://github.com/flaviotkt/dockview-svelte) - Dockable UI components
- [Lucide Icons](https://lucide.dev/) - Beautiful open-source icons
- NASA for inspiration on the terminal aesthetic and space exploration spirit

## 📞 Contact

For questions or feedback, please open an issue on the GitHub repository.

---

*Built with passion for physics simulation and space exploration. 🌠*