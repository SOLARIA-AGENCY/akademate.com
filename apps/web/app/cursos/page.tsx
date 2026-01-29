import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Clock, Users, Star, Filter, Search } from 'lucide-react'
import { cms } from '@/lib/cms'
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils'

/** Format currency with proper typing */
function formatCurrency(amount: number): string {
  return (formatCurrencyUtil as (amount: number, currency?: string) => string)(amount)
}

/** Course data structure from CMS */
interface Course {
  id: string
  title: string
  slug: string
  description: string
  shortDescription?: string
  price: number
  currency: string
  duration: number
  category: string
  level: 'beginner' | 'intermediate' | 'advanced'
  instructor: {
    id: string
    name: string
    avatar?: {
      id: string
      url: string
      alt: string
      width: number
      height: number
    }
  }
  image?: {
    id: string
    url: string
    alt: string
    width: number
    height: number
  }
  rating?: number
  studentsCount?: number
  status: 'draft' | 'published' | 'archived'
  createdAt: string
  updatedAt: string
}

/** Paginated response from CMS API */
interface CoursesResponse {
  docs: Course[]
  totalDocs: number
  limit: number
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export const metadata: Metadata = {
  title: 'Cursos',
  description: 'Explora nuestro catálogo de cursos de formación profesional',
}

/** Typed CMS client interface for getCourses */
interface CMSClient {
  getCourses: (params: { limit: number }) => Promise<CoursesResponse>
}

async function fetchCourses(): Promise<CoursesResponse> {
  try {
    const typedCms = cms as unknown as CMSClient
    const response = await typedCms.getCourses({ limit: 20 })
    return response
  } catch {
    return {
      docs: [],
      totalDocs: 0,
      limit: 20,
      page: 1,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    }
  }
}

export default async function CoursesPage() {
  const courseResponse = await fetchCourses()
  const courses = courseResponse.docs
  const categories: string[] = [
    'Todos',
    ...Array.from(new Set(courses.map((course) => course.category))).filter(
      (category): category is string => Boolean(category)
    ),
  ]
  const levelLabels: Record<string, string> = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
  }
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
                      <span>{levelLabels[course.level] ?? course.level}</span>
                    </div>

                    <h2 className="mt-3 text-lg font-semibold group-hover:text-primary">
                      <Link href={`/cursos/${course.slug}`}>{course.title}</Link>
                    </h2>

                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {course.shortDescription ?? course.description}
                    </p>

                    <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{course.duration}h</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{course.studentsCount ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{course.rating ?? '—'}</span>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {formatCurrency(course.price)}
                      </span>
                      <Link
                        href={`/cursos/${course.slug}`}
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
