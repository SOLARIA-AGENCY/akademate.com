'use client'

/**
 * React Context for Tenant Information
 *
 * Provides tenant info to client components
 */

import { createContext, useContext, type ReactNode } from 'react'

export interface TenantInfo {
  id: string
  slug: string
  name: string
  plan: 'starter' | 'pro' | 'enterprise'
  branding?: {
    primaryColor?: string
    logo?: string
  }
}

interface TenantContextValue {
  tenant: TenantInfo | null
  isLoading: boolean
  error: Error | null
}

export const TenantContext = createContext<TenantContextValue>({
  tenant: null,
  isLoading: false,
  error: null,
})

export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}

interface TenantProviderProps {
  tenant: TenantInfo | null
  children: ReactNode
}

export function TenantProvider({ tenant, children }: TenantProviderProps) {
  return (
    <TenantContext.Provider
      value={{
        tenant,
        isLoading: false,
        error: null,
      }}
    >
      {children}
    </TenantContext.Provider>
  )
}
