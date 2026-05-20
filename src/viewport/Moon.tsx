import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function Moon({
  orbitRadius = 4,
  orbitSpeed = 0.15,
  size = 0.27,
}: {
  orbitRadius?: number
  orbitSpeed?: number
  size?: number
}) {
  const pivot = useRef<THREE.Group>(null)
  const moon = useRef<THREE.Mesh>(null)

  useFrame((_, dt) => {
    if (pivot.current) pivot.current.rotation.y += dt * orbitSpeed
    if (moon.current) moon.current.rotation.y += dt * 0.02
  })

  return (
    <group ref={pivot}>
      <mesh ref={moon} position={[orbitRadius, 0, 0]} castShadow receiveShadow>
        <sphereGeometry args={[size, 48, 48]} />
        <meshStandardMaterial
          color="#9a9a9a"
          roughness={0.95}
          metalness={0.0}
          emissive="#222"
          emissiveIntensity={0.08}
        />
      </mesh>

      {/* Orbital path */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[orbitRadius - 0.005, orbitRadius + 0.005, 256]} />
        <meshBasicMaterial color="#1a3a1a" side={THREE.DoubleSide} transparent opacity={0.6} />
      </mesh>
    </group>
  )
}
