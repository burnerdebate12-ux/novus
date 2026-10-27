"use client"

import { useCallback, useRef, useState } from "react"
import { toast } from "sonner"
import { EXPORT_FORMATS, exportAvatar, formatBytes, type ExportFormat } from "@/lib/avatar/exporters"
import { useAvatar } from "@/lib/avatar/store"

const STAGES = ["Collecting meshes", "Baking materials", "Packing buffers", "Compressing assets", "Finalizing package"]
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export interface ExportJob {
  format: ExportFormat
  progress: number
  stage: string
}

export function useAvatarExport() {
  const { sceneRefs, design, projectName } = useAvatar()
  const [job, setJob] = useState<ExportJob | null>(null)
  const busy = useRef(false)

  const run = useCallback(
    async (format: ExportFormat) => {
      if (busy.current) return
      busy.current = true
      const label = EXPORT_FORMATS.find((f) => f.id === format)?.label ?? format
      try {
        for (let i = 0; i <= 19; i++) {
          setJob({ format, progress: i * 5, stage: STAGES[Math.min(Math.floor(i / 4), STAGES.length - 1)] })
          await sleep(45 + Math.random() * 70)
        }
        const result = await exportAvatar(format, sceneRefs.current.avatar, design, projectName)
        setJob({ format, progress: 100, stage: "Complete" })
        await sleep(250)
        toast.success(`${label} exported`, { description: `${result.filename} · ${formatBytes(result.bytes)}` })
      } catch (err) {
        toast.error(`${label} export failed`, { description: err instanceof Error ? err.message : "Unknown error" })
      } finally {
        busy.current = false
        setJob(null)
      }
    },
    [sceneRefs, design, projectName],
  )

  return { job, run }
}
