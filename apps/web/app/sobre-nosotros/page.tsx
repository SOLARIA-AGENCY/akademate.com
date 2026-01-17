import type { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Users, Target, HeartHandshake } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sobre Nosotros',
  description: 'Conoce la historia, el equipo y la mision de Akademate.',
}

const values = [
  {
    title: 'Mision clara',
    description: 'Empoderar a academias con tecnologia accesible y efectiva.',
    icon: Target,
  },
  {
    title: 'Compromiso real',
    description: 'Acompanamos a los equipos docentes en cada etapa.',
    icon: HeartHandshake,
  },
  {
    title: 'Comunidad',
    description: 'Construimos una red de academias que crecen juntas.',
    icon: Users,
  },
]

const team = [
  { name: 'Alicia Romero', role: 'CEO' },
  { name: 'Carlos Vega', role: 'CTO' },
  { name: 'Lucia Torres', role: 'Product Lead' },
  { name: 'Javier Gomez', role: 'Growth' },
]

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-b from-primary/5 to-background py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="company-name text-sm font-semibold text-primary">Akademate</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Akademate impulsa la formacion moderna
              </h1>
              <p className="company-description mt-4 text-lg text-muted-foreground">
                Somos una plataforma SaaS para academias que quieren crecer sin perder el foco en sus alumnos.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                50+ academias y centros confian en nuestra tecnologia.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Nuestra mision, valores y vision guian cada producto que lanzamos.
              </p>
              <div className="social-links mt-6 flex items-center justify-center gap-4 text-sm">
                <a
                  className="social-twitter text-primary hover:underline"
                  href="https://twitter.com/akademate"
                  rel="noreferrer"
                  target="_blank"
                >
                  Twitter
                </a>
                <a
                  className="social-linkedin text-primary hover:underline"
                  href="https://linkedin.com/in/akademate"
                  rel="noreferrer"
                  target="_blank"
                >
                  LinkedIn
                </a>
                <a
                  className="social-instagram text-primary hover:underline"
                  href="https://instagram.com/akademate"
                  rel="noreferrer"
                  target="_blank"
                >
                  Instagram
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {values.map((value) => {
                const Icon = value.icon
                return (
                  <div key={value.title} className="rounded-2xl border bg-background p-6 shadow-sm">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold">{value.title}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{value.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold">Nuestro equipo</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Un equipo multidisciplinar con experiencia en educacion y tecnologia.
              </p>
              <p className="team-count mt-2 text-sm font-medium text-primary">50+ Academias</p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {team.map((member) => (
                <div key={member.name} className="team-card rounded-xl border bg-background p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {member.name
                      .split(' ')
                      .map((word) => word[0])
                      .join('')}
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
