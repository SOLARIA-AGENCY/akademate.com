'use client'

import Link from 'next/link'
import { Award, BookOpen, Clock3, Layers3 } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  MetricCard,
  PageHeader,
  Progress,
  Skeleton,
} from '@akademate/ui'

import { CampusWorkspace } from '../../components/CampusWorkspace'
import { progressSummaryFromEnrollments } from '../../lib/progress-summary'
import { useCampusDashboard } from '../../lib/use-campus-dashboard'

function remainingTime(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  if (hours === 0) return `${remainder} min`
  if (remainder === 0) return `${hours} h`
  return `${hours} h ${remainder} min`
}

export default function ProgressPage() {
  const { dashboard, error, isLoading } = useCampusDashboard()
  const summary = progressSummaryFromEnrollments(dashboard?.enrollments ?? [])

  return (
    <CampusWorkspace activePath="/progress">
      <main className="space-y-6" data-testid="progress-page">
        <PageHeader
          eyebrow="Actividad académica"
          title="Progreso"
          description="Avance calculado a partir de tus matrículas y lecciones registradas."
          actions={
            <Button asChild variant="outline" size="sm">
              <Link href="/certificates" prefetch={false}>
                <Award className="size-4" aria-hidden="true" />
                Certificados
              </Link>
            </Button>
          }
        />

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="status">
            <span className="sr-only">Cargando progreso</span>
            {[0, 1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-28" />
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo cargar el progreso</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Resumen">
            <MetricCard
              label="Progreso medio"
              value={<span data-testid="overall-progress">{summary.averageProgress}%</span>}
              hint="Sobre cursos visibles"
              icon={<BookOpen className="size-5" />}
            />
            <MetricCard
              label="Módulos completados"
              value={summary.completedModules}
              hint={`de ${summary.totalModules}`}
              icon={<Layers3 className="size-5" />}
            />
            <MetricCard
              label="Cursos activos"
              value={dashboard?.stats.totalCourses ?? 0}
              hint="Matrículas en curso"
              icon={<BookOpen className="size-5" />}
            />
            <MetricCard
              label="Tiempo estimado"
              value={remainingTime(summary.estimatedMinutesRemaining)}
              hint="Contenido pendiente"
              icon={<Clock3 className="size-5" />}
            />
          </section>
        )}

        <Card aria-busy={isLoading}>
          <CardHeader>
            <CardTitle>Progreso por curso</CardTitle>
            <CardDescription>Último avance guardado para cada matrícula.</CardDescription>
          </CardHeader>
          <CardContent data-testid="course-progress">
            {!isLoading && !error && dashboard?.enrollments.length === 0 && (
              <EmptyState
                title="Sin progreso disponible"
                description="El avance aparecerá cuando tengas una matrícula activa."
                icon={<BookOpen className="size-5" />}
              />
            )}
            {dashboard && dashboard.enrollments.length > 0 && (
              <div className="divide-y divide-border">
                {dashboard.enrollments.map((course) => (
                  <article key={course.id} className="py-5 first:pt-0 last:pb-0">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold">
                          {course.courseTitle || course.courseRunTitle}
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {course.completedModules} de {course.totalModules} módulos
                        </p>
                      </div>
                      <Badge variant={course.progressPercent === 100 ? 'success' : 'outline'}>
                        {course.progressPercent}%
                      </Badge>
                    </div>
                    <Progress
                      className="mt-3"
                      value={course.progressPercent}
                      data-testid="progress-bar"
                      aria-label={`${course.courseTitle}: ${course.progressPercent}% completado`}
                    />
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </CampusWorkspace>
  )
}
