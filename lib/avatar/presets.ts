import { createDefaultDesign } from "./defaults"
import type { Design, PartId, PartMaterial } from "./types"

export interface CharacterPreset {
  id: string
  name: string
  description: string
  accent: string
  create: () => Design
}

type MaterialPatch = Partial<Record<PartId, Partial<PartMaterial>>>

function variant(materials: MaterialPatch, rest: Partial<Pick<Design, "morphs" | "accessories">> = {}): Design {
  const d = createDefaultDesign()
  for (const [id, patch] of Object.entries(materials) as [PartId, Partial<PartMaterial>][]) {
    d.parts[id] = { ...d.parts[id], material: { ...d.parts[id].material, ...patch } }
  }
  return {
    ...d,
    morphs: { ...d.morphs, ...rest.morphs },
    accessories: { ...d.accessories, ...rest.accessories },
  }
}

export const CHARACTER_PRESETS: CharacterPreset[] = [
  {
    id: "neon-ronin",
    name: "Neon Ronin",
    description: "Cyberpunk operative with holo-visor and alloy pauldrons",
    accent: "#22d3ee",
    create: createDefaultDesign,
  },
  {
    id: "chrome-knight",
    name: "Chrome Knight",
    description: "Heavy mirror-finish armor, broad and tall",
    accent: "#e4e4e7",
    create: () =>
      variant(
        {
          armor: { color: "#d4d4d8", metalness: 1, roughness: 0.08, clearcoat: 1 },
          pauldrons: { color: "#e4e4e7", metalness: 1, roughness: 0.1 },
          torso: { color: "#52525b", metalness: 0.8 },
          arms: { color: "#71717a", metalness: 0.8, roughness: 0.25 },
          legs: { color: "#3f3f46", metalness: 0.7 },
          eyes: { emissive: "#60a5fa" },
        },
        { morphs: { muscle: 135, height: 110, faceRound: 50, faceThin: 0, eyeSize: 80 }, accessories: { glasses: false, pauldrons: true, cape: true } },
      ),
  },
  {
    id: "void-mage",
    name: "Void Mage",
    description: "Slender spellcaster with a glowing violet cape",
    accent: "#a855f7",
    create: () =>
      variant(
        {
          torso: { color: "#1e1b4b", metalness: 0.1, roughness: 0.7 },
          armor: { color: "#4c1d95", metalness: 0.4, emissive: "#7c3aed", emissiveIntensity: 0.6 },
          cape: { color: "#581c87", emissive: "#a855f7", emissiveIntensity: 0.8 },
          eyes: { emissive: "#c084fc", emissiveIntensity: 3 },
          head: { color: "#c4b5fd" },
        },
        { morphs: { muscle: 80, height: 112, faceRound: 10, faceThin: 60, eyeSize: 120 }, accessories: { glasses: false, pauldrons: false, cape: true } },
      ),
  },
  {
    id: "desert-scout",
    name: "Desert Scout",
    description: "Lightweight explorer in sand-toned gear",
    accent: "#f59e0b",
    create: () =>
      variant(
        {
          torso: { color: "#a16207", metalness: 0, roughness: 0.85 },
          armor: { color: "#ca8a04", metalness: 0.3, roughness: 0.6 },
          arms: { color: "#78350f", roughness: 0.8 },
          legs: { color: "#57534e", roughness: 0.8 },
          glasses: { color: "#f59e0b", emissive: "#f97316", emissiveIntensity: 0.8 },
          head: { color: "#b08060" },
        },
        { morphs: { muscle: 95, height: 96, faceRound: 30, faceThin: 20, eyeSize: 100 }, accessories: { glasses: true, pauldrons: false, cape: false } },
      ),
  },
  {
    id: "bubble-bot",
    name: "Bubble Bot",
    description: "Chunky, round-faced toy robot with big eyes",
    accent: "#ec4899",
    create: () =>
      variant(
        {
          head: { color: "#f9a8d4", metalness: 0.2, roughness: 0.3, clearcoat: 1 },
          torso: { color: "#f472b6", metalness: 0.2, roughness: 0.3, clearcoat: 1 },
          armor: { color: "#fdf2f8", metalness: 0.1, roughness: 0.2, clearcoat: 1 },
          arms: { color: "#fbcfe8" },
          legs: { color: "#db2777" },
          eyes: { emissive: "#22d3ee", emissiveIntensity: 2.6 },
        },
        { morphs: { muscle: 120, height: 88, faceRound: 100, faceThin: 0, eyeSize: 170 }, accessories: { glasses: false, pauldrons: false, cape: false } },
      ),
  },
]
