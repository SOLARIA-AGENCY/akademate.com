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

  // Get auth data from localStorage or session
  useEffect(() => {
    const getAuthData = async () => {
      try {
        // Try to get from localStorage first
        const storedUser = localStorage.getItem('akademate_user')
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          if (userData.token) {
            setAuthData({
              token: userData.token,
              userId: userData.id?.toString() || userData.userId?.toString() || '1',
              role: userData.role || 'admin',
              tenantId: userData.tenantId || defaultTenantId,
            })
            setIsReady(true)
            return
          }
        }

        // Fallback: fetch from auth endpoint
        const response = await fetch('/api/auth/session')
        if (response.ok) {
          const data = await response.json()
          if (data.token) {
            setAuthData({
              token: data.token,
              userId: data.userId?.toString() || data.id?.toString() || '1',
              role: data.role || 'admin',
              tenantId: data.tenantId || defaultTenantId,
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

  // Don't render SocketProvider until we've checked for auth
  if (!isReady) {
    return <>{children}</>
  }

  // If no auth data, render children without socket (graceful degradation)
  if (!authData) {
    return <>{children}</>
  }

  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3009'

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
