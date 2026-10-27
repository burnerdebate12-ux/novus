import type { Morphs, Vec3 } from "./types"

export interface DerivedShape {
  headScale: Vec3
  eyeRadius: number
  muscle: number
  shoulderX: number
  bodyScale: Vec3
}

const round = (n: number) => Math.round(n * 1000) / 1000

export function deriveShape(morphs: Morphs): DerivedShape {
  const r = morphs.faceRound / 100
  const t = morphs.faceThin / 100
  const muscle = morphs.muscle / 100
  const h = morphs.height / 100
  return {
    headScale: [round(1 + 0.3 * r - 0.25 * t), round(1 + 0.2 * t - 0.05 * r), round(1 + 0.15 * r - 0.1 * t)],
    eyeRadius: round(0.034 * (morphs.eyeSize / 100)),
    muscle: round(muscle),
    shoulderX: round(0.3 + 0.07 * muscle),
    bodyScale: [round(1 + (h - 1) * 0.3), round(h), round(1 + (h - 1) * 0.3)],
  }
}

export const degToRad = (d: number) => (d * Math.PI) / 180
export const radToDeg = (r: number) => (r * 180) / Math.PI
