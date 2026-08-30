'use client'

import { useEffect } from 'react'
import { ThemeProvider } from '@payload-config/components/providers/ThemeProvider'
import { TenantBrandingProvider, type TenantBranding } from '@/app/providers/tenant-branding'
import { applyIpadAppFlag } from '@/lib/detect-ipad-app'

export function ClientLayout({
  children,
  initialBranding,
}: {
  children: React.ReactNode
  initialBranding?: TenantBranding
}) {
  useEffect(() => {
    applyIpadAppFlag(document, window)
  }, [])

  return (
    <ThemeProvider data-oid="_b1y_2q">
      <TenantBrandingProvider initialBranding={initialBranding} data-oid="8rkgj6m">
        {children}
      </TenantBrandingProvider>
    </ThemeProvider>
  )
}
