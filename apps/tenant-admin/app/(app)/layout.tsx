import type React from 'react'
import type { Metadata } from 'next'
import '../globals.css'
import { ClientLayout } from '../ClientLayout'
import type { TenantBranding } from '@/app/providers/tenant-branding'
import { getTenantHostBranding, toAbsoluteAssetUrl } from '@/app/lib/server/tenant-host-branding'

function getIconMimeType(url: string): string {
  if (url.endsWith('.svg')) return 'image/svg+xml'
  if (url.endsWith('.png')) return 'image/png'
  if (url.endsWith('.ico')) return 'image/x-icon'
  return 'image/png'
}

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantHostBranding()
  const title = `${tenant.academyName} — Plataforma Educativa`
  const description = 'Gestion academica, operaciones y campus virtual para centros de formacion.'
  const ogImage = toAbsoluteAssetUrl(tenant.origin, tenant.logoUrl)

  return {
    metadataBase: new URL(tenant.origin),
    title,
    description,
    icons: {
      icon: [
        { url: tenant.faviconUrl, type: getIconMimeType(tenant.faviconUrl) },
        { url: tenant.logoUrl, sizes: '32x32', type: getIconMimeType(tenant.logoUrl) },
      ],
      apple: tenant.logoUrl,
      shortcut: tenant.faviconUrl,
    },
    openGraph: {
      title,
      description,
      url: tenant.origin,
      siteName: tenant.academyName,
      images: [
        {
          url: ogImage,
          width: 1000,
          height: 1000,
          alt: tenant.academyName,
        },
      ],
      locale: 'es_ES',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getTenantHostBranding()
  const initialBranding: TenantBranding = {
    academyName: tenant.academyName,
    logos: {
      principal: tenant.logoUrl,
      oscuro: tenant.logoUrl,
      claro: tenant.logoUrl,
      favicon: tenant.faviconUrl,
    },
    theme: {
      primary: tenant.primaryColor,
      secondary: '#1a1a2e',
      accent: tenant.primaryColor,
      success: '#22c55e',
      warning: '#f59e0b',
      danger: '#ef4444',
    },
    tenantId: tenant.tenantId,
  }

  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ClientLayout initialBranding={initialBranding}>{children}</ClientLayout>
      </body>
    </html>
  )
}
