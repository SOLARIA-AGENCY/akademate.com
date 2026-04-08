'use client'

import { ThemeProvider } from '@payload-config/components/providers/ThemeProvider'
import { TenantBrandingProvider, type TenantBranding } from '@/app/providers/tenant-branding'
import { NotificationProvider } from '@/app/providers/notifications'

export function ClientLayout({
  children,
  initialBranding,
}: {
  children: React.ReactNode
  initialBranding?: TenantBranding
}) {
  return (
    <ThemeProvider data-oid="_b1y_2q">
      <TenantBrandingProvider initialBranding={initialBranding} data-oid="8rkgj6m">
        <NotificationProvider>{children}</NotificationProvider>
      </TenantBrandingProvider>
    </ThemeProvider>
  )
}
