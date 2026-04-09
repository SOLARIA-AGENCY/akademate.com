import type React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import '../globals.css'
import { getTenantHostBranding, toAbsoluteAssetUrl } from '@/app/lib/server/tenant-host-branding'
import { getTenantWebsite } from '@/app/lib/website/server'
import { CookieBanner } from './_components/CookieBanner'

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
                className="h-24 w-auto object-contain lg:h-28"
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

        <footer className="border-t border-slate-200 bg-white text-slate-700">
          <div className="bg-slate-50 py-12">
            <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
              <div className="flex flex-col items-center lg:items-start">
                <img
                  src={website.visualIdentity.logoPrimary || tenant.logoUrl}
                  alt={tenant.academyName}
                  className="h-24 w-auto object-contain lg:h-28"
                />
                <p className="mt-4 text-sm font-medium text-slate-600">© {new Date().getFullYear()} CEP FORMACIÓN S.L.</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-900">Sedes</h3>
                <div className="mt-4 space-y-4 text-sm text-slate-700">
                  <p>
                    <span className="block font-semibold text-slate-900">Santa Cruz</span>
                    Plaza José Antonio Barrios Olivero, Bajo Estadio Heliodoro, 38005
                  </p>
                  <p>
                    <span className="block font-semibold text-slate-900">Norte</span>
                    Molinos de Gofio 2, 38312 La Orotava (C.C. El Trompo, última planta)
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-900">Contacto</h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-700">
                  <li>Teléfono: 922 21 92 57</li>
                  <li>Email: info@cursostenerife.es</li>
                  <li>Horario: L-V 10:00-14:00 y 16:00-20:00</li>
                </ul>
              </div>
              <div className="flex flex-col items-center gap-3 lg:items-end">
                <img
                  src="/website/cep/logos/footer/logo-certificaciones.jpg"
                  alt="Certificaciones de calidad"
                  className="h-auto w-52 max-w-full object-contain"
                />
                <img
                  src="/website/cep/logos/footer/logo-fondo-europeo.jpg"
                  alt="Fondo social europeo"
                  className="h-auto w-52 max-w-full object-contain"
                />
                <img
                  src="/website/cep/logos/footer/logo-sce.jpg"
                  alt="Servicio Canario de Empleo"
                  className="h-auto w-52 max-w-full object-contain"
                />
              </div>
            </div>
          </div>
          <div className="border-t border-slate-200">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                {website.footer.columns.flatMap((column) => column.links).map((link) => (
                  <Link key={link.href} href={link.href} className="transition hover:text-slate-900">
                    {link.label}
                  </Link>
                ))}
              </div>
              <p className="text-xs text-slate-500">{website.footer.legalNote ?? 'Plataforma pública de CEP Formación.'}</p>
            </div>
          </div>
        </footer>
        <CookieBanner />
      </body>
    </html>
  )
}
