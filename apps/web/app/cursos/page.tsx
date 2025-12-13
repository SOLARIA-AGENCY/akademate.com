import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Clock, Users, Star, Filter, Search } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Cursos',
  description: 'Explora nuestro catálogo de cursos de formación profesional',
}

// Mock data - will be replaced with CMS/API content
const categories = [
  'Todos',
  'Desarrollo',
  'Data',
  'Diseño',
  'Marketing',
  'Negocios',
]

const courses = [
  {
    id: '1',
    title: 'Desarrollo Web Full Stack',
    description: 'Aprende HTML, CSS, JavaScript, React y Node.js desde cero hasta nivel profesional.',
    price: 1299,
    duration: 320,
    students: 1240,
    rating: 4.9,
    instructor: 'María García',
    category: 'Desarrollo',
    level: 'Principiante',
  },
  {
    id: '2',
    title: 'Data Science con Python',
    description: 'Análisis de datos, machine learning y visualización con las herramientas más demandadas.',
    price: 999,
    duration: 200,
    students: 856,
    rating: 4.8,
    instructor: 'Carlos Ruiz',
    category: 'Data',
    level: 'Intermedio',
  },
  {
    id: '3',
    title: 'UX/UI Design Professional',
    description: 'Diseño de interfaces y experiencia de usuario con Figma, investigación y prototipado.',
    price: 799,
    duration: 160,
    students: 623,
    rating: 4.9,
    instructor: 'Ana Martínez',
    category: 'Diseño',
    level: 'Principiante',
  },
  {
    id: '4',
    title: 'Marketing Digital Avanzado',
    description: 'SEO, SEM, redes sociales, email marketing y analítica digital para profesionales.',
    price: 699,
    duration: 120,
    students: 445,
    rating: 4.7,
    instructor: 'Pedro López',
    category: 'Marketing',
    level: 'Avanzado',
  },
  {
    id: '5',
    title: 'Gestión de Proyectos con Scrum',
    description: 'Metodologías ágiles, Scrum Master certification prep, liderazgo de equipos.',
    price: 599,
    duration: 80,
    students: 312,
    rating: 4.8,
    instructor: 'Laura Sánchez',
    category: 'Negocios',
    level: 'Intermedio',
  },
  {
    id: '6',
    title: 'Ciberseguridad Empresarial',
    description: 'Protección de sistemas, ethical hacking, compliance y gestión de riesgos.',
    price: 1199,
    duration: 180,
    students: 289,
    rating: 4.9,
    instructor: 'Miguel Torres',
    category: 'Desarrollo',
    level: 'Avanzado',
  },
]

export default function CoursesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Catálogo de Cursos
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Descubre nuestra oferta formativa y encuentra el curso perfecto para tu carrera
            </p>

            {/* Search and filters */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Buscar cursos..."
                  className="w-full rounded-md border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button className="inline-flex items-center justify-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
                <Filter className="h-4 w-4" />
                Filtros
              </button>
            </div>

            {/* Category tabs */}
            <div className="mt-6 flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    category === 'Todos'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Courses grid */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <article
                  key={course.id}
                  className="group overflow-hidden rounded-2xl border bg-background shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Image placeholder */}
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20">
                    <div className="flex h-full items-center justify-center">
                      <span className="text-sm text-muted-foreground">
                        {course.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {course.category}
                      </span>
                      <span>•</span>
                      <span>{course.level}</span>
                    </div>

                    <h2 className="mt-3 text-lg font-semibold group-hover:text-primary">
                      <Link href={`/cursos/${course.id}`}>{course.title}</Link>
                    </h2>

                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {course.description}
                    </p>

                    <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{course.duration}h</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{course.students}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{course.rating}</span>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {formatCurrency(course.price)}
                      </span>
                      <Link
                        href={`/cursos/${course.id}`}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        Ver curso
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-12 flex justify-center gap-2">
              <button className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent">
                Anterior
              </button>
              <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                1
              </button>
              <button className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent">
                2
              </button>
              <button className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent">
                3
              </button>
              <button className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent">
                Siguiente
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
