import Link from 'next/link'
import { BarChart3, Building2, GraduationCap, LockKeyhole, Network, Sparkles } from 'lucide-react'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'

const capabilities = [
  {
    icon: GraduationCap,
    title: 'Cursos y alumnado',
    text: 'El producto implementa superficies para catálogo, matrículas y gestión académica; la disponibilidad depende del despliegue y plan contratado.',
  },
  {
    icon: Building2,
    title: 'Organización por sedes',
    text: 'El modelo contempla centros físicos y scopes organizativos. La ampliación multi-entidad permanece interna y no se ofrece desde esta web.',
  },
  {
    icon: BarChart3,
    title: 'Operación y analítica',
    text: 'Existen vistas operativas y fuentes de datos integrables. No prometemos métricas “en tiempo real” sin conexión y configuración verificadas.',
  },
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_75%_20%,hsl(var(--primary)/0.16),transparent_38%)]" />
          <div className="mx-auto grid min-h-[calc(100svh-73px)] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:py-20">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[.22em] text-primary">
                Akademate · acceso anticipado
              </p>
              <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
                Una base operativa clara para centros de formación.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                Centraliza trabajo académico y administrativo sin presentar como activas las
                capacidades que aún están en validación. Akademate se encuentra en desarrollo y
                evaluación con organizaciones seleccionadas.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contacto"
                  className="rounded-md bg-primary px-5 py-3 text-center text-sm font-semibold text-primary-foreground"
                >
                  Solicitar información
                </Link>
                <Link
                  href="/transparencia-ia"
                  className="rounded-md border px-5 py-3 text-center text-sm font-semibold"
                >
                  Cómo tratamos la IA
                </Link>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Sin alta automática, prueba gratuita ni condiciones comerciales implícitas.
              </p>
            </div>
            <div aria-label="Estado del producto" className="border-l-2 border-primary/30 pl-6">
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Estado público
              </p>
              <dl className="mt-6 space-y-6">
                <div>
                  <dt className="font-semibold">Disponible para evaluación</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">
                    Demostración y definición de alcance con el equipo.
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold">Capacidades por verificar</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">
                    Pagos, automatizaciones, analítica externa e IA se confirman por entorno y
                    contrato.
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold">Sin certificación pública</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">
                    Los badges de privacidad e IA enlazan información; no son sellos de conformidad.
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
        <section id="producto" className="scroll-mt-24 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <p className="text-sm font-semibold text-primary">Producto verificable</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight">
              Capacidades descritas con sus límites
            </h2>
            <div className="mt-10 grid gap-0 border-y md:grid-cols-3">
              {capabilities.map(({ icon: Icon, title, text }) => (
                <article
                  key={title}
                  className="border-b p-6 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
                >
                  <Icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-5 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section id="confianza" className="scroll-mt-24 bg-slate-950 py-16 text-white sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-cyan-300">Diseño responsable</p>
                <h2 className="mt-3 text-3xl font-bold">
                  Permisos primero. Automatización después.
                </h2>
                <p className="mt-5 max-w-xl text-slate-300">
                  Las integraciones de IA/MCP están en evaluación. Antes de permitir acciones
                  deberán demostrar autorización backend, trazabilidad, supervisión y aislamiento
                  por organización.
                </p>
              </div>
              <div className="space-y-5">
                {[
                  {
                    icon: LockKeyhole,
                    title: 'Acceso limitado',
                    text: 'Ninguna interfaz pública demuestra por sí sola permisos efectivos.',
                  },
                  {
                    icon: Network,
                    title: 'Integraciones condicionadas',
                    text: 'Una conexión prevista no se anuncia como operativa hasta superar pruebas.',
                  },
                  {
                    icon: Sparkles,
                    title: 'IA informada',
                    text: 'La asistencia futura deberá identificarse y mantener revisión humana.',
                  },
                ].map(({ icon: Icon, title, text }) => (
                  <div key={title} className="flex gap-4 border-b border-white/15 pb-5">
                    <Icon className="mt-1 h-5 w-5 text-cyan-300" />
                    <div>
                      <h3 className="font-semibold">{title}</h3>
                      <p className="mt-1 text-sm text-slate-300">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="py-16 text-center sm:py-20">
          <div className="mx-auto max-w-2xl px-4">
            <h2 className="text-3xl font-bold">¿Quieres evaluar Akademate?</h2>
            <p className="mt-4 text-muted-foreground">
              Cuéntanos el tamaño y necesidades de tu centro. Responderemos con el alcance que
              podemos demostrar, no con una lista de promesas.
            </p>
            <Link
              href="/contacto"
              className="mt-7 inline-flex rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              Contactar
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
