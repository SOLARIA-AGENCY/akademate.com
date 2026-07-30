import type { CollectionBeforeValidateHook, CollectionConfig, Field } from 'payload'
import { getUserTenantId, tenantFilteredAccess, tenantField } from '../../access/tenantAccess'
import { assertAllocationPercentage, assertExactlyOnePrimaryScope, assertValidTemporalRange } from '../../domain/organizationScopes'

export const internalOrganizationAccess: CollectionConfig['access'] = {
  read: tenantFilteredAccess.read,
  create: tenantFilteredAccess.create,
  update: tenantFilteredAccess.update,
  delete: tenantFilteredAccess.delete,
}

export const temporalFields: Field[] = [
  { name: 'valid_from', type: 'date', index: true, admin: { date: { pickerAppearance: 'dayOnly' } } },
  { name: 'valid_to', type: 'date', index: true, admin: { date: { pickerAppearance: 'dayOnly' } } },
  { name: 'active', type: 'checkbox', defaultValue: true, index: true },
]

export const validateTemporalRange: CollectionBeforeValidateHook = ({ data }) => {
  if (data) assertValidTemporalRange(data)
  return data
}

export const validateAllocation: CollectionBeforeValidateHook = ({ data }) => {
  if (data) {
    assertValidTemporalRange(data)
    assertAllocationPercentage(data.allocation_percentage)
  }
  return data
}

export const validateRoleBindingScope: CollectionBeforeValidateHook = ({ data }) => {
  if (data) {
    assertValidTemporalRange(data)
    assertExactlyOnePrimaryScope(data)
  }
  return data
}

type RelationshipRule = { field: string; collection: string; many?: boolean }

function relationshipId(value: unknown): string | number | null {
  if (typeof value === 'string' || typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    return typeof id === 'string' || typeof id === 'number' ? id : null
  }
  return null
}

function tenantIdFrom(value: unknown): string | number | null {
  return relationshipId(value)
}

export const validateSameTenantRelationships = (rules: RelationshipRule[]): CollectionBeforeValidateHook =>
  async ({ data, originalDoc, req }) => {
    if (!data) return data
    const requestedTenant = tenantIdFrom(data.tenant)
      ?? tenantIdFrom((originalDoc as Record<string, unknown> | undefined)?.tenant)
      ?? getUserTenantId(req.user)
    if (requestedTenant === null) return data

    for (const rule of rules) {
      const raw = data[rule.field]
      const values = rule.many && Array.isArray(raw) ? raw : [raw]
      for (const value of values) {
        const id = relationshipId(value)
        if (id === null) continue
        const related = await req.payload.findByID({
          collection: rule.collection as never,
          id,
          depth: 0,
          overrideAccess: true,
          req,
        }) as Record<string, unknown>
        const relatedTenant = tenantIdFrom(related.tenant)
        if (relatedTenant === null || String(relatedTenant) !== String(requestedTenant)) {
          throw new Error(`La relacion ${rule.field} no pertenece al mismo tenant`)
        }
      }
    }
    return data
  }

export { tenantField }
