'use client'

import * as React from 'react'
import Link from 'next/link'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Switch } from '@payload-config/components/ui/switch'
import { Skeleton } from '@payload-config/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@payload-config/components/ui/table'
import { Globe, ExternalLink, Pencil } from 'lucide-react'
import { fetchCoursesCatalog, type StudyTypeMeta } from '@/app/lib/client/courses-catalog'

type CourseItem = {
  id: string
  nombre: string
  slug: string
  studyType: 'privados' | 'ocupados' | 'desempleados' | 'teleformacion' | null
  studyTypeLabel: string
  studyTypeColor: string
  tipo: string
  active: boolean
  codigo: string
}

export default function WebCursosPage() {
  const [courses, setCourses] = React.useState<CourseItem[]>([])
  const [studyTypeMeta, setStudyTypeMeta] = React.useState<Record<string, StudyTypeMeta>>({})
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [togglingIds, setTogglingIds] = React.useState<Set<string>>(new Set())

  const fetchCourses = React.useCallback(async () => {
    try {
      setIsLoading(true)
      setErrorMessage(null)
      const result = await fetchCoursesCatalog<CourseItem>({
        includeInactive: true,
        limit: 1000,
        timeoutMs: 15000,
        retries: 2,
      })
      setCourses(result.courses)
      setStudyTypeMeta(result.studyTypeMeta)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al cargar cursos')
      setCourses([])
      setStudyTypeMeta({})
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void fetchCourses()
  }, [fetchCourses])

  const handleTogglePublish = React.useCallback(async (course: CourseItem) => {
    const nextActive = !course.active
    setTogglingIds((prev) => new Set(prev).add(course.id))
    try {
      const response = await fetch(`/api/cursos/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: nextActive }),
      })

      if (!response.ok) {
        throw new Error('No se pudo actualizar el estado de publicación')
      }

      setCourses((prev) =>
        prev.map((item) => (item.id === course.id ? { ...item, active: nextActive } : item))
      )
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al actualizar publicación')
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev)
        next.delete(course.id)
        return next
      })
    }
  }, [])

  const publishedCount = courses.filter((course) => course.active).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cursos Publicados"
        description="Catálogo publicable unificado desde Cursos. El estado de publicación usa el campo activo."
        icon={Globe}
        badge={
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{courses.length} total</Badge>
            <Badge variant="success">{publishedCount} publicados</Badge>
          </div>
        }
      />

      {isLoading && (
        <Card>
          <CardContent className="space-y-3 py-6">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      )}

      {errorMessage && (
        <Card>
          <CardContent className="py-6 text-sm text-destructive">{errorMessage}</CardContent>
        </Card>
      )}

      {!isLoading && !errorMessage && courses.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No hay cursos disponibles todavía.
          </CardContent>
        </Card>
      )}

      {!isLoading && !errorMessage && courses.length > 0 && (
        <Card className="overflow-x-auto">
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow>
                <TableHead>Curso</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-center">Publicación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => {
                const typeLabel = course.studyTypeLabel || studyTypeMeta[course.studyType ?? '']?.label || course.tipo
                const typeColor = course.studyTypeColor || studyTypeMeta[course.studyType ?? '']?.color || '#64748B'
                const isToggling = togglingIds.has(course.id)
                return (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">
                      <div className="space-y-1">
                        <p>{course.nombre}</p>
                        <p className="text-xs text-muted-foreground">{course.codigo}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className="inline-flex rounded-full px-2 py-1 text-xs font-semibold text-white"
                        style={{ backgroundColor: typeColor }}
                      >
                        {typeLabel}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {course.slug || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={course.active ? 'success' : 'outline'}>
                        {course.active ? 'Publicado' : 'Oculto'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={course.active}
                        disabled={isToggling}
                        onCheckedChange={() => void handleTogglePublish(course)}
                        aria-label={`Cambiar publicación de ${course.nombre}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/cursos/${course.id}/editar`}>
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Editar
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild={Boolean(course.slug)}
                          disabled={!course.slug || !course.active}
                        >
                          {course.slug ? (
                            <Link href={`/p/cursos/${course.slug}`} target="_blank" rel="noreferrer">
                              <ExternalLink className="mr-1 h-3.5 w-3.5" />
                              Ver página
                            </Link>
                          ) : (
                            <span className="inline-flex items-center">
                              <ExternalLink className="mr-1 h-3.5 w-3.5" />
                              Ver página
                            </span>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
