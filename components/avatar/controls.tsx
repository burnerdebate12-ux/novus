"use client"

import { useId, type ReactNode } from "react"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

export function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-1 pb-2">
      <h3 className="font-mono text-[10px] font-medium tracking-[0.18em] text-muted-foreground uppercase">{children}</h3>
      {action}
    </div>
  )
}

export function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  hint,
  format,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  hint?: string
  format?: (v: number) => string
  onChange: (v: number) => void
}) {
  const id = useId()
  return (
    <div className="group space-y-2 rounded-lg px-1 py-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-xs font-medium text-foreground/90">
          {label}
        </label>
        <span className="font-mono text-[11px] text-neon tabular-nums">
          {format ? format(value) : value}
          {unit}
        </span>
      </div>
      <Slider
        id={id}
        value={[value]}
        min={min}
        max={max}
        step={step}
        aria-label={label}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : (v as number))}
        className="[&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-neon-violet [&_[data-slot=slider-range]]:to-neon [&_[data-slot=slider-thumb]]:border-neon"
      />
      {hint && <p className="text-[10px] text-muted-foreground/70">{hint}</p>}
    </div>
  )
}

const SWATCHES = ["#22d3ee", "#6366f1", "#a855f7", "#ec4899", "#f97316", "#facc15", "#10b981", "#e4e4e7", "#27272a", "#d4b5a0"]

export function ColorField({
  label,
  value,
  onChange,
  showSwatches = true,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  showSwatches?: boolean
}) {
  const id = useId()
  return (
    <div className="space-y-2.5">
      <label htmlFor={id} className="text-xs font-medium text-foreground/90">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <div className="relative size-9 shrink-0 overflow-hidden rounded-md ring-1 ring-white/10">
          <input
            id={id}
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute -inset-2 size-[calc(100%+1rem)] cursor-pointer border-0 bg-transparent p-0"
          />
        </div>
        <input
          aria-label={`${label} hex value`}
          value={value.toUpperCase()}
          maxLength={7}
          onChange={(e) => {
            const v = e.target.value
            if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v.toLowerCase())
          }}
          className="h-9 w-full rounded-md border border-input bg-black/30 px-2.5 font-mono text-xs uppercase outline-none focus-visible:border-neon/60 focus-visible:ring-2 focus-visible:ring-neon/20"
        />
      </div>
      {showSwatches && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={`${label} presets`}>
          {SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Use ${c}`}
              onClick={() => onChange(c)}
              className={cn(
                "size-5 rounded-full ring-1 ring-white/10 transition-transform hover:scale-110",
                value.toLowerCase() === c && "ring-2 ring-neon ring-offset-2 ring-offset-zinc-950",
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
