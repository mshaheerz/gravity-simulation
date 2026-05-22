import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier'
import { useSim } from '../store/sim'
import { useEffect, useMemo, useState } from 'react'
import { Body } from './Body'
import * as THREE from 'three'

function seeded(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (1664525 * s + 1013904223) >>> 0
    return s / 4294967296
  }
}

function createTerrainTexture() {
  if (typeof document === 'undefined') {
    const data = new Uint8Array([92, 84, 74, 255])
    const tex = new THREE.DataTexture(data, 1, 1)
    tex.needsUpdate = true
    tex.colorSpace = THREE.SRGBColorSpace
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(80, 80)
    return tex
  }

  const size = 1024
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    const data = new Uint8Array([92, 84, 74, 255])
    const tex = new THREE.DataTexture(data, 1, 1)
    tex.needsUpdate = true
    tex.colorSpace = THREE.SRGBColorSpace
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(80, 80)
    return tex
  }

  const rand = seeded(20260522)

  ctx.fillStyle = '#5c544a'
  ctx.fillRect(0, 0, size, size)

  // Tile/stone seams.
  const cell = 64
  ctx.strokeStyle = 'rgba(32, 24, 16, 0.24)'
  ctx.lineWidth = 2
  for (let x = 0; x <= size; x += cell) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, size)
    ctx.stroke()
  }
  for (let y = 0; y <= size; y += cell) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(size, y)
    ctx.stroke()
  }

  // Grass tint patches.
  for (let i = 0; i < 180; i++) {
    const x = rand() * size
    const y = rand() * size
    const rx = 14 + rand() * 36
    const ry = 10 + rand() * 30
    ctx.fillStyle = rand() > 0.5 ? 'rgba(70, 102, 58, 0.34)' : 'rgba(94, 130, 76, 0.26)'
    ctx.beginPath()
    ctx.ellipse(x, y, rx, ry, rand() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }

  // Water stain tint under puddles.
  for (let i = 0; i < 36; i++) {
    const x = rand() * size
    const y = rand() * size
    const rx = 22 + rand() * 40
    const ry = 16 + rand() * 30
    ctx.fillStyle = 'rgba(60, 115, 168, 0.14)'
    ctx.beginPath()
    ctx.ellipse(x, y, rx, ry, rand() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }

  // Fine grain noise.
  for (let i = 0; i < 12000; i++) {
    const x = rand() * size
    const y = rand() * size
    const a = 0.05 + rand() * 0.1
    ctx.fillStyle = rand() > 0.5 ? `rgba(18, 12, 8, ${a})` : `rgba(255, 245, 228, ${a * 0.35})`
    ctx.fillRect(x, y, 1, 1)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(8, 8)
  texture.generateMipmaps = true
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.needsUpdate = true
  return texture
}

function TerrainVisual() {
  const terrainMap = useMemo(() => createTerrainTexture(), [])
  const deco = useMemo(() => {
    const rand = seeded(71)
    const puddles = Array.from({ length: 10 }, () => ({
      x: (rand() * 2 - 1) * 30,
      z: (rand() * 2 - 1) * 30,
      rx: 1 + rand() * 2.8,
      rz: 0.8 + rand() * 2.2,
      r: rand() * Math.PI,
    }))
    const grass = Array.from({ length: 120 }, () => ({
      x: (rand() * 2 - 1) * 36,
      z: (rand() * 2 - 1) * 36,
      h: 0.08 + rand() * 0.22,
      r: 0.04 + rand() * 0.06,
      c: rand() > 0.5 ? '#5a8e4a' : '#4b7b3d',
      rot: rand() * Math.PI * 2,
    }))
    return { puddles, grass }
  }, [])

  useEffect(() => () => terrainMap.dispose(), [terrainMap])

  return (
    <>
      {/* Terrain visual layer — separate from collider; keeps physics unchanged. */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial map={terrainMap} roughness={0.93} metalness={0.04} />
      </mesh>

      {/* Water puddles */}
      {deco.puddles.map((p, i) => (
        <mesh key={`p-${i}`} receiveShadow rotation={[-Math.PI / 2, 0, p.r]} position={[p.x, 0.007, p.z]} scale={[p.rx, p.rz, 1]}>
          <circleGeometry args={[1, 36]} />
          <meshPhysicalMaterial
            color="#3f7fb5"
            roughness={0.18}
            metalness={0.08}
            transmission={0.22}
            transparent
            opacity={0.72}
          />
        </mesh>
      ))}

      {/* Grass tufts */}
      {deco.grass.map((g, i) => (
        <mesh key={`g-${i}`} castShadow receiveShadow position={[g.x, g.h * 0.5, g.z]} rotation={[0, g.rot, 0]}>
          <coneGeometry args={[g.r, g.h, 6]} />
          <meshStandardMaterial color={g.c} roughness={1} metalness={0} />
        </mesh>
      ))}
    </>
  )
}

function DayClouds() {
  const clouds = useMemo(() => {
    const rand = seeded(807)
    return Array.from({ length: 16 }, (_, i) => ({
      id: i,
      x: (rand() * 2 - 1) * 46,
      y: 12 + rand() * 11,
      z: (rand() * 2 - 1) * 46,
      sx: 2 + rand() * 4.5,
      sy: 0.8 + rand() * 1.6,
      sz: 1.8 + rand() * 4.2,
      r: rand() * Math.PI,
      a: 0.42 + rand() * 0.28,
    }))
  }, [])

  return (
    <>
      {clouds.map((c) => (
        <group key={c.id} position={[c.x, c.y, c.z]} rotation={[0, c.r, 0]}>
          <mesh scale={[c.sx, c.sy, c.sz]}>
            <sphereGeometry args={[1, 18, 14]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={c.a} roughness={0.95} metalness={0} depthWrite={false} />
          </mesh>
          <mesh position={[0.9, 0.25, 0.4]} scale={[c.sx * 0.58, c.sy * 0.8, c.sz * 0.56]}>
            <sphereGeometry args={[1, 14, 10]} />
            <meshStandardMaterial color="#f2f7ff" transparent opacity={Math.min(0.75, c.a + 0.08)} roughness={0.95} metalness={0} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </>
  )
}

export function SurfaceScene() {
  const gravity = useSim((s) => s.gravity)
  const paused = useSim((s) => s.paused)
  const timeScale = useSim((s) => s.timeScale)
  const theme = useSim((s) => s.theme)
  const resetNonce = useSim((s) => s.resetNonce)
  const stepNonce = useSim((s) => s.stepNonce)
  const bodies = useSim((s) => s.bodies)
  const selectBody = useSim((s) => s.selectBody)

  const gravityVec = useMemo<[number, number, number]>(() => [0, -gravity, 0], [gravity])
  // Rapier marches a fixed-size step; we scale wall-clock dt into sim dt by
  // setting timeStep to (1/60) * timeScale. Clamp huge values to keep the
  // solver stable; the user gets fast-forward without exploding constraints.
  const timeStep = useMemo(() => (1 / 60) * Math.min(Math.max(timeScale, 0.001), 50), [timeScale])

  // One-frame step: when stepNonce bumps while paused, unpause for one rAF,
  // then re-pause. Telemetry sampler reads `paused` directly so it captures
  // the step too.
  const [stepping, setStepping] = useState(false)
  useEffect(() => {
    if (stepNonce === 0) return
    if (!useSim.getState().paused) return // ignore step while running
    setStepping(true)
    const id = requestAnimationFrame(() => {
      // give Rapier one frame, then snap back to paused
      requestAnimationFrame(() => setStepping(false))
    })
    return () => cancelAnimationFrame(id)
  }, [stepNonce])

  const effectivelyPaused = paused && !stepping
  const dayMode = theme === 'day'

  return (
    <Physics gravity={gravityVec} paused={effectivelyPaused} timeStep={timeStep} interpolate>
      <group onPointerMissed={() => selectBody(null)}>
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[40, 0.5, 40]} position={[0, -0.5, 0]} />
          <mesh receiveShadow position={[0, -0.5, 0]} visible={false}>
            <boxGeometry args={[80, 1, 80]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
        </RigidBody>
        <TerrainVisual />
        {dayMode && <DayClouds />}
        {bodies.map((b) => (
          <Body key={`${b.id}-${b.remountNonce}-${resetNonce}`} body={b} />
        ))}
      </group>
    </Physics>
  )
}
