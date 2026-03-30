'use client'

import { ThemeProvider } from '@payload-config/components/providers/ThemeProvider'
import { TenantBrandingProvider } from '@/app/providers/tenant-branding'
import { NotificationProvider } from '@/app/providers/notifications'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider data-oid="_b1y_2q">
      <TenantBrandingProvider data-oid="8rkgj6m">
        <NotificationProvider>{children}</NotificationProvider>
      </TenantBrandingProvider>
    </ThemeProvider>
  )
}
