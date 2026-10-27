import type { Block, BlockOp, BlockShape } from "./types"

export const SHAPE_META: Record<BlockShape, { label: string; hint: string }> = {
  sphere: { label: "Sphere", hint: "Mold into eggs, heads, blobs" },
  box: { label: "Box", hint: "Bodies, walls, panels" },
  cylinder: { label: "Cylinder", hint: "Limbs, trunks, pipes — taper it" },
  cone: { label: "Cone", hint: "Spikes, hats, noses" },
  torus: { label: "Ring", hint: "Donuts, wheels, halos" },
  capsule: { label: "Capsule", hint: "Rounded limbs and fingers" },
}

let counter = 0
export const newBlockId = () => `b${Date.now().toString(36)}${(counter++).toString(36)}`

export function createBlock(shape: BlockShape, patch: Partial<Block> = {}): Block {
  return {
    id: newBlockId(),
    name: SHAPE_META[shape].label,
    shape,
    position: [0, 0.5, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    color: "#22d3ee",
    metalness: 0.1,
    roughness: 0.45,
    emissive: "#000000",
    emissiveIntensity: 0,
    taper: 1,
    thickness: 0.2,
    mirror: false,
    ...patch,
  }
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
const isVec3 = (v: unknown): v is [number, number, number] =>
  Array.isArray(v) && v.length === 3 && v.every((n) => typeof n === "number" && Number.isFinite(n))
const isHex = (v: unknown): v is string => typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v)

/** Drops unknown/invalid fields so untrusted input (AI output, saved JSON) can't break the scene. */
export function sanitizePatch(patch: Record<string, unknown>): Partial<Block> {
  const out: Partial<Block> = {}
  if (typeof patch.name === "string") out.name = patch.name.slice(0, 40)
  if (typeof patch.shape === "string" && patch.shape in SHAPE_META) out.shape = patch.shape as BlockShape
  if (isVec3(patch.position)) out.position = patch.position.map((n) => clamp(n, -20, 20)) as Block["position"]
  if (isVec3(patch.rotation)) out.rotation = patch.rotation
  if (isVec3(patch.scale)) out.scale = patch.scale.map((n) => clamp(n, 0.02, 20)) as Block["scale"]
  if (isHex(patch.color)) out.color = patch.color.toLowerCase()
  if (isHex(patch.emissive)) out.emissive = patch.emissive.toLowerCase()
  if (typeof patch.metalness === "number") out.metalness = clamp(patch.metalness, 0, 1)
  if (typeof patch.roughness === "number") out.roughness = clamp(patch.roughness, 0, 1)
  if (typeof patch.emissiveIntensity === "number") out.emissiveIntensity = clamp(patch.emissiveIntensity, 0, 4)
  if (typeof patch.taper === "number") out.taper = clamp(patch.taper, 0, 2)
  if (typeof patch.thickness === "number") out.thickness = clamp(patch.thickness, 0.05, 0.5)
  if (typeof patch.mirror === "boolean") out.mirror = patch.mirror
  return out
}

export function sanitizeBlocks(raw: unknown): Block[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((b) => {
    if (!b || typeof b !== "object") return []
    const clean = sanitizePatch(b as Record<string, unknown>)
    if (!clean.shape) return []
    const id = typeof (b as Block).id === "string" ? (b as Block).id : newBlockId()
    return [createBlock(clean.shape, { ...clean, id })]
  })
}

export function applyOps(blocks: Block[], ops: BlockOp[]): Block[] {
  let next = blocks
  for (const o of ops) {
    if (o.op === "clear") next = []
    else if (o.op === "remove") next = next.filter((b) => b.id !== o.id)
    else if (o.op === "update") {
      const patch = sanitizePatch(o.patch as Record<string, unknown>)
      next = next.map((b) => (b.id === o.id ? { ...b, ...patch } : b))
    } else if (o.op === "add") {
      const patch = sanitizePatch(o.block as Record<string, unknown>)
      if (!patch.shape) continue
      const wanted = typeof o.block.id === "string" && o.block.id ? o.block.id : undefined
      const id = wanted && !next.some((b) => b.id === wanted) ? wanted : newBlockId()
      next = [...next, createBlock(patch.shape, { ...patch, id })]
    }
  }
  return next
}

type Spec = Partial<Block> & { shape: BlockShape }
const build = (specs: Spec[]) => specs.map((s) => createBlock(s.shape, s))

export interface BlockTemplate {
  id: string
  name: string
  description: string
  accent: string
  create: () => Block[]
}

export const BLOCK_TEMPLATES: BlockTemplate[] = [
  {
    id: "blank",
    name: "Blank canvas",
    description: "Start from a single clay sphere",
    accent: "#a1a1aa",
    create: () => build([{ shape: "sphere", name: "Clay", color: "#d4b5a0", roughness: 0.8 }]),
  },
  {
    id: "snowman",
    name: "Snowman",
    description: "Three molded spheres, coal eyes and a carrot",
    accent: "#e4e4e7",
    create: () =>
      build([
        { shape: "sphere", name: "Base", position: [0, 0.45, 0], scale: [1, 0.9, 1], color: "#f4f4f5", roughness: 0.9 },
        { shape: "sphere", name: "Belly", position: [0, 1.1, 0], scale: [0.72, 0.68, 0.72], color: "#f4f4f5", roughness: 0.9 },
        { shape: "sphere", name: "Head", position: [0, 1.62, 0], scale: [0.5, 0.48, 0.5], color: "#fafafa", roughness: 0.9 },
        { shape: "sphere", name: "Eye", position: [0.09, 1.7, 0.21], scale: [0.06, 0.06, 0.06], color: "#18181b", mirror: true },
        { shape: "cone", name: "Carrot", position: [0, 1.62, 0.3], rotation: [90, 0, 0], scale: [0.08, 0.25, 0.08], color: "#f97316", taper: 0 },
        { shape: "cylinder", name: "Hat brim", position: [0, 1.84, 0], scale: [0.55, 0.03, 0.55], color: "#18181b" },
        { shape: "cylinder", name: "Hat", position: [0, 2.0, 0], scale: [0.36, 0.3, 0.36], color: "#18181b" },
      ]),
  },
  {
    id: "robot",
    name: "Robot",
    description: "Boxy chassis with mirrored limbs and a glowing visor",
    accent: "#22d3ee",
    create: () =>
      build([
        { shape: "box", name: "Torso", position: [0, 1.05, 0], scale: [0.7, 0.8, 0.45], color: "#6366f1", metalness: 0.85, roughness: 0.25 },
        { shape: "box", name: "Head", position: [0, 1.72, 0], scale: [0.48, 0.42, 0.42], color: "#a1a1aa", metalness: 0.9, roughness: 0.2 },
        { shape: "box", name: "Visor", position: [0, 1.75, 0.21], scale: [0.38, 0.1, 0.02], color: "#0e7490", emissive: "#22d3ee", emissiveIntensity: 2 },
        { shape: "cylinder", name: "Antenna", position: [0, 2.05, 0], scale: [0.03, 0.25, 0.03], color: "#a1a1aa", metalness: 0.9 },
        { shape: "sphere", name: "Antenna tip", position: [0, 2.2, 0], scale: [0.08, 0.08, 0.08], color: "#f472b6", emissive: "#ec4899", emissiveIntensity: 2 },
        { shape: "capsule", name: "Arm", position: [0.5, 1.0, 0], rotation: [0, 0, 8], scale: [0.5, 0.9, 0.5], color: "#3f3f46", metalness: 0.6, mirror: true },
        { shape: "cylinder", name: "Leg", position: [0.18, 0.33, 0], scale: [0.2, 0.66, 0.2], color: "#27272a", metalness: 0.5, mirror: true },
        { shape: "box", name: "Foot", position: [0.18, 0.05, 0.05], scale: [0.24, 0.1, 0.34], color: "#18181b", mirror: true },
      ]),
  },
  {
    id: "tree",
    name: "Low-poly Tree",
    description: "Tapered trunk with stacked foliage blobs",
    accent: "#10b981",
    create: () =>
      build([
        { shape: "cylinder", name: "Trunk", position: [0, 0.6, 0], scale: [0.28, 1.2, 0.28], color: "#7c4a2d", roughness: 0.9, taper: 0.65 },
        { shape: "sphere", name: "Canopy", position: [0, 1.55, 0], scale: [1.3, 1.0, 1.3], color: "#16a34a", roughness: 0.8 },
        { shape: "sphere", name: "Canopy top", position: [0.15, 2.1, 0.05], scale: [0.85, 0.75, 0.85], color: "#22c55e", roughness: 0.8 },
        { shape: "sphere", name: "Canopy side", position: [0.5, 1.45, 0.25], scale: [0.6, 0.55, 0.6], color: "#15803d", roughness: 0.8, mirror: true },
      ]),
  },
  {
    id: "rocket",
    name: "Rocket",
    description: "Nose cone, porthole ring and flared fins",
    accent: "#f97316",
    create: () =>
      build([
        { shape: "cylinder", name: "Body", position: [0, 1.1, 0], scale: [0.6, 1.4, 0.6], color: "#e4e4e7", metalness: 0.6, roughness: 0.3 },
        { shape: "cone", name: "Nose", position: [0, 2.1, 0], scale: [0.6, 0.6, 0.6], color: "#ef4444", metalness: 0.3, taper: 0 },
        { shape: "torus", name: "Porthole", position: [0, 1.45, 0.3], scale: [0.35, 0.35, 0.35], color: "#a1a1aa", metalness: 0.9, thickness: 0.15 },
        { shape: "sphere", name: "Window", position: [0, 1.45, 0.27], scale: [0.24, 0.24, 0.08], color: "#0e7490", emissive: "#22d3ee", emissiveIntensity: 1.2 },
        { shape: "box", name: "Fin", position: [0.38, 0.45, 0], rotation: [0, 0, -15], scale: [0.25, 0.6, 0.06], color: "#ef4444", mirror: true },
        { shape: "cone", name: "Exhaust", position: [0, 0.32, 0], scale: [0.45, 0.25, 0.45], color: "#3f3f46", metalness: 0.8, taper: 1.6 },
        { shape: "cone", name: "Flame", position: [0, 0.1, 0], rotation: [180, 0, 0], scale: [0.3, 0.3, 0.3], color: "#facc15", emissive: "#f97316", emissiveIntensity: 2.5, taper: 0 },
      ]),
  },
  {
    id: "mushroom",
    name: "Mushroom",
    description: "Squashed sphere cap on a tapered stem",
    accent: "#ec4899",
    create: () =>
      build([
        { shape: "cylinder", name: "Stem", position: [0, 0.45, 0], scale: [0.4, 0.9, 0.4], color: "#fef3c7", roughness: 0.8, taper: 0.8 },
        { shape: "sphere", name: "Cap", position: [0, 0.95, 0], scale: [1.4, 0.6, 1.4], color: "#dc2626", roughness: 0.5 },
        { shape: "sphere", name: "Spot", position: [0.3, 1.18, 0.25], scale: [0.16, 0.06, 0.16], color: "#fafafa", mirror: true },
        { shape: "sphere", name: "Spot top", position: [0, 1.25, 0], scale: [0.2, 0.06, 0.2], color: "#fafafa" },
      ]),
  },
]
