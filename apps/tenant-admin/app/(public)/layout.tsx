import type React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import '../globals.css'
import { getTenantHostBranding, toAbsoluteAssetUrl } from '@/app/lib/server/tenant-host-branding'
import { getTenantWebsite } from '@/app/lib/website/server'

function getIconMimeType(url: string): string {
  if (url.endsWith('.svg')) return 'image/svg+xml'
  if (url.endsWith('.png')) return 'image/png'
  if (url.endsWith('.ico')) return 'image/x-icon'
  return 'image/png'
}

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantHostBranding()
  const website = await getTenantWebsite()
  const home = website.pages.find((page) => page.path === '/')
  const title = home?.seo?.title ?? `${tenant.academyName} — Formación profesional`
  const description =
    home?.seo?.description ??
    'Centro de estudios profesionales con oferta dinámica de ciclos, cursos, convocatorias y sedes.'
  const ogImage = toAbsoluteAssetUrl(tenant.origin, website.visualIdentity.logoPrimary || tenant.logoUrl)

  return {
    metadataBase: new URL(tenant.origin),
    title,
    description,
    icons: {
      icon: [
        { url: website.visualIdentity.favicon || tenant.faviconUrl, type: getIconMimeType(website.visualIdentity.favicon || tenant.faviconUrl) },
      ],
      apple: website.visualIdentity.logoPrimary || tenant.logoUrl,
      shortcut: website.visualIdentity.favicon || tenant.faviconUrl,
    },
    openGraph: {
      title,
      description,
      url: tenant.origin,
      siteName: tenant.academyName,
      images: [{ url: ogImage, width: 1200, height: 630, alt: tenant.academyName }],
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

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getTenantHostBranding()
  const website = await getTenantWebsite()
  const brandColor = website.visualIdentity.colorPrimary || tenant.primaryColor
  const brandDark = website.visualIdentity.colorPrimaryDark || brandColor

  return (
    <html lang="es">
      <body className="public-site min-h-screen bg-white text-slate-950 antialiased">
        <style>{`
          :root {
            --cep-brand: ${brandColor};
            --cep-brand-dark: ${brandDark};
            --cep-brand-surface: ${website.visualIdentity.colorSurface};
            --cep-brand-text: ${website.visualIdentity.colorText};
          }
        `}</style>

        <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-3">
              <img
                src={website.visualIdentity.logoPrimary || tenant.logoUrl}
                alt={tenant.academyName}
                className="h-14 w-auto object-contain lg:h-16"
              />
            </Link>
            <nav className="hidden items-center gap-6 lg:flex">
              {website.navigation.items.map((item) => (
                <Link key={item.href} href={item.href} className="text-sm font-medium text-slate-600 transition hover:text-slate-950">
                  {item.label}
                </Link>
              ))}
              {website.navigation.cta ? (
                <Link
                  href={website.navigation.cta.href}
                  className="rounded-full px-5 py-2.5 text-sm font-semibold text-white"
                  style={{ backgroundColor: brandColor }}
                >
                  {website.navigation.cta.label}
                </Link>
              ) : null}
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="bg-slate-950 text-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_1.9fr] lg:px-8">
            <div>
              <img
                src={website.visualIdentity.logoPrimary || tenant.logoUrl}
                alt={tenant.academyName}
                className="h-14 w-auto object-contain brightness-0 invert lg:h-16"
              />
              <p className="mt-5 max-w-md text-sm leading-7 text-white/65">{website.footer.description}</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-3">
              {website.footer.columns.map((column) => (
                <div key={column.title}>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-white/95">{column.title}</h3>
                  <ul className="mt-4 space-y-3 text-sm text-white/65">
                    {column.links.map((link) => (
                      <li key={link.href}>
                        <Link href={link.href} className="transition hover:text-white">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-white/10">
            <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-white/45 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <p>{tenant.academyName} · {new Date().getFullYear()}</p>
              <p>{website.footer.legalNote ?? 'Plataforma pública multitenant de Akademate.'}</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
