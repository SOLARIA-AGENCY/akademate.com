import Link from 'next/link'
import type { Metadata } from 'next'
import {
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { RegulatoryNotice } from '@/components/legal/regulatory-notice'

export const metadata: Metadata = {
  title: 'Akademate — Gestión académica y operativa',
  description: 'Gestiona cursos, convocatorias, alumnado y matrículas con un alcance SaaS claro y configurable.',
  alternates: { canonical: '/' },
}

const capabilities = [
  {
    title: 'Cursos y convocatorias',
    description: 'Catálogo, ediciones, horarios y recursos asociados bajo la configuración de cada centro.',
    icon: BookOpen,
  },
  {
    title: 'Alumnado y matrículas',
    description: 'Seguimiento administrativo del ciclo de alta, matrícula, asistencia y progreso disponible.',
    icon: Users,
  },
  {
    title: 'Sedes y planificación',
    description: 'Modelado de sedes, aulas y calendarios sin prometer aislamiento por sede fuera del contrato activo.',
    icon: Building2,
  },
  {
    title: 'Calendario académico',
    description: 'Planificación de sesiones y detección de conflictos según los módulos configurados.',
    icon: CalendarDays,
  },
  {
    title: 'Roles y acceso',
    description: 'Acceso por tenant y rol. Los ámbitos más granulares dependen de la versión y configuración desplegadas.',
    icon: ShieldCheck,
  },
  {
    title: 'Informes operativos',
    description: 'Vistas y exportaciones sobre los datos disponibles; no se presenta como analítica universal en tiempo real.',
    icon: BarChart3,
  },
] as const

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main id="main-content" className="flex-1">
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_48%)]" />
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:px-8">
            <div>
              <p className="mb-6 inline-flex rounded-full border bg-background/80 px-3 py-1 text-sm text-muted-foreground shadow-sm">
                Plataforma SaaS para centros de formación
              </p>
              <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">
                Una base operativa para gestionar formación con más claridad
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                Akademate reúne cursos, convocatorias, alumnado, matrículas y operación académica.
                La disponibilidad concreta de cada módulo depende del entorno y del alcance contratado.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/registro"
                  className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  Solicitar acceso
                </Link>
                <Link
                  href="/#capacidades"
                  className="inline-flex min-h-11 items-center justify-center rounded-md border bg-background px-6 py-3 text-sm font-medium hover:bg-accent"
                >
                  Revisar capacidades
                </Link>
              </div>
              <div className="mt-8">
                <RegulatoryNotice />
              </div>
            </div>

            <aside className="rounded-3xl border bg-card p-7 shadow-xl shadow-primary/5" aria-label="Alcance del producto">
              <p className="text-sm font-semibold text-primary">Alcance verificable</p>
              <h2 className="mt-2 text-2xl font-semibold">Producto configurable, sin claims absolutos</h2>
              <ul className="mt-6 space-y-4 text-sm text-muted-foreground">
                <li><strong className="text-foreground">SaaS general:</strong> gestión académica y operativa según módulos activos.</li>
                <li><strong className="text-foreground">Multi-sede:</strong> datos y planificación por sede; el aislamiento granular requiere validación del despliegue.</li>
                <li><strong className="text-foreground">Pagos:</strong> integraciones y flujos dependen de configuración y contrato.</li>
                <li><strong className="text-foreground">IA y MCP:</strong> no se anuncian como capacidad general activa.</li>
              </ul>
            </aside>
          </div>
        </section>

        <section id="capacidades" className="scroll-mt-24 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">Capacidades generales</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Una superficie pública alineada con el producto real</h2>
              <p className="mt-4 text-muted-foreground">
                Estas áreas existen en el código de Akademate. No implican que todas estén habilitadas para todos los clientes ni sustituyen el alcance contractual.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {capabilities.map(({ title, description, icon: Icon }) => (
                <article key={title} className="rounded-2xl border bg-card p-6 shadow-sm">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y bg-muted/30 py-16">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-semibold">¿Quieres validar el encaje con tu centro?</h2>
              <p className="mt-3 text-muted-foreground">
                Revisamos contigo módulos, datos, integraciones y límites antes de presentar una propuesta. Una solicitud no activa producción ni constituye un contrato.
              </p>
            </div>
            <Link href="/contacto" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Hablar con el equipo
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
