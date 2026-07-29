'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, GraduationCap, Loader2 } from 'lucide-react'
import { getRuntimePlatformUrls } from '@/lib/platform-access'

const benefits = [
  'Solicitud sin compromiso',
  'Revisión de necesidades',
  'Alcance confirmado antes de activar',
]

type FormData = {
  academyName: string
  name: string
  email: string
  phone: string
  message: string
}
const emptyForm: FormData = { academyName: '', name: '', email: '', phone: '', message: '' }

export default function RegistroPage() {
  const [form, setForm] = useState<FormData>(emptyForm)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const tenantLoginUrl = `${getRuntimePlatformUrls().tenant}/auth/login`

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (!privacyAccepted) {
      setError('Debes aceptar la política de privacidad para continuar.')
      return
    }

    const nameParts = form.name.trim().split(/\s+/)
    const firstName = nameParts.shift() ?? ''
    setLoading(true)
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: nameParts.join(' ') || 'Sin apellido indicado',
          email: form.email,
          phone: form.phone,
          message: `Academia: ${form.academyName}${form.message ? `\n\n${form.message}` : ''}`,
          gdpr_consent: true,
          privacy_policy_accepted: true,
          marketing_consent: false,
        }),
      })
      const data = await response.json() as { success?: boolean; error?: string }
      if (!response.ok || !data.success) {
        setError(data.error ?? 'No se pudo enviar la solicitud. Inténtalo de nuevo.')
        return
      }
      setSubmitted(true)
    } catch {
      setError('Error de conexión. Por favor, inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-700" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold">Solicitud recibida</h1>
          <p className="mt-3 text-muted-foreground">Revisaremos la solicitud y te contactaremos para confirmar el alcance disponible.</p>
          <div className="mt-8 flex flex-col gap-3">
            <Link href="/" className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">Volver al inicio</Link>
            <Link href={tenantLoginUrl} className="inline-flex items-center justify-center rounded-md border px-6 py-3 text-sm font-medium hover:bg-accent">Ya tengo cuenta <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary/5 to-background px-4 py-14 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <header className="mb-10 text-center">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <GraduationCap className="h-5 w-5" aria-hidden="true" /><span className="font-semibold">Akademate</span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Solicita una demo de Akademate</h1>
          <p className="mt-4 text-lg text-muted-foreground">Cuéntanos qué necesita tu centro. No activaremos ninguna cuenta o entorno sin confirmar antes el alcance.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2">
            {benefits.map((benefit) => <span key={benefit} className="flex items-center gap-1.5 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-green-700" aria-hidden="true" />{benefit}</span>)}
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          {error && <div role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
          <div><label htmlFor="academyName" className="text-sm font-medium">Nombre del centro *</label><input id="academyName" required value={form.academyName} onChange={(event) => setForm({ ...form, academyName: event.target.value })} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div><label htmlFor="name" className="text-sm font-medium">Nombre y apellidos *</label><input id="name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
            <div><label htmlFor="phone" className="text-sm font-medium">Teléfono</label><input id="phone" type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
          </div>
          <div><label htmlFor="email" className="text-sm font-medium">Correo electrónico *</label><input id="email" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
          <div><label htmlFor="message" className="text-sm font-medium">Necesidades del centro</label><textarea id="message" rows={4} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} className="mt-1 w-full resize-none rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
          <label className="flex items-start gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={privacyAccepted} onChange={(event) => setPrivacyAccepted(event.target.checked)} className="mt-0.5" /><span>Acepto la <Link href="/legal/privacidad" className="underline hover:text-foreground">política de privacidad</Link> para gestionar esta solicitud. No acepto marketing por defecto.</span></label>
          <button type="submit" disabled={loading} className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando…</> : <>Solicitar demo<ArrowRight className="ml-2 h-4 w-4" /></>}</button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">¿Ya tienes cuenta? <Link href={tenantLoginUrl} className="font-medium text-primary hover:underline">Iniciar sesión</Link></p>
      </div>
    </main>
  )
}
