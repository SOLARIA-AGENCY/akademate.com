import type React from 'react'
import type { Metadata } from 'next'
import '../globals.css'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const metadata: Metadata = {
  title: 'Formacion Profesional | Akademate',
  description: 'Descubre ciclos formativos y cursos de formacion profesional.',
}

export const dynamic = 'force-dynamic'

async function getTenantData() {
  try {
    const payload = await getPayload({ config: configPromise })
    const tenants = await payload.find({ collection: 'tenants', limit: 1, depth: 0 })
    const tenant = tenants.docs[0] as any
    const primaryColor = tenant?.branding_primary_color || '#cc0000'
    return {
      name: tenant?.name || 'Akademate',
      logo: '/logos/akademate-logo-official.png',
      primaryColor,
    }
  } catch {
    return { name: 'Akademate', logo: '/logos/akademate-logo-official.png', primaryColor: '#0066CC' }
  }
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getTenantData()
  const c = tenant.primaryColor

  return (
    <html lang="es">
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
              <nav className="hidden sm:flex items-center gap-6">
                <a href="/p/ciclos" className="text-sm font-medium text-gray-600 brand-hover transition-colors">Ciclos</a>
                <a href="/p/cursos" className="text-sm font-medium text-gray-600 brand-hover transition-colors">Cursos</a>
                <a href="/p/convocatorias" className="text-sm font-medium text-gray-600 brand-hover transition-colors">Convocatorias</a>
                <a href="/p/blog" className="text-sm font-medium text-gray-600 brand-hover transition-colors">Blog</a>
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
      </body>
    </html>
  )
}
