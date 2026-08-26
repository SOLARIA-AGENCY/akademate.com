import {
  resolveStaffDirectoryStatus,
  type StaffDirectoryStatus,
} from './directory-status'

export type StaffDirectoryKind = 'profesor' | 'administrativo'

export type StaffDirectorySource = {
  id: string | number
  firstName?: string | null
  lastName?: string | null
  fullName?: string | null
  email?: string | null
  phone?: string | null
  position?: string | null
  contractType?: string | null
  employmentStatus?: string | null
  photo?: string | null
  isActive?: boolean | null
  assignedCampuses?: Array<{ id?: number; name?: string | null } | null> | null
  qualifiedAreas?: Array<{ id?: number; nombre?: string | null } | null> | null
  courseRunsCount?: number | null
  courseRuns?: Array<{ status?: string | null } | null> | null
}

export type StaffDirectoryRow = {
  id: string
  kind: StaffDirectoryKind
  name: string
  email: string
  phone: string
  avatarUrl: string | null
  initials: string
  department: string
  campus: string
  campuses: string[]
  workloadLabel: string
  contractLabel: string
  status: StaffDirectoryStatus
}

export type DirectoryKpi = {
  id: string
  label: string
  value: string
  helper?: string
}

const CONTRACT_LABELS: Record<string, string> = {
  general_regime: 'Régimen General',
  full_time: 'Tiempo completo',
  part_time: 'Tiempo parcial',
  freelance: 'Autónomo',
  contract: 'Contrato',
  employee: 'Empleado',
}

export function directoryInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function formatContractLabel(value?: string | null): string {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (!normalized) return 'Contrato por definir'
  return CONTRACT_LABELS[normalized] ?? value ?? 'Contrato por definir'
}

export function mapStaffToDirectoryRow(
  staff: StaffDirectorySource,
  kind: StaffDirectoryKind,
): StaffDirectoryRow {
  const name =
    String(staff.fullName ?? '').trim() ||
    `${staff.firstName ?? ''} ${staff.lastName ?? ''}`.trim() ||
    'Sin nombre'
  const campuses = (staff.assignedCampuses ?? [])
    .map((campus) => String(campus?.name ?? '').trim())
    .filter(Boolean)
  const department =
    String(staff.qualifiedAreas?.[0]?.nombre ?? '').trim() ||
    String(staff.position ?? '').trim() ||
    'Área por definir'
  const courseRunsCount = staff.courseRunsCount ?? staff.courseRuns?.length ?? 0
  const status = resolveStaffDirectoryStatus({
    employmentStatus: staff.employmentStatus,
    isActive: staff.isActive,
    courseRunStatuses: (staff.courseRuns ?? []).map((run) => run?.status),
    allowInClass: kind === 'profesor',
  })

  return {
    id: String(staff.id),
    kind,
    name,
    email: String(staff.email ?? '').trim(),
    phone: String(staff.phone ?? '').trim(),
    avatarUrl: staff.photo ? String(staff.photo) : null,
    initials: directoryInitials(name),
    department,
    campus: campuses[0] ?? 'Sin sede',
    campuses,
    workloadLabel: kind === 'profesor' ? `${courseRunsCount} cursos` : formatContractLabel(staff.contractType),
    contractLabel: formatContractLabel(staff.contractType),
    status,
  }
}

export function computeStaffDirectoryKpis(
  rows: readonly StaffDirectoryRow[],
  kind: StaffDirectoryKind,
): DirectoryKpi[] {
  const total = rows.length
  const active = rows.filter((row) => row.status === 'activo' || row.status === 'en_clase').length
  const leave = rows.filter((row) => row.status === 'permiso').length
  const campuses = new Set(rows.flatMap((row) => row.campuses)).size
  const availability = total > 0 ? Math.round((active / total) * 100) : 0

  if (kind === 'administrativo') {
    return [
      { id: 'total', label: 'Total administrativos', value: String(total) },
      { id: 'activos', label: 'Activos', value: String(active), helper: `${availability}% disponibilidad` },
      { id: 'permiso', label: 'Baja temporal', value: String(leave) },
      { id: 'sedes', label: 'Sedes cubiertas', value: String(campuses) },
    ]
  }

  return [
    { id: 'total', label: 'Total profesores', value: String(total) },
    { id: 'activos', label: 'Docentes activos', value: String(active), helper: `${availability}% disponibilidad` },
    { id: 'permiso', label: 'En permiso', value: String(leave) },
    { id: 'sedes', label: 'Sedes asignadas', value: `${campuses} ${campuses === 1 ? 'Sede' : 'Sedes'}` },
  ]
}

export function filterStaffDirectoryRows(
  rows: readonly StaffDirectoryRow[],
  input: {
    search: string
    status: 'todos' | StaffDirectoryStatus
    department: string
    campus: string
  },
): StaffDirectoryRow[] {
  const search = input.search.trim().toLowerCase()
  return rows.filter((row) => {
    const matchesSearch =
      !search ||
      row.name.toLowerCase().includes(search) ||
      row.email.toLowerCase().includes(search) ||
      row.department.toLowerCase().includes(search) ||
      row.campus.toLowerCase().includes(search)
    const matchesStatus = input.status === 'todos' || row.status === input.status
    const matchesDepartment = input.department === 'todos' || row.department === input.department
    const matchesCampus = input.campus === 'todos' || row.campus === input.campus
    return matchesSearch && matchesStatus && matchesDepartment && matchesCampus
  })
}
