'use client'

/**
 * RealtimeProvider for tenant-admin
 *
 * Wraps the dashboard with Socket.io connection for real-time updates.
 * Automatically connects when auth data is available.
 */

import { ReactNode, useEffect, useState } from 'react'
import { SocketProvider } from '@akademate/realtime/context'

interface AuthData {
  token: string
  userId: string
  role: string
  tenantId: number
}

interface RealtimeProviderProps {
  children: ReactNode
  /** Default tenant ID if not found in auth */
  tenantId?: number
}

export function RealtimeProvider({ children, tenantId: defaultTenantId = 1 }: RealtimeProviderProps) {
  const [authData, setAuthData] = useState<AuthData | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [realtimeReady, setRealtimeReady] = useState(false)
  const [realtimeAvailable, setRealtimeAvailable] = useState(false)

  // Get auth data from server-side session endpoint (reads httpOnly cookie)
  useEffect(() => {
    const getAuthData = async () => {
      try {
        // Fetch auth data from server — the httpOnly cookie is sent automatically
        const response = await fetch('/api/auth/session', { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          if (data.authenticated && data.socketToken) {
            setAuthData({
              token: data.socketToken,
              userId: data.user?.id?.toString() || '1',
              role: data.user?.role || 'admin',
              tenantId: data.user?.tenantId || defaultTenantId,
            })
          }
        }
      } catch (error) {
        console.warn('[RealtimeProvider] Could not get auth data:', error)
      } finally {
        setIsReady(true)
      }
    }

    getAuthData()
  }, [defaultTenantId])

  // Probe socket server availability to avoid endless client reconnect loops
  useEffect(() => {
    const canAttemptRealtime = process.env.NEXT_PUBLIC_REALTIME_ENABLED !== 'false'
    if (!canAttemptRealtime || !authData) {
      setRealtimeAvailable(false)
      setRealtimeReady(true)
      return
    }

    setRealtimeReady(false)
    setRealtimeAvailable(false)

    let cancelled = false
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)
    const socketBaseUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ??
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3009')

    const probeSocket = async () => {
      try {
        const probeUrl = `${socketBaseUrl.replace(/\/$/, '')}/socket.io/?EIO=4&transport=polling&t=${Date.now()}`
        const response = await fetch(probeUrl, {
          cache: 'no-store',
          credentials: 'include',
          signal: controller.signal,
        })
        const text = await response.text()
        const looksLikeSocketHandshake = response.ok && text.startsWith('0{')

        if (!cancelled) {
          setRealtimeAvailable(looksLikeSocketHandshake)
        }
      } catch {
        if (!cancelled) {
          setRealtimeAvailable(false)
        }
      } finally {
        clearTimeout(timeoutId)
        if (!cancelled) {
          setRealtimeReady(true)
        }
      }
    }

    void probeSocket()

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [authData])

  // Don't render SocketProvider until we've checked for auth
  if (!isReady) {
    return <>{children}</>
  }

  // If no auth or realtime unavailable, render children without socket (graceful degradation)
  if (!authData || !realtimeReady || !realtimeAvailable) {
    return <>{children}</>
  }

  const socketUrl =
    process.env.NEXT_PUBLIC_SOCKET_URL ??
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3009')

  return (
    <SocketProvider
      url={socketUrl}
      tenantId={authData.tenantId}
      userId={authData.userId}
      role={authData.role}
      token={authData.token}
      autoConnect={true}
      debug={process.env.NODE_ENV === 'development'}
    >
      {children}
    </SocketProvider>
  )
}
