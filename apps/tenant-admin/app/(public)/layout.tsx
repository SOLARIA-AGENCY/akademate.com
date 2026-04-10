import type React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import '../globals.css'
import { withTenantScope } from '@/app/lib/server/tenant-scope'
import { getTenantHostBranding, toAbsoluteAssetUrl } from '@/app/lib/server/tenant-host-branding'
import { resolvePublicNavigation } from '@/app/lib/website/navigation'
import { getTenantWebsite } from '@/app/lib/website/server'
import { CookieBanner } from './_components/CookieBanner'
import { PublicHeaderClient } from './_components/PublicHeaderClient'

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
  const navigationItems = await resolvePublicNavigation(website.navigation.items, { tenantId: tenant.tenantId })
  const brandColor = website.visualIdentity.colorPrimary || tenant.primaryColor
  const brandDark = website.visualIdentity.colorPrimaryDark || brandColor
  const contactPhone = tenant.contactPhone || '922 219 257'
  const contactPhoneAlternative = tenant.contactPhoneAlternative || ''
  const contactEmail = 'info@cursostenerife.es'
  const contactSchedule = 'Lunes a viernes 10 a 14 - 16 a 20'

  let footerCampuses: Array<{ name: string; address: string }> = []
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'campuses',
      where: withTenantScope({ active: { equals: true } }, tenant.tenantId) as any,
      depth: 0,
      limit: 4,
      sort: 'name',
    })
    footerCampuses = (result.docs as Array<{ name?: string; address?: string; city?: string }>)
      .map((campus) => ({
        name: (campus.name || '').trim(),
        address: [campus.address, campus.city].filter(Boolean).join(' · ').trim(),
      }))
      .filter((campus) => campus.name !== '' && campus.address !== '')
      .slice(0, 2)
  } catch {
    footerCampuses = []
  }

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

        <PublicHeaderClient
          brandColor={brandColor}
          logoSrc={website.visualIdentity.logoPrimary || tenant.logoUrl}
          academyName={tenant.academyName}
          navigationItems={navigationItems}
          navigationCta={website.navigation.cta}
          topBar={{
            phone: contactPhone,
            phoneAlternative: contactPhoneAlternative,
            schedule: contactSchedule,
            email: contactEmail,
          }}
        />

        <main>{children}</main>

        <footer className="border-t border-slate-200 bg-white text-slate-700">
          <div className="bg-slate-50 py-12">
            <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
              <div className="flex flex-col items-center lg:items-start">
                <img
                  src={website.visualIdentity.logoPrimary || tenant.logoUrl}
                  alt={tenant.academyName}
                  className="h-28 w-auto max-w-[460px] object-contain lg:h-32"
                />
                <p className="mt-4 text-sm font-medium text-slate-600">© {new Date().getFullYear()} CEP FORMACIÓN S.L.</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-900">Sedes</h3>
                <div className="mt-4 space-y-4 text-sm text-slate-700">
                  {footerCampuses.length > 0 ? (
                    footerCampuses.map((campus) => (
                      <p key={campus.name}>
                        <span className="block font-semibold text-slate-900">{campus.name}</span>
                        {campus.address}
                      </p>
                    ))
                  ) : (
                    <>
                      <p>
                        <span className="block font-semibold text-slate-900">Santa Cruz</span>
                        Plaza José Antonio Barrios Olivero, Bajo Estadio Heliodoro, 38005
                      </p>
                      <p>
                        <span className="block font-semibold text-slate-900">Norte</span>
                        Molinos de Gofio 2, 38312 La Orotava (C.C. El Trompo, última planta)
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-900">Contacto</h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-700">
                  <li>Teléfono: {contactPhone}</li>
                  {contactPhoneAlternative ? <li>Teléfono alternativo: {contactPhoneAlternative}</li> : null}
                  <li>Email: {contactEmail}</li>
                  <li>Horario: {contactSchedule}</li>
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
