import type { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ArrowUpRight, Globe, Shield, Database, Activity } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Accesos',
  description: 'Accesos rápidos a los sistemas principales de Akademate',
}

const accessItems = [
  {
    title: 'Web Pública',
    description: 'Landing pública y navegación principal.',
    href: 'http://100.99.60.106:3006',
    label: 'Abrir web',
    icon: Globe,
  },
  {
    title: 'Akademate Ops',
    description: 'Panel de operaciones y supervisión.',
    href: 'http://100.99.60.106:3004/login',
    label: 'Ir a Ops',
    icon: Shield,
  },
  {
    title: 'Payload CMS',
    description: 'Acceso al panel CMS y colecciones.',
    href: 'http://100.99.60.106:3003/admin/login',
    label: 'Ir a Payload',
    icon: Database,
  },
  {
    title: 'Health API',
    description: 'Verificación rápida de estado de Payload.',
    href: 'http://100.99.60.106:3003/api/health',
    label: 'Ver health',
    icon: Activity,
  },
]

export default function AccessHubPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-b from-primary/5 to-background">
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Centro de Accesos
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Entradas rápidas de AKADEMATE
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Usa esta página como agregador único para abrir los paneles y servicios principales.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {accessItems.map((item) => {
              const Icon = item.icon
              return (
                <article
                  key={item.title}
                  className="rounded-2xl border bg-background p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      {item.label}
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </div>
                  <h2 className="mt-5 text-xl font-semibold">{item.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                  <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-xs font-mono text-muted-foreground">
                    {item.href}
                  </p>
                </article>
              )
            })}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
