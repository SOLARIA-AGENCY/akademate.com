'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from '@/lib/auth-client'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) { setError('El email es obligatorio.'); return }
    if (!password.trim()) { setError('La contraseña es obligatoria.'); return }

    setIsLoading(true)
    try {
      const result = await signIn.email({ email: email.trim(), password })
      if (result.error) {
        setError(
          result.error.message === 'Invalid email or password'
            ? 'Credenciales inválidas.'
            : (result.error.message ?? 'Error al iniciar sesión.')
        )
        setIsLoading(false)
        return
      }
      router.push(redirectTo)
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-indigo-600/25 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-cyan-500/15 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-md w-full space-y-8">
        <div className="text-center">
          <img
            src="/logos/akademate-icon-180.png"
            alt="Akademate"
            className="w-16 h-16 object-contain mb-4 mx-auto block"
          />
          <h1 className="text-3xl font-bold text-white mb-1">Akademate Ops</h1>
          <p className="text-slate-400">Panel multitenant para superadmin</p>
          <p className="text-xs text-slate-500 mt-1">Acceso restringido. Integra auth real en Payload/IdP.</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-700/60 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
          <form onSubmit={onSubmit} className="space-y-5">
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
                autoComplete="email"

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
                autoComplete="current-password"

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

          <div className="mt-6 p-4 bg-slate-800/60 rounded-lg border border-slate-700 text-xs text-slate-400 text-center">
            Autenticación con <strong className="text-slate-300">Better Auth 1.5</strong> — sesiones seguras httpOnly
          </div>
        </div>

        <div className="text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Akademate • Ops dashboard
        </div>
      </div>
    </div>
  )
}

export default function OpsLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
