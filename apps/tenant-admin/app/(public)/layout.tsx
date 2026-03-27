import type React from 'react'
import type { Metadata } from 'next'
import '../globals.css'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const metadata: Metadata = {
  title: 'CEP Formacion — Centro de Formacion Profesional en Tenerife',
  description: 'Ciclos formativos oficiales de Grado Medio y Superior. Modalidad semipresencial, 1 dia de clase a la semana, 500h de practicas en empresa. Mas de 26 anos formando profesionales.',
  openGraph: {
    title: 'CEP Formacion — Formacion Profesional en Tenerife',
    description: 'Ciclos formativos oficiales. Semipresencial, practicas en empresa, financiacion disponible.',
    url: 'https://cepformacion.akademate.com',
    siteName: 'CEP Formacion',
    images: [
      {
        url: 'https://cepformacion.akademate.com/og-image.png',
        width: 1000,
        height: 1000,
        alt: 'CEP Formacion',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CEP Formacion — Formacion Profesional en Tenerife',
    description: 'Ciclos formativos oficiales. Semipresencial, practicas en empresa.',
    images: ['https://cepformacion.akademate.com/og-image.png'],
  },
}

export const dynamic = 'force-dynamic'

async function getTenantData() {
  try {
    const payload = await getPayload({ config: configPromise })
    const tenants = await payload.find({ collection: 'tenants', limit: 1, depth: 0 })
    const tenant = tenants.docs[0] as any
    const primaryColor = tenant?.branding_primary_color || '#cc0000'

    // Read logo from config API
    let logo = '/logos/akademate-logo-official.png'
    try {
      const logoRes = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3009'}/api/config?section=logos&tenantId=${tenant?.id || 1}`)
      if (logoRes.ok) {
        const logoData = await logoRes.json()
        if (logoData.data?.principal) logo = logoData.data.principal
      }
    } catch { /* use default */ }

    return {
      name: tenant?.name || 'Akademate',
      logo,
      primaryColor,
      metaPixelId: tenant?.integrations_meta_pixel_id || tenant?.integrations?.metaPixelId || '',
      ga4MeasurementId: tenant?.integrations_ga4_measurement_id || tenant?.integrations?.ga4MeasurementId || '',
    }
  } catch {
    return { name: 'Akademate', logo: '/logos/akademate-logo-official.png', primaryColor: '#0066CC', metaPixelId: '', ga4MeasurementId: '' }
  }
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getTenantData()
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

        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <a href="/" className="flex items-center gap-3">
                <img src={tenant.logo} alt={tenant.name} className="h-8 w-8 object-contain" />
                <span className="font-bold text-lg text-gray-900">{tenant.name}</span>
              </a>
              <nav className="hidden sm:flex items-center gap-5">
                <a href="/p/ciclos" className="text-sm font-medium text-gray-600 brand-hover transition-colors">Ciclos FP</a>
                <a href="/p/cursos?tipo=privados" className="text-sm font-medium text-gray-600 brand-hover transition-colors">Privados</a>
                <a href="/p/cursos?tipo=desempleados" className="text-sm font-medium text-gray-600 brand-hover transition-colors">Desempleados</a>
                <a href="/p/cursos?tipo=ocupados" className="text-sm font-medium text-gray-600 brand-hover transition-colors">Ocupados</a>
                <a href="/p/cursos?tipo=teleformacion" className="text-sm font-medium text-gray-600 brand-hover transition-colors">Teleformacion</a>
                <a href="/p/convocatorias" className="text-sm font-medium text-gray-600 brand-hover transition-colors">Convocatorias</a>
                <a href="/p/contacto" className="text-sm font-medium brand-btn px-4 py-2 rounded-lg transition-colors" style={{backgroundColor: c, color: '#fff'}}>Contacto</a>
              </nav>
              <button className="sm:hidden p-2 text-gray-600" aria-label="Menu">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        {/* Footer — uses brand color */}
        <footer className="brand-bg-dark text-gray-200 mt-16" style={{ backgroundColor: `color-mix(in srgb, ${c} 20%, #111827)` }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <img src={tenant.logo} alt={tenant.name} className="h-8 w-8 object-contain brightness-200" />
                  <span className="font-bold text-lg text-white">{tenant.name}</span>
                </div>
                <p className="text-sm text-gray-400">Centro de formacion profesional autorizado. Ciclos formativos oficiales y cursos especializados.</p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Formacion</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="/p/ciclos" className="hover:text-white transition-colors">Ciclos Formativos</a></li>
                  <li><a href="/p/cursos" className="hover:text-white transition-colors">Cursos</a></li>
                  <li><a href="/p/convocatorias" className="hover:text-white transition-colors">Convocatorias Abiertas</a></li>
                  <li><a href="/p/blog" className="hover:text-white transition-colors">Blog / Noticias</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Legal</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="/p/legal/privacidad" className="hover:text-white transition-colors">Politica de Privacidad</a></li>
                  <li><a href="/p/legal/terminos" className="hover:text-white transition-colors">Terminos y Condiciones</a></li>
                  <li><a href="/p/legal/cookies" className="hover:text-white transition-colors">Politica de Cookies</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-white/10 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} {tenant.name}. Todos los derechos reservados.</p>
              <p className="text-xs text-gray-400">Powered by <a href="https://akademate.com" className="brand-text hover:underline" target="_blank" rel="noopener">Akademate</a></p>
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
              <p style={{margin:0,fontWeight:700,fontSize:16}}>CEP Formacion</p>
              <p style={{margin:'4px 0 0',fontSize:13,opacity:0.9}}>Contacta por WhatsApp</p>
            </div>
            <div style={{padding:12}}>
              <a href="https://wa.me/34622416020?text=Hola%2C%20me%20gustaria%20recibir%20informacion%20sobre%20los%20cursos" target="_blank" rel="noopener" style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,textDecoration:'none',color:'#111',fontSize:14,transition:'background 0.2s',background:'#f9fafb',marginBottom:6}}>
                <span style={{width:36,height:36,borderRadius:'50%',background:'#25D366',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700,flexShrink:0}}>N</span>
                <span><strong>CEP Norte</strong><br/><span style={{fontSize:12,color:'#6b7280'}}>+34 622 41 60 20</span></span>
              </a>
              <a href="https://wa.me/34618989648?text=Hola%2C%20me%20gustaria%20recibir%20informacion%20sobre%20los%20cursos" target="_blank" rel="noopener" style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,textDecoration:'none',color:'#111',fontSize:14,transition:'background 0.2s',background:'#f9fafb',marginBottom:6}}>
                <span style={{width:36,height:36,borderRadius:'50%',background:'#25D366',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700,flexShrink:0}}>SC</span>
                <span><strong>CEP Santa Cruz</strong><br/><span style={{fontSize:12,color:'#6b7280'}}>+34 618 98 96 48</span></span>
              </a>
              <a href="https://wa.me/34622736101?text=Hola%2C%20quiero%20informacion%20sobre%20cursos%20subvencionados" target="_blank" rel="noopener" style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,textDecoration:'none',color:'#111',fontSize:14,transition:'background 0.2s',background:'#f0fdf4',border:'1px solid #bbf7d0'}}>
                <span style={{width:36,height:36,borderRadius:'50%',background:'#16a34a',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0}}>SUB</span>
                <span><strong>Cursos Subvencionados</strong><br/><span style={{fontSize:12,color:'#6b7280'}}>+34 622 73 61 01</span></span>
              </a>
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
