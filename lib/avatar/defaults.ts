import type {
  AccessoryId,
  Design,
  PartCategory,
  PartId,
  PartMaterial,
  PartState,
  Vec3,
} from "./types"

export const PART_ORDER: PartId[] = [
  "torso",
  "head",
  "eyes",
  "glasses",
  "armor",
  "pauldrons",
  "cape",
  "arms",
  "legs",
]

export const ACCESSORY_IDS: AccessoryId[] = ["glasses", "pauldrons", "cape"]

export const PART_META: Record<
  PartId,
  { label: string; category: PartCategory; parent: PartId | null; accessory?: AccessoryId }
> = {
  torso: { label: "Torso", category: "Torso", parent: null },
  head: { label: "Head", category: "Head", parent: "torso" },
  eyes: { label: "Eyes", category: "Head", parent: "head" },
  glasses: { label: "Cyber Glasses", category: "Accessories", parent: "head", accessory: "glasses" },
  armor: { label: "Chest Armor", category: "Armor", parent: "torso" },
  pauldrons: { label: "Pauldrons", category: "Accessories", parent: "torso", accessory: "pauldrons" },
  cape: { label: "Sci-Fi Cape", category: "Accessories", parent: "torso", accessory: "cape" },
  arms: { label: "Arms", category: "Limbs", parent: "torso" },
  legs: { label: "Legs", category: "Limbs", parent: null },
}

/** Local pivot of each part relative to its parent group (scene units). */
export const PART_PIVOTS: Record<PartId, Vec3> = {
  legs: [0, 0.9, 0],
  torso: [0, 0.95, 0],
  head: [0, 0.68, 0],
  eyes: [0, 0.24, 0.17],
  glasses: [0, 0.25, 0.19],
  armor: [0, 0.36, 0.17],
  pauldrons: [0, 0.6, 0],
  cape: [0, 0.62, -0.2],
  arms: [0, 0.56, 0],
}

function mat(partial: Partial<PartMaterial> & { color: string }): PartMaterial {
  return {
    metalness: 0.1,
    roughness: 0.5,
    clearcoat: 0,
    emissive: "#000000",
    emissiveIntensity: 0,
    ...partial,
  }
}

function part(material: PartMaterial): PartState {
  return {
    material,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    visible: true,
    locked: false,
  }
}

export function createDefaultDesign(): Design {
  return {
    parts: {
      torso: part(mat({ color: "#27272a", metalness: 0.35, roughness: 0.45, clearcoat: 0.3 })),
      head: part(mat({ color: "#d4b5a0", metalness: 0.05, roughness: 0.55, clearcoat: 0.4 })),
      eyes: part(mat({ color: "#e0f7ff", roughness: 0.15, emissive: "#22d3ee", emissiveIntensity: 2.2 })),
      glasses: part(
        mat({ color: "#0e7490", metalness: 0.8, roughness: 0.15, clearcoat: 1, emissive: "#22d3ee", emissiveIntensity: 1.2 }),
      ),
      armor: part(mat({ color: "#6366f1", metalness: 0.85, roughness: 0.25, clearcoat: 0.8 })),
      pauldrons: part(mat({ color: "#a1a1aa", metalness: 0.9, roughness: 0.2, clearcoat: 0.6 })),
      cape: part(mat({ color: "#7c3aed", metalness: 0.1, roughness: 0.7, emissive: "#4c1d95", emissiveIntensity: 0.3 })),
      arms: part(mat({ color: "#3f3f46", metalness: 0.3, roughness: 0.5, clearcoat: 0.2 })),
      legs: part(mat({ color: "#18181b", metalness: 0.4, roughness: 0.4, clearcoat: 0.2 })),
    },
    morphs: {
      faceRound: 30,
      faceThin: 0,
      eyeSize: 100,
      muscle: 100,
      height: 100,
    },
    accessories: {
      glasses: true,
      pauldrons: true,
      cape: false,
    },
  }
}

export const MORPH_CONFIG = [
  { key: "faceRound", label: "Face Shape · Round", min: 0, max: 100, unit: "%", hint: "Widens the skull" },
  { key: "faceThin", label: "Face Shape · Thin", min: 0, max: 100, unit: "%", hint: "Narrows and elongates" },
  { key: "eyeSize", label: "Eye Size", min: 50, max: 180, unit: "%", hint: "Scales eye spheres" },
  { key: "muscle", label: "Muscle Mass", min: 70, max: 150, unit: "%", hint: "Torso & limb girth" },
  { key: "height", label: "Height", min: 85, max: 120, unit: "%", hint: "Overall stature" },
] as const
