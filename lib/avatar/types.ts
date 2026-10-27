export type Vec3 = [number, number, number]

export type PartId =
  | "torso"
  | "head"
  | "eyes"
  | "glasses"
  | "armor"
  | "pauldrons"
  | "cape"
  | "arms"
  | "legs"

export type AccessoryId = "glasses" | "pauldrons" | "cape"

export type PartCategory = "Head" | "Torso" | "Limbs" | "Armor" | "Accessories"

export interface PartMaterial {
  color: string
  metalness: number
  roughness: number
  clearcoat: number
  emissive: string
  emissiveIntensity: number
}

export interface PartState {
  material: PartMaterial
  position: Vec3
  rotation: Vec3
  scale: Vec3
  visible: boolean
  locked: boolean
}

export interface Morphs {
  faceRound: number
  faceThin: number
  eyeSize: number
  muscle: number
  height: number
}

export type Accessories = Record<AccessoryId, boolean>

export interface Design {
  parts: Record<PartId, PartState>
  morphs: Morphs
  accessories: Accessories
}

export type ShadingMode = "lit" | "shaded" | "wireframe" | "xray"
export type GizmoMode = "translate" | "rotate" | "scale"
export type LightingPreset = "cyber" | "studio" | "sunset"
export type AnimationPreset = "idle" | "walk" | "run" | "dance" | "jump"

export interface ViewState {
  selected: PartId
  shading: ShadingMode
  showGrid: boolean
  showStats: boolean
  gizmoEnabled: boolean
  gizmoMode: GizmoMode
  lighting: LightingPreset
  cameraResetKey: number
}

export interface AnimState {
  preset: AnimationPreset
  playing: boolean
  speed: number
  loop: boolean
}
