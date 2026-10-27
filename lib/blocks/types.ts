import type { Vec3 } from "@/lib/avatar/types"

export const BLOCK_SHAPES = ["sphere", "box", "cylinder", "cone", "torus", "capsule"] as const
export type BlockShape = (typeof BLOCK_SHAPES)[number]

export interface Block {
  id: string
  name: string
  shape: BlockShape
  /** World position (scene units, ground is y = 0). */
  position: Vec3
  /** Euler rotation in degrees. */
  rotation: Vec3
  /** Per-axis scale — stretching a sphere is how you "mold" it into eggs, blobs and limbs. */
  scale: Vec3
  color: string
  metalness: number
  roughness: number
  emissive: string
  emissiveIntensity: number
  /** Cylinder/cone top radius factor (0 = point, 1 = straight, 2 = flared). */
  taper: number
  /** Torus tube thickness (0.05–0.5). */
  thickness: number
  /** Renders a mirrored twin across the X axis (for arms, ears, eyes…). */
  mirror: boolean
}

export type BlockOp =
  | { op: "add"; block: Partial<Block> & { shape: BlockShape } }
  | { op: "update"; id: string; patch: Partial<Omit<Block, "id">> }
  | { op: "remove"; id: string }
  | { op: "clear" }
