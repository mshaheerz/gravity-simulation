import { RigidBody, CuboidCollider, BallCollider, CapsuleCollider, ConeCollider, type RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { useEffect, useRef } from 'react'
import type { Body as BodyData } from '../store/sim'
import { PRESETS_BY_ID } from '../sim/presets'
import { useSim } from '../store/sim'
import { bodyRefs } from '../sim/bodyRefs'
import { CustomBody } from './CustomBody'
import { reportImpact } from '../sim/impactFx'
import { useThemeColors } from '../sim/useThemeColors'

export function Body({ body }: { body: BodyData }) {
  // User-uploaded assets live in a parallel registry and render via CustomBody.
  if (body.presetId === 'custom') {
    return <CustomBody body={body} />
  }

  const preset = PRESETS_BY_ID[body.presetId]

  const selectedId = useSim((s) => s.selectedId)
  const selectBody = useSim((s) => s.selectBody)
  const vacuum = useSim((s) => s.vacuum)
  const airDensity = useSim((s) => s.airDensity)
  const colors = useThemeColors()
  const isSelected = selectedId === body.id
  const rbRef = useRef<RapierRigidBody | null>(null)

  // Resolve effective physics values (may be used before preset-null short-circuit,
  // so default safely if the preset is missing).
  const mass = body.mass ?? preset?.mass ?? 1
  const restitution = body.restitution ?? preset?.restitution ?? 0.3
  const friction = body.friction ?? preset?.friction ?? 0.5
  const baseDamping = body.linearDamping ?? preset?.linearDamping ?? 0
  // Vacuum → no drag. Otherwise scale per-body damping by ambient air density
  // (Earth sea level = 1.225 kg/m³ is the reference where damping == preset value).
  const linearDamping = vacuum ? 0 : baseDamping * (airDensity / 1.225)
  const color = body.color ?? preset?.color ?? '#ffffff'

  useEffect(() => {
    bodyRefs.set(body.id, rbRef.current)
    return () => bodyRefs.delete(body.id)
  }, [body.id])

  // Keep linear damping in sync when vacuum / airDensity / per-body damping
  // change at runtime — RigidBody reads the prop only at construction, so we
  // patch the live Rapier body directly.
  useEffect(() => {
    const rb = rbRef.current
    if (!rb) return
    try {
      rb.setLinearDamping(linearDamping)
    } catch {
      /* older Rapier types: ignore */
    }
  }, [linearDamping])

  if (!preset) return null

  const onClick = (e: any) => {
    e.stopPropagation()
    selectBody(body.id)
  }

  const selectionRing = isSelected && (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[selectionRadius(preset.shape, preset.dims) + 0.08, selectionRadius(preset.shape, preset.dims) + 0.14, 64]} />
      <meshBasicMaterial color={colors.accent} side={THREE.DoubleSide} transparent opacity={0.9} depthTest={false} />
    </mesh>
  )

  const onCollisionEnter = () => {
    const rb = rbRef.current
    if (!rb) return
    const v = rb.linvel()
    reportImpact(body.id, Math.hypot(v.x, v.y, v.z))
  }

  // Mass density override for Rapier — give it a `density` proxy via collider mass props
  // Rapier in @react-three/rapier exposes `mass` on the collider via `density` indirectly;
  // simpler path: set `colliders={false}` and pass an explicit collider with mass.
  const commonRB = {
    ref: (rb: RapierRigidBody | null) => {
      rbRef.current = rb
      bodyRefs.set(body.id, rb)
    },
    position: body.pos,
    linearVelocity: body.vel,
    restitution,
    friction,
    linearDamping,
    angularDamping: 0.05,
    onClick,
    onCollisionEnter,
  } as const

  if (preset.shape === 'sphere') {
    const r = preset.dims[0]
    return (
      <RigidBody {...commonRB} colliders={false}>
        <BallCollider args={[r]} mass={mass} />
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[r, 32, 32]} />
          <meshStandardMaterial
            color={color}
            roughness={0.5}
            metalness={0.1}
            emissive={isSelected ? '#003322' : '#000'}
            emissiveIntensity={isSelected ? 0.6 : 0}
          />
        </mesh>
        {selectionRing}
      </RigidBody>
    )
  }

  if (preset.shape === 'cuboid') {
    const [hx, hy, hz] = preset.dims
    return (
      <RigidBody {...commonRB} colliders={false}>
        <CuboidCollider args={[hx, hy, hz]} mass={mass} />
        <mesh castShadow receiveShadow>
          <boxGeometry args={[hx * 2, hy * 2, hz * 2]} />
          <meshStandardMaterial
            color={color}
            roughness={0.6}
            metalness={0.1}
            emissive={isSelected ? '#003322' : '#000'}
            emissiveIntensity={isSelected ? 0.6 : 0}
          />
        </mesh>
        {selectionRing}
      </RigidBody>
    )
  }

  if (preset.shape === 'capsule') {
    const [r, h] = preset.dims
    return (
      <RigidBody {...commonRB} colliders={false}>
        <CapsuleCollider args={[h, r]} mass={mass} />
        <mesh castShadow receiveShadow>
          <capsuleGeometry args={[r, h * 2, 8, 16]} />
          <meshStandardMaterial
            color={color}
            roughness={0.5}
            metalness={0.2}
            emissive={isSelected ? '#330000' : '#000'}
            emissiveIntensity={isSelected ? 0.5 : 0}
          />
        </mesh>
        {selectionRing}
      </RigidBody>
    )
  }

  if (preset.shape === 'cone') {
    const [r, h] = preset.dims
    return (
      <RigidBody {...commonRB} colliders={false}>
        <ConeCollider args={[h, r]} mass={mass} />
        <mesh castShadow receiveShadow>
          <coneGeometry args={[r, h * 2, 24]} />
          <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
        </mesh>
        {selectionRing}
      </RigidBody>
    )
  }

  return null
}

function selectionRadius(shape: string, dims: number[]) {
  if (shape === 'sphere') return dims[0]
  if (shape === 'cuboid') return Math.max(dims[0], dims[1], dims[2])
  if (shape === 'capsule') return Math.max(dims[0], dims[1])
  if (shape === 'cone') return Math.max(dims[0], dims[1])
  return 0.5
}
