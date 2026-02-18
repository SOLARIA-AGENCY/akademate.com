'use client'

import { useRef, useState } from 'react'

type LoginPhase = 'credentials' | 'mfa'

export function OpsLoginForm() {
  const emailRef = useRef<HTMLInputElement | null>(null)
  const passwordRef = useRef<HTMLInputElement | null>(null)
  const totpRef = useRef<HTMLInputElement | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<LoginPhase>('credentials')
  const [mfaToken, setMfaToken] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleCredentialsSubmit = async () => {
    const email = emailRef.current?.value?.trim() ?? ''
    const password = passwordRef.current?.value ?? ''

    if (!email) {
      setError('Introduce tu correo.')
      emailRef.current?.focus()
      return
    }

    if (!password) {
      setError('Introduce tu contrasena.')
      passwordRef.current?.focus()
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data: Record<string, unknown> = await res.json()

      if (!res.ok) {
        setError(typeof data['error'] === 'string' ? data['error'] : 'Error de autenticacion.')
        return
      }

      if (data['requiresMfa'] === true && typeof data['mfaToken'] === 'string') {
        setMfaToken(data['mfaToken'])
        setPhase('mfa')
        return
      }

      // Login succeeded without MFA
      window.location.href = '/dashboard'
    } catch (_err) {
      setError('Error de conexion.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleMfaSubmit = async () => {
    const totpCode = totpRef.current?.value?.trim() ?? ''

    if (!totpCode) {
      setError('Introduce el codigo TOTP.')
      totpRef.current?.focus()
      return
    }

    if (!mfaToken) {
      setError('Sesion MFA expirada. Inicia sesion de nuevo.')
      setPhase('credentials')
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/auth/mfa-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mfaToken, totpCode }),
      })

      const data: Record<string, unknown> = await res.json()

      if (!res.ok) {
        setError(typeof data['error'] === 'string' ? data['error'] : 'Codigo TOTP invalido.')
        return
      }

      // MFA verified, login complete
      window.location.href = '/dashboard'
    } catch (_err) {
      setError('Error de conexion.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (phase === 'credentials') {
      void handleCredentialsSubmit()
    } else {
      void handleMfaSubmit()
    }
  }

  const handleBackToCredentials = () => {
    setPhase('credentials')
    setMfaToken(null)
    setError(null)
  }

  return (
    <form className="space-y-3 rounded-xl border border-border bg-background/60 p-4" onSubmit={handleSubmit}>
      {phase === 'credentials' && (
        <>
          <div>
            <label className="text-xs text-muted-foreground">Correo</label>
            <input
              ref={emailRef}
              type="email"
              className="mt-2 w-full rounded-lg border border-border bg-background/80 px-3 py-2 text-sm"
              placeholder="ops@akademate.com"
              autoComplete="email"
              disabled={submitting}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Contrasena</label>
            <input
              ref={passwordRef}
              type="password"
              className="mt-2 w-full rounded-lg border border-border bg-background/80 px-3 py-2 text-sm"
              placeholder="--------"
              autoComplete="current-password"
              disabled={submitting}
            />
          </div>
        </>
      )}

      {phase === 'mfa' && (
        <>
          <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-xs text-muted-foreground">
            Verificacion en dos pasos requerida. Introduce el codigo de tu aplicacion TOTP.
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Codigo TOTP</label>
            <input
              ref={totpRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              className="mt-2 w-full rounded-lg border border-border bg-background/80 px-3 py-2 text-sm tracking-widest"
              placeholder="000000"
              autoComplete="one-time-code"
              autoFocus
              disabled={submitting}
            />
          </div>
          <button
            type="button"
            className="text-xs text-muted-foreground underline"
            onClick={handleBackToCredentials}
            disabled={submitting}
          >
            Volver al inicio de sesion
          </button>
        </>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive" data-error>
          {error}
        </div>
      )}
      <button
        type="submit"
        className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        disabled={submitting}
      >
        {submitting ? 'Verificando...' : phase === 'mfa' ? 'Verificar codigo' : 'Entrar'}
      </button>
    </form>
  )
}
