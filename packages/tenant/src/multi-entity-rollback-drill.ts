import type { EntityScopedRecordType } from './multi-entity-backfill'

export const MULTI_ENTITY_ROLLBACK_BOOLEAN_FLAGS = [
  'AKADEMATE_CEP_MULTI_ENTITY_SCHEMA_SHADOW_ENABLED',
  'AKADEMATE_CEP_MULTI_ENTITY_LEDGER_SHADOW_ENABLED',
  'AKADEMATE_CEP_TEACHER_SCHEDULE_SHADOW_ENABLED',
  'AKADEMATE_CEP_PUBLIC_PROJECTION_SHADOW_ENABLED',
  'AKADEMATE_CEP_FINANCE_RECONCILIATION_SHADOW_ENABLED',
  'AKADEMATE_CEP_FINANCE_ISOLATION_AUDIT_ENABLED',
  'AKADEMATE_CEP_FINANCE_ACCOUNTING_SYNC_SHADOW_ENABLED',
  'AKADEMATE_CEP_FINANCE_ACCOUNTING_IMPORT_STAGING_ENABLED',
] as const

export const MULTI_ENTITY_ROLLBACK_AUTHORIZATION_MODE =
  'AKADEMATE_MULTI_ENTITY_AUTHORIZATION_MODE' as const

export type MultiEntityRollbackBooleanFlag = (typeof MULTI_ENTITY_ROLLBACK_BOOLEAN_FLAGS)[number]

export interface MultiEntityRollbackFlagState {
  readonly AKADEMATE_CEP_MULTI_ENTITY_SCHEMA_SHADOW_ENABLED: boolean
  readonly AKADEMATE_CEP_MULTI_ENTITY_LEDGER_SHADOW_ENABLED: boolean
  readonly AKADEMATE_CEP_TEACHER_SCHEDULE_SHADOW_ENABLED: boolean
  readonly AKADEMATE_CEP_PUBLIC_PROJECTION_SHADOW_ENABLED: boolean
  readonly AKADEMATE_CEP_FINANCE_RECONCILIATION_SHADOW_ENABLED: boolean
  readonly AKADEMATE_CEP_FINANCE_ISOLATION_AUDIT_ENABLED: boolean
  readonly AKADEMATE_CEP_FINANCE_ACCOUNTING_SYNC_SHADOW_ENABLED: boolean
  readonly AKADEMATE_CEP_FINANCE_ACCOUNTING_IMPORT_STAGING_ENABLED: boolean
  readonly AKADEMATE_MULTI_ENTITY_AUTHORIZATION_MODE: 'disabled' | 'shadow'
}

export interface MultiEntityRollbackRecord {
  readonly operation: 'restore_null_if_unchanged'
  readonly recordType: EntityScopedRecordType
  readonly recordId: string
  readonly tenantId: string
  readonly expectedLegalEntityId: string
  readonly currentLegalEntityId: string | null
  readonly restoreLegalEntityId: null
}

export interface MultiEntityRollbackDrillInput {
  readonly targetTenantId: string
  readonly reviewReference: string
  readonly accessBaseline: {
    readonly capturedDigest: string
    readonly currentDigest: string
  }
  readonly flagState: MultiEntityRollbackFlagState
  readonly records: readonly MultiEntityRollbackRecord[]
  readonly maxRecords?: number
}

export type MultiEntityRollbackIssueCode =
  | 'access_baseline_changed'
  | 'record_identifier_invalid'
  | 'duplicate_record'
  | 'record_outside_target_tenant'
  | 'record_changed_since_backfill'

export interface MultiEntityRollbackIssue {
  readonly code: MultiEntityRollbackIssueCode
  readonly recordType?: EntityScopedRecordType
  readonly recordId?: string
}

export interface MultiEntityRollbackFlagAction {
  readonly variable:
    | MultiEntityRollbackBooleanFlag
    | typeof MULTI_ENTITY_ROLLBACK_AUTHORIZATION_MODE
  readonly operation: 'set_false' | 'set_disabled'
}

export interface MultiEntityRollbackRecordAction {
  readonly operation: 'restore_null_if_unchanged'
  readonly recordType: EntityScopedRecordType
  readonly recordId: string
  readonly tenantId: string
  readonly expectedLegalEntityId: string
  readonly restoreLegalEntityId: null
}

export interface MultiEntityRollbackDrillPlan {
  readonly mode: 'rollback_dry_run'
  readonly canWrite: false
  readonly canApply: false
  readonly ready: boolean
  readonly accessBaselineMatches: boolean
  readonly flagActions: readonly MultiEntityRollbackFlagAction[]
  readonly recordActions: readonly MultiEntityRollbackRecordAction[]
  readonly issues: readonly MultiEntityRollbackIssue[]
  readonly summary: {
    readonly knownFlags: 9
    readonly flagsToDisable: number
    readonly totalRecords: number
    readonly reversibleRecords: number
    readonly alreadyRestoredRecords: number
    readonly conflictedRecords: number
    readonly issues: number
  }
}

export interface RedactedMultiEntityRollbackObservation {
  readonly schemaVersion: 1
  readonly kind: 'cep_multi_entity_rollback_drill'
  readonly mode: 'rollback_dry_run'
  readonly verdict: 'ready_for_staging_rehearsal' | 'blocked'
  readonly canWrite: false
  readonly canApply: false
  readonly accessBaselineMatches: boolean
  readonly metrics: MultiEntityRollbackDrillPlan['summary']
}

const DEFAULT_MAX_RECORDS = 100_000
const IDENTIFIER_PATTERN = /^\S(?:.{0,253}\S)?$/
const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/
const INPUT_KEYS = new Set([
  'targetTenantId',
  'reviewReference',
  'accessBaseline',
  'flagState',
  'records',
  'maxRecords',
])
const ACCESS_KEYS = new Set(['capturedDigest', 'currentDigest'])
const FLAG_KEYS = new Set([
  ...MULTI_ENTITY_ROLLBACK_BOOLEAN_FLAGS,
  MULTI_ENTITY_ROLLBACK_AUTHORIZATION_MODE,
])
const RECORD_KEYS = new Set([
  'operation',
  'recordType',
  'recordId',
  'tenantId',
  'expectedLegalEntityId',
  'currentLegalEntityId',
  'restoreLegalEntityId',
])
const RECORD_TYPES = new Set<EntityScopedRecordType>([
  'classroom',
  'course_run',
  'enrollment',
  'lead',
  'campaign',
  'advertising_spend',
])

/**
 * Builds a deterministic rollback rehearsal. It performs no I/O and exposes no
 * apply function. Record actions preserve compare-and-set semantics so a value
 * changed after backfill is never overwritten by this plan.
 */
export function planMultiEntityRollbackDrill(
  input: MultiEntityRollbackDrillInput
): MultiEntityRollbackDrillPlan {
  validateInput(input)

  const accessBaselineMatches =
    input.accessBaseline.capturedDigest === input.accessBaseline.currentDigest
  const issues: MultiEntityRollbackIssue[] = accessBaselineMatches
    ? []
    : [{ code: 'access_baseline_changed' }]
  const flagActions = buildFlagActions(input.flagState)
  const recordActions: MultiEntityRollbackRecordAction[] = []
  const recordKeys = new Set<string>()
  let alreadyRestoredRecords = 0
  let conflictedRecords = 0

  for (const record of sortedRecords(input.records)) {
    if (
      !validIdentifier(record.recordId) ||
      !validIdentifier(record.tenantId) ||
      !validIdentifier(record.expectedLegalEntityId) ||
      (record.currentLegalEntityId !== null && !validIdentifier(record.currentLegalEntityId))
    ) {
      issues.push(issue('record_identifier_invalid', record))
      conflictedRecords += 1
      continue
    }

    const key = recordKey(record)
    if (recordKeys.has(key)) {
      issues.push(issue('duplicate_record', record))
      conflictedRecords += 1
      continue
    }
    recordKeys.add(key)

    if (record.tenantId !== input.targetTenantId) {
      issues.push(issue('record_outside_target_tenant', record))
      conflictedRecords += 1
      continue
    }
    if (record.currentLegalEntityId === null) {
      alreadyRestoredRecords += 1
      continue
    }
    if (record.currentLegalEntityId !== record.expectedLegalEntityId) {
      issues.push(issue('record_changed_since_backfill', record))
      conflictedRecords += 1
      continue
    }

    recordActions.push({
      operation: 'restore_null_if_unchanged',
      recordType: record.recordType,
      recordId: record.recordId,
      tenantId: record.tenantId,
      expectedLegalEntityId: record.expectedLegalEntityId,
      restoreLegalEntityId: null,
    })
  }

  const sortedIssues = issues.sort(compareIssues)
  const frozenFlagActions = Object.freeze(flagActions.map((action) => Object.freeze(action)))
  const frozenRecordActions = Object.freeze(recordActions.map((action) => Object.freeze(action)))
  const summary = Object.freeze({
    knownFlags: 9 as const,
    flagsToDisable: frozenFlagActions.length,
    totalRecords: input.records.length,
    reversibleRecords: frozenRecordActions.length,
    alreadyRestoredRecords,
    conflictedRecords,
    issues: sortedIssues.length,
  })

  return Object.freeze({
    mode: 'rollback_dry_run',
    canWrite: false,
    canApply: false,
    ready: sortedIssues.length === 0,
    accessBaselineMatches,
    flagActions: frozenFlagActions,
    recordActions: frozenRecordActions,
    issues: Object.freeze(sortedIssues.map((entry) => Object.freeze(entry))),
    summary,
  })
}

export function createRedactedMultiEntityRollbackObservation(
  plan: MultiEntityRollbackDrillPlan
): RedactedMultiEntityRollbackObservation {
  validatePlan(plan)
  return Object.freeze({
    schemaVersion: 1,
    kind: 'cep_multi_entity_rollback_drill',
    mode: 'rollback_dry_run',
    verdict: plan.ready ? 'ready_for_staging_rehearsal' : 'blocked',
    canWrite: false,
    canApply: false,
    accessBaselineMatches: plan.accessBaselineMatches,
    metrics: Object.freeze({ ...plan.summary }),
  })
}

export function serializeMultiEntityRollbackObservation(
  input: MultiEntityRollbackDrillInput
): string {
  return JSON.stringify(
    createRedactedMultiEntityRollbackObservation(planMultiEntityRollbackDrill(input))
  )
}

function validateInput(input: MultiEntityRollbackDrillInput): void {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS, true) ||
    !validIdentifier(input.targetTenantId) ||
    !REVIEW_REFERENCE_PATTERN.test(input.reviewReference) ||
    !input.accessBaseline ||
    typeof input.accessBaseline !== 'object' ||
    !exactKeys(input.accessBaseline, ACCESS_KEYS) ||
    !DIGEST_PATTERN.test(input.accessBaseline.capturedDigest) ||
    !DIGEST_PATTERN.test(input.accessBaseline.currentDigest) ||
    !input.flagState ||
    typeof input.flagState !== 'object' ||
    !exactKeys(input.flagState, FLAG_KEYS) ||
    !validFlagState(input.flagState) ||
    !Array.isArray(input.records)
  ) {
    throw new Error('MULTI_ENTITY_ROLLBACK_INPUT_INVALID')
  }

  const maxRecords = input.maxRecords ?? DEFAULT_MAX_RECORDS
  if (!Number.isInteger(maxRecords) || maxRecords < 1 || input.records.length > maxRecords) {
    throw new Error('MULTI_ENTITY_ROLLBACK_RECORD_LIMIT_EXCEEDED')
  }

  for (const record of input.records) {
    if (
      !record ||
      typeof record !== 'object' ||
      !exactKeys(record, RECORD_KEYS) ||
      record.operation !== 'restore_null_if_unchanged' ||
      !RECORD_TYPES.has(record.recordType) ||
      record.restoreLegalEntityId !== null ||
      (record.currentLegalEntityId !== null && typeof record.currentLegalEntityId !== 'string')
    ) {
      throw new Error('MULTI_ENTITY_ROLLBACK_RECORD_INVALID')
    }
  }
}

function buildFlagActions(state: MultiEntityRollbackFlagState): MultiEntityRollbackFlagAction[] {
  const actions: MultiEntityRollbackFlagAction[] = []
  for (const variable of MULTI_ENTITY_ROLLBACK_BOOLEAN_FLAGS) {
    if (state[variable]) actions.push({ variable, operation: 'set_false' })
  }
  if (state[MULTI_ENTITY_ROLLBACK_AUTHORIZATION_MODE] === 'shadow') {
    actions.push({
      variable: MULTI_ENTITY_ROLLBACK_AUTHORIZATION_MODE,
      operation: 'set_disabled',
    })
  }
  return actions
}

function validFlagState(state: MultiEntityRollbackFlagState): boolean {
  return (
    MULTI_ENTITY_ROLLBACK_BOOLEAN_FLAGS.every((variable) => typeof state[variable] === 'boolean') &&
    (state[MULTI_ENTITY_ROLLBACK_AUTHORIZATION_MODE] === 'disabled' ||
      state[MULTI_ENTITY_ROLLBACK_AUTHORIZATION_MODE] === 'shadow')
  )
}

function validatePlan(plan: MultiEntityRollbackDrillPlan): void {
  const expectedReady = plan.issues.length === 0
  if (
    plan.mode !== 'rollback_dry_run' ||
    plan.canWrite !== false ||
    plan.canApply !== false ||
    plan.ready !== expectedReady ||
    plan.summary.knownFlags !== 9 ||
    plan.summary.flagsToDisable !== plan.flagActions.length ||
    plan.summary.totalRecords !==
      plan.summary.reversibleRecords +
        plan.summary.alreadyRestoredRecords +
        plan.summary.conflictedRecords ||
    plan.summary.reversibleRecords !== plan.recordActions.length ||
    plan.summary.issues !== plan.issues.length ||
    ![
      plan.summary.flagsToDisable,
      plan.summary.totalRecords,
      plan.summary.reversibleRecords,
      plan.summary.alreadyRestoredRecords,
      plan.summary.conflictedRecords,
      plan.summary.issues,
    ].every(nonNegativeInteger) ||
    plan.accessBaselineMatches ===
      plan.issues.some(({ code }) => code === 'access_baseline_changed')
  ) {
    throw new Error('MULTI_ENTITY_ROLLBACK_PLAN_INVALID')
  }
}

function sortedRecords(records: readonly MultiEntityRollbackRecord[]): MultiEntityRollbackRecord[] {
  return [...records].sort(
    (left, right) =>
      left.recordType.localeCompare(right.recordType) || left.recordId.localeCompare(right.recordId)
  )
}

function recordKey(record: MultiEntityRollbackRecord): string {
  return `${record.recordType}\u0000${record.recordId}`
}

function issue(
  code: Exclude<MultiEntityRollbackIssueCode, 'access_baseline_changed'>,
  record: MultiEntityRollbackRecord
): MultiEntityRollbackIssue {
  return { code, recordType: record.recordType, recordId: record.recordId }
}

function compareIssues(left: MultiEntityRollbackIssue, right: MultiEntityRollbackIssue): number {
  return (
    (left.recordType ?? '').localeCompare(right.recordType ?? '') ||
    (left.recordId ?? '').localeCompare(right.recordId ?? '') ||
    left.code.localeCompare(right.code)
  )
}

function validIdentifier(value: string): boolean {
  return typeof value === 'string' && IDENTIFIER_PATTERN.test(value)
}

function exactKeys(value: object, allowed: ReadonlySet<string>, optionalMax = false): boolean {
  const keys = Object.keys(value)
  return (
    keys.every((key) => allowed.has(key)) &&
    [...allowed].every((key) => (optionalMax && key === 'maxRecords') || own(value, key))
  )
}

function own(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function nonNegativeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0
}
