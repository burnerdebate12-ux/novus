"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useAvatar } from "@/lib/avatar/store"
import { ColorField, SliderRow } from "../controls"

const MATERIAL_PRESETS = [
  { label: "Chrome", patch: { metalness: 1, roughness: 0.08, clearcoat: 1 } },
  { label: "Matte", patch: { metalness: 0, roughness: 0.9, clearcoat: 0 } },
  { label: "Carbon", patch: { metalness: 0.5, roughness: 0.35, clearcoat: 0.9 } },
  { label: "Rubber", patch: { metalness: 0, roughness: 0.7, clearcoat: 0.2 } },
]

const pct = (v: number) => `${Math.round(v * 100)}`

export function MaterialPanel() {
  const { design, view, setMaterial } = useAvatar()
  const id = view.selected
  const m = design.parts[id].material

  return (
    <div className="space-y-4">
      <div
        className="relative h-24 overflow-hidden rounded-lg border border-white/[0.07]"
        style={{
          background: `radial-gradient(circle at 35% 30%, color-mix(in oklab, ${m.color} ${100 - m.roughness * 40}%, white) 0%, ${m.color} 35%, color-mix(in oklab, ${m.color} 45%, black) 100%)`,
          boxShadow: m.emissiveIntensity > 0 ? `inset 0 0 40px -6px ${m.emissive}` : undefined,
        }}
        aria-hidden
      >
        <div className="absolute right-2 bottom-2 rounded bg-black/50 px-1.5 py-0.5 font-mono text-[10px] text-white/80 backdrop-blur">
          M {pct(m.metalness)} · R {pct(m.roughness)} · C {pct(m.clearcoat)}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {MATERIAL_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setMaterial(id, p.patch)}
            className="rounded-md border border-white/[0.07] bg-white/[0.02] py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-neon/30 hover:text-foreground"
          >
            {p.label}
          </button>
        ))}
      </div>

      <Accordion multiple defaultValue={["color", "physical", "emission"]} className="rounded-lg border border-white/[0.07]">
        <AccordionItem value="color" className="border-white/[0.07] px-3">
          <AccordionTrigger className="text-xs">Base Color</AccordionTrigger>
          <AccordionContent>
            <ColorField label="Albedo" value={m.color} onChange={(color) => setMaterial(id, { color })} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="physical" className="border-white/[0.07] px-3">
          <AccordionTrigger className="text-xs">Physical Properties</AccordionTrigger>
          <AccordionContent className="space-y-1">
            <SliderRow label="Metalness" value={m.metalness} min={0} max={1} step={0.01} format={pct} unit="%" onChange={(metalness) => setMaterial(id, { metalness })} />
            <SliderRow label="Roughness" value={m.roughness} min={0} max={1} step={0.01} format={pct} unit="%" onChange={(roughness) => setMaterial(id, { roughness })} />
            <SliderRow label="Clearcoat" value={m.clearcoat} min={0} max={1} step={0.01} format={pct} unit="%" onChange={(clearcoat) => setMaterial(id, { clearcoat })} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="emission" className="border-white/[0.07] px-3">
          <AccordionTrigger className="text-xs">Emission</AccordionTrigger>
          <AccordionContent className="space-y-3">
            <ColorField label="Emissive Color" value={m.emissive} showSwatches={false} onChange={(emissive) => setMaterial(id, { emissive })} />
            <SliderRow
              label="Intensity"
              value={m.emissiveIntensity}
              min={0}
              max={4}
              step={0.05}
              format={(v) => v.toFixed(2)}
              onChange={(emissiveIntensity) => setMaterial(id, { emissiveIntensity })}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
