"use client"

import { useEffect, useState } from "react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AvatarProvider, useAvatar } from "@/lib/avatar/store"
import type { ShadingMode } from "@/lib/avatar/types"
import { cn } from "@/lib/utils"
import { LeftSidebar } from "./left-sidebar"
import { Navbar } from "./navbar"
import { PublishDialog } from "./publish-dialog"
import { RightSidebar } from "./right-sidebar"
import { Timeline } from "./timeline"
import { Viewport } from "./viewport"

const SHADING_KEYS: Record<string, ShadingMode> = { "1": "lit", "2": "shaded", "3": "wireframe", "4": "xray" }

function useShortcuts() {
  const { undo, redo, setView, setAnim, view, anim } = useAvatar()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.closest("input, textarea, select, [contenteditable=true]")) return
      const mod = e.metaKey || e.ctrlKey
      const key = e.key.toLowerCase()

      if (mod && key === "z") {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }
      if (mod && key === "y") {
        e.preventDefault()
        redo()
        return
      }
      if (mod || e.altKey) return

      if (key === "w") setView({ gizmoMode: "translate", gizmoEnabled: true })
      else if (key === "e") setView({ gizmoMode: "rotate", gizmoEnabled: true })
      else if (key === "r") setView({ gizmoMode: "scale", gizmoEnabled: true })
      else if (key === "q") setView({ gizmoEnabled: !view.gizmoEnabled })
      else if (key === "g") setView({ showGrid: !view.showGrid })
      else if (key === "f") setView({ cameraResetKey: view.cameraResetKey + 1 })
      else if (SHADING_KEYS[key]) setView({ shading: SHADING_KEYS[key] })
      else if (key === " " && !target.closest("button, [role=slider]")) {
        e.preventDefault()
        setAnim({ playing: !anim.playing })
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [undo, redo, setView, setAnim, view.gizmoEnabled, view.showGrid, view.cameraResetKey, anim.playing])
}

function Workspace() {
  const [leftOpen, setLeftOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  useShortcuts()

  const openPublish = () => {
    setRightOpen(false)
    setPublishOpen(true)
  }

  return (
    <div className="dark flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <Navbar
        onPublish={openPublish}
        onToggleLeft={() => {
          setLeftOpen((o) => !o)
          setRightOpen(false)
        }}
        onToggleRight={() => {
          setRightOpen((o) => !o)
          setLeftOpen(false)
        }}
      />
      <div className="relative flex min-h-0 flex-1">
        <LeftSidebar
          className={cn(
            "absolute inset-y-0 left-0 z-30 transition-transform duration-200 lg:static lg:w-60 lg:translate-x-0 xl:w-64",
            leftOpen ? "translate-x-0" : "-translate-x-full",
          )}
        />
        <main className="flex min-w-0 flex-1 flex-col">
          <Viewport />
          <Timeline />
        </main>
        <RightSidebar
          onPublish={openPublish}
          className={cn(
            "absolute inset-y-0 right-0 z-30 max-w-[calc(100vw-2rem)] transition-transform duration-200 lg:static lg:translate-x-0 xl:w-[22rem]",
            rightOpen ? "translate-x-0" : "translate-x-full",
          )}
        />
        {(leftOpen || rightOpen) && (
          <button
            type="button"
            aria-label="Close panel"
            className="absolute inset-0 z-20 bg-black/50 backdrop-blur-[2px] lg:hidden"
            onClick={() => {
              setLeftOpen(false)
              setRightOpen(false)
            }}
          />
        )}
      </div>
      <PublishDialog open={publishOpen} onOpenChange={setPublishOpen} />
    </div>
  )
}

export function DesignerApp() {
  return (
    <AvatarProvider>
      <TooltipProvider delay={300}>
        <Workspace />
      </TooltipProvider>
    </AvatarProvider>
  )
}
