'use client'
import React, { useState } from 'react'

export default function ComingSoonPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) return

    setStatus('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setStatus('success')
        setEmail('')
      } else {
        const data = await res.json().catch(() => ({}))
        setErrorMsg((data as { error?: string }).error ?? 'Error al registrar el email')
        setStatus('error')
      }
    } catch {
      setErrorMsg('Error de conexión. Inténtalo de nuevo.')
      setStatus('error')
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-background overflow-hidden">

      {/* Background gradient blob — igual que HeroSection */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 blur-3xl opacity-20">
          <div
            className="aspect-[1155/678] w-[72rem] bg-gradient-to-tr from-primary to-secondary"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>
        {/* Segundo blob bottom-right */}
        <div className="absolute right-0 bottom-0 blur-3xl opacity-10">
          <div
            className="aspect-square w-[40rem] bg-gradient-to-tl from-primary to-accent"
            style={{ clipPath: 'ellipse(60% 60% at 70% 70%)' }}
          />
        </div>
      </div>

      {/* Header mínimo */}
      <header className="w-full px-6 py-6 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">A</span>
          </div>
          <span className="font-bold text-lg tracking-tight">Akademate</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          En construcción
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">

          {/* Badge */}
          <div className="mb-8 inline-flex items-center rounded-full border bg-background px-4 py-1.5 text-sm shadow-sm">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-muted-foreground">Lanzamiento próximamente</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
            La plataforma para{' '}
            <span className="text-primary">gestionar tu academia</span>{' '}
            está llegando
          </h1>

          {/* Descripción — qué es Akademate */}
          <p className="text-lg text-muted-foreground leading-relaxed mb-6 max-w-xl mx-auto">
            Akademate es la plataforma SaaS todo-en-uno diseñada para centros de formación y academias.
            Gestión de cursos, matrículas, alumnos, comunicaciones y facturación en un único lugar.
          </p>

          {/* Features inline */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-12 text-sm text-muted-foreground">
            {[
              '✦ Gestión de cursos y ciclos',
              '✦ Campus virtual para alumnos',
              '✦ Matrículas y pagos integrados',
              '✦ Comunicaciones y leads',
              '✦ Analíticas en tiempo real',
              '✦ Multi-sede',
            ].map((f) => (
              <span key={f}>{f}</span>
            ))}
          </div>

          {/* Email capture */}
          <div className="bg-background/80 backdrop-blur-sm border rounded-xl p-6 sm:p-8 shadow-sm max-w-md mx-auto">
            <p className="text-sm font-semibold text-foreground mb-1">
              Sé el primero en conocerlo
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Regístrate y te avisamos cuando lancemos. Sin spam, solo lo importante.
            </p>

            {status === 'success' ? (
              <div className="flex flex-col items-center gap-2 py-2">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-green-700">¡Apuntado! Te avisaremos pronto.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setStatus('idle') }}
                  placeholder="tu@email.com"
                  required
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 placeholder:text-muted-foreground"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  {status === 'loading' ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  ) : 'Notifícame'}
                </button>
              </form>
            )}

            {status === 'error' && (
              <p className="mt-2 text-xs text-destructive">{errorMsg}</p>
            )}

            <p className="mt-3 text-xs text-muted-foreground">
              Sin compromiso · Sin spam · Puedes cancelar en cualquier momento
            </p>
          </div>

          {/* Contador/indicador social proof */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-foreground">100%</span>
              <span>Personalizable</span>
            </div>
            <div className="hidden sm:block h-8 w-px bg-border" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-foreground">Multi-sede</span>
              <span>Varias ubicaciones</span>
            </div>
            <div className="hidden sm:block h-8 w-px bg-border" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-foreground">SaaS</span>
              <span>Sin instalación</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer mínimo */}
      <footer className="px-6 py-6 text-center text-xs text-muted-foreground border-t">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <span>© {new Date().getFullYear()} Akademate. Todos los derechos reservados.</span>
          <span className="hidden sm:inline">·</span>
          <span>hola@akademate.com</span>
        </div>
      </footer>
    </div>
  )
}
