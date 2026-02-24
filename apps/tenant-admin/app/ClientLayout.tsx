'use client'

import { ThemeProvider } from '@payload-config/components/providers/ThemeProvider'
import { TenantBrandingProvider } from '@/app/providers/tenant-branding'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TenantBrandingProvider>{children}</TenantBrandingProvider>
    </ThemeProvider>
  )
}
