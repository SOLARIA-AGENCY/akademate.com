import type React from 'react'
import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import '../globals.css'
import { ClientLayout } from '../ClientLayout'
import type { TenantBranding } from '@/app/providers/tenant-branding'
import { getTenantHostBranding, toAbsoluteAssetUrl } from '@/app/lib/server/tenant-host-branding'

export const dynamic = 'force-dynamic'

function getIconMimeType(url: string): string {
  if (url.endsWith('.svg')) return 'image/svg+xml'
  if (url.endsWith('.png')) return 'image/png'
  if (url.endsWith('.ico')) return 'image/x-icon'
  return 'image/png'
}

function hexToHSL(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '0 0% 50%'

  const r = parseInt(result[1] ?? '00', 16) / 255
  const g = parseInt(result[2] ?? '00', 16) / 255
  const b = parseInt(result[3] ?? '00', 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
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
  const runtime = process.env.AKADEMATE_RUNTIME === 'next' ? 'next' : 'legacy'
  const primaryHsl = hexToHSL(tenant.primaryColor)
  const tenantThemeVars = {
    '--primary': primaryHsl,
    '--ring': primaryHsl,
    '--sidebar-primary': primaryHsl,
    '--sidebar-ring': primaryHsl,
    '--brand-accent': primaryHsl,
  } as CSSProperties
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
    <html
      lang="es"
      style={tenantThemeVars}
      data-akademate-runtime={runtime}
      suppressHydrationWarning
    >
      <body>
        <ClientLayout initialBranding={initialBranding}>{children}</ClientLayout>
      </body>
    </html>
  )
}
