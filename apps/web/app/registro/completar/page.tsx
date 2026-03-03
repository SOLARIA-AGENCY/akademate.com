'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, Loader2, CheckCircle2 } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

export default function CompletarRegistroPage() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const [form, setForm] = useState({ academyName: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!isPending && !session) {
      router.replace('/portal/login')
    }
  }, [session, isPending, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: session?.user.name ?? '',
          email: session?.user.email ?? '',
          telefono: form.phone,
          asunto: 'demo',
          mensaje: `Academia: ${form.academyName}\n\nRegistro vía Google OAuth`,
          gdpr_consent: true,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSubmitted(true)
        setTimeout(() => router.push('/dashboard'), 2000)
      } else {
        setError(data.error ?? 'Error al guardar la información. Inténtalo de nuevo.')
      }
    } catch {
      setError('Error de conexión. Por favor inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-3">¡Todo listo!</h1>
          <p className="text-muted-foreground">Redirigiendo a tu panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6 text-muted-foreground">
            <GraduationCap className="h-5 w-5" />
            <span className="font-semibold">Akademate</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Un último paso</h1>
          <p className="mt-2 text-muted-foreground">
            Cuéntanos sobre tu academia para configurar tu cuenta
          </p>
        </div>

        <div className="rounded-2xl border bg-card shadow-sm p-8">
          {session && (
            <div className="flex items-center gap-3 mb-6 p-3 rounded-lg bg-muted/50">
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name ?? ''}
                  className="h-10 w-10 rounded-full"
                />
              )}
              <div>
                <p className="text-sm font-medium">{session.user.name}</p>
                <p className="text-xs text-muted-foreground">{session.user.email}</p>
              </div>
            </div>
          )}

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

            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-medium">
                Teléfono de contacto
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

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Completar registro'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
