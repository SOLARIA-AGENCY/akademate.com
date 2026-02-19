import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Building2, Database, Shield, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Login',
  description: 'Accesos de autenticación para clientes y operadores de Akademate',
}

const loginTargets = [
  {
    title: 'Acceso Cliente (CMS)',
    description: 'Panel del cliente para gestión de cursos, usuarios y contenidos.',
    href: 'http://100.99.60.106:3003/admin/login',
    cta: 'Entrar como cliente',
    icon: Building2,
  },
  {
    title: 'Acceso Operaciones (Ops)',
    description: 'Panel interno de operaciones (solo superadmin).',
    href: 'http://100.99.60.106:3004/login',
    cta: 'Entrar en Ops',
    icon: Shield,
  },
  {
    title: 'API de Salud',
    description: 'Comprobación rápida del estado del backend Payload.',
    href: 'http://100.99.60.106:3003/api/health',
    cta: 'Ver estado',
    icon: Database,
  },
]

export default function LoginHubPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-b from-primary/5 to-background">
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Login Akademate</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Accede al entorno correcto
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Selecciona el tipo de acceso que necesitas para entrar rápidamente.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {loginTargets.map((target) => {
              const Icon = target.icon
              return (
                <article
                  key={target.title}
                  className="rounded-2xl border bg-background p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="mt-4 text-xl font-semibold">{target.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{target.description}</p>
                  <a
                    href={target.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    {target.cta}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </article>
              )
            })}
          </div>

          <div className="mt-10 rounded-2xl border bg-background p-5 text-sm text-muted-foreground">
            ¿Necesitas todos los accesos en una sola pantalla?{' '}
            <Link href="/accesos" className="font-medium text-primary hover:underline">
              Ir al agregador de accesos
            </Link>
            .
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
