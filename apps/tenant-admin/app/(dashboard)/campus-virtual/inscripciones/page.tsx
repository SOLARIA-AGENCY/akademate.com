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
import { BulkEnrollmentDialog } from '@/app/(dashboard)/matriculas/components/BulkEnrollmentDialog'
import { GraduationCap, PlusCircle } from 'lucide-react'

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
      const courseMatches =
        courseFilter === 'all' || row.courseRun?.course?.title === courseFilter
      const statusMatches = statusFilter === 'all' || row.status === statusFilter
      const dateMatches =
        !dateFilter || row.enrolledAt.startsWith(dateFilter)
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
    <div className="space-y-6">
      <PageHeader
        title="Inscripciones LMS"
        description="Gestión de matrículas del campus virtual con filtros por curso, estado y fecha."
        icon={GraduationCap}
        badge={<Badge variant="default">Operativo</Badge>}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Refina resultados para revisar matrículas activas</CardDescription>
          </div>
          <Button onClick={() => setBulkDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Importar CSV
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <label className="text-sm text-muted-foreground">
            Curso
            <select
              className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-foreground"
              value={courseFilter}
              onChange={(event) => setCourseFilter(event.target.value)}
            >
              <option value="all">Todos</option>
              {courseOptions.map((course) => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </label>

          <label className="text-sm text-muted-foreground">
            Estado
            <select
              className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-foreground"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">Todos</option>
              <option value="active">active</option>
              <option value="completed">completed</option>
              <option value="cancelled">cancelled</option>
            </select>
          </label>

          <label className="text-sm text-muted-foreground">
            Fecha
            <input
              type="date"
              className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-foreground"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado de inscripciones</CardTitle>
          <CardDescription>{filteredRows.length} registros</CardDescription>
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
                  <TableHead>Run</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Progreso</TableHead>
                  <TableHead>Fecha alta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.courseRun?.course?.title ?? 'Sin curso'}</TableCell>
                    <TableCell>{row.courseRun?.title ?? 'Sin run'}</TableCell>
                    <TableCell>
                      <Badge variant={row.status === 'active' ? 'default' : 'secondary'}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.progress.percent}%</TableCell>
                    <TableCell>{new Date(row.enrolledAt).toLocaleDateString('es-ES')}</TableCell>
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
      />
    </div>
  )
}
