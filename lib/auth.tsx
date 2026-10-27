"use client"

import {
  AuthError,
  MissingIdentityError,
  getUser,
  handleAuthCallback,
  login as identityLogin,
  logout as identityLogout,
  onAuthChange,
  requestPasswordRecovery,
  signup as identitySignup,
  updateUser,
  type User,
} from "@netlify/identity"
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

interface AuthValue {
  user: User | null
  loading: boolean
  /** True after a recovery link — the user is signed in but must choose a new password. */
  needsPasswordReset: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<{ confirmed: boolean }>
  logout: () => Promise<void>
  recover: (email: string) => Promise<void>
  setPassword: (password: string) => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function describeAuthError(error: unknown): string {
  if (error instanceof MissingIdentityError) return "Sign-in isn't available in this environment yet. Try again on the deployed site."
  if (error instanceof AuthError) {
    if (error.status === 401) return "Invalid email or password."
    if (error.status === 403) return "Signups are currently closed for this site."
    if (error.status === 422) return "Check your email and password (passwords need at least 6 characters)."
    return error.message
  }
  return "Something went wrong. Please try again."
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const result = await handleAuthCallback()
        if (result?.type === "recovery") setNeedsPasswordReset(true)
      } catch {
        // An expired or already-used link — fall through to the normal session check.
      }
      const current = await getUser()
      if (!cancelled) {
        setUser(current)
        setLoading(false)
      }
    })()
    const unsubscribe = onAuthChange((_event, next) => setUser(next))
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setUser(await identityLogin(email, password))
  }, [])

  const signup = useCallback(async (email: string, password: string, name: string) => {
    const created = await identitySignup(email, password, { full_name: name })
    if (created.confirmedAt) setUser(created)
    return { confirmed: !!created.confirmedAt }
  }, [])

  const logout = useCallback(async () => {
    try {
      await identityLogout()
    } finally {
      setUser(null)
    }
  }, [])

  const recover = useCallback((email: string) => requestPasswordRecovery(email), [])

  const setPassword = useCallback(async (password: string) => {
    setUser(await updateUser({ password }))
    setNeedsPasswordReset(false)
  }, [])

  const value = useMemo(
    () => ({ user, loading, needsPasswordReset, login, signup, logout, recover, setPassword }),
    [user, loading, needsPasswordReset, login, signup, logout, recover, setPassword],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

export function displayName(user: User) {
  return user.name || user.email?.split("@")[0] || "Creator"
}
