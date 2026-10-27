import { PART_ORDER, PART_PIVOTS } from "./defaults"
import { deriveShape } from "./derived"
import type { Design, PartId, Vec3 } from "./types"

const n = (v: number) => Number(v.toFixed(3)).toString()
const v3 = (v: Vec3) => `[${v.map(n).join(", ")}]`
const toRad = (v: Vec3): Vec3 => v.map((d) => (d * Math.PI) / 180) as Vec3

function toComponentName(name: string) {
  const cleaned = name
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("")
  return cleaned && /^[A-Z]/.test(cleaned) ? `${cleaned}Avatar` : "CustomAvatar"
}

function partTransform(design: Design, id: PartId) {
  const p = design.parts[id]
  const pivot = PART_PIVOTS[id]
  const position: Vec3 = [pivot[0] + p.position[0], pivot[1] + p.position[1], pivot[2] + p.position[2]]
  return `position={${v3(position)}} rotation={${v3(toRad(p.rotation))}} scale={${v3(p.scale)}}`
}

export function generateReactCode(design: Design, projectName: string) {
  const shape = deriveShape(design.morphs)
  const name = toComponentName(projectName)
  const { accessories: acc, parts } = design
  const m = shape.muscle

  const materialEntries = PART_ORDER.map((id) => {
    const mat = parts[id].material
    return `  ${id}: { color: "${mat.color}", metalness: ${n(mat.metalness)}, roughness: ${n(mat.roughness)}, clearcoat: ${n(mat.clearcoat)}, emissive: "${mat.emissive}", emissiveIntensity: ${n(mat.emissiveIntensity)} },`
  }).join("\n")

  const show = (id: PartId) => parts[id].visible

  const head = show("head")
    ? `
          {/* Head */}
          <group ${partTransform(design, "head")}>
            <mesh position={[0, 0.04, 0]} castShadow>
              <cylinderGeometry args={[0.07, 0.08, 0.12, 16]} />
              <meshPhysicalMaterial {...MATERIALS.head} />
            </mesh>
            <mesh position={[0, 0.22, 0]} scale={${v3(shape.headScale)}} castShadow>
              <sphereGeometry args={[0.2, 48, 48]} />
              <meshPhysicalMaterial {...MATERIALS.head} />
            </mesh>${
              show("eyes")
                ? `
            <group ${partTransform(design, "eyes")}>
              {[-0.075, 0.075].map((x) => (
                <mesh key={x} position={[x, 0, 0]}>
                  <sphereGeometry args={[${n(shape.eyeRadius)}, 24, 24]} />
                  <meshPhysicalMaterial {...MATERIALS.eyes} />
                </mesh>
              ))}
            </group>`
                : ""
            }${
              acc.glasses && show("glasses")
                ? `
            <group ${partTransform(design, "glasses")}>
              <mesh castShadow>
                <boxGeometry args={[0.34, 0.07, 0.05]} />
                <meshPhysicalMaterial {...MATERIALS.glasses} />
              </mesh>
            </group>`
                : ""
            }
          </group>`
    : ""

  const armor = show("armor")
    ? `
          {/* Chest armor */}
          <group ${partTransform(design, "armor")}>
            <mesh scale={[${n(m)}, 1, ${n(m)}]} castShadow>
              <boxGeometry args={[0.42, 0.34, 0.12]} />
              <meshPhysicalMaterial {...MATERIALS.armor} />
            </mesh>
          </group>`
    : ""

  const pauldrons =
    acc.pauldrons && show("pauldrons")
      ? `
          {/* Pauldrons */}
          <group ${partTransform(design, "pauldrons")}>
            {[-${n(shape.shoulderX + 0.02)}, ${n(shape.shoulderX + 0.02)}].map((x) => (
              <mesh key={x} position={[x, 0, 0]} scale={[${n(m)}, 0.75, ${n(m)}]} castShadow>
                <sphereGeometry args={[0.13, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshPhysicalMaterial {...MATERIALS.pauldrons} />
              </mesh>
            ))}
          </group>`
      : ""

  const cape =
    acc.cape && show("cape")
      ? `
          {/* Sci-Fi cape */}
          <group ${partTransform(design, "cape")}>
            <mesh position={[0, -0.55, 0]} rotation={[0.08, 0, 0]} castShadow>
              <planeGeometry args={[0.6, 1.1, 8, 16]} />
              <meshPhysicalMaterial {...MATERIALS.cape} side={THREE.DoubleSide} />
            </mesh>
          </group>`
      : ""

  const arms = show("arms")
    ? `
          {/* Arms */}
          <group ${partTransform(design, "arms")}>
            {[-1, 1].map((side) => (
              <group key={side} position={[side * ${n(shape.shoulderX)}, 0, 0]} rotation={[0, 0, side * 0.12]}>
                <mesh position={[0, -0.18, 0]} scale={[${n(m)}, 1, ${n(m)}]} castShadow>
                  <capsuleGeometry args={[0.07, 0.22, 8, 16]} />
                  <meshPhysicalMaterial {...MATERIALS.arms} />
                </mesh>
                <mesh position={[0, -0.47, 0]} scale={[${n(m)}, 1, ${n(m)}]} castShadow>
                  <capsuleGeometry args={[0.06, 0.2, 8, 16]} />
                  <meshPhysicalMaterial {...MATERIALS.arms} />
                </mesh>
                <mesh position={[0, -0.66, 0]} castShadow>
                  <sphereGeometry args={[0.065, 24, 24]} />
                  <meshPhysicalMaterial {...MATERIALS.head} />
                </mesh>
              </group>
            ))}
          </group>`
    : ""

  const legs = show("legs")
    ? `
        {/* Legs */}
        <group ${partTransform(design, "legs")}>
          {[-0.13, 0.13].map((x) => (
            <group key={x} position={[x, 0, 0]}>
              <mesh position={[0, -0.2, 0]} scale={[${n(0.85 + 0.15 * m)}, 1, ${n(0.85 + 0.15 * m)}]} castShadow>
                <capsuleGeometry args={[0.085, 0.24, 8, 16]} />
                <meshPhysicalMaterial {...MATERIALS.legs} />
              </mesh>
              <mesh position={[0, -0.56, 0]} castShadow>
                <capsuleGeometry args={[0.072, 0.22, 8, 16]} />
                <meshPhysicalMaterial {...MATERIALS.legs} />
              </mesh>
              <mesh position={[0, -0.84, 0.04]} castShadow>
                <boxGeometry args={[0.17, 0.12, 0.28]} />
                <meshPhysicalMaterial {...MATERIALS.armor} />
              </mesh>
            </group>
          ))}
        </group>`
    : ""

  const torso = show("torso")
    ? `
        {/* Torso */}
        <group ${partTransform(design, "torso")}>
          <mesh position={[0, 0.3, 0]} scale={[${n(m)}, 1, ${n(m * 0.8)}]} castShadow>
            <capsuleGeometry args={[0.22, 0.32, 12, 24]} />
            <meshPhysicalMaterial {...MATERIALS.torso} />
          </mesh>
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.36, 0.14, 0.22]} />
            <meshPhysicalMaterial {...MATERIALS.legs} />
          </mesh>${head}${armor}${pauldrons}${cape}${arms}
        </group>`
    : ""

  return `"use client"

import * as THREE from "three"
import { Canvas, type ThreeElements } from "@react-three/fiber"
import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei"

// Generated by Avatar Forge · ${projectName}
// Morphs → round: ${design.morphs.faceRound}% · thin: ${design.morphs.faceThin}% · eyes: ${design.morphs.eyeSize}% · muscle: ${design.morphs.muscle}% · height: ${design.morphs.height}%
const MATERIALS = {
${materialEntries}
} as const

export function ${name}(props: ThreeElements["group"]) {
  return (
    <group {...props}>
      <group scale={${v3(shape.bodyScale)}}>${legs}${torso}
      </group>
    </group>
  )
}

export default function ${name}Scene() {
  return (
    <div className="h-screen w-full bg-black">
      <Canvas shadows camera={{ position: [2.6, 1.8, 3.4], fov: 40 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 5, 3]} intensity={1.8} castShadow shadow-mapSize={[2048, 2048]} />
        <directionalLight position={[-3, 2, -4]} intensity={2.2} color="#6366f1" />
        <directionalLight position={[3, 2, -4]} intensity={1.6} color="#22d3ee" />
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={2} position={[0, 4, 4]} scale={[6, 2, 1]} />
          <Lightformer form="ring" color="#8b5cf6" intensity={3} position={[-4, 2, -2]} scale={2} />
        </Environment>
        <${name} />
        <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={6} blur={2.4} />
        <OrbitControls target={[0, 1, 0]} enableDamping />
      </Canvas>
    </div>
  )
}
`
}

export function generateJsonSchema(design: Design, projectName: string) {
  return JSON.stringify(
    {
      $schema: "https://avatarforge.dev/schema/avatar.v1.json",
      name: projectName,
      version: "1.0.0",
      generatedAt: new Date().toISOString(),
      morphs: design.morphs,
      accessories: design.accessories,
      derived: deriveShape(design.morphs),
      parts: design.parts,
    },
    null,
    2,
  )
}
