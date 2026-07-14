'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'

export default function CampusRecoverPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setError(null)
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/campus/auth/recover', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json() as { message?: string; error?: string }
      if (!response.ok) throw new Error(data.error ?? 'No se pudo procesar la solicitud')
      setMessage(data.message ?? 'Revisa tu correo para continuar.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo procesar la solicitud')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Recuperar acceso</CardTitle>
          <CardDescription>Te enviaremos instrucciones al correo asociado a tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recovery-email">Correo electronico</Label>
              <Input id="recovery-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={isSubmitting} />
            </div>
            {message && <p className="text-sm text-emerald-700">{message}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Enviando...' : 'Enviar instrucciones'}</Button>
            <Link className="ml-3 text-sm text-primary hover:underline" href="/campus/login">Volver al acceso</Link>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
