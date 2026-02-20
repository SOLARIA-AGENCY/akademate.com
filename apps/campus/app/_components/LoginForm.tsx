'use client'

import { useRef, useState } from 'react'

export function LoginForm() {
  const emailRef = useRef<HTMLInputElement | null>(null)
  const passwordRef = useRef<HTMLInputElement | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const email = emailRef.current?.value?.trim() ?? ''
    const password = passwordRef.current?.value ?? ''

    if (!email) {
      emailRef.current?.focus()
      setError('Introduce tu correo para continuar.')
      return
    }

    if (!password) {
      passwordRef.current?.focus()
      setError('Introduce tu contraseña para continuar.')
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/auth/dev-login', {
        method: 'POST',
        credentials: 'include',
        body: new URLSearchParams({ redirect: '/dashboard' }),
      })

      if (!response.ok) {
        throw new Error('No se pudo iniciar sesión en modo desarrollo.')
      }

      window.location.href = '/dashboard'
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Error de autenticación.')
      setIsSubmitting(false)
    }
  }

  return (
    <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-sm">
      <div className="space-y-2 text-center">
        <div className="mx-auto mb-2 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/30">
          <span className="text-xl font-bold text-white">A</span>
        </div>
        <p className="text-[10px] uppercase tracking-[0.22em] text-white/50">CAMPUS ALUMNO</p>
        <h1 className="text-3xl font-semibold text-white">Akademate Campus</h1>
        <p className="text-sm text-white/70">Accede a tus cursos y contenidos.</p>
      </div>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm">
          <span className="text-xs text-white/60">Correo electrónico</span>
          <input
            ref={emailRef}
            type="email"
            name="email"
            className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="alumno@akademate.com"
            autoComplete="email"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs text-white/60">Contraseña</span>
          <input
            ref={passwordRef}
            type="password"
            name="password"
            className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </label>
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-300">
            {error}
          </div>
        )}
        <button
          type="submit"
          className="h-11 w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-700 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Ingresando…' : 'Entrar'}
        </button>
      </form>
    </section>
  )
}
