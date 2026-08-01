'use client'

import { BookOpen, GraduationCap, TrendingUp } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
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
import { useCampusDashboard } from '../../lib/use-campus-dashboard'
import { useSession } from '../../lib/session-context'

type CourseStatusDisplay = { label: string; variant: 'secondary' | 'success' | 'warning' }
const defaultCourseStatus: CourseStatusDisplay = { label: 'Activo', variant: 'secondary' }
const courseStatus: Record<string, CourseStatusDisplay> = {
  active: { label: 'Activo', variant: 'secondary' },
  confirmed: { label: 'Confirmado', variant: 'secondary' },
  in_progress: { label: 'En curso', variant: 'warning' },
  completed: { label: 'Completado', variant: 'success' },
}

function courseStatusFor(status: string): CourseStatusDisplay {
  return courseStatus[status] ?? defaultCourseStatus
}

export default function DashboardPage() {
  const { user } = useSession()
  const { dashboard, error, isLoading } = useCampusDashboard()
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Alumno'
  const averageProgress = dashboard?.enrollments.length
    ? Math.round(
        dashboard.enrollments.reduce((sum, item) => sum + item.progressPercent, 0) /
          dashboard.enrollments.length
      )
    : 0

  return (
    <CampusWorkspace activePath="/dashboard">
      <main className="space-y-6" data-testid="dashboard">
        <PageHeader
          eyebrow="Campus del alumno"
          title={`Bienvenido, ${displayName}`}
          description="Cursos, progreso y próximos pasos de tu matrícula."
        />

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Resumen">
          <MetricCard
            label="Cursos activos"
            value={dashboard?.stats.totalCourses ?? 0}
            hint="Matrículas en curso"
            icon={<BookOpen className="size-5" />}
          />
          <MetricCard
            label="Progreso medio"
            value={<span data-testid="completion-rate">{averageProgress}%</span>}
            hint="Sobre cursos visibles"
            icon={<TrendingUp className="size-5" />}
          />
          <MetricCard
            label="Cursos completados"
            value={dashboard?.stats.completedCourses ?? 0}
            hint="Historial académico"
            icon={<GraduationCap className="size-5" />}
          />
        </section>

        <Card aria-busy={isLoading}>
          <CardHeader>
            <CardTitle>Cursos activos</CardTitle>
            <CardDescription>Continúa desde el último punto guardado.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                role="status"
                aria-label="Cargando cursos"
              >
                {[0, 1, 2].map((item) => (
                  <Skeleton key={item} className="h-36" />
                ))}
              </div>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertTitle>No se pudieron cargar los cursos</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {!isLoading && !error && dashboard?.enrollments.length === 0 && (
              <EmptyState
                title="Sin cursos activos"
                description="Cuando tu academia confirme una matrícula, aparecerá aquí."
                icon={<BookOpen className="size-5" />}
              />
            )}
            {dashboard && dashboard.enrollments.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="courses-grid">
                {dashboard.enrollments.map((course) => (
                  <Card
                    key={course.id}
                    className="shadow-none transition-shadow duration-200 ease-in-out hover:shadow-md"
                    data-testid="course-card"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle>{course.courseTitle || course.courseRunTitle}</CardTitle>
                        <Badge variant={courseStatusFor(course.status).variant}>
                          {courseStatusFor(course.status).label}
                        </Badge>
                      </div>
                      <CardDescription>
                        {course.completedModules}/{course.totalModules} módulos
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Progreso</span>
                        <span>{course.progressPercent}%</span>
                      </div>
                      <Progress
                        className="mt-2"
                        value={course.progressPercent}
                        aria-label={`${course.progressPercent}% completado`}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground" data-testid="user-name">
          Sesión de {user?.email}
        </p>
      </main>
    </CampusWorkspace>
  )
}
