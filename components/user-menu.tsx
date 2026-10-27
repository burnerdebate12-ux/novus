"use client"

import { Home, LogOut } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { displayName, useAuth } from "@/lib/auth"

export function UserMenu({ onHome }: { onHome?: () => void }) {
  const { user, logout } = useAuth()
  if (!user) return null
  const name = displayName(user)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Account menu"
            className="rounded-full bg-gradient-to-br from-neon-violet to-neon text-xs font-semibold text-zinc-950 hover:opacity-90"
          />
        }
      >
        {name.slice(0, 1).toUpperCase()}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="block truncate text-foreground">{name}</span>
            <span className="block truncate font-normal">{user.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {onHome && (
          <DropdownMenuItem onClick={onHome}>
            <Home />
            My models
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          variant="destructive"
          onClick={async () => {
            await logout()
            toast("Logged out")
          }}
        >
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
