import type { AnimationPreset } from "./types"

export interface Pose {
  rootY: number
  rootRotY: number
  spineX: number
  spineZ: number
  headX: number
  headY: number
  armLX: number
  armLZ: number
  armRX: number
  armRZ: number
  legLX: number
  legRX: number
  capeX: number
}

export const FPS = 30

export const ANIMATIONS: Record<
  AnimationPreset,
  { label: string; duration: number; tracks: Record<string, number[]> }
> = {
  idle: {
    label: "Idle",
    duration: 3,
    tracks: { Root: [0, 0.5, 1], Spine: [0, 0.5, 1], Head: [0, 0.25, 0.75, 1], Arms: [0, 0.5, 1], Legs: [0, 1] },
  },
  walk: {
    label: "Walk",
    duration: 1.1,
    tracks: { Root: [0, 0.25, 0.5, 0.75, 1], Spine: [0, 0.5, 1], Head: [0, 1], Arms: [0, 0.25, 0.5, 0.75, 1], Legs: [0, 0.25, 0.5, 0.75, 1] },
  },
  run: {
    label: "Run",
    duration: 0.65,
    tracks: { Root: [0, 0.25, 0.5, 0.75, 1], Spine: [0, 1], Head: [0, 0.5, 1], Arms: [0, 0.25, 0.5, 0.75, 1], Legs: [0, 0.25, 0.5, 0.75, 1] },
  },
  dance: {
    label: "Dance",
    duration: 2,
    tracks: { Root: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1], Spine: [0, 0.25, 0.5, 0.75, 1], Head: [0, 0.5, 1], Arms: [0, 0.25, 0.5, 0.75, 1], Legs: [0, 0.5, 1] },
  },
  jump: {
    label: "Jump",
    duration: 1.4,
    tracks: { Root: [0, 0.2, 0.45, 0.7, 0.85, 1], Spine: [0, 0.2, 0.7, 1], Head: [0, 0.45, 1], Arms: [0, 0.2, 0.45, 0.85, 1], Legs: [0, 0.2, 0.45, 0.7, 1] },
  },
}

const TAU = Math.PI * 2
const smooth = (x: number) => x * x * (3 - 2 * x)

export function getPose(preset: AnimationPreset, phase: number): Pose {
  const s = Math.sin(phase * TAU)
  const c = Math.cos(phase * TAU)
  const base: Pose = {
    rootY: 0,
    rootRotY: 0,
    spineX: 0,
    spineZ: 0,
    headX: 0,
    headY: 0,
    armLX: 0,
    armLZ: -0.12,
    armRX: 0,
    armRZ: 0.12,
    legLX: 0,
    legRX: 0,
    capeX: 0.08,
  }

  switch (preset) {
    case "idle":
      return {
        ...base,
        rootY: 0.008 * s,
        spineX: 0.02 * s,
        headY: 0.18 * Math.sin(phase * TAU + 0.6),
        headX: 0.04 * c,
        armLZ: -0.12 - 0.03 * s,
        armRZ: 0.12 + 0.03 * s,
        capeX: 0.08 + 0.03 * s,
      }
    case "walk":
      return {
        ...base,
        rootY: 0.035 * Math.abs(c),
        spineX: 0.05,
        spineZ: 0.03 * s,
        armLX: 0.45 * s,
        armRX: -0.45 * s,
        legLX: -0.5 * s,
        legRX: 0.5 * s,
        headY: 0.05 * s,
        capeX: 0.25 + 0.06 * Math.abs(s),
      }
    case "run":
      return {
        ...base,
        rootY: 0.09 * Math.abs(c),
        spineX: 0.22,
        spineZ: 0.04 * s,
        armLX: 1.0 * s,
        armRX: -1.0 * s,
        armLZ: -0.2,
        armRZ: 0.2,
        legLX: -0.95 * s,
        legRX: 0.95 * s,
        headX: -0.15,
        capeX: 0.7 + 0.12 * Math.abs(s),
      }
    case "dance": {
      const beat = Math.sin(phase * TAU * 4)
      return {
        ...base,
        rootY: 0.05 * Math.abs(beat),
        rootRotY: 0.45 * s,
        spineZ: 0.16 * s,
        headX: 0.1 * beat,
        headY: -0.2 * s,
        armLZ: -2.45 - 0.35 * beat,
        armRZ: 2.45 - 0.35 * beat,
        armLX: 0.2 * c,
        armRX: -0.2 * c,
        legLX: -0.25 * Math.max(0, s),
        legRX: 0.25 * Math.min(0, s),
        capeX: 0.15 + 0.1 * Math.abs(beat),
      }
    }
    case "jump": {
      let rootY = 0
      let crouch = 0
      let armsUp = 0
      if (phase < 0.2) {
        crouch = smooth(phase / 0.2)
      } else if (phase < 0.7) {
        const t = (phase - 0.2) / 0.5
        rootY = 0.65 * Math.sin(t * Math.PI)
        crouch = Math.max(0, 1 - t * 4)
        armsUp = Math.sin(t * Math.PI)
      } else if (phase < 0.85) {
        crouch = smooth(1 - Math.abs((phase - 0.775) / 0.075))
      }
      return {
        ...base,
        rootY: rootY - 0.12 * crouch,
        spineX: 0.35 * crouch - 0.1 * armsUp,
        headX: -0.2 * crouch,
        armLX: 0.5 * crouch - 2.7 * armsUp,
        armRX: 0.5 * crouch - 2.7 * armsUp,
        armLZ: -0.12 - 0.2 * armsUp,
        armRZ: 0.12 + 0.2 * armsUp,
        legLX: -0.6 * crouch + 0.3 * armsUp,
        legRX: -0.6 * crouch - 0.2 * armsUp,
        capeX: 0.1 - 0.6 * armsUp + 0.3 * crouch,
      }
    }
  }
}
