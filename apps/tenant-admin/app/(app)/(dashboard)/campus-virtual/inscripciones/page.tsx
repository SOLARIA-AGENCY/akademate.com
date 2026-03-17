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
import { BulkEnrollmentDialog } from '@/app/(app)/(dashboard)/matriculas/components/BulkEnrollmentDialog'
import { GraduationCap, PlusCircle } from 'lucide-react'
import { traducirEstado } from '@payload-config/lib/estados'

interface EnrollmentRow {
  id: string
  status: string
  enrolledAt: string
  courseRun: {
    id: string
    title: string
    course: {
      title: string
    } | null
  } | null
  progress: {
    percent: number
  }
}

export default function CampusInscripcionesPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [courseFilter, setCourseFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)

  const fetchEnrollments = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/lms/enrollments?limit=50', {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!response.ok) {
        throw new Error('No se pudo cargar la lista de inscripciones')
      }
      const payload = (await response.json()) as { data?: EnrollmentRow[] }
      setEnrollments(payload.data ?? [])
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchEnrollments()
  }, [])

  const filteredRows = useMemo(() => {
    return enrollments.filter((row) => {
      const courseMatches = courseFilter === 'all' || row.courseRun?.course?.title === courseFilter
      const statusMatches = statusFilter === 'all' || row.status === statusFilter
      const dateMatches = !dateFilter || row.enrolledAt.startsWith(dateFilter)
      return courseMatches && statusMatches && dateMatches
    })
  }, [courseFilter, dateFilter, enrollments, statusFilter])

  const courseOptions = useMemo(() => {
    return Array.from(
      new Set(
        enrollments
          .map((item) => item.courseRun?.course?.title)
          .filter((value): value is string => Boolean(value))
      )
    )
  }, [enrollments])

  return (
    <div className="space-y-6" data-oid="w-pgk_j">
      <PageHeader
        title="Inscripciones LMS"
        description="Gestión de matrículas del campus virtual con filtros por curso, estado y fecha."
        icon={GraduationCap}
        badge={
          <Badge variant="default" data-oid="vje985l">
            Operativo
          </Badge>
        }
        data-oid="_th16w2"
      />

      <Card data-oid="46tr3z2">
        <CardHeader className="flex flex-row items-center justify-between gap-4" data-oid=".1sh-w.">
          <div data-oid="gp57gx.">
            <CardTitle data-oid="oy.hlz8">Filtros</CardTitle>
            <CardDescription data-oid="wbcj8v_">
              Refina resultados para revisar matrículas activas
            </CardDescription>
          </div>
          <Button onClick={() => setBulkDialogOpen(true)} data-oid="y.cn:pw">
            <PlusCircle className="mr-2 h-4 w-4" data-oid="7uboxlt" />
            Importar CSV
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3" data-oid="-2s5r35">
          <label className="text-sm text-muted-foreground" data-oid="6_-7d5d">
            Curso
            <select
              className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-foreground"
              value={courseFilter}
              onChange={(event) => setCourseFilter(event.target.value)}
              data-oid="t_07ba0"
            >
              <option value="all" data-oid="6ozjc0j">
                Todos
              </option>
              {courseOptions.map((course) => (
                <option key={course} value={course} data-oid="dn9l1ii">
                  {course}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-muted-foreground" data-oid="i7o7rnq">
            Estado
            <select
              className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-foreground"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              data-oid="7m1nzyb"
            >
              <option value="all" data-oid="o3tdjp1">
                Todos
              </option>
              <option value="active" data-oid="q:8avqi">
                Activo
              </option>
              <option value="completed" data-oid="npoyw.c">
                Completado
              </option>
              <option value="cancelled" data-oid="if366yl">
                Cancelado
              </option>
            </select>
          </label>

          <label className="text-sm text-muted-foreground" data-oid="poetxmg">
            Fecha
            <input
              type="date"
              className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-foreground"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              data-oid="-:p.eaz"
            />
          </label>
        </CardContent>
      </Card>

      <Card data-oid="6njf0f7">
        <CardHeader data-oid="a:r-qh.">
          <CardTitle data-oid="egbq2_q">Listado de inscripciones</CardTitle>
          <CardDescription data-oid=".dz.q.s">{filteredRows.length} registros</CardDescription>
        </CardHeader>
        <CardContent data-oid="dp064x5">
          {loading ? (
            <p className="text-sm text-muted-foreground" data-oid="yb3bsio">
              Cargando inscripciones...
            </p>
          ) : error ? (
            <p className="text-sm text-destructive" data-oid="he0jv6m">
              {error}
            </p>
          ) : (
            <Table data-oid="-azcy-_">
              <TableHeader data-oid="hfx2m:p">
                <TableRow data-oid="fwnmpzb">
                  <TableHead data-oid="ssikot3">Curso</TableHead>
                  <TableHead data-oid="u:w3wym">Run</TableHead>
                  <TableHead data-oid="4dqgmtt">Estado</TableHead>
                  <TableHead data-oid="hp7tet:">Progreso</TableHead>
                  <TableHead data-oid=":e_ac7g">Fecha alta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody data-oid="9y2ji8f">
                {filteredRows.map((row) => (
                  <TableRow key={row.id} data-oid="bafvja9">
                    <TableCell data-oid="3q:1:er">
                      {row.courseRun?.course?.title ?? (
                        <span
                          className="text-muted-foreground italic"
                          title="Sin vincular al LMS"
                          data-oid="ufxya4e"
                        >
                          Sin vincular
                        </span>
                      )}
                    </TableCell>
                    <TableCell data-oid=":1lszw:">
                      {row.courseRun?.title ?? (
                        <span className="text-muted-foreground italic" data-oid="4-a6pk5">
                          Sin run
                        </span>
                      )}
                    </TableCell>
                    <TableCell data-oid="3cmn_vn">
                      <Badge variant={traducirEstado(row.status).variant} data-oid="a2uo6tc">
                        {traducirEstado(row.status).label}
                      </Badge>
                    </TableCell>
                    <TableCell data-oid="lv4u_e-">{row.progress.percent}%</TableCell>
                    <TableCell data-oid="v496891">
                      {new Date(row.enrolledAt).toLocaleDateString('es-ES')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <BulkEnrollmentDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        onComplete={() => void fetchEnrollments()}
        data-oid="y8pe1ck"
      />
    </div>
  )
}
