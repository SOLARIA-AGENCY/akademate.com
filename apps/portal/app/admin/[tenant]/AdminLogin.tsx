'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'

export function AdminLogin() {
  const emailRef = useRef<HTMLInputElement | null>(null)
  const passwordRef = useRef<HTMLInputElement | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const email = emailRef.current?.value?.trim() ?? ''
    const password = passwordRef.current?.value ?? ''

    if (!email || !password) {
      setError('Completa correo y contraseña.')
      if (!email) {
        emailRef.current?.focus()
      } else {
        passwordRef.current?.focus()
      }
      return
    }

    setError(null)
    window.location.href = '/dashboard'
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-6 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/60 p-8">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Admin</p>
          <h1 className="mt-2 text-2xl font-semibold">Acceso administrativo</h1>
          <p className="mt-2 text-sm text-slate-400">Gestiona tu academia desde aquí.</p>
        </div>
        <form className="mt-6 space-y-4" data-testid="admin-login" onSubmit={handleSubmit}>
          <label className="block text-sm">
            <span className="text-xs text-slate-400">Correo</span>
            <input
              ref={emailRef}
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm"
              type="email"
              name="email"
              autoComplete="email"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs text-slate-400">Contraseña</span>
            <input
              ref={passwordRef}
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm"
              type="password"
              name="password"
              autoComplete="current-password"
            />
          </label>
          {error && (
            <p className="error rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300" data-error>
              {error}
            </p>
          )}
          <button className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950" type="submit">
            Entrar
          </button>
        </form>
        <div className="mt-4 text-xs text-slate-400">
          <Link href="/" className="hover:text-emerald-300">Volver</Link>
        </div>
      </section>
    </main>
  )
}
