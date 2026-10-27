"use client"

import { Check, Globe, Lock, Rocket, Users } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { slugify } from "@/lib/avatar/exporters"
import { useAvatar } from "@/lib/avatar/store"
import { cn } from "@/lib/utils"

const VISIBILITY = [
  { id: "public", label: "Public", desc: "Anyone in the hub", icon: Globe },
  { id: "team", label: "Team", desc: "Workspace only", icon: Users },
  { id: "private", label: "Private", desc: "Just you", icon: Lock },
] as const

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function PublishDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { projectName, setProjectName, design } = useAvatar()
  const [visibility, setVisibility] = useState<(typeof VISIBILITY)[number]["id"]>("public")
  const [description, setDescription] = useState("Cyberpunk operative with holo-visor and alloy pauldrons.")
  const [progress, setProgress] = useState<number | null>(null)

  const partCount = Object.values(design.parts).filter((p) => p.visible).length

  const publish = async () => {
    for (let p = 0; p <= 100; p += 4) {
      setProgress(p)
      await sleep(30)
    }
    setProgress(null)
    onOpenChange(false)
    toast.success("Published to Asset Hub", {
      description: `hub.avatarforge.dev/${slugify(projectName)} · ${visibility}`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => progress === null && onOpenChange(o)}>
      <DialogContent className="border-white/10 bg-zinc-950/95 backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="size-4 text-neon" aria-hidden /> Publish avatar
          </DialogTitle>
          <DialogDescription>
            Share {partCount} visible parts and the full material config as a versioned asset.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="publish-name">Name</Label>
            <Input id="publish-name" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
            <p className="font-mono text-[10px] text-muted-foreground">hub.avatarforge.dev/{slugify(projectName)}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="publish-desc">Description</Label>
            <Textarea id="publish-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <fieldset className="space-y-1.5">
            <legend className="mb-1.5 text-sm font-medium">Visibility</legend>
            <div className="grid grid-cols-3 gap-2">
              {VISIBILITY.map((v) => {
                const active = visibility === v.id
                return (
                  <button
                    key={v.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setVisibility(v.id)}
                    className={cn(
                      "relative flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-colors",
                      active ? "border-neon/50 bg-neon/10" : "border-white/10 hover:bg-white/5",
                    )}
                  >
                    {active && <Check className="absolute top-2 right-2 size-3 text-neon" aria-hidden />}
                    <v.icon className={cn("size-4", active ? "text-neon" : "text-muted-foreground")} aria-hidden />
                    <span className="text-xs font-medium">{v.label}</span>
                    <span className="text-[10px] text-muted-foreground">{v.desc}</span>
                  </button>
                )
              })}
            </div>
          </fieldset>
          {progress !== null && (
            <div className="space-y-1.5" aria-live="polite">
              <Progress value={progress} className="[&_[data-slot=progress-indicator]]:bg-neon" />
              <p className="font-mono text-[10px] text-muted-foreground">Uploading package… {progress}%</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={progress !== null}>
            Cancel
          </Button>
          <Button
            onClick={publish}
            disabled={progress !== null || !projectName.trim()}
            className="bg-gradient-to-r from-neon to-neon-violet font-semibold text-zinc-950 hover:opacity-90"
          >
            <Rocket /> {progress !== null ? "Publishing…" : "Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
