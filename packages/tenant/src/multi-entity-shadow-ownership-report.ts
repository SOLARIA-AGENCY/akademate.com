import type { EntityScopedLegacyRecord, EntityScopedRecordType } from './multi-entity-backfill'
import type {
  EntityCampusBindingTopologyRecord,
  LegalEntityTopologyRecord,
} from './multi-entity-topology'

export type MultiEntityShadowOwnershipClassification =
  | 'ready'
  | 'missing'
  | 'ambiguous'
  | 'cross_scope'

export type MultiEntityShadowOwnershipReason =
  | 'owner_explicit_and_validated'
  | 'owner_missing'
  | 'owner_unknown_inactive_or_unvalidated'
  | 'campus_owner_unmapped'
  | 'campus_owner_ambiguous'
  | 'record_outside_target_tenant'
  | 'owner_outside_target_tenant'
  | 'campus_outside_target_tenant'
  | 'campus_owner_mismatch'
  | 'duplicate_record'
  | 'invalid_record'

export interface MultiEntityShadowOwnershipReportInput {
  readonly targetTenantId: string
  readonly legalEntities: readonly LegalEntityTopologyRecord[]
  readonly campusBindings: readonly EntityCampusBindingTopologyRecord[]
  readonly records: readonly EntityScopedLegacyRecord[]
  readonly maxRecords?: number
}

export interface MultiEntityShadowOwnershipRecord {
  readonly recordType: EntityScopedRecordType
  readonly recordId: string
  readonly classification: MultiEntityShadowOwnershipClassification
  readonly reason: MultiEntityShadowOwnershipReason
  readonly ownerLegalEntityId: string | null
  readonly campusId: string | null
}

export interface MultiEntityShadowOwnershipReport {
  readonly mode: 'shadow_ownership_report'
  readonly canWrite: false
  readonly canApply: false
  readonly records: readonly MultiEntityShadowOwnershipRecord[]
  readonly summary: Readonly<Record<MultiEntityShadowOwnershipClassification, number>>
}

const DEFAULT_MAX_RECORDS = 100_000

/**
 * Classifies an already-read snapshot without resolving or applying ownership.
 * In particular, a null owner is always `missing`, even if its campus has one
 * active binding: only a persisted owner or a separately reviewed resolution
 * may establish ownership.
 */
export function reportMultiEntityShadowOwnership(
  input: MultiEntityShadowOwnershipReportInput
): MultiEntityShadowOwnershipReport {
  const records = Array.isArray(input?.records) ? input.records : []
  if (
    !validIdentifier(input?.targetTenantId) ||
    !validMaxRecords(input?.maxRecords, records.length) ||
    !Array.isArray(input?.legalEntities) ||
    !Array.isArray(input?.campusBindings) ||
    !containsOnlyObjects(input.legalEntities) ||
    !containsOnlyObjects(input.campusBindings)
  ) {
    return emptyReport(records)
  }

  const targetTenantId = input.targetTenantId
  const entities = new Map(input.legalEntities.map((entity) => [entity.id, entity]))
  const bindingsByCampus = buildBindingsByCampus(input.campusBindings)
  const seenRecords = new Set<string>()
  const classified = records.map((record) => {
    const result = classifyRecord(record, targetTenantId, entities, bindingsByCampus, seenRecords)
    return Object.freeze(result)
  })

  const ordered = classified.sort(compareRecords)
  return Object.freeze({
    mode: 'shadow_ownership_report',
    canWrite: false,
    canApply: false,
    records: Object.freeze(ordered),
    summary: Object.freeze(summarize(ordered)),
  })
}

function classifyRecord(
  record: EntityScopedLegacyRecord,
  targetTenantId: string,
  entities: ReadonlyMap<string, LegalEntityTopologyRecord>,
  bindingsByCampus: ReadonlyMap<string, readonly EntityCampusBindingTopologyRecord[]>,
  seenRecords: Set<string>
): MultiEntityShadowOwnershipRecord {
  const recordType = validRecordType(record?.recordType) ? record.recordType : 'course_run'
  const recordId = validIdentifier(record?.id) ? record.id : ''
  const ownerLegalEntityId = validIdentifier(record?.legalEntityId) ? record.legalEntityId : null
  const campusId = validIdentifier(record?.campusId) ? record.campusId : null
  const base = { recordType, recordId, ownerLegalEntityId, campusId }

  if (!recordId || !validRecordType(record?.recordType) || !validIdentifier(record?.tenantId)) {
    return { ...base, classification: 'missing', reason: 'invalid_record' }
  }
  const recordKey = `${recordType}\u0000${recordId}`
  if (seenRecords.has(recordKey)) {
    return { ...base, classification: 'ambiguous', reason: 'duplicate_record' }
  }
  seenRecords.add(recordKey)

  if (record.tenantId !== targetTenantId) {
    return { ...base, classification: 'cross_scope', reason: 'record_outside_target_tenant' }
  }
  if (!ownerLegalEntityId) {
    return { ...base, classification: 'missing', reason: 'owner_missing' }
  }

  const owner = entities.get(ownerLegalEntityId)
  if (!owner || owner.status !== 'validated') {
    return {
      ...base,
      classification: 'missing',
      reason: 'owner_unknown_inactive_or_unvalidated',
    }
  }
  if (owner.tenantId !== targetTenantId) {
    return { ...base, classification: 'cross_scope', reason: 'owner_outside_target_tenant' }
  }
  if (!campusId) {
    return { ...base, classification: 'ready', reason: 'owner_explicit_and_validated' }
  }

  const bindings = bindingsByCampus.get(campusId) ?? []
  const targetBindings = bindings.filter((binding) => binding.tenantId === targetTenantId)
  if (targetBindings.length === 0 && bindings.length > 0) {
    return { ...base, classification: 'cross_scope', reason: 'campus_outside_target_tenant' }
  }
  if (targetBindings.length === 0) {
    return { ...base, classification: 'missing', reason: 'campus_owner_unmapped' }
  }
  if (targetBindings.length > 1) {
    return { ...base, classification: 'ambiguous', reason: 'campus_owner_ambiguous' }
  }
  const binding = targetBindings[0]!
  if (binding.legalEntityId !== ownerLegalEntityId) {
    return { ...base, classification: 'cross_scope', reason: 'campus_owner_mismatch' }
  }
  return { ...base, classification: 'ready', reason: 'owner_explicit_and_validated' }
}

function buildBindingsByCampus(
  bindings: readonly EntityCampusBindingTopologyRecord[]
): ReadonlyMap<string, readonly EntityCampusBindingTopologyRecord[]> {
  const result = new Map<string, EntityCampusBindingTopologyRecord[]>()
  for (const binding of bindings) {
    if (
      binding.status !== 'validated' ||
      !validIdentifier(binding.campusId) ||
      !validIdentifier(binding.legalEntityId)
    ) {
      continue
    }
    const existing = result.get(binding.campusId) ?? []
    existing.push(binding)
    result.set(binding.campusId, existing)
  }
  return result
}

function emptyReport(
  records: readonly EntityScopedLegacyRecord[]
): MultiEntityShadowOwnershipReport {
  const classified = records.map((record) =>
    Object.freeze({
      recordType: validRecordType(record?.recordType) ? record.recordType : 'course_run',
      recordId: validIdentifier(record?.id) ? record.id : '',
      ownerLegalEntityId: validIdentifier(record?.legalEntityId) ? record.legalEntityId : null,
      campusId: validIdentifier(record?.campusId) ? record.campusId : null,
      classification: 'missing' as const,
      reason: 'invalid_record' as const,
    })
  )
  return Object.freeze({
    mode: 'shadow_ownership_report',
    canWrite: false,
    canApply: false,
    records: Object.freeze(classified.sort(compareRecords)),
    summary: Object.freeze(summarize(classified)),
  })
}

function summarize(
  records: readonly MultiEntityShadowOwnershipRecord[]
): Record<MultiEntityShadowOwnershipClassification, number> {
  const summary = { ready: 0, missing: 0, ambiguous: 0, cross_scope: 0 }
  for (const record of records) summary[record.classification] += 1
  return summary
}

function compareRecords(
  left: MultiEntityShadowOwnershipRecord,
  right: MultiEntityShadowOwnershipRecord
): number {
  return (
    left.recordType.localeCompare(right.recordType) || left.recordId.localeCompare(right.recordId)
  )
}

function validMaxRecords(value: number | undefined, length: number): boolean {
  const maximum = value ?? DEFAULT_MAX_RECORDS
  return Number.isSafeInteger(maximum) && maximum >= 1 && length <= maximum
}

function validRecordType(value: unknown): value is EntityScopedRecordType {
  return (
    value === 'classroom' ||
    value === 'course_run' ||
    value === 'enrollment' ||
    value === 'lead' ||
    value === 'campaign' ||
    value === 'advertising_spend'
  )
}

function validIdentifier(value: unknown): value is string {
  return (
    typeof value === 'string' && value.length > 0 && value.length <= 255 && value.trim() === value
  )
}

function containsOnlyObjects(value: unknown): boolean {
  return Array.isArray(value) && value.every(isObject)
}

function isObject(value: unknown): value is object {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}
