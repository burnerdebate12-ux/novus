"use client"

import { useHelper } from "@react-three/drei"
import { useFrame, type ThreeEvent } from "@react-three/fiber"
import { useCallback, useRef, type ReactNode } from "react"
import * as THREE from "three"
import { ANIMATIONS, getPose } from "@/lib/avatar/animations"
import { PART_PIVOTS } from "@/lib/avatar/defaults"
import { degToRad, deriveShape } from "@/lib/avatar/derived"
import { useAvatar } from "@/lib/avatar/store"
import type { PartId } from "@/lib/avatar/types"

function AvatarMaterial({ id, doubleSide }: { id: PartId; doubleSide?: boolean }) {
  const { design, view } = useAvatar()
  const m = design.parts[id].material
  const side = doubleSide ? THREE.DoubleSide : THREE.FrontSide

  switch (view.shading) {
    case "wireframe":
      return <meshBasicMaterial key="wire" color={m.color} wireframe side={side} />
    case "xray":
      return (
        <meshPhysicalMaterial
          key="xray"
          color={m.color}
          emissive={m.color}
          emissiveIntensity={0.35}
          transparent
          opacity={0.28}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      )
    case "shaded":
      return <meshStandardMaterial key="shaded" color={m.color} roughness={0.9} metalness={0} flatShading side={side} />
    default:
      return (
        <meshPhysicalMaterial
          key="lit"
          color={m.color}
          metalness={m.metalness}
          roughness={m.roughness}
          clearcoat={m.clearcoat}
          clearcoatRoughness={0.15}
          emissive={m.emissive}
          emissiveIntensity={m.emissiveIntensity}
          side={side}
        />
      )
  }
}

function PartNode({ id, children }: { id: PartId; children: ReactNode }) {
  const { design, view, select, sceneRefs } = useAvatar()
  const part = design.parts[id]
  const pivot = PART_PIVOTS[id]
  const groupRef = useRef<THREE.Group>(null)

  const setRef = useCallback(
    (node: THREE.Group | null) => {
      groupRef.current = node
      if (node) {
        node.name = id
        sceneRefs.current.parts[id] = node
      } else {
        delete sceneRefs.current.parts[id]
      }
    },
    [id, sceneRefs],
  )

  useHelper(view.selected === id && part.visible ? groupRef : null, THREE.BoxHelper, "#22d3ee")

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    select(id)
  }

  return (
    <group
      ref={setRef}
      position={[pivot[0] + part.position[0], pivot[1] + part.position[1], pivot[2] + part.position[2]]}
      rotation={[degToRad(part.rotation[0]), degToRad(part.rotation[1]), degToRad(part.rotation[2])]}
      scale={part.scale}
      visible={part.visible}
      onClick={handleClick}
    >
      {children}
    </group>
  )
}

export function Character() {
  const { design, anim, setAnim, timeRef, sceneRefs } = useAvatar()
  const shape = deriveShape(design.morphs)
  const m = shape.muscle

  const rootRef = useRef<THREE.Group>(null)
  const spineRef = useRef<THREE.Group>(null)
  const headRef = useRef<THREE.Group>(null)
  const armLRef = useRef<THREE.Group>(null)
  const armRRef = useRef<THREE.Group>(null)
  const legLRef = useRef<THREE.Group>(null)
  const legRRef = useRef<THREE.Group>(null)
  const capeRef = useRef<THREE.Group>(null)
  const stoppedRef = useRef(false)

  const setAvatarRef = useCallback(
    (node: THREE.Group | null) => {
      sceneRefs.current.avatar = node
    },
    [sceneRefs],
  )

  useFrame((_, delta) => {
    const { duration } = ANIMATIONS[anim.preset]
    if (anim.playing) {
      timeRef.current += Math.min(delta, 0.1) * anim.speed
      if (timeRef.current >= duration) {
        if (anim.loop) {
          timeRef.current %= duration
        } else {
          timeRef.current = duration
          if (!stoppedRef.current) {
            stoppedRef.current = true
            setAnim({ playing: false })
          }
        }
      }
    }
    if (anim.playing && timeRef.current < duration) stoppedRef.current = false

    const pose = getPose(anim.preset, Math.min(timeRef.current / duration, 0.9999))
    rootRef.current?.position.set(0, pose.rootY, 0)
    rootRef.current?.rotation.set(0, pose.rootRotY, 0)
    spineRef.current?.rotation.set(pose.spineX, 0, pose.spineZ)
    headRef.current?.rotation.set(pose.headX, pose.headY, 0)
    armLRef.current?.rotation.set(pose.armLX, 0, pose.armLZ)
    armRRef.current?.rotation.set(pose.armRX, 0, pose.armRZ)
    legLRef.current?.rotation.set(pose.legLX, 0, 0)
    legRRef.current?.rotation.set(pose.legRX, 0, 0)
    capeRef.current?.rotation.set(pose.capeX, 0, 0)
  })

  const legGirth = 0.85 + 0.15 * m
  const { accessories } = design

  return (
    <group ref={setAvatarRef} name="Avatar_Root">
      <group ref={rootRef}>
        <group scale={shape.bodyScale}>
          <PartNode id="legs">
            {[
              { x: -0.13, ref: legLRef },
              { x: 0.13, ref: legRRef },
            ].map(({ x, ref }) => (
              <group key={x} ref={ref} position={[x, 0, 0]}>
                <mesh position={[0, -0.2, 0]} scale={[legGirth, 1, legGirth]} castShadow>
                  <capsuleGeometry args={[0.085, 0.24, 8, 16]} />
                  <AvatarMaterial id="legs" />
                </mesh>
                <mesh position={[0, -0.56, 0]} castShadow>
                  <capsuleGeometry args={[0.072, 0.22, 8, 16]} />
                  <AvatarMaterial id="legs" />
                </mesh>
                <mesh position={[0, -0.84, 0.04]} castShadow>
                  <boxGeometry args={[0.17, 0.12, 0.28]} />
                  <AvatarMaterial id="armor" />
                </mesh>
              </group>
            ))}
          </PartNode>

          <PartNode id="torso">
            <group ref={spineRef}>
              <mesh position={[0, 0.3, 0]} scale={[m, 1, m * 0.8]} castShadow>
                <capsuleGeometry args={[0.22, 0.32, 12, 24]} />
                <AvatarMaterial id="torso" />
              </mesh>
              <mesh castShadow>
                <boxGeometry args={[0.36, 0.14, 0.22]} />
                <AvatarMaterial id="legs" />
              </mesh>

              <PartNode id="head">
                <group ref={headRef}>
                  <mesh position={[0, 0.04, 0]} castShadow>
                    <cylinderGeometry args={[0.07, 0.08, 0.12, 16]} />
                    <AvatarMaterial id="head" />
                  </mesh>
                  <mesh position={[0, 0.22, 0]} scale={shape.headScale} castShadow>
                    <sphereGeometry args={[0.2, 48, 48]} />
                    <AvatarMaterial id="head" />
                  </mesh>
                  <PartNode id="eyes">
                    {[-0.075, 0.075].map((x) => (
                      <mesh key={x} position={[x * shape.headScale[0], 0, (shape.headScale[2] - 1) * 0.2]}>
                        <sphereGeometry args={[shape.eyeRadius, 24, 24]} />
                        <AvatarMaterial id="eyes" />
                      </mesh>
                    ))}
                  </PartNode>
                  {accessories.glasses && (
                    <PartNode id="glasses">
                      <mesh position={[0, 0, (shape.headScale[2] - 1) * 0.2]} scale={[shape.headScale[0], 1, 1]} castShadow>
                        <boxGeometry args={[0.34, 0.07, 0.05]} />
                        <AvatarMaterial id="glasses" />
                      </mesh>
                    </PartNode>
                  )}
                </group>
              </PartNode>

              <PartNode id="armor">
                <mesh scale={[m, 1, m]} castShadow>
                  <boxGeometry args={[0.42, 0.34, 0.12]} />
                  <AvatarMaterial id="armor" />
                </mesh>
                <mesh position={[0, 0.02, 0.065]}>
                  <boxGeometry args={[0.08, 0.08, 0.01]} />
                  <AvatarMaterial id="eyes" />
                </mesh>
              </PartNode>

              {accessories.pauldrons && (
                <PartNode id="pauldrons">
                  {[-1, 1].map((side) => (
                    <mesh key={side} position={[side * (shape.shoulderX + 0.02), 0, 0]} scale={[m, 0.75, m]} castShadow>
                      <sphereGeometry args={[0.13, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                      <AvatarMaterial id="pauldrons" doubleSide />
                    </mesh>
                  ))}
                </PartNode>
              )}

              {accessories.cape && (
                <PartNode id="cape">
                  <group ref={capeRef}>
                    <mesh position={[0, -0.55, 0]} castShadow>
                      <planeGeometry args={[0.6, 1.1, 8, 16]} />
                      <AvatarMaterial id="cape" doubleSide />
                    </mesh>
                  </group>
                </PartNode>
              )}

              <PartNode id="arms">
                {[
                  { side: -1, ref: armLRef },
                  { side: 1, ref: armRRef },
                ].map(({ side, ref }) => (
                  <group key={side} ref={ref} position={[side * shape.shoulderX, 0, 0]}>
                    <mesh position={[0, -0.18, 0]} scale={[m, 1, m]} castShadow>
                      <capsuleGeometry args={[0.07, 0.22, 8, 16]} />
                      <AvatarMaterial id="arms" />
                    </mesh>
                    <mesh position={[0, -0.47, 0]} scale={[m, 1, m]} castShadow>
                      <capsuleGeometry args={[0.06, 0.2, 8, 16]} />
                      <AvatarMaterial id="arms" />
                    </mesh>
                    <mesh position={[0, -0.66, 0]} castShadow>
                      <sphereGeometry args={[0.065, 24, 24]} />
                      <AvatarMaterial id="head" />
                    </mesh>
                  </group>
                ))}
              </PartNode>
            </group>
          </PartNode>
        </group>
      </group>
    </group>
  )
}
