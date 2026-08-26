export type StaffDirectoryStatus = 'activo' | 'en_clase' | 'permiso' | 'inactivo'

export type DirectoryStatusTone = 'success' | 'info' | 'warning' | 'neutral'

export type DirectoryStatusVisual = {
  id: StaffDirectoryStatus
  label: string
  tone: DirectoryStatusTone
  pillClass: string
  dotClass: string
}

const STAFF_STATUS_VISUAL: Record<StaffDirectoryStatus, DirectoryStatusVisual> = {
  activo: {
    id: 'activo',
    label: 'Activo',
    tone: 'success',
    pillClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dotClass: 'bg-emerald-500',
  },
  en_clase: {
    id: 'en_clase',
    label: 'En clase',
    tone: 'info',
    pillClass: 'border-blue-200 bg-blue-50 text-blue-700',
    dotClass: 'bg-blue-500',
  },
  permiso: {
    id: 'permiso',
    label: 'En Permiso',
    tone: 'warning',
    pillClass: 'border-amber-200 bg-amber-50 text-amber-700',
    dotClass: 'bg-amber-500',
  },
  inactivo: {
    id: 'inactivo',
    label: 'Inactivo',
    tone: 'neutral',
    pillClass: 'border-slate-200 bg-slate-100 text-slate-600',
    dotClass: 'bg-slate-400',
  },
}

export function staffStatusVisual(status: StaffDirectoryStatus): DirectoryStatusVisual {
  switch (status) {
    case 'activo':
    case 'en_clase':
    case 'permiso':
    case 'inactivo':
      return STAFF_STATUS_VISUAL[status]
    default: {
      const _exhaustive: never = status
      return _exhaustive
    }
  }
}

export function resolveStaffDirectoryStatus(input: {
  employmentStatus?: string | null
  isActive?: boolean | null
  courseRunStatuses?: Array<string | null | undefined>
  allowInClass?: boolean
}): StaffDirectoryStatus {
  const employment = String(input.employmentStatus ?? '').trim().toLowerCase()

  if (employment === 'temporary_leave' || employment === 'permiso') return 'permiso'
  if (employment === 'inactive' || input.isActive === false) return 'inactivo'

  if (input.allowInClass) {
    const inClass = (input.courseRunStatuses ?? []).some((status) => {
      const normalized = String(status ?? '').trim().toLowerCase()
      return normalized === 'in_progress' || normalized === 'en_curso'
    })
    if (inClass) return 'en_clase'
  }

  return 'activo'
}

export type CatalogActiveStatus = 'activo' | 'inactivo'

export function resolveCatalogActiveStatus(active?: boolean | null): CatalogActiveStatus {
  return active === false ? 'inactivo' : 'activo'
}

export type ConvocationDirectoryStatus =
  | 'published'
  | 'enrollment_open'
  | 'in_progress'
  | 'draft'
  | 'completed'
  | 'cancelled'
  | 'unknown'

export function resolveConvocationDirectoryStatus(
  status?: string | null,
): ConvocationDirectoryStatus {
  switch (String(status ?? '').trim().toLowerCase()) {
    case 'published':
      return 'published'
    case 'enrollment_open':
      return 'enrollment_open'
    case 'in_progress':
      return 'in_progress'
    case 'draft':
      return 'draft'
    case 'completed':
      return 'completed'
    case 'cancelled':
      return 'cancelled'
    default:
      return 'unknown'
  }
}

export function convocationStatusLabel(status: ConvocationDirectoryStatus): string {
  switch (status) {
    case 'published':
      return 'Publicado'
    case 'enrollment_open':
      return 'Matrícula abierta'
    case 'in_progress':
      return 'En curso'
    case 'draft':
      return 'Sin publicar'
    case 'completed':
      return 'Completada'
    case 'cancelled':
      return 'Cancelada'
    case 'unknown':
      return 'Estado'
    default: {
      const _exhaustive: never = status
      return _exhaustive
    }
  }
}
