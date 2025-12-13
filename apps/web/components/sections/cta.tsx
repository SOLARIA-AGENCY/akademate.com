import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

const benefits = [
  'Sin permanencia ni compromisos',
  'Soporte técnico incluido',
  'Migración de datos gratuita',
  'Actualizaciones automáticas',
]

export function CTASection() {
  return (
    <section className="py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative isolate overflow-hidden rounded-3xl bg-primary px-6 py-16 shadow-2xl sm:px-16 lg:px-24">
          {/* Background pattern */}
          <svg
            viewBox="0 0 1024 1024"
            className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-x-1/2 -translate-y-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]"
            aria-hidden="true"
          >
            <circle
              cx={512}
              cy={512}
              r={512}
              fill="url(#cta-gradient)"
              fillOpacity="0.15"
            />
            <defs>
              <radialGradient id="cta-gradient">
                <stop stopColor="#fff" />
                <stop offset={1} stopColor="#fff" />
              </radialGradient>
            </defs>
          </svg>

          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              ¿Listo para transformar tu academia?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-foreground/80">
              Únete a más de 50 academias que ya gestionan su formación con Akademate.
              Prueba gratis durante 14 días, sin tarjeta de crédito.
            </p>

            {/* Benefits list */}
            <ul className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2">
              {benefits.map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-center gap-2 text-sm text-primary-foreground/90"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {benefit}
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/registro"
                className="inline-flex items-center justify-center rounded-md bg-white px-6 py-3 text-sm font-medium text-primary shadow-sm hover:bg-white/90"
              >
                Empezar prueba gratuita
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/contacto"
                className="inline-flex items-center justify-center rounded-md border border-primary-foreground/20 px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/10"
              >
                Contactar ventas
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
