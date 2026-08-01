'use client'

import { SocketProvider } from '@akademate/realtime/context'
import type { ReactNode } from 'react'

type RealtimeProviderProps = {
  children: ReactNode
  enabled?: boolean
  token?: string
  tenantId?: number
  userId?: string
  role?: 'student' | 'instructor'
}

/**
 * Realtime stays fail-closed until the canonical Campus API issues a bounded,
 * short-lived socket credential. It must never recover identity from legacy
 * endpoints or browser-persisted identity.
 */
export function RealtimeProvider({
  children,
  enabled = process.env.NEXT_PUBLIC_CAMPUS_REALTIME_ENABLED === 'true',
  token,
  tenantId,
  userId,
  role,
}: RealtimeProviderProps) {
  if (!enabled || !token || !tenantId || !userId || !role) return <>{children}</>

  return (
    <SocketProvider
      url={process.env.NEXT_PUBLIC_SOCKET_URL ?? ''}
      tenantId={tenantId}
      userId={userId}
      role={role}
      token={token}
      autoConnect
      debug={process.env.NODE_ENV === 'development'}
    >
      {children}
    </SocketProvider>
  )
}
