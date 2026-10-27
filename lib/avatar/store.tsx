"use client"

import { createContext, useCallback, useContext, useMemo, useReducer, useRef, type ReactNode } from "react"
import type { Group, Object3D } from "three"
import { createDefaultDesign } from "./defaults"
import type {
  AccessoryId,
  AnimState,
  Design,
  Morphs,
  PartId,
  PartMaterial,
  Vec3,
  ViewState,
} from "./types"

const HISTORY_LIMIT = 100
const COALESCE_MS = 600

interface History {
  past: Design[]
  present: Design
  future: Design[]
  lastKey: string | null
  lastAt: number
}

interface StoreState {
  history: History
  view: ViewState
  anim: AnimState
  projectName: string
}

type Action =
  | { type: "design"; key: string; update: (d: Design) => Design; at: number }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset" }
  | { type: "view"; patch: Partial<ViewState> }
  | { type: "anim"; patch: Partial<AnimState> }
  | { type: "projectName"; name: string }

function reducer(state: StoreState, action: Action): StoreState {
  const h = state.history
  switch (action.type) {
    case "design": {
      const next = action.update(h.present)
      if (next === h.present) return state
      const coalesce = h.lastKey === action.key && action.at - h.lastAt < COALESCE_MS
      return {
        ...state,
        history: {
          past: coalesce ? h.past : [...h.past, h.present].slice(-HISTORY_LIMIT),
          present: next,
          future: [],
          lastKey: action.key,
          lastAt: action.at,
        },
      }
    }
    case "undo": {
      if (!h.past.length) return state
      const previous = h.past[h.past.length - 1]
      return {
        ...state,
        history: { past: h.past.slice(0, -1), present: previous, future: [h.present, ...h.future], lastKey: null, lastAt: 0 },
      }
    }
    case "redo": {
      if (!h.future.length) return state
      const [next, ...rest] = h.future
      return {
        ...state,
        history: { past: [...h.past, h.present], present: next, future: rest, lastKey: null, lastAt: 0 },
      }
    }
    case "reset":
      return {
        ...state,
        history: { past: [...h.past, h.present], present: createDefaultDesign(), future: [], lastKey: null, lastAt: 0 },
      }
    case "view":
      return { ...state, view: { ...state.view, ...action.patch } }
    case "anim":
      return { ...state, anim: { ...state.anim, ...action.patch } }
    case "projectName":
      return { ...state, projectName: action.name }
  }
}

const initialState: StoreState = {
  history: { past: [], present: createDefaultDesign(), future: [], lastKey: null, lastAt: 0 },
  view: {
    selected: "head",
    shading: "lit",
    showGrid: true,
    showStats: false,
    gizmoEnabled: true,
    gizmoMode: "translate",
    lighting: "cyber",
    cameraResetKey: 0,
  },
  anim: { preset: "idle", playing: true, speed: 1, loop: true },
  projectName: "Neon Ronin",
}

export interface SceneRefs {
  avatar: Group | null
  parts: Partial<Record<PartId, Object3D>>
}

function useAvatarValue() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const timeRef = useRef(0)
  const sceneRefs = useRef<SceneRefs>({ avatar: null, parts: {} })

  const updateDesign = useCallback(
    (key: string, update: (d: Design) => Design) => dispatch({ type: "design", key, update, at: Date.now() }),
    [],
  )

  const actions = useMemo(
    () => ({
      undo: () => dispatch({ type: "undo" }),
      redo: () => dispatch({ type: "redo" }),
      resetDesign: () => dispatch({ type: "reset" }),
      setView: (patch: Partial<ViewState>) => dispatch({ type: "view", patch }),
      setAnim: (patch: Partial<AnimState>) => dispatch({ type: "anim", patch }),
      setProjectName: (name: string) => dispatch({ type: "projectName", name }),
      select: (id: PartId) => dispatch({ type: "view", patch: { selected: id } }),
      setMorph: (key: keyof Morphs, value: number) =>
        updateDesign(`morph:${key}`, (d) => ({ ...d, morphs: { ...d.morphs, [key]: value } })),
      applyMorphs: (morphs: Morphs) => updateDesign(`morph-preset:${Date.now()}`, (d) => ({ ...d, morphs })),
      setMaterial: (id: PartId, patch: Partial<PartMaterial>) =>
        updateDesign(`mat:${id}:${Object.keys(patch).join(",")}`, (d) => ({
          ...d,
          parts: { ...d.parts, [id]: { ...d.parts[id], material: { ...d.parts[id].material, ...patch } } },
        })),
      setTransform: (id: PartId, field: "position" | "rotation" | "scale", value: Vec3) =>
        updateDesign(`xf:${id}:${field}`, (d) => ({
          ...d,
          parts: { ...d.parts, [id]: { ...d.parts[id], [field]: value } },
        })),
      commitTransform: (id: PartId, position: Vec3, rotation: Vec3, scale: Vec3) =>
        updateDesign(`gizmo:${id}:${Date.now()}`, (d) => ({
          ...d,
          parts: { ...d.parts, [id]: { ...d.parts[id], position, rotation, scale } },
        })),
      resetTransform: (id: PartId) =>
        updateDesign(`xf-reset:${id}`, (d) => ({
          ...d,
          parts: { ...d.parts, [id]: { ...d.parts[id], position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] } },
        })),
      toggleVisible: (id: PartId) =>
        updateDesign(`vis:${id}:${Date.now()}`, (d) => ({
          ...d,
          parts: { ...d.parts, [id]: { ...d.parts[id], visible: !d.parts[id].visible } },
        })),
      setPartsVisible: (ids: PartId[], visible: boolean) =>
        updateDesign(`layer:${ids.join(",")}:${Date.now()}`, (d) => {
          const parts = { ...d.parts }
          for (const id of ids) parts[id] = { ...parts[id], visible }
          return { ...d, parts }
        }),
      toggleLock: (id: PartId) =>
        updateDesign(`lock:${id}:${Date.now()}`, (d) => ({
          ...d,
          parts: { ...d.parts, [id]: { ...d.parts[id], locked: !d.parts[id].locked } },
        })),
      toggleAccessory: (id: AccessoryId) =>
        updateDesign(`acc:${id}:${Date.now()}`, (d) => ({
          ...d,
          accessories: { ...d.accessories, [id]: !d.accessories[id] },
        })),
    }),
    [updateDesign],
  )

  return {
    design: state.history.present,
    canUndo: state.history.past.length > 0,
    canRedo: state.history.future.length > 0,
    undoCount: state.history.past.length,
    redoCount: state.history.future.length,
    view: state.view,
    anim: state.anim,
    projectName: state.projectName,
    timeRef,
    sceneRefs,
    ...actions,
  }
}

export type AvatarStore = ReturnType<typeof useAvatarValue>

const AvatarContext = createContext<AvatarStore | null>(null)

export function AvatarProvider({ children }: { children: ReactNode }) {
  const value = useAvatarValue()
  return <AvatarContext.Provider value={value}>{children}</AvatarContext.Provider>
}

export function useAvatar() {
  const ctx = useContext(AvatarContext)
  if (!ctx) throw new Error("useAvatar must be used within AvatarProvider")
  return ctx
}
