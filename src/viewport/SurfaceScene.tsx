import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier'
import { Grid } from '@react-three/drei'
import { useSim } from '../store/sim'
import { useMemo } from 'react'
import * as THREE from 'three'
import { Body } from './Body'

function Ground() {
  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[40, 0.5, 40]} position={[0, -0.5, 0]} />
        <mesh receiveShadow position={[0, -0.5, 0]}>
          <boxGeometry args={[80, 1, 80]} />
          <meshStandardMaterial color="#0a1a0a" roughness={1} metalness={0} />
        </mesh>
      </RigidBody>
      <Grid
        position={[0, 0.001, 0]}
        args={[80, 80]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#1a3a1a"
        sectionSize={5}
        sectionThickness={1.2}
        sectionColor="#00ff66"
        fadeDistance={60}
        fadeStrength={1}
        infiniteGrid
      />
    </>
  )
}

function HorizonRig() {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
      <ringGeometry args={[39.5, 40, 128]} />
      <meshBasicMaterial color="#00ff66" transparent opacity={0.25} side={THREE.DoubleSide} />
    </mesh>
  )
}

export function SurfaceScene() {
  const gravity = useSim((s) => s.gravity)
  const paused = useSim((s) => s.paused)
  const resetNonce = useSim((s) => s.resetNonce)
  const bodies = useSim((s) => s.bodies)
  const selectBody = useSim((s) => s.selectBody)

  const gravityVec = useMemo<[number, number, number]>(() => [0, -gravity, 0], [gravity])

  return (
    <Physics gravity={gravityVec} paused={paused} timeStep="vary" interpolate>
      <group onPointerMissed={() => selectBody(null)}>
        <Ground />
        <HorizonRig />
        {bodies.map((b) => (
          <Body key={`${b.id}-${b.remountNonce}-${resetNonce}`} body={b} />
        ))}
      </group>
    </Physics>
  )
}
