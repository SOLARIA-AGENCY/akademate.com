import Link from 'next/link'
import { ArrowRight, Play } from 'lucide-react'

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
            <span className="text-muted-foreground">Nueva plataforma disponible</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Akademate transforma tu academia con{' '}
            <span className="text-primary">tecnología moderna</span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Akademate es la plataforma todo-en-uno para gestionar tu centro de formación.
            Cursos, matrículas, pagos y comunicación con alumnos en un solo lugar.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/demo"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Empezar ahora
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/tour"
              className="inline-flex items-center justify-center rounded-md border px-6 py-3 text-sm font-medium hover:bg-accent"
            >
              <Play className="mr-2 h-4 w-4" />
              Ver video tour
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-16 flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground">
              +50 academias confían en Akademate
            </p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className="h-5 w-5 fill-yellow-400"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="ml-2 text-sm font-medium">4.9/5</span>
              <span className="text-sm text-muted-foreground">(120+ reseñas)</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
