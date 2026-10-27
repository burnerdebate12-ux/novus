"use client"

import {
  Activity,
  Box,
  Grid3x3,
  Move3d,
  MousePointer2,
  RotateCw,
  Scale3d,
  ScanEye,
} from "lucide-react"
import dynamic from "next/dynamic"
import { useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PART_META } from "@/lib/avatar/defaults"
import { useAvatar } from "@/lib/avatar/store"
import type { GizmoMode, LightingPreset } from "@/lib/avatar/types"
import { IconButton } from "./icon-button"

const AvatarScene = dynamic(() => import("./scene/avatar-scene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="size-8 animate-spin rounded-full border-2 border-neon/20 border-t-neon" />
        <span className="font-mono text-[11px] tracking-widest uppercase">Initializing renderer</span>
      </div>
    </div>
  ),
})

const GIZMO_MODES: { id: GizmoMode; label: string; key: string; icon: typeof Move3d }[] = [
  { id: "translate", label: "Move", key: "W", icon: Move3d },
  { id: "rotate", label: "Rotate", key: "E", icon: RotateCw },
  { id: "scale", label: "Scale", key: "R", icon: Scale3d },
]

const LIGHTING_ITEMS: { value: LightingPreset; label: string }[] = [
  { value: "cyber", label: "Cyber Neon" },
  { value: "studio", label: "Studio Soft" },
  { value: "sunset", label: "Synth Sunset" },
]

export function Viewport() {
  const { view, setView, design } = useAvatar()
  const statsRef = useRef<HTMLDivElement>(null)
  const selected = design.parts[view.selected]

  return (
    <section aria-label="Viewport" className="relative min-h-0 flex-1 overflow-hidden bg-[radial-gradient(ellipse_at_50%_40%,oklch(0.22_0.04_280)_0%,oklch(0.12_0.01_270)_60%,oklch(0.09_0.005_270)_100%)]">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="absolute inset-0">
        <AvatarScene statsParent={statsRef} />
      </div>

      <div className="glass-panel absolute top-3 left-3 flex flex-col gap-0.5 rounded-xl border p-1 shadow-xl">
        <IconButton
          side="right"
          label={view.gizmoEnabled ? "Hide gizmo" : "Show gizmo"}
          shortcut="Q"
          active={view.gizmoEnabled}
          onClick={() => setView({ gizmoEnabled: !view.gizmoEnabled })}
        >
          <MousePointer2 />
        </IconButton>
        <div className="mx-1.5 my-1 h-px bg-white/10" />
        {GIZMO_MODES.map((m) => (
          <IconButton
            key={m.id}
            side="right"
            label={m.label}
            shortcut={m.key}
            active={view.gizmoEnabled && view.gizmoMode === m.id}
            onClick={() => setView({ gizmoMode: m.id, gizmoEnabled: true })}
          >
            <m.icon />
          </IconButton>
        ))}
        <div className="mx-1.5 my-1 h-px bg-white/10" />
        <IconButton side="right" label="Toggle grid" shortcut="G" active={view.showGrid} onClick={() => setView({ showGrid: !view.showGrid })}>
          <Grid3x3 />
        </IconButton>
        <IconButton side="right" label="Performance stats" active={view.showStats} onClick={() => setView({ showStats: !view.showStats })}>
          <Activity />
        </IconButton>
        <IconButton side="right" label="Reset camera" shortcut="F" onClick={() => setView({ cameraResetKey: view.cameraResetKey + 1 })}>
          <ScanEye />
        </IconButton>
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-2">
        <Select
          items={LIGHTING_ITEMS}
          value={view.lighting}
          onValueChange={(v) => v && setView({ lighting: v as LightingPreset })}
        >
          <SelectTrigger size="sm" aria-label="Lighting preset" className="glass-panel h-8 min-w-36 border text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LIGHTING_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="glass-panel gap-1.5 border font-mono text-[10px] tracking-wider uppercase">
          <Box className="size-3 text-neon" aria-hidden />
          {PART_META[view.selected].label}
          {!selected.visible && <span className="text-muted-foreground">· hidden</span>}
          {selected.locked && <span className="text-amber-400">· locked</span>}
        </Badge>
        <Badge variant="outline" className="glass-panel hidden border font-mono text-[10px] tracking-wider text-muted-foreground uppercase sm:inline-flex">
          {view.shading} · {view.gizmoEnabled ? view.gizmoMode : "select"}
        </Badge>
      </div>

      <div ref={statsRef} className="absolute right-0 bottom-0" />
    </section>
  )
}
