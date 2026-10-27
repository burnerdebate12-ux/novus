"use client"

import { Check, Copy, Download, Rocket } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { generateReactCode } from "@/lib/avatar/code-gen"
import { EXPORT_FORMATS } from "@/lib/avatar/exporters"
import { useAvatar } from "@/lib/avatar/store"
import { cn } from "@/lib/utils"
import { SectionLabel } from "../controls"
import { useAvatarExport } from "../use-avatar-export"

const TOKEN_RE = /("(?:[^"\\]|\\.)*"|\/\/.*$|\b(?:import|from|export|function|return|const|default|as|type)\b|\b\d+(?:\.\d+)?\b|<\/?[A-Za-z][\w.]*)/gm

function highlight(line: string) {
  const parts = line.split(TOKEN_RE)
  return parts.map((p, i) => {
    if (!p) return null
    let cls = ""
    if (p.startsWith("//")) cls = "text-zinc-500 italic"
    else if (p.startsWith('"')) cls = "text-emerald-300"
    else if (p.startsWith("<")) cls = "text-sky-300"
    else if (/^\d/.test(p)) cls = "text-amber-300"
    else if (/^(import|from|export|function|return|const|default|as|type)$/.test(p)) cls = "text-violet-300"
    return cls ? (
      <span key={i} className={cls}>
        {p}
      </span>
    ) : (
      p
    )
  })
}

function CodeView({ code }: { code: string }) {
  const lines = useMemo(() => code.split("\n"), [code])
  return (
    <div className="max-h-[420px] overflow-auto rounded-lg border border-white/[0.07] bg-black/50">
      <pre className="py-3 font-mono text-[10.5px] leading-[1.6]">
        <code>
          {lines.map((line, i) => (
            <div key={i} className="flex px-3 hover:bg-white/[0.03]">
              <span className="mr-3 w-6 shrink-0 text-right text-zinc-600 select-none">{i + 1}</span>
              <span className="whitespace-pre text-zinc-300">{highlight(line)}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  )
}

export function ExportPanel({ onPublish }: { onPublish: () => void }) {
  const { design, projectName } = useAvatar()
  const { job, run } = useAvatarExport()
  const [copied, setCopied] = useState(false)
  const code = useMemo(() => generateReactCode(design, projectName), [design, projectName])

  const copy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success("Component copied to clipboard")
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <Tabs defaultValue="react" className="gap-4">
      <TabsList className="w-full">
        <TabsTrigger value="react" className="text-xs">
          React / Next.js
        </TabsTrigger>
        <TabsTrigger value="engine" className="text-xs">
          Game Engine
        </TabsTrigger>
      </TabsList>

      <TabsContent value="react" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="font-mono text-[10px]">
              {lines(code)} lines
            </Badge>
            <Badge variant="outline" className="font-mono text-[10px] text-neon">
              R3F · drei
            </Badge>
          </div>
          <Button size="xs" variant="outline" onClick={copy}>
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <CodeView code={code} />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Live-synced with the viewport. Requires <code className="font-mono text-foreground/80">three</code>,{" "}
          <code className="font-mono text-foreground/80">@react-three/fiber</code> and{" "}
          <code className="font-mono text-foreground/80">@react-three/drei</code>.
        </p>
      </TabsContent>

      <TabsContent value="engine" className="space-y-4">
        <section>
          <SectionLabel>Formats</SectionLabel>
          <ul className="space-y-2">
            {EXPORT_FORMATS.map((f) => {
              const running = job?.format === f.id
              return (
                <li
                  key={f.id}
                  className={cn(
                    "rounded-lg border p-3 transition-colors",
                    running ? "border-neon/40 bg-neon/[0.05]" : "border-white/[0.07] bg-white/[0.02]",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-white/5 font-mono text-[10px] font-semibold text-neon uppercase">
                      .{f.ext}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium">{f.label}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{f.description}</p>
                    </div>
                    <Button
                      size="icon-sm"
                      variant="outline"
                      aria-label={`Export ${f.label}`}
                      disabled={!!job}
                      onClick={() => run(f.id)}
                    >
                      <Download />
                    </Button>
                  </div>
                  {running && job && (
                    <div className="mt-3 space-y-1.5" aria-live="polite">
                      <Progress value={job.progress} className="[&_[data-slot=progress-indicator]]:bg-neon" />
                      <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
                        <span>{job.stage}…</span>
                        <span className="tabular-nums">{job.progress}%</span>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
        <Button className="w-full bg-gradient-to-r from-neon-violet to-neon font-semibold text-zinc-950 hover:opacity-90" onClick={onPublish}>
          <Rocket /> Publish to Asset Hub
        </Button>
      </TabsContent>
    </Tabs>
  )
}

const lines = (s: string) => s.split("\n").length
