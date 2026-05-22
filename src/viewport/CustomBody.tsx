import { Suspense, useEffect, useMemo, useRef } from 'react'
import { RigidBody, BallCollider, type RapierRigidBody } from '@react-three/rapier'
import { useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { useLoader } from '@react-three/fiber'
import type { Body as BodyData } from '../store/sim'
import { useSim } from '../store/sim'
import { bodyRefs } from '../sim/bodyRefs'
import { customAssets } from '../sim/customAssets'
import { reportImpact } from '../sim/impactFx'
import { useThemeColors } from '../sim/useThemeColors'

/**
 * Render a single user-uploaded asset as a physics body. GLTF/OBJ → mesh inside
 * a sphere collider sized to the asset's bounding sphere. Image → camera-facing
 * sprite, also wrapped in a sphere collider.
 */

const SelectionRing = ({ radius, accent }: { radius: number; accent: string }) => (
  <mesh rotation={[Math.PI / 2, 0, 0]}>
    <ringGeometry args={[radius + 0.08, radius + 0.14, 64]} />
    <meshBasicMaterial color={accent} side={THREE.DoubleSide} transparent opacity={0.9} depthTest={false} />
  </mesh>
)

function GltfVisual({ url, targetRadius }: { url: string; targetRadius: number }) {
  const gltf = useGLTF(url)
  // Auto-scale so the longest bounding-sphere axis matches the target radius.
  const { scale, scene } = useMemo(() => {
    const cloned = gltf.scene.clone(true)
    const box = new THREE.Box3().setFromObject(cloned)
    const sphere = new THREE.Sphere()
    box.getBoundingSphere(sphere)
    const factor = sphere.radius > 0 ? targetRadius / sphere.radius : 1
    // Re-center on origin so the body's rigid body anchor matches the visual.
    const center = new THREE.Vector3()
    box.getCenter(center)
    cloned.position.sub(center)
    return { scale: factor, scene: cloned }
  }, [gltf, targetRadius])
  return <primitive object={scene} scale={scale} />
}

function ObjVisual({ url, targetRadius, color }: { url: string; targetRadius: number; color: string }) {
  const obj = useLoader(OBJLoader, url)
  const { scale, scene } = useMemo(() => {
    const cloned = obj.clone(true)
    // OBJ has no materials by default → apply a NASA-themed standard material.
    cloned.traverse((child) => {
      const m = child as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = true
        m.receiveShadow = true
        m.material = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.1 })
      }
    })
    const box = new THREE.Box3().setFromObject(cloned)
    const sphere = new THREE.Sphere()
    box.getBoundingSphere(sphere)
    const factor = sphere.radius > 0 ? targetRadius / sphere.radius : 1
    const center = new THREE.Vector3()
    box.getCenter(center)
    cloned.position.sub(center)
    return { scale: factor, scene: cloned }
  }, [obj, targetRadius, color])
  return <primitive object={scene} scale={scale} />
}

function ImageVisual({ url, targetRadius }: { url: string; targetRadius: number }) {
  const tex = useTexture(url) as THREE.Texture
  // tex.image is HTMLImageElement|ImageBitmap depending on loader path — typed
  // loosely by drei. Cast for aspect math; default to 1:1 if unavailable.
  const img = tex.image as { width?: number; height?: number } | undefined
  const aspect = (img?.width ?? 1) / (img?.height ?? 1) || 1
  const w = targetRadius * 2
  const h = w / aspect
  return (
    <sprite scale={[w, h, 1]}>
      <spriteMaterial map={tex} transparent depthWrite={false} />
    </sprite>
  )
}

function VisualFallback({ radius, border }: { radius: number; border: string }) {
  return (
    <mesh>
      <sphereGeometry args={[radius, 16, 16]} />
      <meshBasicMaterial color={border} wireframe />
    </mesh>
  )
}

export function CustomBody({ body }: { body: BodyData }) {
  const asset = body.customAssetId ? customAssets.get(body.customAssetId) : undefined

  const selectedId = useSim((s) => s.selectedId)
  const selectBody = useSim((s) => s.selectBody)
  const vacuum = useSim((s) => s.vacuum)
  const airDensity = useSim((s) => s.airDensity)
  const colors = useThemeColors()
  const isSelected = selectedId === body.id
  const rbRef = useRef<RapierRigidBody | null>(null)

  const radius = asset?.defaultRadius ?? 0.5
  const mass = body.mass ?? 1
  const restitution = body.restitution ?? 0.3
  const friction = body.friction ?? 0.5
  const baseDamping = body.linearDamping ?? 0.05
  const linearDamping = vacuum ? 0 : baseDamping * (airDensity / 1.225)
  const color = body.color ?? '#9fc8ff'

  useEffect(() => {
    bodyRefs.set(body.id, rbRef.current)
    return () => bodyRefs.delete(body.id)
  }, [body.id])

  useEffect(() => {
    const rb = rbRef.current
    if (!rb) return
    try {
      rb.setLinearDamping(linearDamping)
    } catch {
      /* ignore */
    }
  }, [linearDamping])

  // If the asset went missing (e.g. user removed it from the library), render
  // a wireframe stand-in so physics still works.
  const visual = !asset ? (
    <VisualFallback radius={radius} border={colors.border} />
  ) : asset.kind === 'gltf' ? (
    <GltfVisual url={asset.url} targetRadius={radius} />
  ) : asset.kind === 'obj' ? (
    <ObjVisual url={asset.url} targetRadius={radius} color={color} />
  ) : (
    <ImageVisual url={asset.url} targetRadius={radius} />
  )

  const onClick = (e: any) => {
    e.stopPropagation()
    selectBody(body.id)
  }

  const onCollisionEnter = () => {
    const rb = rbRef.current
    if (!rb) return
    const v = rb.linvel()
    reportImpact(body.id, Math.hypot(v.x, v.y, v.z))
  }

  return (
    <RigidBody
      ref={(rb: RapierRigidBody | null) => {
        rbRef.current = rb
        bodyRefs.set(body.id, rb)
      }}
      position={body.pos}
      linearVelocity={body.vel}
      restitution={restitution}
      friction={friction}
      linearDamping={linearDamping}
      angularDamping={0.05}
      colliders={false}
      onCollisionEnter={onCollisionEnter}
    >
      <BallCollider args={[radius]} mass={mass} />
      {/* Click target lives on the visual group so we avoid relying on
          RigidBody's prop-forwarding (the types don't surface onClick). */}
      <group onClick={onClick}>
        <Suspense fallback={<VisualFallback radius={radius} border={colors.border} />}>{visual}</Suspense>
      </group>
      {isSelected && <SelectionRing radius={radius} accent={colors.accent} />}
    </RigidBody>
  )
}
