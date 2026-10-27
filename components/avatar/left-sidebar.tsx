"use client"

import {
  Camera,
  ChevronRight,
  Eye,
  EyeOff,
  Glasses,
  Lightbulb,
  Lock,
  LockOpen,
  Shield,
  Shirt,
  Sparkles,
  User,
  Bone,
  Boxes,
  Wind,
} from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { ACCESSORY_IDS, PART_META, PART_ORDER } from "@/lib/avatar/defaults"
import { useAvatar } from "@/lib/avatar/store"
import type { AccessoryId, PartCategory, PartId } from "@/lib/avatar/types"
import { cn } from "@/lib/utils"
import { SectionLabel } from "./controls"

const CATEGORY_ICON: Record<PartCategory, typeof User> = {
  Head: User,
  Torso: Shirt,
  Limbs: Bone,
  Armor: Shield,
  Accessories: Sparkles,
}

const ACCESSORY_INFO: Record<AccessoryId, { icon: typeof Glasses; blurb: string }> = {
  glasses: { icon: Glasses, blurb: "Holo-visor with HUD emissive" },
  pauldrons: { icon: Shield, blurb: "Polished alloy shoulder plates" },
  cape: { icon: Wind, blurb: "Animated nano-fiber cloak" },
}

const LAYERS: { id: string; label: string; color: string; parts: PartId[] }[] = [
  { id: "base", label: "Base Mesh", color: "bg-zinc-400", parts: ["torso", "head", "eyes", "arms", "legs"] },
  { id: "armor", label: "Armor", color: "bg-indigo-400", parts: ["armor"] },
  { id: "accessories", label: "Accessories", color: "bg-cyan-400", parts: ["glasses", "pauldrons", "cape"] },
]

const childrenOf = (parent: PartId | null) => PART_ORDER.filter((id) => PART_META[id].parent === parent)

function TreeRow({ id, depth }: { id: PartId; depth: number }) {
  const { design, view, select, toggleVisible, toggleLock } = useAvatar()
  const [open, setOpen] = useState(true)
  const kids = childrenOf(id)
  const meta = PART_META[id]
  const part = design.parts[id]
  const Icon = CATEGORY_ICON[meta.category]
  const selected = view.selected === id
  const mounted = meta.accessory ? design.accessories[meta.accessory] : true

  return (
    <li role="treeitem" aria-selected={selected} aria-expanded={kids.length ? open : undefined}>
      <div
        className={cn(
          "group relative flex h-8 items-center gap-1 rounded-md pr-1 text-xs transition-colors",
          selected ? "bg-neon/10 text-foreground" : "text-foreground/80 hover:bg-white/[0.04]",
          !mounted && "opacity-45",
        )}
        style={{ paddingLeft: depth * 14 + 4 }}
      >
        {selected && <span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-neon" aria-hidden />}
        <button
          type="button"
          aria-label={open ? `Collapse ${meta.label}` : `Expand ${meta.label}`}
          onClick={() => setOpen((o) => !o)}
          className={cn("flex size-4 items-center justify-center text-muted-foreground", !kids.length && "invisible")}
        >
          <ChevronRight className={cn("size-3 transition-transform", open && "rotate-90")} />
        </button>
        <button type="button" onClick={() => select(id)} className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left">
          <Icon className={cn("size-3.5 shrink-0", selected ? "text-neon" : "text-muted-foreground")} aria-hidden />
          <span className={cn("truncate", !part.visible && "line-through decoration-white/30")}>{meta.label}</span>
          {!mounted && (
            <Badge variant="outline" className="h-4 px-1 font-mono text-[9px] text-muted-foreground">
              off
            </Badge>
          )}
        </button>
        <button
          type="button"
          aria-label={part.locked ? `Unlock ${meta.label}` : `Lock ${meta.label}`}
          onClick={() => toggleLock(id)}
          className={cn(
            "flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground",
            part.locked ? "text-amber-400" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
          )}
        >
          {part.locked ? <Lock className="size-3" /> : <LockOpen className="size-3" />}
        </button>
        <button
          type="button"
          aria-label={part.visible ? `Hide ${meta.label}` : `Show ${meta.label}`}
          onClick={() => toggleVisible(id)}
          className="flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground"
        >
          {part.visible ? <Eye className="size-3" /> : <EyeOff className="size-3 text-muted-foreground/50" />}
        </button>
      </div>
      {kids.length > 0 && open && (
        <ul role="group">
          {kids.map((k) => (
            <TreeRow key={k} id={k} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  )
}

function StaticRow({ icon: Icon, label, meta }: { icon: typeof User; label: string; meta: string }) {
  return (
    <li role="treeitem" aria-selected={false} className="flex h-7 items-center gap-2 rounded-md pr-2 pl-[22px] text-xs text-muted-foreground">
      <Icon className="size-3.5" aria-hidden />
      <span className="flex-1 truncate">{label}</span>
      <span className="font-mono text-[10px] text-muted-foreground/60">{meta}</span>
    </li>
  )
}

export function LeftSidebar({ className }: { className?: string }) {
  const { design, toggleAccessory, setPartsVisible } = useAvatar()
  const [rootOpen, setRootOpen] = useState(true)

  return (
    <aside aria-label="Outliner" className={cn("glass-panel flex w-64 shrink-0 flex-col border-r", className)}>
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/[0.07] px-3">
        <span className="text-xs font-semibold tracking-tight">Outliner</span>
        <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground">
          {PART_ORDER.length} nodes
        </Badge>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-6 p-3">
          <section>
            <SectionLabel>Scene Graph</SectionLabel>
            <ul role="tree" aria-label="Scene graph" className="space-y-0.5">
              <li role="treeitem" aria-selected={false} aria-expanded={rootOpen}>
                <button
                  type="button"
                  onClick={() => setRootOpen((o) => !o)}
                  className="flex h-8 w-full items-center gap-1 rounded-md px-1 text-xs font-medium hover:bg-white/[0.04]"
                >
                  <ChevronRight className={cn("size-3 text-muted-foreground transition-transform", rootOpen && "rotate-90")} aria-hidden />
                  <Boxes className="ml-1 size-3.5 text-neon-violet" aria-hidden />
                  <span className="ml-1">Avatar_Root</span>
                </button>
                {rootOpen && (
                  <ul role="group">
                    {childrenOf(null).map((id) => (
                      <TreeRow key={id} id={id} depth={1} />
                    ))}
                  </ul>
                )}
              </li>
              <StaticRow icon={Lightbulb} label="Key Light" meta="dir" />
              <StaticRow icon={Lightbulb} label="Rim Lights" meta="×2" />
              <StaticRow icon={Camera} label="Main Camera" meta="40°" />
            </ul>
          </section>

          <section>
            <SectionLabel>Layers</SectionLabel>
            <ul className="space-y-1">
              {LAYERS.map((layer) => {
                const visibleCount = layer.parts.filter((p) => design.parts[p].visible).length
                const allVisible = visibleCount === layer.parts.length
                return (
                  <li
                    key={layer.id}
                    className="flex items-center gap-2.5 rounded-md border border-white/[0.05] bg-white/[0.02] px-2.5 py-2"
                  >
                    <span className={cn("size-2 rounded-full", layer.color)} aria-hidden />
                    <span className="flex-1 text-xs">{layer.label}</span>
                    <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                      {visibleCount}/{layer.parts.length}
                    </span>
                    <button
                      type="button"
                      aria-label={allVisible ? `Hide ${layer.label} layer` : `Show ${layer.label} layer`}
                      onClick={() => setPartsVisible(layer.parts, !allVisible)}
                      className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    >
                      {allVisible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>

          <section>
            <SectionLabel>Accessories</SectionLabel>
            <ul className="space-y-2">
              {ACCESSORY_IDS.map((id) => {
                const info = ACCESSORY_INFO[id]
                const on = design.accessories[id]
                const switchId = `acc-${id}`
                return (
                  <li
                    key={id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-2.5 transition-colors",
                      on ? "border-neon/25 bg-neon/[0.05]" : "border-white/[0.06] bg-white/[0.02]",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-md",
                        on ? "bg-neon/15 text-neon" : "bg-white/5 text-muted-foreground",
                      )}
                    >
                      <info.icon className="size-4" aria-hidden />
                    </div>
                    <label htmlFor={switchId} className="min-w-0 flex-1 cursor-pointer">
                      <span className="block text-xs font-medium">{PART_META[id].label}</span>
                      <span className="block truncate text-[10px] text-muted-foreground">{info.blurb}</span>
                    </label>
                    <Switch id={switchId} checked={on} onCheckedChange={() => toggleAccessory(id)} />
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      </ScrollArea>
    </aside>
  )
}
