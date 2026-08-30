export type MultiEntitySchemaCollection =
  | 'course-runs'
  | 'enrollments'
  | 'campaigns'
  | 'leads'
  | 'campuses'
  | 'classrooms'
  | 'staff'
  | 'media'

export type MultiEntitySchemaPlanStatus = 'ready' | 'missing' | 'ambiguous' | 'cross_scope'

export type MultiEntityOwnershipMode = 'legal_entity_owned' | 'tenant_shared_master'

export interface MultiEntitySchemaAuthorityDecision {
  readonly collection: MultiEntitySchemaCollection
  readonly operationalAuthority: 'payload'
  readonly drizzleRepresentation:
    | 'partial_parallel_model'
    | 'semantic_alias_only'
    | 'not_represented'
  readonly currentTenantScope:
    | 'direct_required'
    | 'direct_optional'
    | 'relationship_only'
    | 'absent'
  readonly ownershipMode: MultiEntityOwnershipMode
  readonly nullableExpansionFields: readonly string[]
  readonly ownershipRule: string
}

export interface MultiEntitySchemaExpansionRecord {
  readonly collection: MultiEntitySchemaCollection
  readonly recordId: string
  readonly tenantId: string
  /** Existing value in the future nullable Payload relationship, if present. */
  readonly currentLegalEntityId?: string | null
  /** Human-reviewed bindings only. Never populate from course, domain, user or role inference. */
  readonly reviewedLegalEntityIds: readonly string[]
  /** Owners of referenced entity-local resources such as campus, course run or campaign. */
  readonly dependencyLegalEntityIds?: readonly string[]
}

export interface MultiEntitySchemaExpansionPlanItem {
  readonly collection: MultiEntitySchemaCollection
  readonly recordId: string
  readonly tenantId: string
  readonly status: MultiEntitySchemaPlanStatus
  readonly proposedLegalEntityId: string | null
  readonly reason:
    | 'single_reviewed_owner'
    | 'shared_master'
    | 'shared_master_assignment_forbidden'
    | 'reviewed_owner_missing'
    | 'multiple_reviewed_owners'
    | 'dependency_owner_conflict'
    | 'existing_owner_conflict'
  readonly operation: 'set_if_null' | 'none'
  readonly rollback: {
    readonly strategy: 'null_if_unchanged'
    readonly expectedCurrentLegalEntityId: string
    readonly restoreLegalEntityId: null
  } | null
}

export interface MultiEntitySchemaExpansionPlan {
  readonly schemaVersion: 1
  readonly kind: 'cep_multi_entity_payload_expand_only_plan'
  readonly mode: 'dry_run'
  readonly operationalAuthority: 'payload'
  readonly canReadData: false
  readonly canWrite: false
  readonly canApplyMigration: false
  readonly canChangePermissions: false
  readonly authorityDecisions: readonly MultiEntitySchemaAuthorityDecision[]
  readonly items: readonly MultiEntitySchemaExpansionPlanItem[]
  readonly summary: Readonly<Record<MultiEntitySchemaPlanStatus, number>>
}

const COLLECTION_ORDER: readonly MultiEntitySchemaCollection[] = [
  'campuses',
  'classrooms',
  'course-runs',
  'enrollments',
  'campaigns',
  'leads',
  'staff',
  'media',
]
const MAX_RECORDS = 100_000
const RECORD_KEYS = new Set([
  'collection',
  'recordId',
  'tenantId',
  'currentLegalEntityId',
  'reviewedLegalEntityIds',
  'dependencyLegalEntityIds',
])
const PLAN_KEYS = new Set([
  'schemaVersion',
  'kind',
  'mode',
  'operationalAuthority',
  'canReadData',
  'canWrite',
  'canApplyMigration',
  'canChangePermissions',
  'authorityDecisions',
  'items',
  'summary',
])
const SUMMARY_KEYS = new Set(['ready', 'missing', 'ambiguous', 'cross_scope'])
const PLAN_ITEM_KEYS = new Set([
  'collection',
  'recordId',
  'tenantId',
  'status',
  'proposedLegalEntityId',
  'reason',
  'operation',
  'rollback',
])
const ROLLBACK_KEYS = new Set(['strategy', 'expectedCurrentLegalEntityId', 'restoreLegalEntityId'])

/**
 * Source-level authority decision reconstructed from the current worktree.
 * This is descriptive and preparatory: it does not register Payload fields or
 * make the parallel Drizzle schema authoritative for operational collections.
 */
export const MULTI_ENTITY_SCHEMA_AUTHORITY_DECISIONS: readonly MultiEntitySchemaAuthorityDecision[] =
  Object.freeze([
    decision(
      'campuses',
      'semantic_alias_only',
      'direct_required',
      'legal_entity_owned',
      ['legal_entity'],
      'A campus has exactly one explicit legal entity; city, slug and domain are never ownership evidence.'
    ),
    decision(
      'classrooms',
      'not_represented',
      'direct_required',
      'legal_entity_owned',
      ['legal_entity'],
      'A classroom owner must be explicit and must equal the reviewed owner of its campus.'
    ),
    decision(
      'course-runs',
      'partial_parallel_model',
      'direct_required',
      'legal_entity_owned',
      ['legal_entity'],
      'A course run has one explicit owner; shared course, cycle, instructor or current user cannot supply it.'
    ),
    decision(
      'enrollments',
      'partial_parallel_model',
      'relationship_only',
      'legal_entity_owned',
      ['legal_entity'],
      'An enrollment owner must be explicit and equal the reviewed owner of its course run.'
    ),
    decision(
      'campaigns',
      'partial_parallel_model',
      'direct_required',
      'legal_entity_owned',
      ['legal_entity'],
      'A campaign has one explicit owner; a shared course or creator is not ownership evidence.'
    ),
    decision(
      'leads',
      'partial_parallel_model',
      'direct_optional',
      'legal_entity_owned',
      ['legal_entity'],
      'A lead owner must be explicit and agree with any reviewed campus and campaign owners.'
    ),
    decision(
      'staff',
      'semantic_alias_only',
      'absent',
      'tenant_shared_master',
      [],
      'Staff identity remains shared; entity-local agreements belong in a separate future assignment resource.'
    ),
    decision(
      'media',
      'not_represented',
      'absent',
      'tenant_shared_master',
      [],
      'Media remains shared at tenant level; uploader and consuming records do not transfer ownership.'
    ),
  ])

/**
 * Produces a deterministic expand-only dry-run from synthetic or previously
 * reviewed inputs. No reader, database client, Payload hook, ACL or mutation is
 * accepted by this API.
 */
export function planMultiEntitySchemaExpansion(
  records: readonly MultiEntitySchemaExpansionRecord[]
): MultiEntitySchemaExpansionPlan {
  if (!Array.isArray(records) || records.length > MAX_RECORDS) {
    throw invalidPlan('invalid_input')
  }
  const seen = new Set<string>()
  const items = records.map((record) => {
    validateRecord(record)
    const key = `${record.collection}\u0000${record.recordId}`
    if (seen.has(key)) throw invalidPlan('duplicate_record')
    seen.add(key)
    return planRecord(record)
  })

  items.sort(
    (left, right) =>
      COLLECTION_ORDER.indexOf(left.collection) - COLLECTION_ORDER.indexOf(right.collection) ||
      left.recordId.localeCompare(right.recordId)
  )

  const summary: Record<MultiEntitySchemaPlanStatus, number> = {
    ready: 0,
    missing: 0,
    ambiguous: 0,
    cross_scope: 0,
  }
  for (const item of items) summary[item.status] += 1

  return Object.freeze({
    schemaVersion: 1 as const,
    kind: 'cep_multi_entity_payload_expand_only_plan' as const,
    mode: 'dry_run' as const,
    operationalAuthority: 'payload' as const,
    canReadData: false as const,
    canWrite: false as const,
    canApplyMigration: false as const,
    canChangePermissions: false as const,
    authorityDecisions: MULTI_ENTITY_SCHEMA_AUTHORITY_DECISIONS,
    items: Object.freeze(items),
    summary: Object.freeze(summary),
  })
}

/**
 * Validates and content-addresses an expand-only plan without granting execution
 * authority. The staging authority gate may bind only the empty source-level
 * form; record-bearing dry-runs remain independent review artifacts.
 */
export function digestMultiEntitySchemaExpansionPlan(value: unknown): `sha256:${string}` {
  assertMultiEntitySchemaExpansionPlan(value)
  return `sha256:${createHash('sha256').update(JSON.stringify(value)).digest('hex')}`
}

export function assertMultiEntitySchemaExpansionPlan(
  value: unknown
): asserts value is MultiEntitySchemaExpansionPlan {
  if (!value || typeof value !== 'object' || !hasOnlyAllowedKeys(value, PLAN_KEYS)) {
    throw invalidPlan('invalid_plan')
  }
  const plan = value as MultiEntitySchemaExpansionPlan
  if (
    plan.schemaVersion !== 1 ||
    plan.kind !== 'cep_multi_entity_payload_expand_only_plan' ||
    plan.mode !== 'dry_run' ||
    plan.operationalAuthority !== 'payload' ||
    plan.canReadData !== false ||
    plan.canWrite !== false ||
    plan.canApplyMigration !== false ||
    plan.canChangePermissions !== false ||
    !Array.isArray(plan.authorityDecisions) ||
    JSON.stringify(plan.authorityDecisions) !==
      JSON.stringify(MULTI_ENTITY_SCHEMA_AUTHORITY_DECISIONS) ||
    !Array.isArray(plan.items) ||
    plan.items.length > MAX_RECORDS ||
    !plan.summary ||
    typeof plan.summary !== 'object' ||
    !hasOnlyAllowedKeys(plan.summary, SUMMARY_KEYS)
  ) {
    throw invalidPlan('invalid_plan')
  }

  const summary: Record<MultiEntitySchemaPlanStatus, number> = {
    ready: 0,
    missing: 0,
    ambiguous: 0,
    cross_scope: 0,
  }
  let previousItem: MultiEntitySchemaExpansionPlanItem | null = null
  for (const candidate of plan.items) {
    if (!validPlanItem(candidate)) throw invalidPlan('invalid_plan')
    if (previousItem !== null && comparePlanItems(previousItem, candidate) >= 0) {
      throw invalidPlan('invalid_plan')
    }
    previousItem = candidate
    summary[candidate.status] += 1
  }
  if (
    (Object.keys(summary) as MultiEntitySchemaPlanStatus[]).some(
      (status) => plan.summary[status] !== summary[status]
    )
  ) {
    throw invalidPlan('invalid_plan')
  }
}

function validPlanItem(value: unknown): value is MultiEntitySchemaExpansionPlanItem {
  if (!value || typeof value !== 'object' || !hasOnlyAllowedKeys(value, PLAN_ITEM_KEYS)) {
    return false
  }
  const item = value as MultiEntitySchemaExpansionPlanItem
  const rollbackValid =
    item.rollback === null ||
    (typeof item.rollback === 'object' &&
      hasOnlyAllowedKeys(item.rollback, ROLLBACK_KEYS) &&
      item.rollback.strategy === 'null_if_unchanged' &&
      validId(item.rollback.expectedCurrentLegalEntityId) &&
      item.rollback.restoreLegalEntityId === null)
  return (
    COLLECTION_ORDER.includes(item.collection) &&
    validId(item.recordId) &&
    validId(item.tenantId) &&
    ['ready', 'missing', 'ambiguous', 'cross_scope'].includes(item.status) &&
    (item.proposedLegalEntityId === null || validId(item.proposedLegalEntityId)) &&
    [
      'single_reviewed_owner',
      'shared_master',
      'shared_master_assignment_forbidden',
      'reviewed_owner_missing',
      'multiple_reviewed_owners',
      'dependency_owner_conflict',
      'existing_owner_conflict',
    ].includes(item.reason) &&
    ['set_if_null', 'none'].includes(item.operation) &&
    rollbackValid &&
    (item.operation === 'set_if_null'
      ? item.status === 'ready' &&
        item.reason === 'single_reviewed_owner' &&
        item.proposedLegalEntityId !== null &&
        item.rollback?.expectedCurrentLegalEntityId === item.proposedLegalEntityId
      : item.rollback === null)
  )
}

function comparePlanItems(
  left: MultiEntitySchemaExpansionPlanItem,
  right: MultiEntitySchemaExpansionPlanItem
): number {
  return (
    COLLECTION_ORDER.indexOf(left.collection) - COLLECTION_ORDER.indexOf(right.collection) ||
    left.recordId.localeCompare(right.recordId)
  )
}

function planRecord(record: MultiEntitySchemaExpansionRecord): MultiEntitySchemaExpansionPlanItem {
  const authority = authorityFor(record.collection)
  if (authority.ownershipMode === 'tenant_shared_master') {
    if (
      normalizeIds(record.reviewedLegalEntityIds).length > 0 ||
      normalizeIds(record.dependencyLegalEntityIds ?? []).length > 0 ||
      normalizeOptionalId(record.currentLegalEntityId) !== null
    ) {
      return item(record, 'ambiguous', null, 'shared_master_assignment_forbidden', 'none', null)
    }
    return item(record, 'ready', null, 'shared_master', 'none', null)
  }

  const currentOwner = normalizeOptionalId(record.currentLegalEntityId)
  const reviewedOwners = normalizeIds(record.reviewedLegalEntityIds)
  const dependencyOwners = normalizeIds(record.dependencyLegalEntityIds ?? [])
  const dependencyConflict = dependencyOwners.length > 1

  if (dependencyConflict) {
    return item(record, 'cross_scope', null, 'dependency_owner_conflict', 'none', null)
  }
  if (reviewedOwners.length === 0) {
    if (currentOwner && dependencyOwners.length === 1 && currentOwner !== dependencyOwners[0]) {
      return item(record, 'cross_scope', null, 'existing_owner_conflict', 'none', null)
    }
    return item(record, 'missing', null, 'reviewed_owner_missing', 'none', null)
  }
  if (reviewedOwners.length > 1) {
    return item(record, 'ambiguous', null, 'multiple_reviewed_owners', 'none', null)
  }

  const reviewedOwner = reviewedOwners[0]!
  if (dependencyOwners.length === 1 && reviewedOwner !== dependencyOwners[0]) {
    return item(record, 'cross_scope', null, 'dependency_owner_conflict', 'none', null)
  }
  if (currentOwner && currentOwner !== reviewedOwner) {
    return item(record, 'cross_scope', null, 'existing_owner_conflict', 'none', null)
  }
  if (currentOwner) {
    return item(record, 'ready', currentOwner, 'single_reviewed_owner', 'none', null)
  }

  return item(record, 'ready', reviewedOwner, 'single_reviewed_owner', 'set_if_null', {
    strategy: 'null_if_unchanged',
    expectedCurrentLegalEntityId: reviewedOwner,
    restoreLegalEntityId: null,
  })
}

function item(
  record: MultiEntitySchemaExpansionRecord,
  status: MultiEntitySchemaPlanStatus,
  proposedLegalEntityId: string | null,
  reason: MultiEntitySchemaExpansionPlanItem['reason'],
  operation: MultiEntitySchemaExpansionPlanItem['operation'],
  rollback: MultiEntitySchemaExpansionPlanItem['rollback']
): MultiEntitySchemaExpansionPlanItem {
  return Object.freeze({
    collection: record.collection,
    recordId: record.recordId.trim(),
    tenantId: record.tenantId.trim(),
    status,
    proposedLegalEntityId,
    reason,
    operation,
    rollback: rollback ? Object.freeze(rollback) : null,
  })
}

function decision(
  collection: MultiEntitySchemaCollection,
  drizzleRepresentation: MultiEntitySchemaAuthorityDecision['drizzleRepresentation'],
  currentTenantScope: MultiEntitySchemaAuthorityDecision['currentTenantScope'],
  ownershipMode: MultiEntityOwnershipMode,
  nullableExpansionFields: readonly string[],
  ownershipRule: string
): MultiEntitySchemaAuthorityDecision {
  return Object.freeze({
    collection,
    operationalAuthority: 'payload' as const,
    drizzleRepresentation,
    currentTenantScope,
    ownershipMode,
    nullableExpansionFields: Object.freeze([...nullableExpansionFields]),
    ownershipRule,
  })
}

function authorityFor(collection: MultiEntitySchemaCollection): MultiEntitySchemaAuthorityDecision {
  const authority = MULTI_ENTITY_SCHEMA_AUTHORITY_DECISIONS.find(
    (candidate) => candidate.collection === collection
  )
  if (!authority) throw invalidPlan('unknown_collection')
  return authority
}

function validateRecord(record: MultiEntitySchemaExpansionRecord): void {
  if (
    !record ||
    typeof record !== 'object' ||
    !hasOnlyAllowedKeys(record, RECORD_KEYS) ||
    !COLLECTION_ORDER.includes(record.collection) ||
    !validId(record.recordId) ||
    !validId(record.tenantId) ||
    !Array.isArray(record.reviewedLegalEntityIds) ||
    !record.reviewedLegalEntityIds.every(validId) ||
    (record.dependencyLegalEntityIds !== undefined &&
      (!Array.isArray(record.dependencyLegalEntityIds) ||
        !record.dependencyLegalEntityIds.every(validId))) ||
    (record.currentLegalEntityId !== undefined &&
      record.currentLegalEntityId !== null &&
      !validId(record.currentLegalEntityId))
  ) {
    throw invalidPlan('invalid_record')
  }
}

function hasOnlyAllowedKeys(value: object, allowed: ReadonlySet<string>): boolean {
  return Object.keys(value).every((key) => allowed.has(key))
}

function normalizeIds(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()))].sort()
}

function normalizeOptionalId(value: string | null | undefined): string | null {
  return value === null || value === undefined ? null : value.trim()
}

function validId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value === value.trim() &&
    /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value)
  )
}

function invalidPlan(reason: string): Error {
  return new Error(`MULTI_ENTITY_SCHEMA_EXPANSION_PLAN_INVALID:${reason}`)
}
import { createHash } from 'node:crypto'
