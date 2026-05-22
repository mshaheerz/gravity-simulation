import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useThemeColors } from '../sim/useThemeColors'

export function Earth({ position = [0, 0, 0] as [number, number, number] }) {
  const group = useRef<THREE.Group>(null)
  const wireframe = useRef<THREE.Mesh>(null)
  const colors = useThemeColors()

  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.05
    if (wireframe.current) wireframe.current.rotation.y -= dt * 0.005
  })

  return (
    <group ref={group} position={position}>
      {/* Ocean / base sphere */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          color="#0a3a6a"
          roughness={0.85}
          metalness={0.05}
          emissive="#001a33"
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* Mission-control wireframe overlay */}
      <mesh ref={wireframe} scale={1.002}>
        <icosahedronGeometry args={[1, 8]} />
        <meshBasicMaterial
          color={colors.accent}
          wireframe
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </mesh>

      {/* Atmospheric halo */}
      <mesh scale={1.05}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#3fa9ff"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Equator ring marker */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.04, 1.05, 96]} />
        <meshBasicMaterial color={colors.accent} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
