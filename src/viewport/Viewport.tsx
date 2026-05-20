import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { SpaceScene } from './SpaceScene'
import { SurfaceScene } from './SurfaceScene'
import { ViewportHud } from './Hud'
import { useSim } from '../store/sim'

function Lights() {
  return (
    <>
      <directionalLight position={[10, 15, 8]} intensity={2.2} color="#fff7e0" castShadow shadow-mapSize={[1024, 1024]} />
      <ambientLight intensity={0.18} color="#0a0e2a" />
      <directionalLight position={[-8, -2, -6]} intensity={0.15} color="#00ff66" />
    </>
  )
}

export function Viewport() {
  const viewMode = useSim((s) => s.viewMode)

  const cameraInit =
    viewMode === 'surface'
      ? { position: [10, 6, 14] as [number, number, number], fov: 50 }
      : { position: [3.2, 1.6, 5.5] as [number, number, number], fov: 50 }

  return (
    <div className="relative h-full w-full bg-black">
      <Canvas
        key={viewMode /* remount when mode changes for a clean camera reset */}
        shadows
        camera={{ ...cameraInit, near: 0.01, far: 2000 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#000004']} />

        <Stars radius={120} depth={60} count={4500} factor={3} saturation={0} fade speed={0.4} />

        <Lights />

        {viewMode === 'space' ? <SpaceScene /> : <SurfaceScene />}

        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          minDistance={1.6}
          maxDistance={viewMode === 'surface' ? 120 : 50}
          makeDefault
        />
      </Canvas>
      <ViewportHud />
    </div>
  )
}
