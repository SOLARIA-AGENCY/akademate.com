'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

const SESSION_KEY = 'akademate-ops-user'

const navItems = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Tenants', href: '/dashboard/tenants' },
  { name: 'Facturación', href: '/dashboard/facturacion' },
  { name: 'Suscripciones', href: '/dashboard/suscripciones' },
  { name: 'API', href: '/dashboard/api' },
  { name: 'Estado', href: '/dashboard/estado' },
  { name: 'Impersonar', href: '/dashboard/impersonar' },
  { name: 'Media', href: '/dashboard/media' },
  { name: 'Soporte', href: '/dashboard/soporte' },
  { name: 'Configuración', href: '/dashboard/configuracion' },
]

type Session = {
  email: string
  role: string
  name?: string
  tenantId?: string
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const devLoginEnabled = useMemo(
    () => process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === 'true',
    []
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = localStorage.getItem(SESSION_KEY)
    if (!stored) {
      router.replace('/login')
      return
    }

    try {
      const parsed = JSON.parse(stored) as Session
      setSession(parsed)
    } catch (error) {
      console.warn('Sesión inválida, reiniciando', error)
      localStorage.removeItem(SESSION_KEY)
      router.replace('/login')
      return
    }

    setLoading(false)
  }, [router])

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_KEY)
    }
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300">
        Cargando sesión...
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col overflow-hidden">
      <header className="bg-slate-900/80 border-b border-slate-800/80 flex-shrink-0 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-4 hover:opacity-90 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Akademate Ops</h1>
              <p className="text-xs text-slate-400">Panel superadmin multitenant</p>
            </div>
          </Link>
          <div className="flex items-center gap-3 text-xs">
            {devLoginEnabled ? (
              <span className="px-2 py-1 rounded bg-amber-500/15 text-amber-300 font-semibold">DEV LOGIN</span>
            ) : null}
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-200 font-semibold">
              {session.email}
            </span>
            <span className="px-2 py-1 rounded bg-primary/20 text-primary font-semibold">
              {session.role || 'superadmin'}
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-slate-900/70 border-b border-slate-800/80 flex-shrink-0 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {navItems.map(item => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'text-white bg-slate-800 rounded-t-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70 rounded-t-lg'
                  }`}
                >
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {children}
        </div>
      </main>

      <footer className="bg-slate-900/80 border-t border-slate-800/80 flex-shrink-0 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <div>
                <span className="text-white font-semibold">Akademate</span>
                <span className="text-slate-500 text-xs ml-2">ops • multitenant</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="badge-dot" style={{ color: '#22c55e' }}>Sistemas operativos</span>
              <span className="text-slate-500">© {new Date().getFullYear()} Solaria / Akademate</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
