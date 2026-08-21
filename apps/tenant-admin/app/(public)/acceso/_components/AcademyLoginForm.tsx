'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'

export function AcademyLoginForm({
  recoverHref,
  helpHref,
}: {
  recoverHref: string
  helpHref: string
}) {
  const router = useRouter()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [errorMessage, setErrorMessage] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setErrorMessage('')
    try {
      const response = await fetch('/api/campus/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: string }
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Correo o contraseña no válidos.')
      }
      router.push('/campus')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo iniciar sesión.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3">
      {errorMessage ? (
        <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}
      <div>
        <label className="text-xs font-semibold text-neutral-950" htmlFor="academy-email">
          Correo del alumno
        </label>
        <Input
          id="academy-email"
          type="email"
          autoComplete="username"
          className="mt-1"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={submitting}
        />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-neutral-950" htmlFor="academy-password">
            Contraseña
          </label>
          <a href={recoverHref} className="text-[11px] text-muted-foreground underline">
            Recuperar acceso
          </a>
        </div>
        <Input
          id="academy-password"
          type="password"
          autoComplete="current-password"
          className="mt-1"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          disabled={submitting}
        />
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Entrando…' : 'Entrar al campus'}
      </Button>
      <p className="text-[11px] text-muted-foreground">
        Si aún no tienes credenciales,{' '}
        <a href={helpHref} className="underline">
          habla con orientación
        </a>
        . El personal del centro entra por el acceso interno.
      </p>
    </form>
  )
}
