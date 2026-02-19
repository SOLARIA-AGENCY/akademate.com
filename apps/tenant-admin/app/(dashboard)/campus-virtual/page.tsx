'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@payload-config/components/ui/card'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@payload-config/components/ui/table'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { GraduationCap, Award, BookOpen, Users, RefreshCw, ExternalLink } from 'lucide-react'

interface EnrollmentItem {
  id: string
  status: string
  enrolledAt: string
  courseRun: {
    id: string
    title: string
    course: {
      id: string
      title: string
      thumbnail?: string
    } | null
  } | null
  progress: {
    completed: number
    total: number
    percent: number
  }
}

const progressByCourseSeed = [
  { course: 'React Inicial', progress: 78 },
  { course: 'Node Backend', progress: 64 },
  { course: 'Marketing Digital', progress: 55 },
  { course: 'Inglés B2', progress: 84 },
]

export default function CampusVirtualOverviewPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadEnrollments = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/lms/enrollments?limit=10', {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!response.ok) {
        throw new Error('No se pudieron cargar inscripciones LMS')
      }
      const payload = (await response.json()) as { data?: EnrollmentItem[] }
      setEnrollments(payload.data ?? [])
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadEnrollments()
  }, [])

  const kpis = useMemo(() => {
    const activeEnrollments = enrollments.filter((item) => item.status === 'active').length
    const activeCourses = new Set(
      enrollments
        .map((item) => item.courseRun?.course?.id)
        .filter((value): value is string => Boolean(value))
    ).size
    const totalProgress = enrollments.reduce((sum, item) => sum + item.progress.percent, 0)
    const completionRate = enrollments.length ? Math.round(totalProgress / enrollments.length) : 0
    const issuedCertificates = enrollments.filter((item) => item.progress.percent >= 100).length

    return {
      activeEnrollments,
      activeCourses,
      completionRate,
      issuedCertificates,
    }
  }, [enrollments])

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Campus Virtual</h1>
          <Badge variant="default">LMS Sync</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Panel operativo del campus con inscripciones, progreso y certificados por tenant.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total inscritos activos</CardDescription>
            <CardTitle className="text-3xl">{kpis.activeEnrollments}</CardTitle>
          </CardHeader>
          <CardContent><Users className="h-5 w-5 text-muted-foreground" /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cursos activos</CardDescription>
            <CardTitle className="text-3xl">{kpis.activeCourses}</CardTitle>
          </CardHeader>
          <CardContent><BookOpen className="h-5 w-5 text-muted-foreground" /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tasa de finalización</CardDescription>
            <CardTitle className="text-3xl">{kpis.completionRate}%</CardTitle>
          </CardHeader>
          <CardContent><GraduationCap className="h-5 w-5 text-muted-foreground" /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Certificados emitidos</CardDescription>
            <CardTitle className="text-3xl">{kpis.issuedCertificates}</CardTitle>
          </CardHeader>
          <CardContent><Award className="h-5 w-5 text-muted-foreground" /></CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Últimas inscripciones LMS</CardTitle>
              <CardDescription>Últimos 10 registros sincronizados</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => void loadEnrollments()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refrescar
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando inscripciones...</p>
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Curso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.courseRun?.course?.title ?? 'Curso sin título'}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.progress.percent}%</TableCell>
                      <TableCell>{new Date(item.enrolledAt).toLocaleDateString('es-ES')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Progreso por curso</CardTitle>
            <CardDescription>Distribución inicial de progreso</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressByCourseSeed}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="course" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="progress" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Accesos rápidos</CardTitle>
            <CardDescription>Operaciones frecuentes de campus</CardDescription>
          </div>
          <Badge variant="outline">Sincronización activa</Badge>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <a href="http://localhost:3005/dashboard" target="_blank" rel="noreferrer">
              Ir al Campus (:3005)
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="/campus-virtual/contenido">
              Gestionar Contenido
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
