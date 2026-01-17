'use client'

import { useRef, useState } from 'react'

export function OpsLoginForm() {
  const emailRef = useRef<HTMLInputElement | null>(null)
  const passwordRef = useRef<HTMLInputElement | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const email = emailRef.current?.value?.trim() ?? ''
    const password = passwordRef.current?.value ?? ''

    if (!email) {
      setError('Introduce tu correo.')
      emailRef.current?.focus()
      return
    }

    if (!password) {
      setError('Introduce tu contraseña.')
      passwordRef.current?.focus()
      return
    }

    setError(null)
  }

  return (
    <form className="space-y-3 rounded-xl border border-border bg-background/60 p-4" onSubmit={handleSubmit}>
      <div>
        <label className="text-xs text-muted-foreground">Correo</label>
        <input
          ref={emailRef}
          type="email"
          className="mt-2 w-full rounded-lg border border-border bg-background/80 px-3 py-2 text-sm"
          placeholder="ops@akademate.com"
          autoComplete="email"
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Contraseña</label>
        <input
          ref={passwordRef}
          type="password"
          className="mt-2 w-full rounded-lg border border-border bg-background/80 px-3 py-2 text-sm"
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </div>
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive" data-error>
          {error}
        </div>
      )}
      <button type="submit" className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
        Entrar
      </button>
    </form>
  )
}
