import {
  BookOpen,
  Users,
  CreditCard,
  BarChart3,
  Calendar,
  MessageSquare,
} from 'lucide-react'

const features = [
  {
    name: 'Gestión de Cursos',
    description:
      'Crea y organiza cursos con módulos, lecciones y recursos multimedia. Configura precios, horarios y modalidades.',
    icon: BookOpen,
  },
  {
    name: 'Alumnos y Matrículas',
    description:
      'Gestiona el ciclo completo del alumno: desde el lead hasta la matrícula. Seguimiento de progreso y asistencia.',
    icon: Users,
  },
  {
    name: 'Cobros según configuración',
    description:
      'Seguimiento administrativo e integraciones disponibles solo cuando estén configuradas y contratadas.',
    icon: CreditCard,
  },
  {
    name: 'Informes operativos',
    description:
      'Vistas y exportaciones sobre los datos disponibles, sin prometer analítica universal en tiempo real.',
    icon: BarChart3,
  },
  {
    name: 'Calendario y Horarios',
    description:
      'Planifica clases, exámenes y eventos. Las sincronizaciones externas dependen de integración verificada.',
    icon: Calendar,
  },
  {
    name: 'Comunicación',
    description:
      'Canales y notificaciones según los módulos y proveedores habilitados para el centro.',
    icon: MessageSquare,
  },
]

export function FeaturesSection() {
  return (
    <section className="py-20 sm:py-32" id="features">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">
            Funcionalidades
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Todo lo que necesitas para gestionar tu academia
          </p>
          <p className="mt-4 text-lg text-muted-foreground">
            Herramientas diseñadas específicamente para centros de formación,
            desde la captación de leads hasta la operación de matrículas y convocatorias.
          </p>
        </div>

        {/* Features grid */}
        <div className="mx-auto mt-16 max-w-5xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.name}
                className="relative rounded-2xl border bg-background p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{feature.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
