import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, Sky, Cloud, Clouds } from '@react-three/drei'
import { SpaceScene } from './SpaceScene'
import { SurfaceScene } from './SurfaceScene'
import { ViewportHud } from './Hud'
import { useSim } from '../store/sim'
import { useThemeColors } from '../sim/useThemeColors'
import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { bodyRefs } from '../sim/bodyRefs'

function FreeCamera() {
  const { camera, gl } = useThree()
  const cameraState = useSim((s) => s.cameraState)
  const setCameraState = useSim((s) => s.setCameraState)
  const [keys, setKeys] = useState<Record<string, boolean>>({})
  const [isPointerLocked, setIsPointerLocked] = useState(false)
  const yawRef = useRef(0)
  const pitchRef = useRef(0)
  const isFirstMount = useRef(true)
  const velocityRef = useRef(new THREE.Vector3())

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => setKeys(k => ({ ...k, [e.code]: true }))
    const handleKeyUp = (e: KeyboardEvent) => setKeys(k => ({ ...k, [e.code]: false }))
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useEffect(() => {
    const canvas = gl.domElement
    const handleClick = () => canvas.requestPointerLock()
    const handlePointerLockChange = () => setIsPointerLocked(document.pointerLockElement === canvas)
    canvas.addEventListener('click', handleClick)
    document.addEventListener('pointerlockchange', handlePointerLockChange)
    return () => {
      canvas.removeEventListener('click', handleClick)
      document.removeEventListener('pointerlockchange', handlePointerLockChange)
    }
  }, [gl])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isPointerLocked) return
      yawRef.current -= e.movementX * 0.002
      pitchRef.current -= e.movementY * 0.002
      pitchRef.current = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitchRef.current))
    }
    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [isPointerLocked])

  useEffect(() => {
    if (isFirstMount.current && cameraState) {
      isFirstMount.current = false
      camera.position.set(...cameraState.pos)
      const target = new THREE.Vector3(...cameraState.target)
      const dir = target.clone().sub(camera.position).normalize()
      yawRef.current = Math.atan2(dir.x, dir.z)
      pitchRef.current = -Math.asin(dir.y)
    }
  }, [camera, cameraState])

  useFrame((_, delta) => {
    const speed = 20
    const move = new THREE.Vector3()
    if (keys['KeyW']) move.z -= 1
    if (keys['KeyS']) move.z += 1
    if (keys['KeyA']) move.x -= 1
    if (keys['KeyD']) move.x += 1
    if (keys['Space']) move.y += 1
    if (keys['ShiftLeft']) move.y -= 1

    move.normalize().multiplyScalar(speed * delta)
    move.applyEuler(new THREE.Euler(0, yawRef.current, 0))
    velocityRef.current.lerp(move, 0.2)
    camera.position.add(velocityRef.current)

    camera.rotation.order = 'YXZ'
    camera.rotation.y = yawRef.current
    camera.rotation.x = pitchRef.current

    const target = camera.position.clone().add(new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(pitchRef.current, yawRef.current, 0)))
    setCameraState({
      pos: [camera.position.x, camera.position.y, camera.position.z],
      target: [target.x, target.y, target.z]
    })
  })

  return null
}

function CameraFocus() {
  const { camera } = useThree()
  const selectedId = useSim((s) => s.selectedId)
  const bodies = useSim((s) => s.bodies)
  const cameraState = useSim((s) => s.cameraState)
  const setCameraState = useSim((s) => s.setCameraState)
  const controlsRef = useRef<any>(null)
  const isFirstMount = useRef(true)
  const lastSelectedId = useRef<string | null>(null)

  useEffect(() => {
    if (!controlsRef.current) return

    if (isFirstMount.current) {
      isFirstMount.current = false
      camera.position.set(...cameraState.pos)
      controlsRef.current.target.set(...cameraState.target)
      controlsRef.current.update()
      return
    }

    if (selectedId && selectedId !== lastSelectedId.current) {
      const selectedBody = bodies.find(b => b.id === selectedId)
      if (selectedBody) {
        const pos = new THREE.Vector3(...selectedBody.pos)
        const distance = 15
        const offset = new THREE.Vector3(distance, distance * 0.6, distance)
        controlsRef.current.target.copy(pos)
        camera.position.copy(pos).add(offset)
        controlsRef.current.update()
      }
    }
    lastSelectedId.current = selectedId
  }, [selectedId, bodies, camera, cameraState])

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return

    const saveState = () => {
      setCameraState({
        pos: [camera.position.x, camera.position.y, camera.position.z],
        target: [controls.target.x, controls.target.y, controls.target.z]
      })
    }

    controls.addEventListener('end', saveState)
    return () => controls.removeEventListener('end', saveState)
  }, [setCameraState, camera])

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={1.6}
      maxDistance={useSim.getState().viewMode === 'surface' ? 120 : 50}
      makeDefault
      enablePan
    />
  )
}

function Lights({ accent, isDay }: { accent: string; isDay: boolean }) {
  if (isDay) {
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

function VolumetricClouds({ dayNight }: { dayNight: 'day' | 'night' }) {
  const ref = useRef<THREE.Group>(null)
  
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.005
    }
  })

  const cloudColor = dayNight === 'day' ? '#ffffff' : '#4a5568'

  return (
    <group ref={ref}>
      <Clouds limit={800} material={THREE.MeshStandardMaterial}>
        {Array.from({ length: 300 }).map((_, i) => (
          <Cloud
            key={i}
            segments={25}
            bounds={[200, 50, 200]}
            color={cloudColor}
            opacity={dayNight === 'day' ? 0.5 : 0.3}
            volume={20}
            position={[
              (Math.random() - 0.5) * 180,
              30 + Math.random() * 40,
              (Math.random() - 0.5) * 180,
            ]}
          />
        ))}
      </Clouds>
    </group>
  )
}

function CameraController() {
  const { camera } = useThree()
  const cameraMode = useSim((s) => s.cameraMode)
  const selectedId = useSim((s) => s.selectedId)
  const gameMode = useSim((s) => s.gameMode)
  const keysRef = useRef<Record<string, boolean>>({})

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameMode && e.key === ' ') return
      keysRef.current[e.key.toLowerCase()] = true
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameMode])

  useFrame(() => {
    if (!selectedId || cameraMode === 'orbit') return
    
    const rb = bodyRefs.get(selectedId)
    if (!rb) return

    const t = rb.translation()
    const bodyPos = new THREE.Vector3(t.x, t.y, t.z)

    const forward = new THREE.Vector3()
    const right = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

    if (gameMode) {
      let desiredVel = new THREE.Vector3()
      if (keysRef.current['w']) desiredVel.add(forward.clone().multiplyScalar(8))
      if (keysRef.current['s']) desiredVel.add(forward.clone().multiplyScalar(-8))
      if (keysRef.current['a']) desiredVel.add(right.clone().multiplyScalar(-8))
      if (keysRef.current['d']) desiredVel.add(right.clone().multiplyScalar(8))
      
      const currentVel = rb.linvel()
      
      const smoothedVel = new THREE.Vector3(
        THREE.MathUtils.lerp(currentVel.x, desiredVel.x, 0.1),
        desiredVel.length() > 0 ? currentVel.y : currentVel.y * 0.98,
        THREE.MathUtils.lerp(currentVel.z, desiredVel.z, 0.1)
      )
      
      if (keysRef.current[' ']) {
        smoothedVel.y = 10
      }
      
      rb.setLinvel(smoothedVel, true)
    }

    if (cameraMode === 'tpp') {
      const offset = new THREE.Vector3(5, 3, 5)
      offset.normalize().multiplyScalar(8)
      camera.position.copy(bodyPos).add(offset)
      camera.lookAt(bodyPos)
    } else if (cameraMode === 'fpp') {
      const offset = new THREE.Vector3(0, 1, 0)
      camera.position.copy(bodyPos).add(offset)
      const lookAt = bodyPos.clone().add(forward.multiplyScalar(10).add(new THREE.Vector3(0, 1, 0)))
      camera.lookAt(lookAt)
    }
  })

  return null
}

export function Viewport() {
  const viewMode = useSim((s) => s.viewMode)
  const dayNight = useSim((s) => s.dayNight)
  const colors = useThemeColors()
  const volumetricClouds = useSim((s) => s.volumetricClouds)
  const cameraMode = useSim((s) => s.cameraMode)
  const isDay = dayNight === 'day' && viewMode === 'surface'

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
        {viewMode === 'surface' && !isDay && <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={0.2} />}
        {isDay && <Sky distance={450000} sunPosition={[100, 20, 100]} turbidity={0.5} rayleigh={0.5} mieCoefficient={0.005} mieDirectionalG={0.8} />}
        {volumetricClouds && viewMode === 'surface' && <VolumetricClouds dayNight={dayNight} />}

        <Lights accent={colors.accent} isDay={isDay} />

        {viewMode === 'space' ? <SpaceScene /> : <SurfaceScene />}

        <CameraController />

        {cameraMode === 'orbit' && <CameraFocus />}
        {cameraMode === 'free' && <FreeCamera />}
      </Canvas>
      <ViewportHud />
    </div>
  )
}
