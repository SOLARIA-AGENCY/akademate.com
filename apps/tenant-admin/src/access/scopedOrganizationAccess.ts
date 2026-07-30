import type { Payload, PayloadRequest, Where } from 'payload'
import { getUserTenantId, isSuperAdmin } from './tenantAccess'

type RelationshipValue = string | number | { id: string | number } | null | undefined

export type ScopeBinding = {
  legal_entity?: RelationshipValue
  campus?: RelationshipValue
  operating_scope?: RelationshipValue
  course_run?: RelationshipValue
  valid_from?: string | null
  valid_to?: string | null
  active?: boolean | null
}

export function relationId(value: RelationshipValue): string | number | null {
  if (typeof value === 'string' || typeof value === 'number') return value
  return value && typeof value === 'object' ? value.id : null
}

export function isBindingActive(binding: ScopeBinding, now = new Date()): boolean {
  if (binding.active === false) return false
  if (binding.valid_from && new Date(binding.valid_from) > now) return false
  if (binding.valid_to && new Date(binding.valid_to) < now) return false
  return true
}

export function buildCourseRunScopeWhere(tenantId: string | number, bindings: ScopeBinding[], now = new Date()): Where {
  const active = bindings.filter((binding) => isBindingActive(binding, now))
  if (bindings.length === 0) return { tenant: { equals: tenantId } }
  if (active.length === 0) {
    return { and: [{ tenant: { equals: tenantId } }, { id: { exists: false } }] }
  }
  if (active.some((binding) =>
    !relationId(binding.legal_entity) && !relationId(binding.campus)
    && !relationId(binding.operating_scope) && !relationId(binding.course_run))) {
    return { tenant: { equals: tenantId } }
  }

  const scopes: Where[] = []
  for (const binding of active) {
    const courseRun = relationId(binding.course_run)
    const campus = relationId(binding.campus)
    const operatingScope = relationId(binding.operating_scope)
    const legalEntity = relationId(binding.legal_entity)
    if (courseRun) scopes.push({ id: { equals: courseRun } })
    if (campus) scopes.push({ campus: { equals: campus } })
    if (operatingScope) scopes.push({ operating_scope: { equals: operatingScope } })
    if (legalEntity) {
      scopes.push({
        or: [
          { owner_legal_entity: { equals: legalEntity } },
          { managing_legal_entity: { equals: legalEntity } },
          { funding_legal_entity: { equals: legalEntity } },
        ],
      })
    }
  }
  return { and: [{ tenant: { equals: tenantId } }, { or: scopes }] }
}

export function buildFinanceScopeWhere(tenantId: string | number, bindings: ScopeBinding[], now = new Date()): Where {
  const active = bindings.filter((binding) => isBindingActive(binding, now))
  if (bindings.length === 0) return { tenant: { equals: tenantId } }
  if (active.length === 0) return { and: [{ tenant: { equals: tenantId } }, { id: { exists: false } }] }
  if (active.some((binding) =>
    !relationId(binding.legal_entity) && !relationId(binding.campus)
    && !relationId(binding.operating_scope) && !relationId(binding.course_run))) {
    return { tenant: { equals: tenantId } }
  }
  const scopes: Where[] = []
  for (const binding of active) {
    const legalEntity = relationId(binding.legal_entity)
    const campus = relationId(binding.campus)
    const operatingScope = relationId(binding.operating_scope)
    const courseRun = relationId(binding.course_run)
    if (legalEntity) scopes.push({ legal_entity: { equals: legalEntity } })
    if (campus) scopes.push({ campus: { equals: campus } })
    if (operatingScope) scopes.push({ operating_scope: { equals: operatingScope } })
    if (courseRun) scopes.push({ course_run: { equals: courseRun } })
  }
  return { and: [{ tenant: { equals: tenantId } }, { or: scopes }] }
}

export async function getActiveScopeBindings(req: PayloadRequest): Promise<ScopeBinding[]> {
  if (!req.user || isSuperAdmin(req.user)) return []
  const tenantId = getUserTenantId(req.user)
  if (!tenantId) return []
  const result = await req.payload.find({
    collection: 'scoped-role-bindings',
    where: {
      and: [
        { tenant: { equals: tenantId } },
        { user: { equals: req.user.id } },
      ],
    },
    depth: 0,
    limit: 100,
    overrideAccess: true,
    req,
  })
  return result.docs as ScopeBinding[]
}

export async function getScopeBindingsForUser(
  payload: Pick<Payload, 'find'>,
  tenantId: string | number,
  userId: string | number,
): Promise<ScopeBinding[]> {
  const result = await payload.find({
    collection: 'scoped-role-bindings',
    where: { and: [{ tenant: { equals: tenantId } }, { user: { equals: userId } }] },
    depth: 0,
    limit: 100,
    overrideAccess: true,
  })
  return result.docs as ScopeBinding[]
}

export async function courseRunScopeWhere(req: PayloadRequest): Promise<Where | true | false> {
  if (!req.user) return false
  if (isSuperAdmin(req.user)) return true
  const tenantId = getUserTenantId(req.user)
  if (!tenantId) return false
  return buildCourseRunScopeWhere(tenantId, await getActiveScopeBindings(req))
}

export function matchesCourseRunScope(
  record: Record<string, unknown>,
  bindings: ScopeBinding[],
  now = new Date(),
): boolean {
  const active = bindings.filter((binding) => isBindingActive(binding, now))
  if (active.length === 0) return true
  return active.some((binding) => {
    const ids = {
      legal: relationId(binding.legal_entity),
      campus: relationId(binding.campus),
      operating: relationId(binding.operating_scope),
      run: relationId(binding.course_run),
    }
    if (!ids.legal && !ids.campus && !ids.operating && !ids.run) return true
    if (ids.run && String(ids.run) === String(record.id)) return true
    if (ids.campus && String(ids.campus) === String(relationId(record.campus as RelationshipValue))) return true
    if (ids.operating && String(ids.operating) === String(relationId(record.operating_scope as RelationshipValue))) return true
    if (ids.legal) {
      return ['owner_legal_entity', 'managing_legal_entity', 'funding_legal_entity']
        .some((field) => String(ids.legal) === String(relationId(record[field] as RelationshipValue)))
    }
    return false
  })
}
