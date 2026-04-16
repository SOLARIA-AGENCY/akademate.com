import type React from 'react'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import '../globals.css'
import { getTenantHostBranding, toAbsoluteAssetUrl } from '@/app/lib/server/tenant-host-branding'
import { getTenantWebsite } from '@/app/lib/website/server'
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
  const title = `${tenant.academyName} — Plataforma Educativa`
  const description =
    'Gestion integral para centros de formacion con branding, campus virtual y operaciones SaaS.'
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

type TenantData = {
  name: string
  logo: string
  primaryColor: string
  metaPixelId: string
  ga4MeasurementId: string
  phone1: string
  phone2: string
  isCepTenant: boolean
  whatsappContacts: Array<{ label: string; phone: string; shortCode: string; message: string }>
}

const CEP_WHATSAPP_CONTACTS: Array<{ label: string; phone: string; message: string }> = [
  {
    label: 'CEP FORMACION NORTE',
    phone: '+34 622 41 60 20',
    message: 'Hola, quiero información de CEP Formación Norte.',
  },
  {
    label: 'CEP DESEMPLEADOS',
    phone: '+34 622 73 61 01',
    message: 'Hola, necesito información sobre cursos para desempleados.',
  },
  {
    label: 'CEP SANTA CRUZ',
    phone: '+34 618 98 96 48',
    message: 'Hola, quiero información de la sede CEP Santa Cruz.',
  },
]

function isCepHost(host: string): boolean {
  return /(^|\.)cepformacion(\.|$)/i.test(host) || host.includes('cep-formacion')
}

async function getEmergencyTenantData(): Promise<TenantData> {
  const headerStore = await Promise.resolve(headers())
  const hostHeader = headerStore.get('x-forwarded-host') || headerStore.get('host') || ''
  const normalizedHost = hostHeader.split(',')[0]?.trim().toLowerCase().replace(/:\d+$/, '') || ''
  const cepFallback = isCepHost(normalizedHost)

  return {
    name: cepFallback ? 'CEP Formación' : 'Academia',
    logo: cepFallback
      ? '/logos/cep-formacion-logo-rectangular.png'
      : '/logos/akademate-logo-official.png',
    primaryColor: cepFallback ? '#cc0000' : '#64748b',
    metaPixelId: '',
    ga4MeasurementId: '',
    phone1: '',
    phone2: '',
    isCepTenant: cepFallback,
    whatsappContacts: cepFallback ? buildWhatsAppContacts(CEP_WHATSAPP_CONTACTS) : [],
  }
}

function normalizeWhatsAppPhone(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, '').replace(/\+/g, '')
  if (!digits) return null
  if (digits.startsWith('34')) return digits
  return `34${digits}`
}

function shortCodeFromLabel(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'WA'
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase()
  return `${words[0]![0] ?? ''}${words[1]![0] ?? ''}`.toUpperCase()
}

function buildWhatsAppContacts(
  entries: Array<{ label: string; phone: string; message: string }>
): Array<{ label: string; phone: string; shortCode: string; message: string }> {
  return entries
    .map((entry) => ({
      ...entry,
      normalizedPhone: normalizeWhatsAppPhone(entry.phone),
    }))
    .filter((entry) => Boolean(entry.normalizedPhone))
    .map((entry) => ({
      label: entry.label,
      phone: entry.phone,
      shortCode: shortCodeFromLabel(entry.label),
      message: entry.message,
    }))
}

async function getTenantData(): Promise<TenantData> {
  try {
    const tenant = await getTenantHostBranding()
    const primaryColor = tenant.primaryColor || '#cc0000'
    const logo = tenant.isCepTenant
      ? '/logos/cep-formacion-logo-rectangular.png'
      : tenant.logoUrl
    const academyName = tenant.academyName
    const phone1 = tenant.contactPhone
    const phone2 = tenant.contactPhoneAlternative

    const whatsappContacts = tenant.isCepTenant
      ? buildWhatsAppContacts(CEP_WHATSAPP_CONTACTS)
      : buildWhatsAppContacts([
          { label: 'Contacto', phone: phone1, message: 'Hola, me gustaria recibir informacion sobre la oferta formativa.' },
          { label: 'Admision', phone: phone2, message: 'Hola, necesito informacion sobre admision y matricula.' },
        ])

    return {
      name: academyName,
      logo,
      primaryColor,
      metaPixelId: tenant.metaPixelId,
      ga4MeasurementId: tenant.ga4MeasurementId,
      phone1,
      phone2,
      isCepTenant: tenant.isCepTenant,
      whatsappContacts,
    }
  } catch {
    return getEmergencyTenantData()
  }
}

function toPublicFooterHref(href: string): string {
  if (href.startsWith('/legal/')) return `/p${href}`
  return href
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getTenantData()
  const website = await getTenantWebsite()
  const c = tenant.primaryColor

  return (
    <html lang="es">
      <head>
        {tenant.metaPixelId && (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${tenant.metaPixelId}');
fbq('track', 'PageView');`,
              }}
            />
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: 'none' }}
                src={`https://www.facebook.com/tr?id=${tenant.metaPixelId}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}
      </head>
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {/* Inject brand color as CSS variable */}
        <style>{`
          :root { --brand: ${c}; --brand-dark: color-mix(in srgb, ${c} 80%, black); --brand-light: color-mix(in srgb, ${c} 15%, white); }
          .brand-bg { background-color: ${c}; }
          .brand-bg-light { background-color: color-mix(in srgb, ${c} 10%, white); }
          .brand-text { color: ${c}; }
          .brand-border { border-color: ${c}; }
          .brand-bg-dark { background-color: color-mix(in srgb, ${c} 85%, black); }
          .brand-hover:hover { color: ${c}; }
          .brand-btn { background-color: ${c}; color: white; }
          .brand-btn:hover { background-color: color-mix(in srgb, ${c} 85%, black); }
          .brand-ring:focus { --tw-ring-color: ${c}; }
        `}</style>

        <PublicHeaderClient
          brandColor={c}
          tenantName={tenant.name}
          logoUrl={tenant.logo}
          phone1={tenant.phone1}
          phone2={tenant.phone2}
          isCepTenant={tenant.isCepTenant}
        />

        <main className="flex-1 pt-12 sm:pt-14 md:pt-[5.5rem]">{children}</main>

        <footer className="mt-16 border-t border-slate-200 bg-white text-slate-700">
          <div className="bg-slate-50 py-12">
            <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
              <div className="flex flex-col items-center lg:items-start">
                <img
                  src={website.visualIdentity.logoPrimary || tenant.logo}
                  alt={tenant.name}
                  className="h-14 w-auto object-contain lg:h-16"
                />
                <p className="mt-4 text-sm font-medium text-slate-600">
                  &copy; {new Date().getFullYear()} {tenant.name}
                </p>
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
                  <a key={link.href} href={toPublicFooterHref(link.href)} className="transition hover:text-slate-900">
                    {link.label}
                  </a>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                {website.footer.legalNote ?? 'Plataforma pública de CEP Formación.'}
              </p>
            </div>
          </div>
        </footer>

        {/* WhatsApp Floating Button + Contact Popup */}
        <div id="wa-widget" style={{position:'fixed',bottom:20,right:20,zIndex:9999}}>
          <style>{`
            #wa-popup { display:none; position:absolute; bottom:70px; right:0; width:300px; background:#fff; border-radius:16px; box-shadow:0 8px 32px rgba(0,0,0,0.15); overflow:hidden; }
            #wa-widget:hover #wa-popup, #wa-popup:hover { display:block; }
            @media(max-width:480px) { #wa-popup { width:280px; right:-10px; } }
          `}</style>
          <div id="wa-popup">
            <div style={{background:'#25D366',padding:'16px 20px',color:'#fff'}}>
              <p style={{margin:0,fontWeight:700,fontSize:16}}>{tenant.name}</p>
              <p style={{margin:'4px 0 0',fontSize:13,opacity:0.9}}>Contacta por WhatsApp</p>
            </div>
            <div style={{padding:12}}>
              {tenant.whatsappContacts.length === 0 ? (
                <p style={{margin:0,padding:'8px 4px',fontSize:13,color:'#6b7280'}}>WhatsApp no configurado para este tenant.</p>
              ) : tenant.whatsappContacts.map((contact) => {
                const phone = normalizeWhatsAppPhone(contact.phone)
                if (!phone) return null
                return (
                  <a
                    key={`${contact.label}-${contact.phone}`}
                    href={`https://wa.me/${phone}?text=${encodeURIComponent(contact.message)}`}
                    target="_blank"
                    rel="noopener"
                    style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,textDecoration:'none',color:'#111',fontSize:14,transition:'background 0.2s',background:'#f9fafb',marginBottom:6}}
                  >
                    <span style={{width:36,height:36,borderRadius:'50%',background:'#25D366',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0}}>{contact.shortCode}</span>
                    <span>
                      <strong>{contact.label}</strong>
                      <br />
                      <span style={{fontSize:12,color:'#6b7280'}}>{contact.phone}</span>
                    </span>
                  </a>
                )
              })}
            </div>
          </div>
          <button aria-label="Contactar por WhatsApp" style={{width:60,height:60,borderRadius:'50%',background:'#25D366',border:'none',cursor:'pointer',boxShadow:'0 4px 12px rgba(37,211,102,0.4)',display:'flex',alignItems:'center',justifyContent:'center',transition:'transform 0.2s'}}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </button>
        </div>
      </body>
    </html>
  )
}
