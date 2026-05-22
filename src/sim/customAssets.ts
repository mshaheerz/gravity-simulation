/**
 * In-memory registry of user-uploaded assets (GLB/GLTF/OBJ models + PNG/JPG
 * sprites). Each asset becomes a spawn-able preset in the Object Library.
 *
 * Persistence: object URLs only live in this tab — we deliberately don't try
 * to serialize binary blobs into autosave/share, because that path is for v2.
 */

export type CustomAssetKind = 'gltf' | 'obj' | 'image'

export interface CustomAsset {
  id: string
  kind: CustomAssetKind
  /** original filename — used as the default label */
  name: string
  /** object URL produced from the dropped File — revoked on remove */
  url: string
  /** rendered preview, used as the swatch in the library tile */
  emoji: string
  /** sizing hint for the spawned body (radius for sphere collider, in meters) */
  defaultRadius: number
}

let _seq = 1
const _assets = new Map<string, CustomAsset>()
const _listeners = new Set<() => void>()
let _cachedList: CustomAsset[] = []

function notify() {
  // Recompute the cached list whenever mutations occur.
  _cachedList = Array.from(_assets.values())
  for (const l of _listeners) l()
}

function detectKind(filename: string): CustomAssetKind | null {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.glb') || lower.endsWith('.gltf')) return 'gltf'
  if (lower.endsWith('.obj')) return 'obj'
  if (/\.(png|jpe?g|webp|gif)$/i.test(lower)) return 'image'
  return null
}

const emojiFor = (kind: CustomAssetKind) =>
  kind === 'gltf' ? '◈' : kind === 'obj' ? '◇' : '▦'

export const customAssets = {
  /** Subscribe to changes (insertions/removals). */
  subscribe(cb: () => void) {
    _listeners.add(cb)
    return () => {
      _listeners.delete(cb)
    }
  },

  /** Current snapshot — stable array reference between mutations. */
  list(): CustomAsset[] {
    return _cachedList
  },

  get(id: string): CustomAsset | undefined {
    return _assets.get(id)
  },

  /**
   * Ingest a single File. Returns the new asset or null if unsupported.
   * The caller (the dropzone UI) is responsible for surfacing errors.
   */
  ingest(file: File): CustomAsset | null {
    const kind = detectKind(file.name)
    if (!kind) return null
    const id = `cu${_seq++}`
    const url = URL.createObjectURL(file)
    const asset: CustomAsset = {
      id,
      kind,
      name: file.name,
      url,
      emoji: emojiFor(kind),
      // Sane defaults — user can adjust mass/restitution via the inspector.
      defaultRadius: kind === 'image' ? 0.4 : 0.5,
    }
    _assets.set(id, asset)
    notify()
    return asset
  },

  /** Convenience: bulk-ingest from a drop event. Returns count accepted. */
  ingestFiles(files: FileList | File[]): { accepted: number; rejected: string[] } {
    const list = Array.from(files as ArrayLike<File>)
    const rejected: string[] = []
    let accepted = 0
    for (const f of list) {
      if (this.ingest(f)) accepted++
      else rejected.push(f.name)
    }
    return { accepted, rejected }
  },

  remove(id: string) {
    const a = _assets.get(id)
    if (!a) return
    URL.revokeObjectURL(a.url)
    _assets.delete(id)
    notify()
  },
}
