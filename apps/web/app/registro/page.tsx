'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, GraduationCap, Loader2 } from 'lucide-react'
import { getRuntimePlatformUrls } from '@/lib/platform-access'

const benefits = [
  'Prueba gratuita 14 días',
  'Sin tarjeta de crédito',
  'Soporte incluido',
  'Migración de datos',
]

interface FormData {
  academyName: string
  name: string
  email: string
  phone: string
  message: string
}

export default function RegistroPage() {
  const [form, setForm] = useState<FormData>({
    academyName: '',
    name: '',
    email: '',
    phone: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.name,
          email: form.email,
          telefono: form.phone,
          asunto: 'demo',
          mensaje: `Academia: ${form.academyName}${form.message ? `\n\n${form.message}` : ''}`,
          gdpr_consent: true,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSubmitted(true)
      } else {
        setError(data.error ?? 'Error al enviar la solicitud. Inténtalo de nuevo.')
      }
    } catch {
      setError('Error de conexión. Por favor inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const tenantLoginUrl = `${getRuntimePlatformUrls().tenant}/auth/login`

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-3">¡Solicitud recibida!</h1>
          <p className="text-muted-foreground mb-8">
            Gracias por tu interés en Akademate. Nuestro equipo se pondrá en contacto contigo en las próximas 24 horas para configurar tu demo.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Volver al inicio
            </Link>
            <Link
              href={tenantLoginUrl}
              className="inline-flex items-center justify-center rounded-md border px-6 py-3 text-sm font-medium hover:bg-accent"
            >
              Ya tengo cuenta — Iniciar sesión
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background py-16 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-8 text-muted-foreground hover:text-foreground transition-colors">
            <GraduationCap className="h-5 w-5" />
            <span className="font-semibold">Akademate</span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Empieza tu prueba gratuita
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Configura tu academia en minutos. Sin permanencias ni compromisos.
          </p>

          {/* Benefits */}
          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2">
            {benefits.map((benefit) => (
              <span key={benefit} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                {benefit}
              </span>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="rounded-2xl border bg-card shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="academyName" className="block text-sm font-medium">
                Nombre de tu academia <span className="text-destructive">*</span>
              </label>
              <input
                id="academyName"
                type="text"
                required
                placeholder="ej. Academia García de Idiomas"
                value={form.academyName}
                onChange={(e) => setForm({ ...form, academyName: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium">
                  Tu nombre <span className="text-destructive">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="Nombre y apellidos"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium">
                  Teléfono
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="+34 600 000 000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Correo electrónico <span className="text-destructive">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="tu@academia.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="block text-sm font-medium">
                ¿Algo más que quieras contarnos?
              </label>
              <textarea
                id="message"
                rows={3}
                placeholder="Tipo de academia, número de alumnos, funcionalidades que necesitas..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  Solicitar demo gratuita
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              Al enviar este formulario aceptas nuestra{' '}
              <Link href="/legal/privacidad" className="underline hover:text-foreground">
                política de privacidad
              </Link>
              .
            </p>
          </form>
        </div>

        {/* Login link */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link href={tenantLoginUrl} className="font-medium text-primary hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
