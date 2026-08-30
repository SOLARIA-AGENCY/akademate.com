import type { EntityScopedLegacyRecord, EntityScopedRecordType } from './multi-entity-backfill'
import type {
  EntityCampusBindingTopologyRecord,
  LegalEntityTopologyRecord,
} from './multi-entity-topology'

export interface ExplicitEntityResolutionRequest {
  readonly recordType: EntityScopedRecordType
  readonly recordId: string
  readonly proposedLegalEntityId: string
  readonly reviewReference: string
}

export interface EntityResolutionDependency {
  readonly childRecordType: 'advertising_spend'
  readonly childRecordId: string
  readonly parentRecordType: 'campaign'
  readonly parentRecordId: string
}

export interface ExplicitEntityResolutionInput {
  readonly targetTenantId: string
  readonly legalEntities: readonly LegalEntityTopologyRecord[]
  readonly campusBindings: readonly EntityCampusBindingTopologyRecord[]
  readonly records: readonly EntityScopedLegacyRecord[]
  readonly resolutions: readonly ExplicitEntityResolutionRequest[]
  readonly dependencies: readonly EntityResolutionDependency[]
  readonly maxRecords?: number
}

export type ExplicitEntityResolutionSource = 'explicit_review' | 'parent_campaign'

export interface ExplicitEntityResolutionRollback {
  readonly operation: 'restore_null_if_unchanged'
  readonly expectedLegalEntityId: string
  readonly restoreLegalEntityId: null
}

export interface ExplicitEntityResolutionProposal {
  readonly operation: 'set_if_null'
  readonly recordType: EntityScopedRecordType
  readonly recordId: string
  readonly tenantId: string
  readonly beforeLegalEntityId: null
  readonly proposedLegalEntityId: string
  readonly resolutionSource: ExplicitEntityResolutionSource
  readonly reviewReference: string
  readonly rollback: ExplicitEntityResolutionRollback
}

export type ExplicitEntityResolutionIssueCode =
  | 'invalid_target_tenant'
  | 'record_limit_exceeded'
  | 'invalid_record_identifier'
  | 'duplicate_record_id'
  | 'record_outside_target_tenant'
  | 'legal_entity_duplicate'
  | 'existing_entity_missing_or_inactive'
  | 'existing_entity_conflicts_with_campus'
  | 'resolution_identifier_invalid'
  | 'resolution_duplicate'
  | 'resolution_record_missing'
  | 'resolution_review_reference_invalid'
  | 'resolution_entity_missing_or_inactive'
  | 'resolution_conflicts_with_existing_entity'
  | 'resolution_conflicts_with_campus'
  | 'campus_unmapped'
  | 'campus_ambiguous'
  | 'campus_binding_entity_missing_or_inactive'
  | 'dependency_invalid'
  | 'dependency_duplicate'
  | 'dependency_child_missing'
  | 'dependency_parent_missing'
  | 'dependency_cross_tenant'
  | 'dependency_parent_unresolved'
  | 'dependency_entity_conflict'
  | 'resolution_missing'

export interface ExplicitEntityResolutionIssue {
  readonly code: ExplicitEntityResolutionIssueCode
  readonly recordType?: EntityScopedRecordType
  readonly recordId?: string
  readonly relatedId?: string
}

export interface ExplicitEntityResolutionSummary {
  readonly total: number
  readonly proposed: number
  readonly inheritedFromCampaign: number
  readonly unchanged: number
  readonly blocked: number
  readonly unresolved: number
}

export interface ExplicitEntityResolutionPlan {
  readonly mode: 'explicit_resolution_dry_run'
  readonly canApply: false
  readonly ready: boolean
  readonly proposals: readonly ExplicitEntityResolutionProposal[]
  readonly issues: readonly ExplicitEntityResolutionIssue[]
  readonly summary: ExplicitEntityResolutionSummary
}

const DEFAULT_MAX_RECORDS = 100_000
const REVIEW_REFERENCE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/-]{2,254}$/

/**
 * Plans reviewed entity assignments for records that cannot be resolved by
 * campus. The function is deterministic, has no I/O and intentionally exposes
 * no apply operation.
 */
export function planExplicitEntityResolutions(
  input: ExplicitEntityResolutionInput
): ExplicitEntityResolutionPlan {
  if (!validIdentifier(input.targetTenantId)) {
    return singleIssuePlan(input.records.length, 'invalid_target_tenant')
  }

  const maxRecords = input.maxRecords ?? DEFAULT_MAX_RECORDS
  const totalItems = input.records.length + input.resolutions.length + input.dependencies.length
  if (!Number.isInteger(maxRecords) || maxRecords < 1 || totalItems > maxRecords) {
    return singleIssuePlan(input.records.length, 'record_limit_exceeded')
  }

  const issues: ExplicitEntityResolutionIssue[] = []
  const proposals: ExplicitEntityResolutionProposal[] = []
  const records = buildRecordMap(input, issues)
  const legalEntities = buildLegalEntityMap(input, issues)
  const campusBindings = buildBindingsByCampus(input, legalEntities)
  const resolvedEntities = new Map<string, string>()
  const reviewReferences = new Map<string, string>()
  let unchanged = 0

  for (const [key, record] of records) {
    if (!record.legalEntityId) continue
    const entity = legalEntities.get(record.legalEntityId)
    if (!entity || entity.tenantId !== input.targetTenantId || entity.status === 'inactive') {
      issues.push(
        resolutionIssue(
          'existing_entity_missing_or_inactive',
          record.recordType,
          record.id,
          record.legalEntityId
        )
      )
      continue
    }

    const campusOwner = resolveCampusOwner(record, campusBindings, issues)
    if (campusOwner.kind === 'invalid') continue
    if (campusOwner.kind === 'resolved' && campusOwner.legalEntityId !== entity.id) {
      issues.push(
        resolutionIssue(
          'existing_entity_conflicts_with_campus',
          record.recordType,
          record.id,
          entity.id
        )
      )
      continue
    }
    resolvedEntities.set(key, entity.id)
  }

  const resolutionKeys = new Set<string>()
  for (const request of sortedResolutions(input.resolutions)) {
    const key = recordKey(request.recordType, request.recordId)
    if (!validIdentifier(request.recordId) || !validIdentifier(request.proposedLegalEntityId)) {
      issues.push(
        resolutionIssue(
          'resolution_identifier_invalid',
          request.recordType,
          validIdentifier(request.recordId) ? request.recordId : undefined
        )
      )
      continue
    }
    if (resolutionKeys.has(key)) {
      issues.push(resolutionIssue('resolution_duplicate', request.recordType, request.recordId))
      continue
    }
    resolutionKeys.add(key)

    const record = records.get(key)
    if (!record) {
      issues.push(
        resolutionIssue('resolution_record_missing', request.recordType, request.recordId)
      )
      continue
    }
    if (!REVIEW_REFERENCE_PATTERN.test(request.reviewReference)) {
      issues.push(
        resolutionIssue('resolution_review_reference_invalid', request.recordType, request.recordId)
      )
      continue
    }

    const entity = legalEntities.get(request.proposedLegalEntityId)
    if (!entity || entity.tenantId !== input.targetTenantId || entity.status === 'inactive') {
      issues.push(
        resolutionIssue(
          'resolution_entity_missing_or_inactive',
          request.recordType,
          request.recordId,
          request.proposedLegalEntityId
        )
      )
      continue
    }

    const existingEntity = resolvedEntities.get(key)
    if (existingEntity) {
      if (existingEntity !== entity.id) {
        issues.push(
          resolutionIssue(
            'resolution_conflicts_with_existing_entity',
            request.recordType,
            request.recordId,
            existingEntity
          )
        )
      } else {
        unchanged += 1
        reviewReferences.set(key, request.reviewReference)
      }
      continue
    }

    const campusOwner = resolveCampusOwner(record, campusBindings, issues)
    if (campusOwner.kind === 'invalid') continue
    if (campusOwner.kind === 'resolved' && campusOwner.legalEntityId !== entity.id) {
      issues.push(
        resolutionIssue(
          'resolution_conflicts_with_campus',
          request.recordType,
          request.recordId,
          campusOwner.legalEntityId
        )
      )
      continue
    }

    proposals.push(createProposal(record, entity.id, 'explicit_review', request.reviewReference))
    resolvedEntities.set(key, entity.id)
    reviewReferences.set(key, request.reviewReference)
  }

  const dependencyKeys = new Set<string>()
  for (const dependency of sortedDependencies(input.dependencies)) {
    if (
      dependency.childRecordType !== 'advertising_spend' ||
      dependency.parentRecordType !== 'campaign' ||
      !validIdentifier(dependency.childRecordId) ||
      !validIdentifier(dependency.parentRecordId)
    ) {
      issues.push(
        resolutionIssue(
          'dependency_invalid',
          dependency.childRecordType,
          validIdentifier(dependency.childRecordId) ? dependency.childRecordId : undefined
        )
      )
      continue
    }

    const childKey = recordKey(dependency.childRecordType, dependency.childRecordId)
    const parentKey = recordKey(dependency.parentRecordType, dependency.parentRecordId)
    const dependencyKey = `${childKey}\u0000${parentKey}`
    if (dependencyKeys.has(dependencyKey)) {
      issues.push(
        resolutionIssue(
          'dependency_duplicate',
          dependency.childRecordType,
          dependency.childRecordId,
          dependency.parentRecordId
        )
      )
      continue
    }
    dependencyKeys.add(dependencyKey)

    const child = records.get(childKey)
    const parent = records.get(parentKey)
    if (!child) {
      issues.push(
        resolutionIssue(
          'dependency_child_missing',
          dependency.childRecordType,
          dependency.childRecordId
        )
      )
      continue
    }
    if (!parent) {
      issues.push(
        resolutionIssue(
          'dependency_parent_missing',
          dependency.childRecordType,
          dependency.childRecordId,
          dependency.parentRecordId
        )
      )
      continue
    }
    if (child.tenantId !== parent.tenantId || child.tenantId !== input.targetTenantId) {
      issues.push(
        resolutionIssue(
          'dependency_cross_tenant',
          dependency.childRecordType,
          dependency.childRecordId,
          dependency.parentRecordId
        )
      )
      continue
    }

    const parentEntity = resolvedEntities.get(parentKey)
    const parentReviewReference = reviewReferences.get(parentKey)
    if (!parentEntity || !parentReviewReference) {
      issues.push(
        resolutionIssue(
          'dependency_parent_unresolved',
          dependency.childRecordType,
          dependency.childRecordId,
          dependency.parentRecordId
        )
      )
      continue
    }

    const childEntity = resolvedEntities.get(childKey)
    if (childEntity) {
      if (childEntity !== parentEntity) {
        issues.push(
          resolutionIssue(
            'dependency_entity_conflict',
            dependency.childRecordType,
            dependency.childRecordId,
            dependency.parentRecordId
          )
        )
      }
      continue
    }

    proposals.push(createProposal(child, parentEntity, 'parent_campaign', parentReviewReference))
    resolvedEntities.set(childKey, parentEntity)
    reviewReferences.set(childKey, parentReviewReference)
  }

  let unresolved = 0
  for (const [key, record] of records) {
    if (record.tenantId !== input.targetTenantId || resolvedEntities.has(key)) continue
    unresolved += 1
    issues.push(resolutionIssue('resolution_missing', record.recordType, record.id))
  }

  const sortedProposals = proposals.sort(compareProposals)
  const sortedIssues = issues.sort(compareIssues)
  const inheritedFromCampaign = sortedProposals.filter(
    ({ resolutionSource }) => resolutionSource === 'parent_campaign'
  ).length

  return {
    mode: 'explicit_resolution_dry_run',
    canApply: false,
    ready: sortedIssues.length === 0 && unresolved === 0,
    proposals: sortedProposals,
    issues: sortedIssues,
    summary: {
      total: input.records.length,
      proposed: sortedProposals.length,
      inheritedFromCampaign,
      unchanged,
      blocked: sortedIssues.length,
      unresolved,
    },
  }
}

function buildRecordMap(
  input: ExplicitEntityResolutionInput,
  issues: ExplicitEntityResolutionIssue[]
): ReadonlyMap<string, EntityScopedLegacyRecord> {
  const records = new Map<string, EntityScopedLegacyRecord>()
  for (const record of sortedRecords(input.records)) {
    if (!validIdentifier(record.id)) {
      issues.push(resolutionIssue('invalid_record_identifier', record.recordType))
      continue
    }
    const key = recordKey(record.recordType, record.id)
    if (records.has(key)) {
      issues.push(resolutionIssue('duplicate_record_id', record.recordType, record.id))
      continue
    }
    records.set(key, record)
    if (record.tenantId !== input.targetTenantId) {
      issues.push(
        resolutionIssue(
          'record_outside_target_tenant',
          record.recordType,
          record.id,
          record.tenantId
        )
      )
    }
  }
  return records
}

function buildLegalEntityMap(
  input: ExplicitEntityResolutionInput,
  issues: ExplicitEntityResolutionIssue[]
): ReadonlyMap<string, LegalEntityTopologyRecord> {
  const entities = new Map<string, LegalEntityTopologyRecord>()
  for (const entity of input.legalEntities) {
    if (entities.has(entity.id)) {
      issues.push(resolutionIssue('legal_entity_duplicate', undefined, undefined, entity.id))
      continue
    }
    entities.set(entity.id, entity)
  }
  return entities
}

interface CampusBindingIndex {
  readonly bindings: ReadonlyMap<string, EntityCampusBindingTopologyRecord[]>
  readonly invalidEntityCampuses: ReadonlySet<string>
}

function buildBindingsByCampus(
  input: ExplicitEntityResolutionInput,
  legalEntities: ReadonlyMap<string, LegalEntityTopologyRecord>
): CampusBindingIndex {
  const bindings = new Map<string, EntityCampusBindingTopologyRecord[]>()
  const invalidEntityCampuses = new Set<string>()
  for (const binding of input.campusBindings) {
    if (binding.tenantId !== input.targetTenantId || binding.status === 'inactive') continue
    const entity = legalEntities.get(binding.legalEntityId)
    if (!entity || entity.tenantId !== input.targetTenantId || entity.status === 'inactive') {
      invalidEntityCampuses.add(binding.campusId)
      continue
    }
    const existing = bindings.get(binding.campusId) ?? []
    existing.push(binding)
    bindings.set(binding.campusId, existing)
  }
  return { bindings, invalidEntityCampuses }
}

type CampusOwnerResult =
  | { readonly kind: 'not_applicable' }
  | { readonly kind: 'invalid' }
  | { readonly kind: 'resolved'; readonly legalEntityId: string }

function resolveCampusOwner(
  record: EntityScopedLegacyRecord,
  bindingIndex: CampusBindingIndex,
  issues: ExplicitEntityResolutionIssue[]
): CampusOwnerResult {
  if (!record.campusId) return { kind: 'not_applicable' }
  if (bindingIndex.invalidEntityCampuses.has(record.campusId)) {
    issues.push(
      resolutionIssue(
        'campus_binding_entity_missing_or_inactive',
        record.recordType,
        record.id,
        record.campusId
      )
    )
    return { kind: 'invalid' }
  }
  const bindings = bindingIndex.bindings.get(record.campusId) ?? []
  if (bindings.length === 0) {
    issues.push(resolutionIssue('campus_unmapped', record.recordType, record.id, record.campusId))
    return { kind: 'invalid' }
  }
  if (bindings.length > 1) {
    issues.push(resolutionIssue('campus_ambiguous', record.recordType, record.id, record.campusId))
    return { kind: 'invalid' }
  }
  return { kind: 'resolved', legalEntityId: bindings[0]!.legalEntityId }
}

function createProposal(
  record: EntityScopedLegacyRecord,
  legalEntityId: string,
  resolutionSource: ExplicitEntityResolutionSource,
  reviewReference: string
): ExplicitEntityResolutionProposal {
  return {
    operation: 'set_if_null',
    recordType: record.recordType,
    recordId: record.id,
    tenantId: record.tenantId,
    beforeLegalEntityId: null,
    proposedLegalEntityId: legalEntityId,
    resolutionSource,
    reviewReference,
    rollback: {
      operation: 'restore_null_if_unchanged',
      expectedLegalEntityId: legalEntityId,
      restoreLegalEntityId: null,
    },
  }
}

function recordKey(recordType: EntityScopedRecordType, recordId: string): string {
  return `${recordType}\u0000${recordId}`
}

function validIdentifier(value: string): boolean {
  return value.length > 0 && value.length <= 255 && value.trim() === value
}

function sortedRecords(records: readonly EntityScopedLegacyRecord[]): EntityScopedLegacyRecord[] {
  return [...records].sort(
    (left, right) =>
      left.recordType.localeCompare(right.recordType) || left.id.localeCompare(right.id)
  )
}

function sortedResolutions(
  resolutions: readonly ExplicitEntityResolutionRequest[]
): ExplicitEntityResolutionRequest[] {
  return [...resolutions].sort(
    (left, right) =>
      left.recordType.localeCompare(right.recordType) || left.recordId.localeCompare(right.recordId)
  )
}

function sortedDependencies(
  dependencies: readonly EntityResolutionDependency[]
): EntityResolutionDependency[] {
  return [...dependencies].sort(
    (left, right) =>
      left.childRecordId.localeCompare(right.childRecordId) ||
      left.parentRecordId.localeCompare(right.parentRecordId)
  )
}

function compareProposals(
  left: ExplicitEntityResolutionProposal,
  right: ExplicitEntityResolutionProposal
): number {
  return (
    left.recordType.localeCompare(right.recordType) || left.recordId.localeCompare(right.recordId)
  )
}

function compareIssues(
  left: ExplicitEntityResolutionIssue,
  right: ExplicitEntityResolutionIssue
): number {
  return (
    (left.recordType ?? '').localeCompare(right.recordType ?? '') ||
    (left.recordId ?? '').localeCompare(right.recordId ?? '') ||
    left.code.localeCompare(right.code) ||
    (left.relatedId ?? '').localeCompare(right.relatedId ?? '')
  )
}

function resolutionIssue(
  code: ExplicitEntityResolutionIssueCode,
  recordType?: EntityScopedRecordType,
  recordId?: string,
  relatedId?: string
): ExplicitEntityResolutionIssue {
  return {
    code,
    ...(recordType === undefined ? {} : { recordType }),
    ...(recordId === undefined ? {} : { recordId }),
    ...(relatedId === undefined ? {} : { relatedId }),
  }
}

function singleIssuePlan(
  total: number,
  code: 'invalid_target_tenant' | 'record_limit_exceeded'
): ExplicitEntityResolutionPlan {
  return {
    mode: 'explicit_resolution_dry_run',
    canApply: false,
    ready: false,
    proposals: [],
    issues: [{ code }],
    summary: {
      total,
      proposed: 0,
      inheritedFromCampaign: 0,
      unchanged: 0,
      blocked: 1,
      unresolved: total,
    },
  }
}
