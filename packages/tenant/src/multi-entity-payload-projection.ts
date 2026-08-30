import {
  planMultiEntityBackfill,
  type EntityScopedLegacyRecord,
  type EntityScopedRecordType,
  type MultiEntityBackfillPlan,
} from './multi-entity-backfill'
import type {
  EntityCampusBindingTopologyRecord,
  LegalEntityTopologyRecord,
} from './multi-entity-topology'
import type { EntityResolutionDependency } from './multi-entity-explicit-resolution'

export type PayloadShadowRelationship =
  | string
  | number
  | { readonly id?: unknown }
  | null
  | undefined

interface PayloadShadowBaseRecord {
  readonly id: unknown
  readonly tenant: PayloadShadowRelationship
  readonly legalEntity?: PayloadShadowRelationship
}

export interface PayloadShadowCampusRecord extends PayloadShadowBaseRecord {
  readonly campus?: PayloadShadowRelationship
}

export interface PayloadShadowEnrollmentRecord extends PayloadShadowBaseRecord {
  readonly course_run?: PayloadShadowRelationship
}

export interface PayloadShadowAdvertisingSpendRecord extends PayloadShadowBaseRecord {
  readonly campaign?: PayloadShadowRelationship
}

export interface PayloadOperationalSnapshot {
  readonly targetTenantId: string
  readonly classrooms: readonly PayloadShadowCampusRecord[]
  readonly courseRuns: readonly PayloadShadowCampusRecord[]
  readonly enrollments: readonly PayloadShadowEnrollmentRecord[]
  readonly leads: readonly PayloadShadowCampusRecord[]
  readonly campaigns: readonly PayloadShadowBaseRecord[]
  readonly advertisingSpends: readonly PayloadShadowAdvertisingSpendRecord[]
  readonly maxRecords?: number
}

export type PayloadProjectionIssueCode =
  | 'invalid_target_tenant'
  | 'record_limit_exceeded'
  | 'invalid_record_id'
  | 'duplicate_record_id'
  | 'tenant_relationship_invalid'
  | 'record_outside_target_tenant'
  | 'legal_entity_relationship_invalid'
  | 'campus_relationship_invalid'
  | 'course_run_relationship_invalid'
  | 'course_run_missing'
  | 'campaign_relationship_invalid'
  | 'campaign_missing'

export interface PayloadProjectionIssue {
  readonly code: PayloadProjectionIssueCode
  readonly recordType?: EntityScopedRecordType
  readonly recordId?: string
  readonly relatedId?: string
}

export interface PayloadProjectionSummary {
  readonly sourceRecords: number
  readonly projectedRecords: number
  readonly campusResolved: number
  readonly campusUnresolved: number
  readonly blocked: number
  readonly outsideTargetTenant: number
}

export interface PayloadOperationalProjection {
  readonly mode: 'shadow_projection'
  readonly canWrite: false
  readonly readyForBackfill: boolean
  readonly records: readonly EntityScopedLegacyRecord[]
  readonly dependencies: readonly EntityResolutionDependency[]
  readonly issues: readonly PayloadProjectionIssue[]
  readonly summary: PayloadProjectionSummary
}

export interface PayloadBackfillPlanningInput extends PayloadOperationalSnapshot {
  readonly legalEntities: readonly LegalEntityTopologyRecord[]
  readonly campusBindings: readonly EntityCampusBindingTopologyRecord[]
}

export interface PayloadBackfillShadowPlan {
  readonly mode: 'shadow_projection_and_dry_run'
  readonly canWrite: false
  readonly ready: boolean
  readonly projection: PayloadOperationalProjection
  readonly backfill: MultiEntityBackfillPlan
}

const DEFAULT_MAX_RECORDS = 100_000

/**
 * Converts already-fetched Payload-like records into the normalized dry-run
 * contract. It performs no I/O and never infers a campus that is not supported
 * by an existing relationship.
 */
export function projectPayloadOperationalSnapshot(
  input: PayloadOperationalSnapshot
): PayloadOperationalProjection {
  const sourceRecords = countSourceRecords(input)
  if (!validIdentifier(input.targetTenantId)) {
    return emptyProjection(sourceRecords, 'invalid_target_tenant')
  }

  const maxRecords = input.maxRecords ?? DEFAULT_MAX_RECORDS
  if (!Number.isInteger(maxRecords) || maxRecords < 1 || sourceRecords > maxRecords) {
    return emptyProjection(sourceRecords, 'record_limit_exceeded')
  }

  const records: EntityScopedLegacyRecord[] = []
  const dependencies: EntityResolutionDependency[] = []
  const issues: PayloadProjectionIssue[] = []
  const seen = new Set<string>()
  const courseRunCampuses = new Map<string, string | null>()
  const campaignCampuses = new Map<string, string | null>()
  let outsideTargetTenant = 0

  const projectCampusRecord = (
    recordType: 'classroom' | 'course_run' | 'lead',
    source: PayloadShadowCampusRecord
  ): EntityScopedLegacyRecord | null => {
    const base = projectBaseRecord(source, recordType, input.targetTenantId, issues)
    if (!base) return null
    if (base.tenantId !== input.targetTenantId) outsideTargetTenant += 1

    const campus = relationshipId(source.campus)
    if (campus.kind === 'invalid') {
      issues.push(projectionIssue('campus_relationship_invalid', recordType, base.id))
    }

    return {
      ...base,
      recordType,
      campusId: campus.kind === 'valid' ? campus.id : null,
    }
  }

  for (const source of input.classrooms) {
    const record = projectCampusRecord('classroom', source)
    if (record) addUniqueRecord(record, records, issues, seen)
  }

  for (const source of input.courseRuns) {
    const record = projectCampusRecord('course_run', source)
    if (!record) continue
    if (addUniqueRecord(record, records, issues, seen)) {
      courseRunCampuses.set(record.id, record.campusId)
    }
  }

  for (const source of input.campaigns) {
    const base = projectBaseRecord(source, 'campaign', input.targetTenantId, issues)
    if (!base) continue
    if (base.tenantId !== input.targetTenantId) outsideTargetTenant += 1
    const record: EntityScopedLegacyRecord = {
      ...base,
      recordType: 'campaign',
      campusId: null,
    }
    if (addUniqueRecord(record, records, issues, seen)) campaignCampuses.set(record.id, null)
  }

  for (const source of input.enrollments) {
    const base = projectBaseRecord(source, 'enrollment', input.targetTenantId, issues)
    if (!base) continue
    if (base.tenantId !== input.targetTenantId) outsideTargetTenant += 1
    const courseRun = relationshipId(source.course_run)
    let campusId: string | null = null

    if (courseRun.kind === 'invalid' || courseRun.kind === 'missing') {
      issues.push(projectionIssue('course_run_relationship_invalid', 'enrollment', base.id))
    } else if (!courseRunCampuses.has(courseRun.id)) {
      issues.push(projectionIssue('course_run_missing', 'enrollment', base.id, courseRun.id))
    } else {
      campusId = courseRunCampuses.get(courseRun.id) ?? null
    }

    addUniqueRecord({ ...base, recordType: 'enrollment', campusId }, records, issues, seen)
  }

  for (const source of input.leads) {
    const record = projectCampusRecord('lead', source)
    if (record) addUniqueRecord(record, records, issues, seen)
  }

  for (const source of input.advertisingSpends) {
    const base = projectBaseRecord(source, 'advertising_spend', input.targetTenantId, issues)
    if (!base) continue
    if (base.tenantId !== input.targetTenantId) outsideTargetTenant += 1
    const campaign = relationshipId(source.campaign)
    let campusId: string | null = null

    if (campaign.kind === 'invalid' || campaign.kind === 'missing') {
      issues.push(projectionIssue('campaign_relationship_invalid', 'advertising_spend', base.id))
    } else if (!campaignCampuses.has(campaign.id)) {
      issues.push(projectionIssue('campaign_missing', 'advertising_spend', base.id, campaign.id))
    } else {
      campusId = campaignCampuses.get(campaign.id) ?? null
      dependencies.push({
        childRecordType: 'advertising_spend',
        childRecordId: base.id,
        parentRecordType: 'campaign',
        parentRecordId: campaign.id,
      })
    }

    addUniqueRecord({ ...base, recordType: 'advertising_spend', campusId }, records, issues, seen)
  }

  const sortedRecords = records.sort(compareRecords)
  const sortedIssues = issues.sort(compareIssues)
  const campusResolved = sortedRecords.filter(({ campusId }) => campusId !== null).length
  const campusUnresolved = sortedRecords.length - campusResolved

  return {
    mode: 'shadow_projection',
    canWrite: false,
    readyForBackfill: sortedIssues.length === 0 && campusUnresolved === 0,
    records: sortedRecords,
    dependencies: dependencies.sort(
      (left, right) =>
        left.childRecordId.localeCompare(right.childRecordId) ||
        left.parentRecordId.localeCompare(right.parentRecordId)
    ),
    issues: sortedIssues,
    summary: {
      sourceRecords,
      projectedRecords: sortedRecords.length,
      campusResolved,
      campusUnresolved,
      blocked: sortedIssues.length,
      outsideTargetTenant,
    },
  }
}

/**
 * Chains the read-only projection with the existing set-if-null dry-run plan.
 * Neither stage exposes an apply operation.
 */
export function planPayloadMultiEntityBackfill(
  input: PayloadBackfillPlanningInput
): PayloadBackfillShadowPlan {
  const projection = projectPayloadOperationalSnapshot(input)
  const backfill = planMultiEntityBackfill({
    targetTenantId: input.targetTenantId,
    legalEntities: input.legalEntities,
    campusBindings: input.campusBindings,
    records: projection.records,
    maxRecords: input.maxRecords,
  })

  return {
    mode: 'shadow_projection_and_dry_run',
    canWrite: false,
    ready: projection.readyForBackfill && backfill.fullyMappable,
    projection,
    backfill,
  }
}

function projectBaseRecord(
  source: PayloadShadowBaseRecord,
  recordType: EntityScopedRecordType,
  targetTenantId: string,
  issues: PayloadProjectionIssue[]
): Omit<EntityScopedLegacyRecord, 'recordType' | 'campusId'> | null {
  const id = relationshipId(source.id as PayloadShadowRelationship)
  if (id.kind !== 'valid') {
    issues.push(projectionIssue('invalid_record_id', recordType))
    return null
  }

  const tenant = relationshipId(source.tenant)
  if (tenant.kind !== 'valid') {
    issues.push(projectionIssue('tenant_relationship_invalid', recordType, id.id))
    return null
  }
  if (tenant.id !== targetTenantId) {
    issues.push(projectionIssue('record_outside_target_tenant', recordType, id.id, tenant.id))
  }

  const legalEntity = relationshipId(source.legalEntity)
  if (legalEntity.kind === 'invalid') {
    issues.push(projectionIssue('legal_entity_relationship_invalid', recordType, id.id))
  }

  return {
    id: id.id,
    tenantId: tenant.id,
    legalEntityId: legalEntity.kind === 'valid' ? legalEntity.id : null,
  }
}

function addUniqueRecord(
  record: EntityScopedLegacyRecord,
  records: EntityScopedLegacyRecord[],
  issues: PayloadProjectionIssue[],
  seen: Set<string>
): boolean {
  const key = `${record.recordType}\u0000${record.id}`
  if (seen.has(key)) {
    issues.push(projectionIssue('duplicate_record_id', record.recordType, record.id))
    return false
  }
  seen.add(key)
  records.push(record)
  return true
}

type RelationshipResult =
  | { readonly kind: 'missing' }
  | { readonly kind: 'invalid' }
  | { readonly kind: 'valid'; readonly id: string }

function relationshipId(value: PayloadShadowRelationship): RelationshipResult {
  if (value === null || value === undefined) return { kind: 'missing' }
  if (typeof value === 'object') {
    if (!Object.prototype.hasOwnProperty.call(value, 'id')) return { kind: 'invalid' }
    const nestedId = value.id
    if (typeof nestedId !== 'string' && typeof nestedId !== 'number') {
      return { kind: 'invalid' }
    }
    return relationshipId(nestedId)
  }
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) && value >= 0
      ? { kind: 'valid', id: String(value) }
      : { kind: 'invalid' }
  }
  return validIdentifier(value) ? { kind: 'valid', id: value } : { kind: 'invalid' }
}

function validIdentifier(value: string): boolean {
  return value.length > 0 && value.length <= 255 && value.trim() === value
}

function countSourceRecords(input: PayloadOperationalSnapshot): number {
  return (
    input.classrooms.length +
    input.courseRuns.length +
    input.enrollments.length +
    input.leads.length +
    input.campaigns.length +
    input.advertisingSpends.length
  )
}

function emptyProjection(
  sourceRecords: number,
  code: 'invalid_target_tenant' | 'record_limit_exceeded'
): PayloadOperationalProjection {
  return {
    mode: 'shadow_projection',
    canWrite: false,
    readyForBackfill: false,
    records: [],
    dependencies: [],
    issues: [{ code }],
    summary: {
      sourceRecords,
      projectedRecords: 0,
      campusResolved: 0,
      campusUnresolved: 0,
      blocked: 1,
      outsideTargetTenant: 0,
    },
  }
}

function projectionIssue(
  code: PayloadProjectionIssueCode,
  recordType?: EntityScopedRecordType,
  recordId?: string,
  relatedId?: string
): PayloadProjectionIssue {
  return {
    code,
    ...(recordType === undefined ? {} : { recordType }),
    ...(recordId === undefined ? {} : { recordId }),
    ...(relatedId === undefined ? {} : { relatedId }),
  }
}

function compareRecords(left: EntityScopedLegacyRecord, right: EntityScopedLegacyRecord): number {
  return left.recordType.localeCompare(right.recordType) || left.id.localeCompare(right.id)
}

function compareIssues(left: PayloadProjectionIssue, right: PayloadProjectionIssue): number {
  return (
    (left.recordType ?? '').localeCompare(right.recordType ?? '') ||
    (left.recordId ?? '').localeCompare(right.recordId ?? '') ||
    left.code.localeCompare(right.code) ||
    (left.relatedId ?? '').localeCompare(right.relatedId ?? '')
  )
}
