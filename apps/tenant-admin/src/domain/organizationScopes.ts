export const INTERNAL_SCOPE_KINDS = ['virtual_entity', 'department', 'project', 'cost_center'] as const
export const ENTITY_SITE_ROLES = ['primary_operator', 'shared_operator', 'employer', 'resource_manager'] as const
export const SCOPED_RESOURCES = ['tenant', 'legal_entity', 'campus', 'operating_scope', 'course_run'] as const

export type TemporalRange = {
  valid_from?: string | null
  valid_to?: string | null
}

export function assertValidTemporalRange(range: TemporalRange): void {
  if (!range.valid_from || !range.valid_to) return
  if (new Date(range.valid_to).getTime() < new Date(range.valid_from).getTime()) {
    throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio')
  }
}

export function assertAllocationPercentage(value: unknown): void {
  if (value === undefined || value === null) return
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > 100) {
    throw new Error('El porcentaje de asignacion debe ser mayor que 0 y menor o igual que 100')
  }
}

export function assertExactlyOnePrimaryScope(input: {
  legal_entity?: unknown
  campus?: unknown
  operating_scope?: unknown
  course_run?: unknown
}): void {
  const selected = [input.legal_entity, input.campus, input.operating_scope, input.course_run]
    .filter((value) => value !== undefined && value !== null && value !== '')
  if (selected.length > 1) {
    throw new Error('Un permiso debe tener un unico ambito primario')
  }
}

export function publicCampusFilter(tenantId: string | number, additional?: Record<string, unknown>) {
  const normalizedTenantId = typeof tenantId === 'string' && /^\d+$/.test(tenantId) ? Number(tenantId) : tenantId
  return {
    and: [
      { tenant: { equals: normalizedTenantId } },
      { active: { equals: true } },
      { public_visibility: { equals: 'public' } },
      ...(additional ? [additional] : []),
    ],
  }
}
