"use client"

import { MORPH_CONFIG } from "@/lib/avatar/defaults"
import { useAvatar } from "@/lib/avatar/store"
import type { Morphs } from "@/lib/avatar/types"
import { cn } from "@/lib/utils"
import { SectionLabel, SliderRow } from "../controls"

const PRESETS: { label: string; morphs: Morphs }[] = [
  { label: "Default", morphs: { faceRound: 30, faceThin: 0, eyeSize: 100, muscle: 100, height: 100 } },
  { label: "Heroic", morphs: { faceRound: 10, faceThin: 30, eyeSize: 85, muscle: 140, height: 112 } },
  { label: "Lean", morphs: { faceRound: 0, faceThin: 70, eyeSize: 95, muscle: 78, height: 108 } },
  { label: "Chibi", morphs: { faceRound: 100, faceThin: 0, eyeSize: 170, muscle: 90, height: 88 } },
]

const same = (a: Morphs, b: Morphs) => (Object.keys(a) as (keyof Morphs)[]).every((k) => a[k] === b[k])

export function MorphPanel() {
  const { design, setMorph, applyMorphs } = useAvatar()

  return (
    <div className="space-y-6">
      <section>
        <SectionLabel>Body Presets</SectionLabel>
        <div className="grid grid-cols-4 gap-1.5">
          {PRESETS.map((p) => {
            const active = same(p.morphs, design.morphs)
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => applyMorphs(p.morphs)}
                aria-pressed={active}
                className={cn(
                  "rounded-md border px-2 py-2 text-[11px] font-medium transition-colors",
                  active
                    ? "border-neon/40 bg-neon/10 text-neon"
                    : "border-white/[0.07] bg-white/[0.02] text-muted-foreground hover:text-foreground",
                )}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <SectionLabel>Blend Shapes</SectionLabel>
        <div className="space-y-2.5">
          {MORPH_CONFIG.map((cfg) => (
            <SliderRow
              key={cfg.key}
              label={cfg.label}
              value={design.morphs[cfg.key]}
              min={cfg.min}
              max={cfg.max}
              unit={cfg.unit}
              hint={cfg.hint}
              onChange={(v) => setMorph(cfg.key, v)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
