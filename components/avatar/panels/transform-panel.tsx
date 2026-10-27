"use client"

import { Lock, LockOpen, Move3d, RotateCcw, RotateCw, Scale3d } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useAvatar } from "@/lib/avatar/store"
import type { GizmoMode, Vec3 } from "@/lib/avatar/types"
import { cn } from "@/lib/utils"
import { SectionLabel } from "../controls"

const AXES = [
  { label: "X", color: "text-rose-400", bar: "bg-rose-400" },
  { label: "Y", color: "text-emerald-400", bar: "bg-emerald-400" },
  { label: "Z", color: "text-sky-400", bar: "bg-sky-400" },
]

function AxisInput({
  axis,
  value,
  step,
  disabled,
  onCommit,
}: {
  axis: (typeof AXES)[number]
  value: number
  step: number
  disabled: boolean
  onCommit: (v: number) => void
}) {
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(Number(value.toFixed(3)))), [value])

  return (
    <label className="relative flex h-8 items-center overflow-hidden rounded-md border border-input bg-black/30 focus-within:border-neon/50">
      <span className={cn("absolute inset-y-1.5 left-0 w-0.5 rounded-full", axis.bar)} aria-hidden />
      <span className={cn("pl-2 font-mono text-[10px] font-semibold", axis.color)}>{axis.label}</span>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        disabled={disabled}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value)
          const n = Number.parseFloat(e.target.value)
          if (Number.isFinite(n)) onCommit(n)
        }}
        className="h-full w-full min-w-0 bg-transparent px-1.5 text-right font-mono text-[11px] tabular-nums outline-none disabled:opacity-50 [&::-webkit-inner-spin-button]:appearance-none"
      />
    </label>
  )
}

function VectorRow({
  label,
  value,
  step,
  unit,
  disabled,
  onChange,
}: {
  label: string
  value: Vec3
  step: number
  unit: string
  disabled: boolean
  onChange: (v: Vec3) => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between px-0.5">
        <span className="text-xs font-medium">{label}</span>
        <span className="font-mono text-[10px] text-muted-foreground">{unit}</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {AXES.map((axis, i) => (
          <AxisInput
            key={axis.label}
            axis={axis}
            value={value[i]}
            step={step}
            disabled={disabled}
            onCommit={(n) => {
              const next = [...value] as Vec3
              next[i] = n
              onChange(next)
            }}
          />
        ))}
      </div>
    </div>
  )
}

const MODES: { id: GizmoMode; label: string; icon: typeof Move3d }[] = [
  { id: "translate", label: "Move", icon: Move3d },
  { id: "rotate", label: "Rotate", icon: RotateCw },
  { id: "scale", label: "Scale", icon: Scale3d },
]

export function TransformPanel() {
  const { design, view, setView, setTransform, resetTransform, toggleLock } = useAvatar()
  const id = view.selected
  const part = design.parts[id]

  return (
    <div className="space-y-6">
      <section>
        <SectionLabel>Gizmo</SectionLabel>
        <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Gizmo mode">
          {MODES.map((m) => {
            const active = view.gizmoEnabled && view.gizmoMode === m.id
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setView({ gizmoMode: m.id, gizmoEnabled: true })}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-md border py-2 text-[11px] transition-colors",
                  active
                    ? "border-neon/40 bg-neon/10 text-neon"
                    : "border-white/[0.07] bg-white/[0.02] text-muted-foreground hover:text-foreground",
                )}
              >
                <m.icon className="size-4" aria-hidden />
                {m.label}
              </button>
            )
          })}
        </div>
      </section>

      <section className="space-y-4">
        <SectionLabel
          action={
            part.locked ? (
              <span className="flex items-center gap-1 font-mono text-[10px] text-amber-400">
                <Lock className="size-3" aria-hidden /> locked
              </span>
            ) : null
          }
        >
          Local Transform
        </SectionLabel>
        <VectorRow label="Position" unit="m" step={0.01} value={part.position} disabled={part.locked} onChange={(v) => setTransform(id, "position", v)} />
        <VectorRow label="Rotation" unit="deg" step={1} value={part.rotation} disabled={part.locked} onChange={(v) => setTransform(id, "rotation", v)} />
        <VectorRow label="Scale" unit="×" step={0.05} value={part.scale} disabled={part.locked} onChange={(v) => setTransform(id, "scale", v)} />
      </section>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={() => resetTransform(id)} disabled={part.locked}>
          <RotateCcw /> Reset
        </Button>
        <Button variant="outline" size="sm" onClick={() => toggleLock(id)}>
          {part.locked ? <LockOpen /> : <Lock />}
          {part.locked ? "Unlock" : "Lock"}
        </Button>
      </div>
    </div>
  )
}
