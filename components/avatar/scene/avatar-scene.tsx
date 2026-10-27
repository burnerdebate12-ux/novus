"use client"

import {
  ContactShadows,
  Environment,
  Grid,
  Lightformer,
  OrbitControls,
  Stats,
  TransformControls,
} from "@react-three/drei"
import { Canvas, useThree } from "@react-three/fiber"
import { useEffect, useState, type RefObject } from "react"
import type { Object3D, Vector3 } from "three"
import { PART_PIVOTS } from "@/lib/avatar/defaults"
import { radToDeg } from "@/lib/avatar/derived"
import { useAvatar } from "@/lib/avatar/store"
import type { LightingPreset, Vec3 } from "@/lib/avatar/types"
import { Character } from "./character"

const LIGHTING: Record<
  LightingPreset,
  { key: string; keyIntensity: number; rimA: string; rimB: string; rimIntensity: number; ring: string }
> = {
  cyber: { key: "#ffffff", keyIntensity: 1.8, rimA: "#6366f1", rimB: "#22d3ee", rimIntensity: 2.6, ring: "#22d3ee" },
  studio: { key: "#fff4e6", keyIntensity: 2.2, rimA: "#a5b4fc", rimB: "#e0e7ff", rimIntensity: 1.2, ring: "#a1a1aa" },
  sunset: { key: "#ffb380", keyIntensity: 2, rimA: "#c084fc", rimB: "#fb7185", rimIntensity: 2.2, ring: "#f472b6" },
}

const round = (v: number) => Math.round(v * 1000) / 1000

function Lights() {
  const { view } = useAvatar()
  const l = LIGHTING[view.lighting]
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[3, 5, 3]}
        intensity={l.keyIntensity}
        color={l.key}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />
      <directionalLight position={[-3, 2.5, -4]} intensity={l.rimIntensity} color={l.rimA} />
      <directionalLight position={[3, 2, -4]} intensity={l.rimIntensity * 0.7} color={l.rimB} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={1.6} color={l.key} position={[0, 4, 4]} scale={[6, 2, 1]} />
        <Lightformer form="ring" intensity={3} color={l.rimA} position={[-4, 2, -2]} scale={2} />
        <Lightformer form="rect" intensity={2} color={l.rimB} position={[4, 1, -3]} scale={[1, 4, 1]} />
      </Environment>
    </>
  )
}

function Ground() {
  const { view } = useAvatar()
  const ring = LIGHTING[view.lighting].ring
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, 0]}>
        <ringGeometry args={[0.62, 0.66, 96]} />
        <meshBasicMaterial color={ring} transparent opacity={0.85} toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, 0]}>
        <circleGeometry args={[0.62, 96]} />
        <meshBasicMaterial color={ring} transparent opacity={0.06} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <shadowMaterial opacity={0.35} />
      </mesh>
      <ContactShadows position={[0, 0.003, 0]} opacity={0.55} scale={5} blur={2.4} far={2} />
      {view.showGrid && (
        <Grid
          position={[0, -0.001, 0]}
          args={[20, 20]}
          cellSize={0.25}
          cellThickness={0.6}
          cellColor="#27272a"
          sectionSize={1}
          sectionThickness={1}
          sectionColor="#3f3f6e"
          fadeDistance={14}
          fadeStrength={1.5}
          infiniteGrid
        />
      )}
    </group>
  )
}

function CameraRig() {
  const { view } = useAvatar()
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as unknown as { target: Vector3; update: () => void } | null
  useEffect(() => {
    if (view.cameraResetKey === 0) return
    camera.position.set(2.6, 1.8, 3.4)
    controls?.target.set(0, 1, 0)
    controls?.update()
  }, [view.cameraResetKey, camera, controls])
  return null
}

function Gizmo() {
  const { design, view, sceneRefs, commitTransform } = useAvatar()
  const [target, setTarget] = useState<Object3D | null>(null)
  const part = design.parts[view.selected]
  const accessoryOff =
    (view.selected === "glasses" || view.selected === "pauldrons" || view.selected === "cape") &&
    !design.accessories[view.selected]

  useEffect(() => {
    setTarget(sceneRefs.current.parts[view.selected] ?? null)
  }, [view.selected, design.accessories, sceneRefs])

  if (!view.gizmoEnabled || !target || !part.visible || part.locked || accessoryOff) return null

  const handleMouseUp = () => {
    const pivot = PART_PIVOTS[view.selected]
    const p = target.position
    const r = target.rotation
    const s = target.scale
    const position: Vec3 = [round(p.x - pivot[0]), round(p.y - pivot[1]), round(p.z - pivot[2])]
    const rotation: Vec3 = [round(radToDeg(r.x)), round(radToDeg(r.y)), round(radToDeg(r.z))]
    const scale: Vec3 = [round(s.x), round(s.y), round(s.z)]
    commitTransform(view.selected, position, rotation, scale)
  }

  return <TransformControls object={target} mode={view.gizmoMode} size={0.7} onMouseUp={handleMouseUp} />
}

export default function AvatarScene({ statsParent }: { statsParent: RefObject<HTMLDivElement | null> }) {
  const { view } = useAvatar()
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      camera={{ position: [2.6, 1.8, 3.4], fov: 40, near: 0.05, far: 100 }}
      aria-label="3D avatar viewport"
    >
      <Lights />
      <Ground />
      <Character />
      <Gizmo />
      <OrbitControls makeDefault target={[0, 1, 0]} enableDamping minDistance={1.2} maxDistance={10} maxPolarAngle={Math.PI * 0.52} />
      <CameraRig />
      {view.showStats && <Stats parent={statsParent as RefObject<HTMLElement>} className="stats-panel" />}
    </Canvas>
  )
}
