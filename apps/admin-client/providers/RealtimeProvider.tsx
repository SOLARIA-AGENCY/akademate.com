'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { SocketProvider } from '@akademate/realtime/context'

interface AuthSessionResponse {
  authenticated?: boolean
  socketToken?: string
  user?: {
    id?: string | number
    role?: string
    tenantId?: string | number
  }
}

interface AuthData {
  token: string
  userId: string
  role: string
  tenantId: number
}

interface RealtimeProviderProps {
  children: ReactNode
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const [authData, setAuthData] = useState<AuthData | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let mounted = true

    const getAuthData = async (): Promise<void> => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
          cache: 'no-store',
        })

        if (!response.ok) return

        const session = (await response.json()) as AuthSessionResponse
        if (!session.authenticated || !session.user?.id || !session.socketToken) return

        if (mounted) {
          setAuthData({
            token: session.socketToken,
            userId: String(session.user.id),
            role: session.user.role ?? 'superadmin',
            tenantId: Number(session.user.tenantId ?? 0),
          })
        }
      } catch (error) {
        console.warn('[RealtimeProvider] Could not get auth session:', error)
      } finally {
        if (mounted) setIsReady(true)
      }
    }

    void getAuthData()

    return () => {
      mounted = false
    }
  }, [])

  if (!isReady || !authData) {
    return <>{children}</>
  }

  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3009'

  return (
    <SocketProvider
      url={socketUrl}
      tenantId={authData.tenantId}
      userId={authData.userId}
      role={authData.role}
      token={authData.token}
      autoConnect
      debug={process.env.NODE_ENV === 'development'}
    >
      {children}
    </SocketProvider>
  )
}
