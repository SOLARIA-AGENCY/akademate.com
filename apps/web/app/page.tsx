'use client'
import React, { useState } from 'react'
import Image from 'next/image'
import { Plug, Zap, ShieldCheck } from 'lucide-react'

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

      {/* Background gradient blob */}
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
        <div className="absolute right-0 bottom-0 blur-3xl opacity-10">
          <div
            className="aspect-square w-[40rem] bg-gradient-to-tl from-primary to-accent"
            style={{ clipPath: 'ellipse(60% 60% at 70% 70%)' }}
          />
        </div>
      </div>

      {/* Header */}
      <header className="w-full px-6 py-6 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Image
            src="/logos/akademate-logo-official.png"
            alt="Akademate"
            width={32}
            height={32}
            priority
            className="h-8 w-8 object-contain"
          />
          <span className="font-bold text-lg tracking-tight">Akademate</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:inline">Lanzamiento próximo</span>
        </div>
      </header>

      {/* Main content */}
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

          {/* Description */}
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

          {/* Stats */}
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

      {/* AI Integration Section */}
      <section className="w-full px-4 py-16 border-t bg-muted/30">
        <div className="mx-auto max-w-3xl text-center">

          {/* Badge */}
          <div className="mb-6 inline-flex items-center rounded-full border bg-background px-4 py-1.5 text-sm shadow-sm gap-2">
            <svg className="h-3.5 w-3.5 text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            <span className="text-muted-foreground font-medium">Compatible con IA</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
            Gestiona tu academia desde cualquier IA
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-10 max-w-xl mx-auto">
            Akademate se conecta con los principales asistentes de inteligencia artificial mediante conectores MCP.
            Crea cursos, matricula alumnos, consulta analíticas y mucho más — directamente desde la IA que ya usas.
          </p>

          {/* AI logos grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-lg mx-auto mb-10">
            {[
              { name: 'Claude', logo: '/logos/ai/claude.svg', w: 120, h: 26, color: 'bg-orange-50 border-orange-100', desc: 'Anthropic' },
              { name: 'ChatGPT', logo: '/logos/ai/openai.svg', w: 40, h: 40, color: 'bg-emerald-50 border-emerald-100', desc: 'OpenAI' },
              { name: 'Grok', logo: '/logos/ai/grok.webp', w: 40, h: 40, color: 'bg-gray-50 border-gray-200', desc: 'xAI' },
              { name: 'Gemini', logo: '/logos/ai/gemini.svg', w: 40, h: 40, color: 'bg-purple-50 border-purple-100', desc: 'Google' },
            ].map((ai) => (
              <div
                key={ai.name}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 ${ai.color}`}
              >
                <div className="h-10 w-full flex items-center justify-center">
                  <Image src={ai.logo} alt={ai.name} width={ai.w} height={ai.h} className="object-contain max-h-10 max-w-full" />
                </div>
                <span className="text-sm font-semibold text-foreground">{ai.name}</span>
                <span className="text-xs text-muted-foreground">{ai.desc}</span>
              </div>
            ))}
          </div>

          {/* Feature bullets */}
          <div className="grid sm:grid-cols-3 gap-4 text-sm text-left">
            {[
              {
                Icon: Plug,
                title: 'Conector MCP nativo',
                desc: 'Integración directa con el protocolo Model Context Protocol para una conexión segura y en tiempo real.',
              },
              {
                Icon: Zap,
                title: 'Acciones desde el chat',
                desc: 'Crea cursos, añade alumnos, genera informes o revisa matrículas con un simple mensaje de texto.',
              },
              {
                Icon: ShieldCheck,
                title: 'Seguro y con permisos',
                desc: 'Cada acción respeta los roles y permisos de tu organización. Tu IA solo accede a lo que tú le autorices.',
              },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="bg-background rounded-lg border p-4">
                <Icon className="h-5 w-5 text-primary mb-2" strokeWidth={1.5} />
                <p className="font-semibold text-foreground mb-1">{title}</p>
                <p className="text-muted-foreground text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
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
