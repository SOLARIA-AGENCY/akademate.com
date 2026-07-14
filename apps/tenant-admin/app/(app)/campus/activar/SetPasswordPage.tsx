'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'

export function SetPasswordPage({ mode }: { mode: 'activate' | 'reset' }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(token ? null : 'Falta el token de acceso.')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!token) return setError('Falta el token de acceso.')
    if (password !== confirmation) return setError('Las contrasenas no coinciden.')
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/campus/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await response.json() as { error?: string }
      if (!response.ok) throw new Error(data.error ?? 'No se pudo guardar la contrasena')
      router.replace('/campus/login?updated=1')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo guardar la contrasena')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isActivation = mode === 'activate'
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{isActivation ? 'Activa tu acceso' : 'Restablece tu contrasena'}</CardTitle>
        <CardDescription>{isActivation ? 'Crea la contrasena de tu Campus Virtual.' : 'Elige una nueva contrasena para continuar.'}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campus-password">Contrasena</Label>
            <Input id="campus-password" type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required disabled={isSubmitting} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="campus-password-confirmation">Repite la contrasena</Label>
            <Input id="campus-password-confirmation" type="password" minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required disabled={isSubmitting} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={isSubmitting || !token}>{isSubmitting ? 'Guardando...' : 'Guardar contrasena'}</Button>
          <Link className="ml-3 text-sm text-primary hover:underline" href="/campus/login">Volver al acceso</Link>
        </form>
      </CardContent>
    </Card>
  )
}
