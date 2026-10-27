import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "inline-flex h-4 min-w-4 items-center justify-center rounded-sm bg-black/10 px-1 font-mono text-[10px] font-medium",
        className,
      )}
    >
      {children}
    </kbd>
  )
}
