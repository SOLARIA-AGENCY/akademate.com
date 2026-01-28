import Link from 'next/link'
import { Clock, Users, Star, ArrowRight } from 'lucide-react'
import { cms, type CMSCourse } from '../../lib/cms'
import { formatCurrency } from '../../lib/utils'

export async function CoursesSection() {
  const courses: CMSCourse[] = await cms.getFeaturedCourses(3).catch(() => [])
  return (
    <section className="bg-muted/30 py-20 sm:py-32" id="courses">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">
              Cursos Destacados
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Formación de calidad para tu carrera
            </p>
          </div>
          <Link
            href="/cursos"
            className="inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            Ver todos los cursos
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        {/* Courses grid */}
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course: CMSCourse) => (
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

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {course.category}
                  </span>
                  <span>•</span>
                  <span>{course.instructor.name}</span>
                </div>

                <h3 className="mt-3 text-lg font-semibold group-hover:text-primary">
                  <Link href={`/cursos/${course.slug}`}>{course.title}</Link>
                </h3>

                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {course.shortDescription ?? course.description}
                </p>

                {/* Stats */}
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

                {/* Price and CTA */}
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
      </div>
    </section>
  )
}
