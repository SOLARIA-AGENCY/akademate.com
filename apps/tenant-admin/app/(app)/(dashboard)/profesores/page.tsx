'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from 'lucide-react'
import {
  AcademicEntityCard,
  DirectoryAvatarCell,
  DirectoryNeutralBadge,
  DirectoryStatusPill,
  PremiumDirectoryShell,
  computeStaffDirectoryKpis,
  filterStaffDirectoryRows,
  formatContractLabel,
  mapStaffToDirectoryRow,
  staffStatusVisual,
  type DirectoryColumn,
  type StaffDirectoryRow,
} from '@payload-config/components/akademate/dashboard'
import { Badge } from '@payload-config/components/ui/badge'
import { downloadCsv, type ExportColumn } from '@/app/lib/dashboard-export'

function formatShortDate(value?: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('es-ES')
}

interface StaffMember {
  id: number
  staffType: string
  firstName: string
  lastName: string
  fullName: string
  email?: string | null
  nif?: string | null
  phone?: string
  position: string
  contractType: string
  employmentStatus: string
  photo: string
  assignedCampuses: { id: number; name: string; city: string }[]
  qualifiedAreas?: { id: number; codigo?: string | null; nombre: string }[]
  courseRunsCount?: number
  courseRuns?: Array<{
    id: number
    status?: string | null
    startDate?: string | null
    endDate?: string | null
    courseName?: string | null
    campusName?: string | null
  }>
  isActive: boolean
  inactiveReason?: string | null
}

interface StaffApiResponse {
  success: boolean
  data: StaffMember[]
}

const employmentLabels: Record<string, string> = {
  active: 'Activo',
  temporary_leave: 'Baja temporal',
  inactive: 'Inactivo',
}

export default function ProfesoresPage() {
  const router = useRouter()
  const [teachers, setTeachers] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterDepartment, setFilterDepartment] = useState('todos')
  const [filterCampus, setFilterCampus] = useState('todos')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const loadProfessors = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/staff?type=profesor&limit=200&includeInactive=true')
      if (!response.ok) throw new Error('Failed to load professors')
      const result = (await response.json()) as StaffApiResponse
      if (!result.success) throw new Error('API returned error')
      setTeachers(result.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.body.classList.add('profesores-route')
    void loadProfessors()
    return () => document.body.classList.remove('profesores-route')
  }, [])

  const rows = useMemo(
    () => teachers.map((staff) => mapStaffToDirectoryRow(staff, 'profesor')),
    [teachers],
  )
  const filteredRows = filterStaffDirectoryRows(rows, {
    search: searchTerm,
    status: filterStatus as 'todos' | StaffDirectoryRow['status'],
    department: filterDepartment,
    campus: filterCampus,
  })
  const teacherById = useMemo(
    () => new Map(teachers.map((teacher) => [String(teacher.id), teacher])),
    [teachers],
  )
  const kpis = computeStaffDirectoryKpis(rows, 'profesor')
  const departments = [...new Set(rows.map((row) => row.department).filter(Boolean))]
  const campuses = [...new Set(rows.map((row) => row.campus).filter((campus) => campus !== 'Sin sede'))]

  const handleAdd = () => router.push('/profesores/nuevo')
  const handleViewTeacher = (teacherId: number) => router.push(`/profesores/${teacherId}`)

  const formatCourseRuns = (teacher: StaffMember) => {
    const runs = teacher.courseRuns ?? []
    if (!runs.length) return `${teacher.courseRunsCount ?? 0} cursos`
    return runs
      .map((run) => {
        const campus = run.campusName ? ` - ${run.campusName}` : ''
        const dates = run.startDate
          ? ` - ${formatShortDate(run.startDate)}${
              run.endDate ? ` a ${formatShortDate(run.endDate)}` : ''
            }`
          : ''
        return `${run.courseName ?? 'Curso sin nombre'}${campus}${dates}`
      })
      .join(' | ')
  }

  const exportColumns: ExportColumn<StaffMember>[] = [
    { header: 'Nombre', getValue: (teacher) => teacher.fullName },
    { header: 'Email', getValue: (teacher) => teacher.email ?? 'Sin mail' },
    { header: 'Telefono', getValue: (teacher) => teacher.phone ?? 'Sin telefono' },
    {
      header: 'Estado',
      getValue: (teacher) => employmentLabels[teacher.employmentStatus] ?? teacher.employmentStatus,
    },
    { header: 'Contrato', getValue: (teacher) => formatContractLabel(teacher.contractType) },
    { header: 'Motivo baja', getValue: (teacher) => teacher.inactiveReason ?? '' },
    {
      header: 'Areas',
      getValue: (teacher) => (teacher.qualifiedAreas ?? []).map((area) => area.nombre).join(', '),
    },
    {
      header: 'Sedes',
      getValue: (teacher) => (teacher.assignedCampuses ?? []).map((campus) => campus.name).join(', '),
    },
    { header: 'Cursos', getValue: (teacher) => teacher.courseRunsCount ?? 0 },
    { header: 'Detalle cursos', getValue: formatCourseRuns },
  ]

  const handlePrint = () => window.print()
  const visibleTeachers = filteredRows
    .map((row) => teacherById.get(row.id))
    .filter((teacher): teacher is StaffMember => Boolean(teacher))
  const handleCsv = () =>
    downloadCsv(`profesores-${new Date().toISOString().slice(0, 10)}.csv`, exportColumns, visibleTeachers)

  const columns: DirectoryColumn<StaffDirectoryRow>[] = [
    {
      id: 'docente',
      header: 'Docente',
      render: (row) => (
        <DirectoryAvatarCell
          name={row.name}
          subtitle={row.email || 'Sin mail'}
          src={row.avatarUrl}
          initials={row.initials}
        />
      ),
    },
    {
      id: 'departamento',
      header: 'Departamento',
      render: (row) => <DirectoryNeutralBadge>{row.department || 'Sin departamento'}</DirectoryNeutralBadge>,
    },
    {
      id: 'sede',
      header: 'Sede',
      render: (row) => <DirectoryNeutralBadge>{row.campus}</DirectoryNeutralBadge>,
    },
    { id: 'carga', header: 'Carga Horaria', render: (row) => row.workloadLabel },
    {
      id: 'estado',
      header: 'Estado',
      render: (row) => {
        const visual = staffStatusVisual(row.status)
        return <DirectoryStatusPill label={visual.label} pillClass={visual.pillClass} dotClass={visual.dotClass} />
      },
    },
  ]

  const printDate = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    <>
      <PremiumDirectoryShell
        scroll="page"
        title="Profesores"
        description="Gestiona el equipo docente, asignaciones y disponibilidad académica."
        icon={User}
        entityPlural="profesores"
        createLabel="Nuevo Profesor"
        onCreate={handleAdd}
        onExportCsv={handleCsv}
        kpis={kpis}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nombre, email o departamento..."
        segments={[
          { id: 'todos', label: 'Todos' },
          { id: 'activo', label: 'Activos' },
          { id: 'en_clase', label: 'En Clase' },
          { id: 'permiso', label: 'En Permiso' },
          { id: 'inactivo', label: 'Inactivos' },
        ]}
        selectedSegment={filterStatus}
        onSegmentChange={setFilterStatus}
        filters={[
          {
            id: 'departamento',
            label: 'Departamento',
            value: filterDepartment,
            onChange: setFilterDepartment,
            options: [
              { value: 'todos', label: 'Departamento: Todos' },
              ...departments.map((department) => ({ value: department, label: department })),
            ],
          },
          {
            id: 'sede',
            label: 'Sede',
            value: filterCampus,
            onChange: setFilterCampus,
            options: [
              { value: 'todos', label: 'Sede: Todas' },
              ...campuses.map((campus) => ({ value: campus, label: campus })),
            ],
          },
        ]}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        columns={columns}
        rows={filteredRows}
        loading={loading}
        error={error}
        emptyTitle="No hay profesores"
        emptyDescription="Crea el primer profesor para asignarlo a convocatorias."
        onRetry={() => void loadProfessors()}
        onRowOpen={(row) => handleViewTeacher(Number(row.id))}
        onRowEdit={(row) => router.push(`/profesores/${row.id}/editar`)}
        onRowMail={(row) => {
          if (row.email) window.location.href = `mailto:${row.email}`
        }}
        onBulkExport={handleCsv}
        onBulkMail={() => {
          const emails = filteredRows
            .filter((row) => selectedIds.includes(row.id) && row.email)
            .map((row) => row.email)
          if (emails.length) window.location.href = `mailto:${emails.join(',')}`
        }}
        renderGrid={(pageRows) => (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {pageRows.map((row) => {
              const teacher = teacherById.get(row.id)
              const editHref = `/profesores/${row.id}/editar`
              return (
                <AcademicEntityCard
                  key={row.id}
                  title={row.name}
                  subtitle={row.department}
                  fallbackImage={row.avatarUrl || undefined}
                  onClick={() => handleViewTeacher(Number(row.id))}
                  onCtaClick={() => router.push(editHref)}
                  badge={<Badge variant="static">{staffStatusVisual(row.status).label}</Badge>}
                  tiles={[row.campus, teacher ? formatCourseRuns(teacher) : row.workloadLabel]}
                />
              )
            })}
          </div>
        )}
      />
      <button type="button" className="sr-only" onClick={handlePrint}>
        Imprimir
      </button>
      <section id="professors-print-sheet" aria-hidden="true">
        <header className="professors-print-header">
          <div>
            <h1>Listado de profesores</h1>
            <p>
              {printDate} · {filteredRows.length} profesores visibles
            </p>
          </div>
        </header>
        <div className="professors-print-list">
          {visibleTeachers.map((teacher) => (
            <article key={teacher.id} className="professors-print-row">
              <img src={teacher.photo || '/placeholder-avatar.svg'} alt="" />
              <div>
                <div className="professors-print-line professors-print-main-line">
                  <strong>{teacher.fullName}</strong>
                  <span>{employmentLabels[teacher.employmentStatus] ?? teacher.employmentStatus}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
