"use client"

import {
  Box,
  ChevronDown,
  Code2,
  Eclipse,
  FileJson,
  Hexagon,
  Layers,
  PanelLeft,
  PanelRight,
  Redo2,
  RotateCcw,
  Rocket,
  ScanLine,
  Sun,
  Undo2,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { generateReactCode } from "@/lib/avatar/code-gen"
import { useAvatar } from "@/lib/avatar/store"
import type { ShadingMode } from "@/lib/avatar/types"
import { IconButton } from "./icon-button"
import { useAvatarExport } from "./use-avatar-export"

const SHADING: { id: ShadingMode; label: string; key: string; icon: typeof Sun }[] = [
  { id: "lit", label: "Lit (PBR)", key: "1", icon: Sun },
  { id: "shaded", label: "Solid shaded", key: "2", icon: Eclipse },
  { id: "wireframe", label: "Wireframe", key: "3", icon: Hexagon },
  { id: "xray", label: "X-Ray", key: "4", icon: ScanLine },
]

export function Navbar({
  onPublish,
  onToggleLeft,
  onToggleRight,
}: {
  onPublish: () => void
  onToggleLeft: () => void
  onToggleRight: () => void
}) {
  const { projectName, setProjectName, undo, redo, canUndo, canRedo, undoCount, view, setView, design, resetDesign } =
    useAvatar()
  const { run, job } = useAvatarExport()

  const copyCode = async () => {
    await navigator.clipboard.writeText(generateReactCode(design, projectName))
    toast.success("React component copied", { description: "Paste it into any R3F project" })
  }

  return (
    <header className="relative z-40 flex h-14 shrink-0 items-center gap-2 border-b border-white/[0.07] bg-zinc-950/80 px-2 backdrop-blur-xl sm:px-3">
      <IconButton label="Toggle outliner" className="lg:hidden" onClick={onToggleLeft}>
        <PanelLeft />
      </IconButton>

      <div className="flex items-center gap-2.5">
        <div className="relative flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-neon to-neon-violet shadow-[0_0_24px_-4px] shadow-neon/60">
          <Box className="size-4 text-zinc-950" strokeWidth={2.5} aria-hidden />
        </div>
        <div className="hidden leading-none sm:block">
          <p className="text-sm font-semibold tracking-tight">Avatar Forge</p>
          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">v2.4 · studio</p>
        </div>
      </div>

      <div className="mx-1 hidden h-6 w-px bg-white/10 sm:block" />

      <label className="sr-only" htmlFor="project-name">
        Project name
      </label>
      <input
        id="project-name"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        className="h-8 w-28 min-w-0 rounded-md border border-transparent bg-transparent px-2 text-sm font-medium outline-none hover:border-white/10 focus-visible:border-neon/50 focus-visible:bg-black/30 sm:w-40"
      />

      <div className="flex items-center gap-0.5">
        <IconButton label={`Undo (${undoCount})`} shortcut="⌘Z" disabled={!canUndo} onClick={undo}>
          <Undo2 />
        </IconButton>
        <IconButton label="Redo" shortcut="⇧⌘Z" disabled={!canRedo} onClick={redo}>
          <Redo2 />
        </IconButton>
      </div>

      <div
        role="radiogroup"
        aria-label="Viewport shading"
        className="mx-auto hidden items-center gap-0.5 rounded-lg border border-white/[0.07] bg-black/30 p-0.5 md:flex"
      >
        {SHADING.map((s) => (
          <IconButton
            key={s.id}
            label={s.label}
            shortcut={s.key}
            active={view.shading === s.id}
            onClick={() => setView({ shading: s.id })}
          >
            <s.icon />
          </IconButton>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-1.5 md:ml-0">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button className="h-8 gap-1.5 bg-gradient-to-r from-neon to-[oklch(0.75_0.16_230)] px-3 font-semibold text-zinc-950 shadow-[0_0_20px_-6px] shadow-neon hover:opacity-90" />
            }
          >
            <Rocket className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">{job ? `Exporting ${job.progress}%` : "Publish & Export"}</span>
            <ChevronDown className="size-3.5 opacity-70" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={onPublish}>
                <Rocket />
                Publish project…
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Quick export</DropdownMenuLabel>
              <DropdownMenuItem disabled={!!job} onClick={() => run("glb")}>
                <Box />
                Export GLB
                <DropdownMenuShortcut>.glb</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!!job} onClick={() => run("obj")}>
                <Layers />
                Export OBJ
                <DropdownMenuShortcut>.obj</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!!job} onClick={() => run("json")}>
                <FileJson />
                Export JSON schema
                <DropdownMenuShortcut>.json</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyCode}>
                <Code2 />
                Copy React component
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                resetDesign()
                toast("Design reset to defaults", { action: { label: "Undo", onClick: undo } })
              }}
            >
              <RotateCcw />
              Reset design
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <IconButton label="Toggle inspector" className="lg:hidden" onClick={onToggleRight}>
          <PanelRight />
        </IconButton>
      </div>
    </header>
  )
}
