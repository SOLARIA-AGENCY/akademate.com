'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase } from 'lucide-react'
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

interface ApiStaffData {
  id: string | number
  firstName: string
  lastName: string
  fullName?: string
  email: string
  phone?: string
  position: string
  contractType?: string
  employmentStatus: string
  photo?: string
  isActive?: boolean
  assignedCampuses?: { id: number; name: string; city: string }[]
}

interface ApiResponse {
  success: boolean
  data: ApiStaffData[]
}

export default function AdministrativosPage() {
  const router = useRouter()
  const [staff, setStaff] = useState<ApiStaffData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterDepartment, setFilterDepartment] = useState('todos')
  const [filterCampus, setFilterCampus] = useState('todos')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const loadAdministrative = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/staff?type=administrativo&limit=200&includeInactive=true')
      if (!response.ok) throw new Error('Failed to load administrative staff')
      const result = (await response.json()) as ApiResponse
      if (!result.success) throw new Error('API returned error')
      setStaff(result.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAdministrative()
  }, [])

  const rows = useMemo(
    () => staff.map((member) => mapStaffToDirectoryRow(member, 'administrativo')),
    [staff],
  )
  const filteredRows = filterStaffDirectoryRows(rows, {
    search: searchTerm,
    status: filterStatus as 'todos' | StaffDirectoryRow['status'],
    department: filterDepartment,
    campus: filterCampus,
  })
  const kpis = computeStaffDirectoryKpis(rows, 'administrativo')
  const departments = [...new Set(rows.map((row) => row.department).filter(Boolean))]
  const campuses = [...new Set(rows.map((row) => row.campus).filter((campus) => campus !== 'Sin sede'))]
  const staffById = useMemo(() => new Map(staff.map((member) => [String(member.id), member])), [staff])

  const handleAdd = () => router.push('/administrativo/nuevo')
  const exportColumns: ExportColumn<ApiStaffData>[] = [
    { header: 'Nombre', getValue: (admin) => admin.fullName || `${admin.firstName} ${admin.lastName}` },
    { header: 'Email', getValue: (admin) => admin.email || 'Sin mail' },
    { header: 'Telefono', getValue: (admin) => admin.phone || 'Sin telefono' },
    { header: 'Departamento', getValue: (admin) => admin.position || 'Sin departamento' },
    { header: 'Contrato', getValue: (admin) => formatContractLabel(admin.contractType) },
    { header: 'Estado', getValue: (admin) => admin.employmentStatus },
    {
      header: 'Sedes',
      getValue: (admin) => (admin.assignedCampuses ?? []).map((campus) => campus.name).join(', '),
    },
  ]
  const handleCsv = () =>
    downloadCsv(
      `administrativos-${new Date().toISOString().slice(0, 10)}.csv`,
      exportColumns,
      filteredRows.map((row) => staffById.get(row.id)).filter((item): item is ApiStaffData => Boolean(item)),
    )

  const columns: DirectoryColumn<StaffDirectoryRow>[] = [
    {
      id: 'persona',
      header: 'Persona',
      render: (row) => (
        <DirectoryAvatarCell name={row.name} subtitle={row.email || 'Sin mail'} src={row.avatarUrl} initials={row.initials} />
      ),
    },
    {
      id: 'departamento',
      header: 'Departamento',
      render: (row) => <DirectoryNeutralBadge>{row.department}</DirectoryNeutralBadge>,
    },
    {
      id: 'sede',
      header: 'Sede',
      render: (row) => <DirectoryNeutralBadge>{row.campus}</DirectoryNeutralBadge>,
    },
    { id: 'contrato', header: 'Contrato', render: (row) => row.contractLabel },
    {
      id: 'estado',
      header: 'Estado',
      render: (row) => {
        const visual = staffStatusVisual(row.status)
        return <DirectoryStatusPill label={visual.label} pillClass={visual.pillClass} dotClass={visual.dotClass} />
      },
    },
  ]

  return (
    <PremiumDirectoryShell
      scroll="page"
      title="Administrativos"
      description="Gestiona el equipo de administración, contratos y sedes asignadas."
      icon={Briefcase}
      entityPlural="administrativos"
      createLabel="Nuevo administrativo"
      onCreate={handleAdd}
      onExportCsv={handleCsv}
      kpis={kpis}
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="Buscar por nombre, email o departamento..."
      segments={[
        { id: 'todos', label: 'Todos' },
        { id: 'activo', label: 'Activos' },
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
      emptyTitle="No hay administrativos"
      emptyDescription="Crea el primer perfil administrativo para el centro."
      onRetry={() => void loadAdministrative()}
      onRowOpen={(row) => router.push(`/administrativo/${row.id}`)}
      onRowEdit={(row) => router.push(`/administrativo/${row.id}/editar`)}
      onRowMail={(row) => {
        if (row.email) window.location.href = `mailto:${row.email}`
      }}
      onBulkExport={handleCsv}
      renderGrid={(pageRows) => (
        <div className={ACADEMIC_LISTING_GRID_CLASS}>
          {pageRows.map((row) => (
            <AcademicEntityCard
              key={row.id}
              title={row.name}
              image={row.avatarUrl}
              fallbackImage={AKADEMATE_ACADEMIC_FALLBACK_IMAGE}
              mediaKind="person"
              href={`/administrativo/${row.id}`}
              onClick={() => router.push(`/administrativo/${row.id}`)}
              onCtaClick={() => router.push(`/administrativo/${row.id}/editar`)}
              badge={<Badge variant="static">{staffStatusVisual(row.status).label}</Badge>}
              tiles={[row.department, row.campus]}
            />
          ))}
        </div>
      )}
    />
  )
}
