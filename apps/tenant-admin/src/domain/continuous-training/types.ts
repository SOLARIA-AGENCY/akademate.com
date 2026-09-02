/**
 * Evergreen / on-demand catalog. Vertical-agnostic: academy, sports, driving, online LMS.
 * Enrollment is immediate; it is not a dated course-run edition.
 */

export const CONTINUOUS_TRAINING_COLLECTION = 'continuous-trainings' as const

export const CONTINUOUS_FUNDING_TYPES = ['privados', 'ocupados', 'desempleados', 'unspecified'] as const
export type ContinuousFundingType = (typeof CONTINUOUS_FUNDING_TYPES)[number]

export const CONTINUOUS_DELIVERY_MODES = ['in_person', 'live_online', 'on_demand', 'hybrid'] as const
export type ContinuousDeliveryMode = (typeof CONTINUOUS_DELIVERY_MODES)[number]

export const CONTINUOUS_STATUSES = ['draft', 'active', 'inactive'] as const
export type ContinuousStatus = (typeof CONTINUOUS_STATUSES)[number]

export const CONTINUOUS_VERTICALS = ['academy', 'sports', 'driving', 'online'] as const
export type ContinuousVertical = (typeof CONTINUOUS_VERTICALS)[number]

export type ContinuousTrainingListingRow = {
  id: string
  name: string
  description: string
  areaLabel: string
  fundingType: ContinuousFundingType
  deliveryMode: ContinuousDeliveryMode
  durationLabel: string
  price: number | null
  status: ContinuousStatus
  campusLabel: string
  instructorLabel: string
  thumbnailUrl: string | null
  capacity: number
  activeEnrollmentCount: number
  virtualCampusUrl: string | null
  createdAt: string | null
}

export const CONTINUOUS_DELIVERY_LABELS: Record<ContinuousDeliveryMode, string> = {
  in_person: 'Presencial',
  live_online: 'En directo',
  on_demand: 'Bajo demanda',
  hybrid: 'Híbrida',
}

export const CONTINUOUS_STATUS_LABELS: Record<ContinuousStatus, string> = {
  draft: 'Borrador',
  active: 'Activo',
  inactive: 'Inactivo',
}

export function isContinuousFundingType(value: string | null | undefined): value is ContinuousFundingType {
  return CONTINUOUS_FUNDING_TYPES.includes(value as ContinuousFundingType)
}

export function durationLabel(hours: number | null | undefined, unlimited: boolean): string {
  if (unlimited) return 'Acceso ilimitado'
  if (typeof hours === 'number' && Number.isFinite(hours) && hours > 0) return `${hours}h`
  return '—'
}

export function computeContinuousTrainingKpis(rows: readonly ContinuousTrainingListingRow[]) {
  const total = rows.length
  const active = rows.filter((row) => row.status === 'active').length
  const open = rows.filter((row) => row.status === 'active').length
  const learners = rows.reduce((sum, row) => sum + (row.activeEnrollmentCount || 0), 0)
  return [
    { id: 'total', label: 'Formaciones', value: String(total) },
    { id: 'activas', label: 'Activas', value: String(active) },
    { id: 'abiertas', label: 'Matrícula inmediata', value: String(open) },
    { id: 'alumnos', label: 'Alumnos con acceso', value: String(learners) },
  ]
}
