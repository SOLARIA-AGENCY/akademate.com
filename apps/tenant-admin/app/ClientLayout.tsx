'use client'

import { ThemeProvider } from '@payload-config/components/providers/ThemeProvider'
import { TenantBrandingProvider } from '@/app/providers/tenant-branding'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider data-oid="_b1y_2q">
      <TenantBrandingProvider data-oid="8rkgj6m">{children}</TenantBrandingProvider>
    </ThemeProvider>
  )
}
