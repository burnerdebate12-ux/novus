"use client"

import { ChevronDown, Pause, Play, Repeat, SkipBack, SkipForward } from "lucide-react"
import { useEffect, useRef, useState, type PointerEvent } from "react"
import { ANIMATIONS, FPS } from "@/lib/avatar/animations"
import { useAvatar } from "@/lib/avatar/store"
import type { AnimationPreset } from "@/lib/avatar/types"
import { cn } from "@/lib/utils"
import { IconButton } from "./icon-button"

const PRESETS = Object.keys(ANIMATIONS) as AnimationPreset[]
const SPEEDS = [0.25, 0.5, 1, 1.5, 2]

export function Timeline() {
  const { anim, setAnim, timeRef } = useAvatar()
  const [collapsed, setCollapsed] = useState(false)
  const clip = ANIMATIONS[anim.preset]
  const totalFrames = Math.round(clip.duration * FPS)

  const playheadRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLSpanElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const t = Math.min(timeRef.current / clip.duration, 1)
      if (playheadRef.current) playheadRef.current.style.left = `${t * 100}%`
      if (frameRef.current) frameRef.current.textContent = String(Math.round(t * totalFrames)).padStart(3, "0")
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [clip.duration, totalFrames, timeRef])

  const scrub = (e: PointerEvent<HTMLDivElement>) => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return
    const t = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 0.9999)
    timeRef.current = t * clip.duration
  }

  const choose = (preset: AnimationPreset) => {
    timeRef.current = 0
    setAnim({ preset, playing: true })
  }

  const ticks = Array.from({ length: Math.floor(totalFrames / 5) + 1 }, (_, i) => i * 5)

  return (
    <section aria-label="Animation timeline" className="glass-panel shrink-0 border-t">
      <div className="flex flex-wrap items-center gap-2 px-2 py-1.5 sm:px-3">
        <div className="flex items-center gap-0.5">
          <IconButton side="top" label="Jump to start" onClick={() => (timeRef.current = 0)}>
            <SkipBack />
          </IconButton>
          <IconButton
            side="top"
            label={anim.playing ? "Pause" : "Play"}
            shortcut="Space"
            active={anim.playing}
            onClick={() => {
              if (!anim.playing && timeRef.current >= clip.duration) timeRef.current = 0
              setAnim({ playing: !anim.playing })
            }}
          >
            {anim.playing ? <Pause /> : <Play />}
          </IconButton>
          <IconButton side="top" label="Jump to end" onClick={() => (timeRef.current = clip.duration * 0.9999)}>
            <SkipForward />
          </IconButton>
          <IconButton side="top" label="Loop" active={anim.loop} onClick={() => setAnim({ loop: !anim.loop })}>
            <Repeat />
          </IconButton>
        </div>

        <div className="font-mono text-[11px] text-muted-foreground tabular-nums">
          <span ref={frameRef} className="text-neon">
            000
          </span>
          <span> / {String(totalFrames).padStart(3, "0")}</span>
        </div>

        <div role="radiogroup" aria-label="Animation preset" className="flex flex-wrap items-center gap-1">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={anim.preset === p}
              onClick={() => choose(p)}
              className={cn(
                "h-7 rounded-md border px-2.5 text-[11px] font-medium transition-colors",
                anim.preset === p
                  ? "border-neon/40 bg-neon/10 text-neon"
                  : "border-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground",
              )}
            >
              {ANIMATIONS[p].label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <label htmlFor="anim-speed" className="sr-only">
            Playback speed
          </label>
          <select
            id="anim-speed"
            value={anim.speed}
            onChange={(e) => setAnim({ speed: Number(e.target.value) })}
            className="h-7 rounded-md border border-white/10 bg-black/30 px-1.5 font-mono text-[11px] outline-none focus-visible:border-neon/50"
          >
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}×
              </option>
            ))}
          </select>
          <IconButton side="top" label={collapsed ? "Expand timeline" : "Collapse timeline"} onClick={() => setCollapsed((c) => !c)}>
            <ChevronDown className={cn("transition-transform", collapsed && "rotate-180")} />
          </IconButton>
        </div>
      </div>

      {!collapsed && (
        <div className="flex border-t border-white/[0.05]">
          <ul className="w-20 shrink-0 border-r border-white/[0.05] pt-5 sm:w-24" aria-hidden>
            {Object.keys(clip.tracks).map((name) => (
              <li key={name} className="flex h-6 items-center px-3 font-mono text-[10px] text-muted-foreground">
                {name}
              </li>
            ))}
          </ul>
          <div
            ref={trackRef}
            role="slider"
            tabIndex={0}
            aria-label="Scrub timeline"
            aria-valuemin={0}
            aria-valuemax={totalFrames}
            aria-valuenow={0}
            className="relative min-w-0 flex-1 cursor-ew-resize touch-none pb-1 select-none"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              scrub(e)
            }}
            onPointerMove={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) scrub(e)
            }}
            onKeyDown={(e) => {
              const step = clip.duration / totalFrames
              if (e.key === "ArrowRight") timeRef.current = Math.min(timeRef.current + step, clip.duration * 0.9999)
              if (e.key === "ArrowLeft") timeRef.current = Math.max(timeRef.current - step, 0)
            }}
          >
            <div className="relative h-5 border-b border-white/[0.05]">
              {ticks.map((f) => (
                <div
                  key={f}
                  className="absolute top-0 flex h-full flex-col items-center"
                  style={{ left: `${(f / totalFrames) * 100}%` }}
                >
                  <span
                    className={cn("w-px bg-white/15", f % 10 === 0 ? "h-2" : "h-1")}
                    aria-hidden
                  />
                  {f % 10 === 0 && (
                    <span className="mt-px -translate-x-1/2 pl-px font-mono text-[9px] text-muted-foreground/60 first:translate-x-0">
                      {f}
                    </span>
                  )}
                </div>
              ))}
            </div>
            {Object.entries(clip.tracks).map(([name, keys]) => (
              <div key={name} className="relative h-6 border-b border-white/[0.03]">
                <div className="absolute inset-x-0 top-1/2 h-px bg-white/[0.06]" />
                {keys.map((k, i) => (
                  <span
                    key={i}
                    className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[1px] border border-neon-violet/80 bg-neon-violet/40"
                    style={{ left: `${k * 100}%` }}
                  />
                ))}
              </div>
            ))}
            <div ref={playheadRef} className="pointer-events-none absolute inset-y-0 w-px bg-neon shadow-[0_0_8px] shadow-neon" style={{ left: 0 }}>
              <span className="absolute -top-px left-1/2 h-2 w-2.5 -translate-x-1/2 rounded-b-sm bg-neon" />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
