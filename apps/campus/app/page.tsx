'use client'

import { useEffect, useMemo, useState } from 'react'
import { BookOpen, CheckCircle, Loader2 } from 'lucide-react'
import { CourseCard } from '@/components/CourseCard'
import { fetchEnrollments } from '@/lib/api'

interface EnrollmentView {
  id: string
  title: string
  description?: string
  progressPercent: number
  completedLessons: number
  totalLessons: number
  status: 'pending' | 'active' | 'completed' | 'withdrawn' | 'failed'
  thumbnail?: string
}

export default function Page() {
  const [enrollments, setEnrollments] = useState<EnrollmentView[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const loadEnrollments = async () => {
      try {
        setErrorMessage(null)
        const response = await fetchEnrollments({ limit: 12 })
        const mapped = response.data.map((enrollment) => {
          const statusMap: Record<string, EnrollmentView['status']> = {
            active: 'active',
            completed: 'completed',
            cancelled: 'withdrawn',
          }

          return {
            id: enrollment.id,
            title: enrollment.courseRun?.course?.title ?? enrollment.courseRun?.title ?? 'Curso',
            description: undefined,
            progressPercent: enrollment.progress.percent ?? 0,
            completedLessons: enrollment.progress.completed ?? 0,
            totalLessons: enrollment.progress.total ?? 0,
            status: statusMap[enrollment.status] ?? 'pending',
            thumbnail: enrollment.courseRun?.course?.thumbnail ?? undefined,
          }
        })

        setEnrollments(mapped)
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Error al cargar cursos')
        setEnrollments([])
      } finally {
        setIsLoading(false)
      }
    }

    loadEnrollments()
  }, [])

  const stats = useMemo(() => {
    const total = enrollments.length
    const completed = enrollments.filter((e) => e.status === 'completed').length
    const inProgress = enrollments.filter((e) => e.status === 'active').length
    return { total, completed, inProgress }
  }, [enrollments])

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card/70 p-6 shadow-xl shadow-black/30">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Campus</p>
            <h1 className="text-2xl font-semibold">Mis cursos</h1>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-full bg-primary/15 px-3 py-1 text-primary">{stats.inProgress} en curso</span>
            <span className="rounded-full bg-secondary/15 px-3 py-1 text-secondary">{stats.completed} completados</span>
            <span className="rounded-full bg-accent/15 px-3 py-1 text-accent">{stats.total} total</span>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando cursos...
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      {!isLoading && enrollments.length === 0 && !errorMessage && (
        <div className="rounded-xl border border-border bg-background/60 p-6 text-center text-muted-foreground">
          Aún no tienes cursos asignados.
        </div>
      )}

      {enrollments.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((enrollment) => (
            <CourseCard
              key={enrollment.id}
              enrollmentId={enrollment.id}
              courseTitle={enrollment.title}
              courseDescription={enrollment.description}
              progressPercent={enrollment.progressPercent}
              completedLessons={enrollment.completedLessons}
              totalLessons={enrollment.totalLessons}
              status={enrollment.status}
              thumbnail={enrollment.thumbnail}
            />
          ))}
        </div>
      )}

      <div className="rounded-xl border border-border bg-background/60 p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          Accede a cada curso para ver módulos, evaluaciones y materiales.
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle className="h-4 w-4" />
          Certificados disponibles al completar el 100% del curso.
        </div>
      </div>
    </div>
  )
}
