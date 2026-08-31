import type React from 'react'
import type { Metadata } from 'next'
import { Manrope, Poppins } from 'next/font/google'
import '../globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
  variable: '--font-display',
})
import { ClientLayout } from '../ClientLayout'
import type { TenantBranding } from '@/app/providers/tenant-branding'
import { getTenantHostBranding, toAbsoluteAssetUrl } from '@/app/lib/server/tenant-host-branding'
import { hexToHsl } from '@/app/lib/tenant-theme-tokens'

export const dynamic = 'force-dynamic'

function getIconMimeType(url: string): string {
  if (url.endsWith('.svg')) return 'image/svg+xml'
  if (url.endsWith('.png')) return 'image/png'
  if (url.endsWith('.ico')) return 'image/x-icon'
  return 'image/png'
}

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantHostBranding()
  const title = `${tenant.academyName}: Plataforma Educativa`
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
      sidebar: '#0F2440',
    },
    tenantId: tenant.tenantId,
  }
  const primaryHsl = hexToHsl(tenant.primaryColor)

  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${manrope.variable} ${poppins.variable} ${manrope.className}`}
      style={{
        ['--primary' as string]: primaryHsl,
        ['--ring' as string]: primaryHsl,
        ['--brand' as string]: primaryHsl,
        ['--sidebar-primary' as string]: primaryHsl,
        ['--sidebar-ring' as string]: primaryHsl,
      }}
    >
      <body className="font-sans">
        <ClientLayout initialBranding={initialBranding}>{children}</ClientLayout>
      </body>
    </html>
  )
}
