import type { RapierRigidBody } from '@react-three/rapier'

// Module-level registry — survives renders, doesn't trigger re-renders on mutate.
const refs = new Map<string, RapierRigidBody>()

export const bodyRefs = {
  set(id: string, rb: RapierRigidBody | null) {
    if (rb) refs.set(id, rb)
    else refs.delete(id)
  },
  get(id: string) {
    return refs.get(id)
  },
  delete(id: string) {
    refs.delete(id)
  },
  all() {
    return refs
  },
}
