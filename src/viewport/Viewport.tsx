import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars, Sky } from '@react-three/drei'
import { SpaceScene } from './SpaceScene'
import { SurfaceScene } from './SurfaceScene'
import { ViewportHud } from './Hud'
import { useSim } from '../store/sim'
import { useThemeColors } from '../sim/useThemeColors'

function Lights({ accent, dayMode }: { accent: string; dayMode: boolean }) {
  if (dayMode) {
    return (
      <>
        <directionalLight position={[20, 35, 12]} intensity={3.2} color="#fff4d6" castShadow shadow-mapSize={[2048, 2048]} />
        <ambientLight intensity={0.5} color="#dcecff" />
        <directionalLight position={[-12, 8, -10]} intensity={0.35} color="#bcd7ff" />
      </>
    )
  }

  return (
    <>
      <directionalLight position={[10, 15, 8]} intensity={2.2} color="#fff7e0" castShadow shadow-mapSize={[1024, 1024]} />
      <ambientLight intensity={0.18} color="#0a0e2a" />
      <directionalLight position={[-8, -2, -6]} intensity={0.15} color={accent} />
    </>
  )
}

export function Viewport() {
  const viewMode = useSim((s) => s.viewMode)
  const theme = useSim((s) => s.theme)
  const colors = useThemeColors()
  const daySurface = theme === 'day' && viewMode === 'surface'

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
        <color attach="background" args={[colors.bg]} />

        {viewMode === 'space' && <Stars radius={120} depth={60} count={4500} factor={3} saturation={0} fade speed={0.4} />}
        {daySurface && <Sky distance={450000} sunPosition={[100, 35, 45]} turbidity={3} rayleigh={1.2} mieCoefficient={0.006} mieDirectionalG={0.82} />}

        <Lights accent={colors.accent} dayMode={daySurface} />

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
