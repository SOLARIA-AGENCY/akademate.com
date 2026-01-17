'use client'

import { useRef, useState } from 'react'

export function LoginForm() {
  const emailRef = useRef<HTMLInputElement | null>(null)
  const passwordRef = useRef<HTMLInputElement | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
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
    setTimeout(() => {
      window.location.href = '/dashboard'
    }, 300)
  }

  return (
    <section className="w-full max-w-lg rounded-3xl border border-border bg-card/70 p-8 shadow-2xl shadow-black/40">
      <div className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Campus Akademate</p>
        <h1 className="text-3xl font-semibold">Iniciar sesión</h1>
        <p className="text-sm text-muted-foreground">Accede a tus cursos y contenidos.</p>
      </div>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm">
          <span className="text-xs text-muted-foreground">Correo electrónico</span>
          <input
            ref={emailRef}
            type="email"
            name="email"
            className="mt-2 w-full rounded-lg border border-border bg-background/60 px-4 py-3 text-sm"
            placeholder="alumno@akademate.com"
            autoComplete="email"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs text-muted-foreground">Contraseña</span>
          <input
            ref={passwordRef}
            type="password"
            name="password"
            className="mt-2 w-full rounded-lg border border-border bg-background/60 px-4 py-3 text-sm"
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </label>
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-xs text-destructive">
            {error}
          </div>
        )}
        <button
          type="submit"
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Ingresando…' : 'Entrar'}
        </button>
      </form>
    </section>
  )
}
