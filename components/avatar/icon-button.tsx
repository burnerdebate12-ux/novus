"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/avatar/kbd"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export function IconButton({
  label,
  shortcut,
  active,
  disabled,
  onClick,
  side = "bottom",
  className,
  children,
}: {
  label: string
  shortcut?: string
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  side?: "top" | "bottom" | "left" | "right"
  className?: string
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            aria-pressed={active}
            disabled={disabled}
            onClick={onClick}
            className={cn(
              "text-muted-foreground hover:bg-white/5 hover:text-foreground",
              active && "bg-neon/15 text-neon shadow-[inset_0_0_0_1px] shadow-neon/30 hover:bg-neon/20 hover:text-neon",
              className,
            )}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side={side}>
        {label}
        {shortcut && <Kbd>{shortcut}</Kbd>}
      </TooltipContent>
    </Tooltip>
  )
}
