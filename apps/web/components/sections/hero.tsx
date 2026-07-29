import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="bg-gradient-to-b from-primary/5 to-background py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <p className="inline-flex rounded-full border bg-background px-4 py-1.5 text-sm text-muted-foreground">Acceso sujeto a disponibilidad</p>
        <h1 className="mt-8 text-4xl font-bold tracking-tight sm:text-6xl">Gestiona la operación académica con <span className="text-primary">un alcance claro</span></h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">Akademate reúne cursos, convocatorias, alumnado y matrículas. Cada módulo e integración se confirma según el entorno y el alcance contratado.</p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/registro" className="inline-flex min-h-11 items-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">Solicitar acceso<ArrowRight className="ml-2 h-4 w-4" /></Link>
          <Link href="/#capacidades" className="inline-flex min-h-11 items-center rounded-md border px-6 py-3 text-sm font-medium">Revisar capacidades</Link>
        </div>
      </div>
    </section>
  )
}
