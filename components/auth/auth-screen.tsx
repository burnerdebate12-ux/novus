"use client"

import { Box, Loader2, Sparkles } from "lucide-react"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { describeAuthError, useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"

type Mode = "login" | "signup" | "recover"

const COPY: Record<Mode, { title: string; cta: string }> = {
  login: { title: "Welcome back", cta: "Log in" },
  signup: { title: "Create your account", cta: "Sign up" },
  recover: { title: "Reset your password", cta: "Send reset link" },
}

export function AuthScreen() {
  const { login, signup, recover } = useAuth()
  const [mode, setMode] = useState<Mode>("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      if (mode === "login") {
        await login(email, password)
        toast.success("Logged in")
      } else if (mode === "signup") {
        const { confirmed } = await signup(email, password, name)
        if (!confirmed) {
          setNotice("Check your inbox to confirm your email, then log in.")
          setMode("login")
        }
      } else {
        await recover(email)
        setNotice("If that email has an account, a reset link is on its way.")
        setMode("login")
      }
    } catch (err) {
      setError(describeAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  const switchMode = (m: Mode) => {
    setMode(m)
    setError(null)
  }

  return (
    <div className="dark relative flex min-h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_30%_20%,oklch(0.24_0.06_285)_0%,oklch(0.12_0.01_270)_55%,oklch(0.08_0.005_270)_100%)] p-4 text-foreground">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden />
      <FloatingShapes />

      <div className="glass-panel relative w-full max-w-sm rounded-2xl border p-7 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-neon to-neon-violet shadow-[0_0_28px_-4px] shadow-neon/60">
            <Box className="size-5 text-zinc-950" strokeWidth={2.5} aria-hidden />
          </div>
          <div className="leading-tight">
            <p className="text-lg font-semibold tracking-tight">Norvos</p>
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">3D model studio</p>
          </div>
        </div>

        <h1 className="text-xl font-semibold tracking-tight">{COPY[mode].title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "recover"
            ? "Enter your email and we'll send you a link."
            : "Pick a character, sculpt with blocks, and build with an AI assistant."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="auth-name">Name</Label>
              <Input id="auth-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Ada" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>
          {mode !== "recover" && (
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <Label htmlFor="auth-password">Password</Label>
                {mode === "login" && (
                  <button type="button" onClick={() => switchMode("recover")} className="text-xs text-muted-foreground hover:text-neon">
                    Forgot?
                  </button>
                )}
              </div>
              <Input
                id="auth-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="rounded-md border border-neon/30 bg-neon/10 px-3 py-2 text-xs text-neon">
              {notice}
            </p>
          )}

          <Button
            type="submit"
            disabled={busy}
            className="h-10 w-full gap-2 bg-gradient-to-r from-neon to-[oklch(0.75_0.16_230)] font-semibold text-zinc-950 hover:opacity-90"
          >
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
            {COPY[mode].cta}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          {mode === "signup" ? "Already have an account? " : mode === "login" ? "New to Norvos? " : "Remembered it? "}
          <button
            type="button"
            onClick={() => switchMode(mode === "login" ? "signup" : "login")}
            className="font-medium text-neon hover:underline"
          >
            {mode === "login" ? "Create an account" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  )
}

export function SetPasswordScreen() {
  const { setPassword } = useAuth()
  const [password, setValue] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await setPassword(password)
      toast.success("Password updated")
    } catch (err) {
      setError(describeAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="dark flex min-h-dvh items-center justify-center bg-background p-4 text-foreground">
      <form onSubmit={submit} className="glass-panel w-full max-w-sm space-y-4 rounded-2xl border p-7">
        <h1 className="text-xl font-semibold tracking-tight">Choose a new password</h1>
        <div className="space-y-1.5">
          <Label htmlFor="new-password">New password</Label>
          <Input id="new-password" type="password" required minLength={6} value={password} onChange={(e) => setValue(e.target.value)} autoComplete="new-password" />
        </div>
        {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full bg-neon font-semibold text-zinc-950 hover:opacity-90">
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Save password
        </Button>
      </form>
    </div>
  )
}

const SHAPES = [
  { className: "left-[8%] top-[14%] size-24 rounded-full from-neon/40 to-neon-violet/20", delay: "0s" },
  { className: "right-[10%] top-[22%] size-16 rounded-xl rotate-12 from-neon-violet/40 to-pink-500/20", delay: "1.2s" },
  { className: "left-[14%] bottom-[16%] size-14 rounded-md -rotate-12 from-amber-400/30 to-pink-500/10", delay: "0.6s" },
  { className: "right-[16%] bottom-[12%] size-28 rounded-full from-emerald-400/25 to-neon/10", delay: "1.8s" },
]

function FloatingShapes() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden sm:block">
      {SHAPES.map((s, i) => (
        <div
          key={i}
          className={cn("absolute animate-pulse bg-gradient-to-br shadow-[0_0_60px_-10px] shadow-neon/30 blur-[1px]", s.className)}
          style={{ animationDelay: s.delay, animationDuration: "4s" }}
        />
      ))}
    </div>
  )
}
