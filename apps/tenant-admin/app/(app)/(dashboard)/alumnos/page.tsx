'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import {
  AcademicEntityCard,
  ACADEMIC_LISTING_GRID_CLASS,
  AKADEMATE_ACADEMIC_FALLBACK_IMAGE,
  DashboardListingLayout,
  DashboardToolbar,
  ListingActions,
  ListingColumnBoard,
  PERSON_LIST_COLUMNS,
} from '@payload-config/components/akademate/dashboard'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import { Plus, User } from 'lucide-react'
import { ViewToggle } from '@payload-config/components/ui/ViewToggle'
import { downloadCsv, printTable, type ExportColumn } from '@/app/lib/dashboard-export'
import { joinStudentWithEnrollments } from '@/src/domain/student-enrollment-join'

interface Student {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  active: boolean
  enrolled_courses: number
  completed_courses: number
  sede: string
  curso_actual: string
  ciclo: string
  fecha_inscripcion: string
}

interface StudentApiDoc {
  id: string | number
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  status?: string
  createdAt?: string
}

interface StudentsApiResponse {
  docs?: StudentApiDoc[]
}

export default function AlumnosPage() {
  const router = useRouter()

  // Estados de visualización
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Estados de filtrado
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSede, setFilterSede] = useState('all')
  const [filterCurso, setFilterCurso] = useState('all')
  const [filterCiclo, setFilterCiclo] = useState('all')

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setErrorMessage(null)
        const response = await fetch('/api/students?limit=100&sort=-createdAt', {
          cache: 'no-cache',
        })
        if (!response.ok) {
          throw new Error('No se pudieron cargar los alumnos')
        }

        const payload = (await response.json()) as StudentsApiResponse
        const docs: StudentApiDoc[] = Array.isArray(payload.docs) ? payload.docs : []
        const enrollmentsRes = await fetch('/api/matriculas?limit=200', { cache: 'no-store' })
        const enrollmentsPayload = enrollmentsRes.ok
          ? ((await enrollmentsRes.json()) as {
              docs?: Array<{
                status?: string
                lead?: { email?: string }
                course?: { name?: string }
                campus?: { name?: string }
                cycle?: { name?: string | null }
              }>
            })
          : { docs: [] }
        const enrollmentRows = (enrollmentsPayload.docs ?? []).map((row) => ({
          email: row.lead?.email,
          status: row.status,
          campusName: row.campus?.name,
          courseName: row.course?.name,
          cycleName: row.cycle?.name,
        }))
        const mapped: Student[] = docs.map((student: StudentApiDoc) => {
          const status = student.status
          const joined = joinStudentWithEnrollments({ email: student.email }, enrollmentRows)
          return {
            id: String(student.id),
            first_name: student.first_name ?? '',
            last_name: student.last_name ?? '',
            email: student.email ?? '—',
            phone: student.phone ?? '—',
            active: status ? status === 'active' : true,
            enrolled_courses: joined.enrolled_courses,
            completed_courses: joined.completed_courses,
            sede: joined.sede,
            curso_actual: joined.curso_actual,
            ciclo: joined.ciclo,
            fecha_inscripcion: student.createdAt ?? '',
          }
        })

        setStudents(mapped)
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Error al cargar alumnos')
        setStudents([])
      } finally {
        setIsLoading(false)
      }
    }

    void fetchStudents()
  }, [])

  const handleViewStudent = (studentId: string) => {
    router.push(`/dashboard/alumnos/${studentId}`)
  }

  const handleEditStudent = (studentId: string) => {
    router.push(`/dashboard/alumnos/${studentId}/editar`)
  }

  // Extraer valores únicos para filtros
  const sedes = Array.from(new Set(students.map((s) => s.sede))).filter(Boolean)
  const cursos = Array.from(
    new Set(students.map((s) => s.curso_actual).filter((c) => c !== '-'))
  ).filter(Boolean)
  const ciclos = Array.from(new Set(students.map((s) => s.ciclo))).filter(Boolean)

  // Filtrado
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && student.active) ||
      (filterStatus === 'inactive' && !student.active)

    const matchesSede = filterSede === 'all' || student.sede === filterSede
    const matchesCurso = filterCurso === 'all' || student.curso_actual === filterCurso
    const matchesCiclo = filterCiclo === 'all' || student.ciclo === filterCiclo

    return matchesSearch && matchesStatus && matchesSede && matchesCurso && matchesCiclo
  })

  const exportColumns: ExportColumn<Student>[] = [
    { header: 'Nombre', getValue: (student) => `${student.first_name} ${student.last_name}` },
    { header: 'Email', getValue: (student) => student.email },
    { header: 'Telefono', getValue: (student) => student.phone },
    { header: 'Estado', getValue: (student) => (student.active ? 'Activo' : 'Inactivo') },
    { header: 'Sede', getValue: (student) => student.sede },
    { header: 'Curso', getValue: (student) => student.curso_actual },
    { header: 'Ciclo', getValue: (student) => student.ciclo },
  ]

  const handlePrint = () => printTable('Alumnos', exportColumns, filteredStudents)
  const handleCsv = () =>
    downloadCsv(
      `alumnos-${new Date().toISOString().slice(0, 10)}.csv`,
      exportColumns,
      filteredStudents
    )

  return (
    <DashboardListingLayout
      title="Alumnos"
      icon={User}
      actions={
        <ListingActions onPrint={handlePrint} onCsv={handleCsv}>
          <Button size="sm" className="shrink-0" onClick={() => router.push('/dashboard/alumnos/nuevo')}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo alumno</span>
          </Button>
        </ListingActions>
      }
      toolbar={
        <DashboardToolbar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Buscar por nombre o email..."
          filters={
            <>
              <Select value={filterStatus} onValueChange={setFilterStatus} data-oid="8gn04-c">
                <SelectTrigger className="w-full min-w-0" data-oid=":.:.p3e">
                  <SelectValue placeholder="Estado" data-oid="wrk4a2x" />
                </SelectTrigger>
                <SelectContent data-oid="neuz-.3">
                  <SelectItem value="all" data-oid="itl3tn_">
                    Todos los estados
                  </SelectItem>
                  <SelectItem value="active" data-oid=":zs2vyc">
                    Activos
                  </SelectItem>
                  <SelectItem value="inactive" data-oid="2jzbrsm">
                    Inactivos
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterSede} onValueChange={setFilterSede} data-oid="ah85kl0">
                <SelectTrigger className="w-full min-w-0" data-oid="_-je2:c">
                  <SelectValue placeholder="Sede" data-oid="hg5vqi2" />
                </SelectTrigger>
                <SelectContent data-oid=":p47ksq">
                  <SelectItem value="all" data-oid="_5ra9.d">
                    Todas las sedes
                  </SelectItem>
                  {sedes.map((sede) => (
                    <SelectItem key={sede} value={sede} data-oid="mqcbyh_">
                      {sede}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterCurso} onValueChange={setFilterCurso} data-oid="zd.guip">
                <SelectTrigger className="w-full min-w-0" data-oid="5mx06il">
                  <SelectValue placeholder="Curso" data-oid="oj62xzc" />
                </SelectTrigger>
                <SelectContent data-oid="xo2qpfm">
                  <SelectItem value="all" data-oid=":4n:frr">
                    Todos los cursos
                  </SelectItem>
                  {cursos.map((curso) => (
                    <SelectItem key={curso} value={curso} data-oid="o3rms35">
                      {curso}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterCiclo} onValueChange={setFilterCiclo} data-oid="yzzmgac">
                <SelectTrigger className="w-full min-w-0" data-oid="8w3syz2">
                  <SelectValue placeholder="Ciclo" data-oid="x676wrn" />
                </SelectTrigger>
                <SelectContent data-oid="min-q8c">
                  <SelectItem value="all" data-oid="c3ijif3">
                    Todos los ciclos
                  </SelectItem>
                  {ciclos.map((ciclo) => (
                    <SelectItem key={ciclo} value={ciclo} data-oid="oe33wrz">
                      {ciclo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
          clearAction={
            searchTerm ||
            filterStatus !== 'all' ||
            filterSede !== 'all' ||
            filterCurso !== 'all' ||
            filterCiclo !== 'all' ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setFilterStatus('all')
                  setFilterSede('all')
                  setFilterCurso('all')
                  setFilterCiclo('all')
                }}
                data-oid="dqkla-s"
              >
                Limpiar filtros
              </Button>
            ) : null
          }
          viewToggle={<ViewToggle view={viewMode} onViewChange={setViewMode} />}
        />
      }
    >
      {isLoading ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Cargando alumnos...
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {/* QA mock: muestra una ficha cuando la API no devuelve datos reales */}
      {!isLoading && students.length === 0 ? (
        viewMode === 'list' ? (
          <ListingColumnBoard columns={PERSON_LIST_COLUMNS}>
            <AcademicEntityCard
              variant="list"
              title="Lucas Rodríguez"
              fallbackImage={AKADEMATE_ACADEMIC_FALLBACK_IMAGE}
              badge={<Badge variant="static" className="bg-green-600 text-white hover:bg-green-600">Activo</Badge>}
              listCells={['Gestión Empresarial', 'Sede Central']}
            />
          </ListingColumnBoard>
        ) : (
          <div className={ACADEMIC_LISTING_GRID_CLASS}>
            <AcademicEntityCard
              title="Lucas Rodríguez"
              fallbackImage={AKADEMATE_ACADEMIC_FALLBACK_IMAGE}
              badge={<Badge variant="static" className="bg-green-600 text-white hover:bg-green-600">Activo</Badge>}
              tiles={['Gestión Empresarial', 'Sede Central']}
            />
          </div>
        )
      ) : !isLoading && filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No se encontraron alumnos que coincidan con los filtros seleccionados.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        <ListingColumnBoard columns={PERSON_LIST_COLUMNS}>
          {filteredStudents.map((student) => (
            <AcademicEntityCard
              key={student.id}
              variant="list"
              title={`${student.first_name} ${student.last_name}`.trim() || student.email}
              fallbackImage={AKADEMATE_ACADEMIC_FALLBACK_IMAGE}
              badge={
                <Badge
                  variant="static"
                  className={
                    student.active
                      ? 'bg-green-600 text-white hover:bg-green-600'
                      : 'bg-muted text-muted-foreground hover:bg-muted'
                  }
                >
                  {student.active ? 'Activo' : 'Inactivo'}
                </Badge>
              }
              listCells={[student.curso_actual !== '-' ? student.curso_actual : student.email, student.sede]}
              onClick={() => handleViewStudent(student.id)}
              onCtaClick={() => handleEditStudent(student.id)}
            />
          ))}
        </ListingColumnBoard>
      ) : (
        <div className={ACADEMIC_LISTING_GRID_CLASS}>
          {filteredStudents.map((student) => (
            <AcademicEntityCard
              key={student.id}
              title={`${student.first_name} ${student.last_name}`.trim() || student.email}
              fallbackImage={AKADEMATE_ACADEMIC_FALLBACK_IMAGE}
              badge={
                <Badge
                  variant="static"
                  className={
                    student.active
                      ? 'bg-green-600 text-white hover:bg-green-600'
                      : 'bg-muted text-muted-foreground hover:bg-muted'
                  }
                >
                  {student.active ? 'Activo' : 'Inactivo'}
                </Badge>
              }
              tiles={[student.curso_actual !== '-' ? student.curso_actual : student.email, student.sede]}
              onClick={() => handleViewStudent(student.id)}
              onCtaClick={() => handleEditStudent(student.id)}
            />
          ))}
        </div>
      )}
    </DashboardListingLayout>
  )
}
