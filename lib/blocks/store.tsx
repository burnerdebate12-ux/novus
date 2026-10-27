"use client"

import { createContext, useCallback, useContext, useMemo, useReducer, useRef, type ReactNode } from "react"
import type { Mesh } from "three"
import type { GizmoMode, Vec3 } from "@/lib/avatar/types"
import { applyOps, createBlock } from "./defaults"
import type { Block, BlockOp, BlockShape } from "./types"

const HISTORY_LIMIT = 100
const COALESCE_MS = 600

interface State {
  past: Block[][]
  present: Block[]
  future: Block[][]
  lastKey: string | null
  lastAt: number
  selectedId: string | null
  gizmoMode: GizmoMode
  name: string
}

type Action =
  | { type: "edit"; key: string; update: (b: Block[]) => Block[]; at: number; select?: string | null }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "select"; id: string | null }
  | { type: "gizmo"; mode: GizmoMode }
  | { type: "name"; name: string }

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "edit": {
      const next = a.update(s.present)
      if (next === s.present) return s
      const coalesce = s.lastKey === a.key && a.at - s.lastAt < COALESCE_MS
      const selectedId = a.select !== undefined ? a.select : next.some((b) => b.id === s.selectedId) ? s.selectedId : null
      return {
        ...s,
        past: coalesce ? s.past : [...s.past, s.present].slice(-HISTORY_LIMIT),
        present: next,
        future: [],
        lastKey: a.key,
        lastAt: a.at,
        selectedId,
      }
    }
    case "undo": {
      if (!s.past.length) return s
      return { ...s, past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future], lastKey: null }
    }
    case "redo": {
      if (!s.future.length) return s
      const [next, ...rest] = s.future
      return { ...s, past: [...s.past, s.present], present: next, future: rest, lastKey: null }
    }
    case "select":
      return { ...s, selectedId: a.id }
    case "gizmo":
      return { ...s, gizmoMode: a.mode }
    case "name":
      return { ...s, name: a.name }
  }
}

function useBlocksValue(initialBlocks: Block[], initialName: string) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    past: [],
    present: initialBlocks,
    future: [],
    lastKey: null,
    lastAt: 0,
    selectedId: initialBlocks[0]?.id ?? null,
    gizmoMode: "translate" as GizmoMode,
    name: initialName,
  }))
  const meshes = useRef<Record<string, Mesh | null>>({})

  const edit = useCallback(
    (key: string, update: (b: Block[]) => Block[], select?: string | null) =>
      dispatch({ type: "edit", key, update, at: Date.now(), select }),
    [],
  )

  const actions = useMemo(
    () => ({
      undo: () => dispatch({ type: "undo" }),
      redo: () => dispatch({ type: "redo" }),
      select: (id: string | null) => dispatch({ type: "select", id }),
      setGizmoMode: (mode: GizmoMode) => dispatch({ type: "gizmo", mode }),
      setName: (name: string) => dispatch({ type: "name", name }),
      addBlock: (shape: BlockShape) => {
        const block = createBlock(shape, { position: [(Math.random() - 0.5) * 0.6, 0.5, (Math.random() - 0.5) * 0.6] })
        edit(`add:${block.id}`, (b) => [...b, block], block.id)
      },
      updateBlock: (id: string, patch: Partial<Omit<Block, "id">>) =>
        edit(`upd:${id}:${Object.keys(patch).join(",")}`, (b) => b.map((x) => (x.id === id ? { ...x, ...patch } : x))),
      commitTransform: (id: string, position: Vec3, rotation: Vec3, scale: Vec3) =>
        edit(`gizmo:${id}:${Date.now()}`, (b) => b.map((x) => (x.id === id ? { ...x, position, rotation, scale } : x))),
      removeBlock: (id: string) => edit(`rm:${id}`, (b) => b.filter((x) => x.id !== id)),
      duplicateBlock: (id: string) => {
        const src = state.present.find((x) => x.id === id)
        if (!src) return
        const { id: _id, ...rest } = src
        const copy = createBlock(src.shape, {
          ...rest,
          name: `${src.name} copy`,
          position: [src.position[0] + 0.25, src.position[1], src.position[2]],
        })
        edit(`dup:${copy.id}`, (b) => [...b, copy], copy.id)
      },
      applyOps: (ops: BlockOp[]) => edit(`ops:${Date.now()}`, (b) => applyOps(b, ops)),
      replaceAll: (blocks: Block[]) => edit(`replace:${Date.now()}`, () => blocks, blocks[0]?.id ?? null),
    }),
    [edit, state.present],
  )

  return {
    blocks: state.present,
    selected: state.present.find((b) => b.id === state.selectedId) ?? null,
    selectedId: state.selectedId,
    gizmoMode: state.gizmoMode,
    name: state.name,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    meshes,
    ...actions,
  }
}

export type BlocksStore = ReturnType<typeof useBlocksValue>

const BlocksContext = createContext<BlocksStore | null>(null)

export function BlocksProvider({
  initialBlocks,
  initialName,
  children,
}: {
  initialBlocks: Block[]
  initialName: string
  children: ReactNode
}) {
  const value = useBlocksValue(initialBlocks, initialName)
  return <BlocksContext.Provider value={value}>{children}</BlocksContext.Provider>
}

export function useBlocks() {
  const ctx = useContext(BlocksContext)
  if (!ctx) throw new Error("useBlocks must be used within BlocksProvider")
  return ctx
}
