import type {
  EntityCampusBindingTopologyRecord,
  LegalEntityTopologyRecord,
} from './multi-entity-topology'

export type EntityScopedRecordType =
  | 'classroom'
  | 'course_run'
  | 'enrollment'
  | 'lead'
  | 'campaign'
  | 'advertising_spend'

export interface EntityScopedLegacyRecord {
  readonly id: string
  readonly recordType: EntityScopedRecordType
  readonly tenantId: string
  readonly campusId: string | null
  readonly legalEntityId?: string | null
}

export interface MultiEntityBackfillInput {
  readonly targetTenantId: string
  readonly legalEntities: readonly LegalEntityTopologyRecord[]
  readonly campusBindings: readonly EntityCampusBindingTopologyRecord[]
  readonly records: readonly EntityScopedLegacyRecord[]
  readonly maxRecords?: number
}

export interface MultiEntityBackfillProposal {
  readonly operation: 'set_if_null'
  readonly recordType: EntityScopedRecordType
  readonly recordId: string
  readonly tenantId: string
  readonly campusId: string
  readonly beforeLegalEntityId: null
  readonly proposedLegalEntityId: string
}

export type MultiEntityBackfillIssueCode =
  | 'invalid_target_tenant'
  | 'invalid_record_identifier'
  | 'duplicate_record_id'
  | 'record_outside_target_tenant'
  | 'campus_missing'
  | 'campus_unmapped'
  | 'campus_ambiguous'
  | 'legal_entity_missing_or_inactive'
  | 'existing_entity_conflict'
  | 'record_limit_exceeded'

export interface MultiEntityBackfillIssue {
  readonly code: MultiEntityBackfillIssueCode
  readonly recordType?: EntityScopedRecordType
  readonly recordId?: string
  readonly relatedId?: string
}

export interface MultiEntityBackfillSummary {
  readonly total: number
  readonly proposed: number
  readonly unchanged: number
  readonly blocked: number
  readonly outsideTargetTenant: number
}

export interface MultiEntityBackfillPlan {
  readonly mode: 'dry-run'
  readonly canApply: false
  readonly fullyMappable: boolean
  readonly proposals: readonly MultiEntityBackfillProposal[]
  readonly issues: readonly MultiEntityBackfillIssue[]
  readonly summary: MultiEntityBackfillSummary
}

const DEFAULT_MAX_RECORDS = 100_000

/**
 * Produces an idempotent dry-run plan. There is intentionally no apply
 * function in this module and every proposal uses compare-and-set semantics.
 */
export function planMultiEntityBackfill(input: MultiEntityBackfillInput): MultiEntityBackfillPlan {
  if (!validIdentifier(input.targetTenantId)) {
    return planWithSingleIssue(input.records.length, 'invalid_target_tenant')
  }

  const maxRecords = input.maxRecords ?? DEFAULT_MAX_RECORDS
  if (!Number.isInteger(maxRecords) || maxRecords < 1 || input.records.length > maxRecords) {
    return planWithSingleIssue(input.records.length, 'record_limit_exceeded')
  }

  const issues: MultiEntityBackfillIssue[] = []
  const proposals: MultiEntityBackfillProposal[] = []
  const legalEntities = new Map(input.legalEntities.map((entity) => [entity.id, entity]))
  const { bindingsByCampus, invalidBindingCampuses } = buildBindingsByCampus(input, legalEntities)
  const recordKeys = new Set<string>()
  let unchanged = 0
  let outsideTargetTenant = 0

  for (const record of sortedRecords(input.records)) {
    if (!validIdentifier(record.id)) {
      issues.push(backfillIssue('invalid_record_identifier', record))
      continue
    }

    const recordKey = `${record.recordType}\u0000${record.id}`
    if (recordKeys.has(recordKey)) {
      issues.push(backfillIssue('duplicate_record_id', record, record.id))
      continue
    }
    recordKeys.add(recordKey)

    if (record.tenantId !== input.targetTenantId) {
      outsideTargetTenant += 1
      issues.push(backfillIssue('record_outside_target_tenant', record, record.tenantId))
      continue
    }

    if (!record.campusId) {
      issues.push(backfillIssue('campus_missing', record))
      continue
    }

    if (invalidBindingCampuses.has(record.campusId)) {
      issues.push(backfillIssue('legal_entity_missing_or_inactive', record, record.campusId))
      continue
    }

    const bindings = bindingsByCampus.get(record.campusId) ?? []
    if (bindings.length === 0) {
      issues.push(backfillIssue('campus_unmapped', record, record.campusId))
      continue
    }
    if (bindings.length > 1) {
      issues.push(backfillIssue('campus_ambiguous', record, record.campusId))
      continue
    }

    const proposedLegalEntityId = bindings[0]!.legalEntityId
    if (record.legalEntityId) {
      if (record.legalEntityId === proposedLegalEntityId) {
        unchanged += 1
      } else {
        issues.push(backfillIssue('existing_entity_conflict', record, record.legalEntityId))
      }
      continue
    }

    proposals.push({
      operation: 'set_if_null',
      recordType: record.recordType,
      recordId: record.id,
      tenantId: record.tenantId,
      campusId: record.campusId,
      beforeLegalEntityId: null,
      proposedLegalEntityId,
    })
  }

  const sortedIssues = issues.sort(compareIssues)
  const sortedProposals = proposals.sort(compareProposals)

  return {
    mode: 'dry-run',
    canApply: false,
    fullyMappable: sortedIssues.length === 0,
    proposals: sortedProposals,
    issues: sortedIssues,
    summary: {
      total: input.records.length,
      proposed: sortedProposals.length,
      unchanged,
      blocked: sortedIssues.length,
      outsideTargetTenant,
    },
  }
}

function buildBindingsByCampus(
  input: MultiEntityBackfillInput,
  legalEntities: ReadonlyMap<string, LegalEntityTopologyRecord>
): {
  readonly bindingsByCampus: ReadonlyMap<string, EntityCampusBindingTopologyRecord[]>
  readonly invalidBindingCampuses: ReadonlySet<string>
} {
  const result = new Map<string, EntityCampusBindingTopologyRecord[]>()
  const invalidBindingCampuses = new Set<string>()

  for (const binding of input.campusBindings) {
    if (binding.tenantId !== input.targetTenantId || binding.status === 'inactive') continue

    const entity = legalEntities.get(binding.legalEntityId)
    if (!entity || entity.tenantId !== input.targetTenantId || entity.status === 'inactive') {
      invalidBindingCampuses.add(binding.campusId)
      continue
    }

    const existing = result.get(binding.campusId) ?? []
    existing.push(binding)
    result.set(binding.campusId, existing)
  }

  return { bindingsByCampus: result, invalidBindingCampuses }
}

function sortedRecords(
  records: readonly EntityScopedLegacyRecord[]
): readonly EntityScopedLegacyRecord[] {
  return [...records].sort(
    (left, right) =>
      left.recordType.localeCompare(right.recordType) || left.id.localeCompare(right.id)
  )
}

function compareProposals(
  left: MultiEntityBackfillProposal,
  right: MultiEntityBackfillProposal
): number {
  return (
    left.recordType.localeCompare(right.recordType) || left.recordId.localeCompare(right.recordId)
  )
}

function compareIssues(left: MultiEntityBackfillIssue, right: MultiEntityBackfillIssue): number {
  return (
    (left.recordType ?? '').localeCompare(right.recordType ?? '') ||
    (left.recordId ?? '').localeCompare(right.recordId ?? '') ||
    left.code.localeCompare(right.code)
  )
}

function backfillIssue(
  code: Exclude<MultiEntityBackfillIssueCode, 'record_limit_exceeded'>,
  record: EntityScopedLegacyRecord,
  relatedId?: string
): MultiEntityBackfillIssue {
  return relatedId === undefined
    ? { code, recordType: record.recordType, recordId: record.id }
    : { code, recordType: record.recordType, recordId: record.id, relatedId }
}

function validIdentifier(value: string): boolean {
  return value.trim().length > 0 && value.length <= 255
}

function planWithSingleIssue(
  total: number,
  code: 'invalid_target_tenant' | 'record_limit_exceeded'
): MultiEntityBackfillPlan {
  return {
    mode: 'dry-run',
    canApply: false,
    fullyMappable: false,
    proposals: [],
    issues: [{ code }],
    summary: {
      total,
      proposed: 0,
      unchanged: 0,
      blocked: 1,
      outsideTargetTenant: 0,
    },
  }
}
