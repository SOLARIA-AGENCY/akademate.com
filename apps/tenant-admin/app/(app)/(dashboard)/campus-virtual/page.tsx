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
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@payload-config/components/ui/table'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { GraduationCap, Award, BookOpen, Users, ExternalLink } from 'lucide-react'

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

const enrollmentStatusLabels: Record<string, string> = {
  active: 'Activo',
  completed: 'Completado',
  cancelled: 'Cancelado',
  paused: 'Pausado',
  pending: 'Pendiente',
}

const enrollmentStatusVariants: Record<string, 'success' | 'info' | 'destructive' | 'warning' | 'secondary'> = {
  active: 'success',
  completed: 'info',
  cancelled: 'destructive',
  paused: 'warning',
  pending: 'secondary',
}

// TODO: Fetch from API
const progressByCourseSeed: { course: string; progress: number }[] = []

export default function CampusVirtualOverviewPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isChartReady, setIsChartReady] = useState(false)

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

  useEffect(() => {
    setIsChartReady(true)
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
    <div className="space-y-6" data-oid="3roq2tg">
      <PageHeader
        title="Campus Virtual"
        description="Panel operativo del campus con inscripciones, progreso y certificados por tenant."
        icon={GraduationCap}
        badge={
          <Badge variant="default" data-oid="pf.vv2f">
            LMS Sync
          </Badge>
        }
        data-oid="fle6e1s"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" data-oid="p555u.a">
        <Card data-oid="f0ne3u6">
          <CardHeader
            className="flex flex-row items-center justify-between pb-2"
            data-oid="54rubhk"
          >
            <CardDescription data-oid="tgbum4j">Total inscritos activos</CardDescription>
            <Users className="h-5 w-5 text-primary/70" data-oid="azirtnn" />
          </CardHeader>
          <CardContent data-oid="ey2_px1">
            <div className="text-3xl font-bold" data-oid="ahv3gcg">
              {kpis.activeEnrollments}
            </div>
          </CardContent>
        </Card>
        <Card data-oid="vfurh.t">
          <CardHeader
            className="flex flex-row items-center justify-between pb-2"
            data-oid="kbm-dc6"
          >
            <CardDescription data-oid="6e6d_23">Cursos activos</CardDescription>
            <BookOpen className="h-5 w-5 text-primary/70" data-oid=".r_hxlt" />
          </CardHeader>
          <CardContent data-oid="vtf_fe_">
            <div className="text-3xl font-bold" data-oid="t3gdjw.">
              {kpis.activeCourses}
            </div>
          </CardContent>
        </Card>
        <Card data-oid="idnunsa">
          <CardHeader
            className="flex flex-row items-center justify-between pb-2"
            data-oid="1t:-uzz"
          >
            <CardDescription data-oid="bm1m-hc">Tasa de finalización</CardDescription>
            <GraduationCap className="h-5 w-5 text-primary/70" data-oid="5db21ga" />
          </CardHeader>
          <CardContent data-oid="yv5ix.6">
            <div className="text-3xl font-bold" data-oid="3336zaq">
              {kpis.completionRate}%
            </div>
          </CardContent>
        </Card>
        <Card data-oid="rwcdtq:">
          <CardHeader
            className="flex flex-row items-center justify-between pb-2"
            data-oid="4xtn9bc"
          >
            <CardDescription data-oid="9fb:hng">Certificados emitidos</CardDescription>
            <Award className="h-5 w-5 text-primary/70" data-oid=".g4v.b." />
          </CardHeader>
          <CardContent data-oid="uov6o0w">
            <div className="text-3xl font-bold" data-oid="56nr7:j">
              {kpis.issuedCertificates}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-5" data-oid="ub58o8g">
        <Card className="xl:col-span-3" data-oid="g60khsf">
          <CardHeader data-oid="1erulti">
            <CardTitle data-oid="ko1lyhn">Últimas inscripciones LMS</CardTitle>
            <CardDescription data-oid="i::cz-4">Últimos 10 registros sincronizados</CardDescription>
          </CardHeader>
          <CardContent data-oid="lmk8b9_">
            {loading ? (
              <p className="text-sm text-muted-foreground" data-oid="fgxmgxd">
                Cargando inscripciones...
              </p>
            ) : error ? (
              <p className="text-sm text-destructive" data-oid="ok9n9zv">
                {error}
              </p>
            ) : (
              <Table data-oid="x6sjqwg">
                <TableHeader data-oid="2.n3_r9">
                  <TableRow data-oid="zz5_x4z">
                    <TableHead data-oid="mao9:q2">Curso</TableHead>
                    <TableHead data-oid="_wup3g_">Estado</TableHead>
                    <TableHead data-oid="zxgkbpc">Progreso</TableHead>
                    <TableHead data-oid="y9ajvf_">Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody data-oid="k4:b_fb">
                  {enrollments.map((item) => (
                    <TableRow key={item.id} data-oid="u11numo">
                      <TableCell data-oid="yorzuxt">
                        {item.courseRun?.course?.title ?? (
                          <span
                            className="text-muted-foreground italic"
                            title="Pendiente de sincronización LMS"
                            data-oid="pddo90r"
                          >
                            Sin título
                          </span>
                        )}
                      </TableCell>
                      <TableCell data-oid="o:1qbp7">
                        <Badge
                          variant={enrollmentStatusVariants[item.status] ?? 'secondary'}
                          data-oid="l_pioj4"
                        >
                          {enrollmentStatusLabels[item.status] ?? item.status}
                        </Badge>
                      </TableCell>
                      <TableCell data-oid="_wg.kjh">{item.progress.percent}%</TableCell>
                      <TableCell data-oid="qcjxj99">
                        {new Date(item.enrolledAt).toLocaleDateString('es-ES')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2" data-oid="onu29q-">
          <CardHeader data-oid="n8849-n">
            <CardTitle data-oid="e26b6eh">Progreso por curso</CardTitle>
            <CardDescription data-oid="x-xc:n2">Distribución inicial de progreso</CardDescription>
          </CardHeader>
          <CardContent className="h-72" data-oid="sg_m7fb">
            {isChartReady ? (
              <ResponsiveContainer width="100%" height="100%" data-oid="fb7t2.p">
                <BarChart data={progressByCourseSeed} data-oid="-zgc6lz">
                  <CartesianGrid strokeDasharray="3 3" data-oid="c3c.fm8" />
                  <XAxis dataKey="course" tick={{ fontSize: 12 }} data-oid="-4w-wp:" />
                  <YAxis data-oid="sl9iudn" />
                  <Tooltip data-oid="55qksqr" />
                  <Bar
                    dataKey="progress"
                    fill="hsl(var(--primary))"
                    radius={[6, 6, 0, 0]}
                    data-oid="dm1q_4n"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full rounded-md bg-muted/30" />
            )}
          </CardContent>
        </Card>
      </section>

      <Card data-oid="6-7yidp">
        <CardHeader className="flex flex-row items-center justify-between" data-oid="h2y012d">
          <div data-oid="bkmj9a.">
            <CardTitle data-oid="6tbv:h0">Accesos rápidos</CardTitle>
            <CardDescription data-oid="gt3vcm9">Operaciones frecuentes de campus</CardDescription>
          </div>
          <Badge variant="outline" data-oid="tmnu5gw">
            Sincronización activa
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3" data-oid="9ae-i6n">
          <Button asChild data-oid="tc7tii0">
            <a
              href="http://localhost:3005/dashboard"
              target="_blank"
              rel="noreferrer"
              data-oid="5kc3b7n"
            >
              Ir al Campus (:3005)
              <ExternalLink className="ml-2 h-4 w-4" data-oid="16s3fm." />
            </a>
          </Button>
          <Button asChild variant="outline" data-oid="16b8nz:">
            <a href="/campus-virtual/contenido" data-oid="u01un-n">
              Gestionar Contenido
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
