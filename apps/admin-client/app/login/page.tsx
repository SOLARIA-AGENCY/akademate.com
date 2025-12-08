'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

const DEV_USER_KEY = 'akademate-ops-user'

export default function OpsLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const devLoginEnabled = useMemo(
    () => process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN !== 'false',
    []
  )

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 450))

    const demoUser = {
      email: email || 'ops@akademate.com',
      role: 'superadmin',
      name: 'Demo Ops',
      tenantId: 'global-ops',
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(DEV_USER_KEY, JSON.stringify(demoUser))
    }

    router.push('/dashboard')
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-indigo-600/25 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-cyan-500/15 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-indigo-500/30">
            <span className="text-white font-bold text-3xl">A</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Akademate Ops</h1>
          <p className="text-slate-400">Panel multitenant para superadmin</p>
          <p className="text-xs text-slate-500 mt-1">Acceso restringido. Integra auth real en Payload/IdP.</p>
        </div>

        <div className="glass-panel p-8">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs text-amber-300 text-center">
              {devLoginEnabled
                ? 'Modo demo activo. No usar en producción.'
                : 'Auth real pendiente. Ajusta NEXT_PUBLIC_ENABLE_DEV_LOGIN si quieres desactivar/activar.'}
            </div>

            {error ? (
              <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-300 text-center">
                {error}
              </div>
            ) : null}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-2">
                Email de administrador
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/70 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="ops@akademate.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-200 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/70 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 focus:ring-4 focus:ring-indigo-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25"
            >
              {isLoading ? 'Validando acceso...' : 'Acceder al panel'}
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-slate-700" />
            <span className="px-4 text-xs text-slate-500">MULTITENANT OPS</span>
            <div className="flex-1 border-t border-slate-700" />
          </div>

          <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800 text-xs text-slate-400 text-center">
            El login real debe validar sesión global y claims `tenant_id`/`roles`.
            Usa un IdP central o Payload con cookies httpOnly.
          </div>
        </div>

        <div className="text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Akademate • Ops dashboard
        </div>
      </div>
    </div>
  )
}
