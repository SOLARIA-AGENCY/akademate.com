import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background py-20 sm:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 blur-3xl">
          <div
            className="aspect-[1155/678] w-[72rem] bg-gradient-to-tr from-primary to-secondary opacity-20"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center rounded-full border bg-background px-4 py-1.5 text-sm">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Producto en evaluación</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Akademate transforma tu academia con{' '}
            <span className="text-primary">tecnología moderna</span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Akademate es la plataforma todo-en-uno para gestionar tu centro de formación. Cursos,
            matrículas, pagos y comunicación con alumnos en un solo lugar.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/registro"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Solicitar información
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/transparencia-ia"
              className="inline-flex items-center justify-center rounded-md border px-6 py-3 text-sm font-medium hover:bg-accent"
            >
              Ver límites y transparencia
            </Link>
          </div>

          <p className="mt-12 text-sm text-muted-foreground">
            La disponibilidad se confirma por entorno y contrato.
          </p>
        </div>
      </div>
    </section>
  )
}
