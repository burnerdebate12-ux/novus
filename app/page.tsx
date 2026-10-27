"use client"

import { AuthScreen, SetPasswordScreen } from "@/components/auth/auth-screen"
import { DesignerApp } from "@/components/avatar/designer-app"
import { AuthProvider, useAuth } from "@/lib/auth"

function Gate() {
  const { user, loading, needsPasswordReset } = useAuth()
  if (loading) return <div className="dark min-h-dvh bg-background" />
  if (!user) return <AuthScreen />
  if (needsPasswordReset) return <SetPasswordScreen />
  return <DesignerApp />
}

export default function Page() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
