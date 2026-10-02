'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

type User = {
  _id: string
  name: string
  email: string
  role: 'admin' | 'provider' | 'client'
  phone?: string
  isActive?: boolean
} | null

type AuthCtx = {
  user: User
  loading: boolean
  login: (email: string, password: string) => Promise<any>
  register: (payload: any) => Promise<any>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  setUser: (u: User) => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      const data = await res.json()
      setUser(res.ok ? data.user : null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const value = useMemo(
    () => ({
      user,
      loading,
      setUser,
      refresh,
      async login(email: string, password: string) {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Login failed')
        setUser(data.user)
        return data.user
      },
      async register(payload: any) {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Registration failed')
        setUser(data.user)
        return data.user
      },
      async logout() {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
        setUser(null)
      },
    }),
    [user, loading, refresh]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
