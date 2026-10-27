"use client"

import { Code2, Move3d, Palette, SlidersHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PART_META, PART_ORDER } from "@/lib/avatar/defaults"
import { useAvatar } from "@/lib/avatar/store"
import type { PartCategory, PartId } from "@/lib/avatar/types"
import { cn } from "@/lib/utils"
import { ExportPanel } from "./panels/export-panel"
import { MaterialPanel } from "./panels/material-panel"
import { MorphPanel } from "./panels/morph-panel"
import { TransformPanel } from "./panels/transform-panel"

const CATEGORIES: PartCategory[] = ["Head", "Torso", "Limbs", "Armor", "Accessories"]
const PART_ITEMS = PART_ORDER.map((id) => ({ value: id, label: PART_META[id].label }))

const TABS = [
  { id: "morph", label: "Morph", icon: SlidersHorizontal },
  { id: "material", label: "Material", icon: Palette },
  { id: "transform", label: "Transform", icon: Move3d },
  { id: "export", label: "Export", icon: Code2 },
] as const

export function RightSidebar({ className, onPublish }: { className?: string; onPublish: () => void }) {
  const { design, view, select } = useAvatar()
  const selected = design.parts[view.selected]

  return (
    <aside aria-label="Inspector" className={cn("glass-panel flex w-80 shrink-0 flex-col border-l", className)}>
      <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.07] p-3">
        <span
          className="size-3 shrink-0 rounded-full ring-2 ring-white/10"
          style={{ backgroundColor: selected.material.color }}
          aria-hidden
        />
        <Select items={PART_ITEMS} value={view.selected} onValueChange={(v) => v && select(v as PartId)}>
          <SelectTrigger size="sm" aria-label="Selected part" className="h-8 flex-1 border-white/10 bg-black/30 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectGroup key={cat}>
                <SelectLabel>{cat}</SelectLabel>
                {PART_ORDER.filter((id) => PART_META[id].category === cat).map((id) => (
                  <SelectItem key={id} value={id}>
                    {PART_META[id].label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground">
          {PART_META[view.selected].category}
        </Badge>
      </div>

      <Tabs defaultValue="morph" className="min-h-0 flex-1 gap-0">
        <div className="shrink-0 border-b border-white/[0.07] px-3 py-2">
          <TabsList className="grid h-9 w-full grid-cols-4 bg-black/30">
            {TABS.map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="gap-1 px-1 text-[11px] data-active:bg-neon/15 data-active:text-neon"
              >
                <t.icon className="size-3.5" aria-hidden />
                <span className="hidden xl:inline">{t.label}</span>
                <span className="sr-only xl:hidden">{t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <div className="p-3">
            <TabsContent value="morph">
              <MorphPanel />
            </TabsContent>
            <TabsContent value="material">
              <MaterialPanel />
            </TabsContent>
            <TabsContent value="transform">
              <TransformPanel />
            </TabsContent>
            <TabsContent value="export">
              <ExportPanel onPublish={onPublish} />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </aside>
  )
}
