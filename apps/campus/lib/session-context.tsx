'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

import {
  CampusApiError,
  type CampusUser,
  fetchCampusSession,
  loginCampus,
  logoutCampus,
} from './campus-client'

export type User = CampusUser
export interface SessionState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}
export interface SessionContextValue extends SessionState {
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession must be used within a SessionProvider')
  return context
}

export function useUser(): User | null {
  return useSession().user
}

export function SessionProvider({
  children,
  apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? '',
}: { children: React.ReactNode; apiBaseUrl?: string }) {
  const [state, setState] = useState<SessionState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  })

  const refreshSession = useCallback(async () => {
    setState((previous) => ({ ...previous, isLoading: true, error: null }))
    try {
      const user = await fetchCampusSession(apiBaseUrl)
      setState({ user, isLoading: false, isAuthenticated: Boolean(user), error: null })
    } catch (error) {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: error instanceof Error ? error.message : 'No se pudo comprobar la sesión.',
      })
    }
  }, [apiBaseUrl])

  const login = useCallback(async (email: string, password: string) => {
    setState({ user: null, isLoading: true, isAuthenticated: false, error: null })
    try {
      const user = await loginCampus(apiBaseUrl, email, password)
      setState({ user, isLoading: false, isAuthenticated: true, error: null })
      return true
    } catch (error) {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: error instanceof CampusApiError ? error.message : 'No se pudo iniciar sesión.',
      })
      return false
    }
  }, [apiBaseUrl])

  const logout = useCallback(async () => {
    try {
      await logoutCampus(apiBaseUrl)
    } catch {
      // Local state must still be cleared if the remote session is unavailable.
    } finally {
      setState({ user: null, isLoading: false, isAuthenticated: false, error: null })
      if (typeof window !== 'undefined') window.location.href = '/login'
    }
  }, [apiBaseUrl])

  useEffect(() => { void refreshSession() }, [refreshSession])

  return <SessionContext.Provider value={{ ...state, login, logout, refreshSession }}>{children}</SessionContext.Provider>
}

export function AuthGuard({
  children,
  fallback = <div className="flex min-h-screen items-center justify-center">Cargando...</div>,
  redirectTo = '/login',
}: { children: React.ReactNode; fallback?: React.ReactNode; redirectTo?: string }) {
  const { isLoading, isAuthenticated } = useSession()
  useEffect(() => {
    if (!isLoading && !isAuthenticated && typeof window !== 'undefined') {
      window.location.href = `${redirectTo}?redirect=${encodeURIComponent(window.location.pathname)}`
    }
  }, [isLoading, isAuthenticated, redirectTo])
  return isLoading || !isAuthenticated ? <>{fallback}</> : <>{children}</>
}
