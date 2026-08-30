import {
  MULTI_ENTITY_RUNTIME_SCOPE_MODE_ENV,
  evaluateMultiEntityRuntimeScopeShadow,
  type MultiEntityRuntimeResourceOwner,
  type MultiEntityRuntimeResourceType,
  type MultiEntityRuntimeScopeContext,
  type MultiEntityRuntimeScopeDecisionReason,
  type MultiEntityRuntimeScopeShadowEvaluation,
} from './multi-entity-runtime-scope'

export { MULTI_ENTITY_RUNTIME_SCOPE_MODE_ENV } from './multi-entity-runtime-scope'

export const MULTI_ENTITY_RUNTIME_SCOPE_SHADOW_RUNNER_FLAG =
  'AKADEMATE_CEP_RUNTIME_SCOPE_SHADOW_ENABLED'
export const MULTI_ENTITY_RUNTIME_SCOPE_SHADOW_RUNNER_ENVIRONMENT =
  'AKADEMATE_CEP_MULTI_ENTITY_ENVIRONMENT'

export const MULTI_ENTITY_RUNTIME_SCOPE_SHADOW_MAX_RECORDS = 10_000

export type MultiEntityRuntimeScopeShadowRunnerGateReason =
  | 'flag_disabled'
  | 'environment_missing_or_invalid'
  | 'production_forbidden'
  | 'scope_mode_disabled'
  | 'staging_enabled'

export type MultiEntityRuntimeScopeShadowRunnerGate =
  | {
      readonly enabled: false
      readonly reason: Exclude<MultiEntityRuntimeScopeShadowRunnerGateReason, 'staging_enabled'>
    }
  | {
      readonly enabled: true
      readonly reason: 'staging_enabled'
    }

export interface MultiEntityRuntimeScopeShadowRecord {
  /** Derived from authenticated access context; never accepted from client input. */
  readonly context: MultiEntityRuntimeScopeContext
  readonly resourceType: MultiEntityRuntimeResourceType
  readonly resourceId: string
  readonly resource: MultiEntityRuntimeResourceOwner | null
  readonly legacyAllowed: boolean
}

export interface MultiEntityRuntimeScopeShadowSnapshot {
  readonly records: readonly MultiEntityRuntimeScopeShadowRecord[]
}

export interface RedactedMultiEntityRuntimeScopeObservation {
  readonly mode: 'shadow'
  readonly resourceType: MultiEntityRuntimeResourceType
  readonly legacyAllowed: boolean
  readonly proposedAllowed: boolean
  readonly proposedReason: MultiEntityRuntimeScopeDecisionReason
  readonly divergence: boolean
}

export interface MultiEntityRuntimeScopeResourceMetrics {
  readonly evaluated: number
  readonly divergences: number
  readonly wouldGrant: number
  readonly wouldRevoke: number
  readonly unresolved: number
}

export interface MultiEntityRuntimeScopeMetrics {
  readonly total: number
  readonly evaluated: number
  readonly divergences: number
  readonly wouldGrant: number
  readonly wouldRevoke: number
  readonly unresolved: number
  readonly byReason: Readonly<Record<MultiEntityRuntimeScopeDecisionReason, number>>
  readonly byResourceType: Readonly<
    Record<MultiEntityRuntimeResourceType, MultiEntityRuntimeScopeResourceMetrics>
  >
}

export type MultiEntityRuntimeScopeShadowVerdict = 'insufficient_evidence' | 'ready' | 'blocked'

export interface MultiEntityRuntimeScopeShadowPlan {
  readonly mode: 'runtime_scope_shadow'
  readonly canWrite: false
  readonly canApply: false
  readonly changePermissions: false
  readonly verdict: MultiEntityRuntimeScopeShadowVerdict
  readonly observations: readonly RedactedMultiEntityRuntimeScopeObservation[]
  readonly metrics: MultiEntityRuntimeScopeMetrics
}

export interface MultiEntityRuntimeScopeShadowEvidenceManifest {
  readonly schemaVersion: 1
  readonly kind: 'cep_multi_entity_runtime_scope_shadow'
  readonly mode: 'shadow_evidence'
  readonly canWrite: false
  readonly canApply: false
  readonly changePermissions: false
  readonly verdict: MultiEntityRuntimeScopeShadowVerdict
  readonly metrics: MultiEntityRuntimeScopeMetrics
}

export interface MultiEntityRuntimeScopeShadowRunnerOptions {
  readonly environment?: Readonly<Record<string, string | undefined>>
  readonly loadSnapshot: () => Promise<MultiEntityRuntimeScopeShadowSnapshot>
}

export interface MultiEntityRuntimeScopeShadowRunnerSkipped {
  readonly status: 'skipped'
  readonly reason: Exclude<MultiEntityRuntimeScopeShadowRunnerGateReason, 'staging_enabled'>
  readonly canWrite: false
  readonly canApply: false
  readonly changePermissions: false
}

export interface MultiEntityRuntimeScopeShadowRunnerFailed {
  readonly status: 'failed'
  readonly reason: 'snapshot_load_failed' | 'shadow_planning_failed'
  readonly canWrite: false
  readonly canApply: false
  readonly changePermissions: false
}

export interface MultiEntityRuntimeScopeShadowRunnerObserved {
  readonly status: 'observed'
  readonly reason: 'shadow_observed'
  readonly canWrite: false
  readonly canApply: false
  readonly changePermissions: false
  readonly manifest: MultiEntityRuntimeScopeShadowEvidenceManifest
  readonly serializedManifest: string
}

export type MultiEntityRuntimeScopeShadowRunnerResult =
  | MultiEntityRuntimeScopeShadowRunnerSkipped
  | MultiEntityRuntimeScopeShadowRunnerFailed
  | MultiEntityRuntimeScopeShadowRunnerObserved

const UNRESOLVED_REASONS = new Set<MultiEntityRuntimeScopeDecisionReason>([
  'request_scope_unresolved',
  'resource_missing',
  'resource_scope_unresolved',
  'resource_type_mismatch',
  'resource_id_mismatch',
])

const RUNTIME_SCOPE_REASONS: readonly MultiEntityRuntimeScopeDecisionReason[] = [
  'scope_match',
  'request_scope_unresolved',
  'resource_missing',
  'resource_scope_unresolved',
  'resource_type_mismatch',
  'resource_id_mismatch',
  'tenant_mismatch',
  'legal_entity_mismatch',
  'campus_mismatch',
]

const RUNTIME_SCOPE_REASON_SET = new Set<MultiEntityRuntimeScopeDecisionReason>(
  RUNTIME_SCOPE_REASONS
)

const RUNTIME_RESOURCE_TYPES: readonly MultiEntityRuntimeResourceType[] = [
  'enrollment',
  'course_run',
  'campaign',
  'lead',
  'campus',
  'classroom',
  'media',
]

export function resolveMultiEntityRuntimeScopeShadowRunnerGate(
  environment: Readonly<Record<string, string | undefined>> = process.env
): MultiEntityRuntimeScopeShadowRunnerGate {
  if (environment[MULTI_ENTITY_RUNTIME_SCOPE_SHADOW_RUNNER_FLAG] !== 'true') {
    return { enabled: false, reason: 'flag_disabled' }
  }

  const explicitEnvironment =
    environment[MULTI_ENTITY_RUNTIME_SCOPE_SHADOW_RUNNER_ENVIRONMENT]?.trim().toLowerCase()

  if (explicitEnvironment === 'production') {
    return { enabled: false, reason: 'production_forbidden' }
  }
  if (explicitEnvironment !== 'staging') {
    return { enabled: false, reason: 'environment_missing_or_invalid' }
  }
  if (environment[MULTI_ENTITY_RUNTIME_SCOPE_MODE_ENV] !== 'shadow') {
    return { enabled: false, reason: 'scope_mode_disabled' }
  }
  return { enabled: true, reason: 'staging_enabled' }
}

/**
 * Evaluates an injected snapshot without I/O, persistence or authorization
 * side effects. The returned observations deliberately omit all identifiers.
 */
export function planMultiEntityRuntimeScopeShadow(
  snapshot: MultiEntityRuntimeScopeShadowSnapshot
): MultiEntityRuntimeScopeShadowPlan {
  if (
    !isObjectRecord(snapshot) ||
    !hasOnlyKeys(snapshot, ['records']) ||
    !Array.isArray(snapshot.records) ||
    snapshot.records.length > MULTI_ENTITY_RUNTIME_SCOPE_SHADOW_MAX_RECORDS
  ) {
    throw new Error('Invalid multi-entity runtime scope shadow snapshot.')
  }

  if (!snapshot.records.every(isRuntimeScopeShadowRecord)) {
    throw new Error('Invalid multi-entity runtime scope shadow snapshot.')
  }

  const observations = Object.freeze(
    snapshot.records.map((record) =>
      createRedactedMultiEntityRuntimeScopeObservation(
        record,
        evaluateMultiEntityRuntimeScopeShadow({
          configuredMode: 'shadow',
          legacyAllowed: record.legacyAllowed,
          context: record.context,
          resourceType: record.resourceType,
          resourceId: record.resourceId,
          resource: record.resource,
        })
      )
    )
  )
  const metrics = summarizeMultiEntityRuntimeScopeObservations(observations)

  return Object.freeze({
    mode: 'runtime_scope_shadow',
    canWrite: false,
    canApply: false,
    changePermissions: false,
    verdict: runtimeScopeVerdict(metrics),
    observations,
    metrics,
  })
}

export function createRedactedMultiEntityRuntimeScopeObservation(
  record: MultiEntityRuntimeScopeShadowRecord,
  evaluation: MultiEntityRuntimeScopeShadowEvaluation
): RedactedMultiEntityRuntimeScopeObservation {
  if (
    evaluation.mode !== 'shadow' ||
    evaluation.decisionSource !== 'legacy' ||
    evaluation.proposedDecision === null ||
    evaluation.canApply !== false ||
    evaluation.changePermissions !== false ||
    evaluation.proposedDecision.resourceType !== record.resourceType ||
    evaluation.proposedDecision.resourceId !== record.resourceId ||
    !RUNTIME_SCOPE_REASON_SET.has(evaluation.proposedDecision.reason) ||
    typeof evaluation.proposedDecision.allowed !== 'boolean' ||
    evaluation.divergence !==
      (evaluation.effectiveAllowed !== evaluation.proposedDecision.allowed) ||
    !decisionReasonIsConsistent(
      evaluation.proposedDecision.allowed,
      evaluation.proposedDecision.reason
    )
  ) {
    throw new Error('Invalid multi-entity runtime scope shadow evaluation.')
  }

  const proposedDecision = evaluation.proposedDecision
  return Object.freeze({
    mode: 'shadow',
    resourceType: record.resourceType,
    legacyAllowed: evaluation.effectiveAllowed,
    proposedAllowed: proposedDecision.allowed,
    proposedReason: proposedDecision.reason,
    divergence: evaluation.divergence === true,
  })
}

export function summarizeMultiEntityRuntimeScopeObservations(
  observations: readonly RedactedMultiEntityRuntimeScopeObservation[]
): MultiEntityRuntimeScopeMetrics {
  if (observations.length > MULTI_ENTITY_RUNTIME_SCOPE_SHADOW_MAX_RECORDS) {
    throw new Error('Multi-entity runtime scope observation limit exceeded.')
  }

  const byResourceType = new Map<
    MultiEntityRuntimeResourceType,
    MutableMultiEntityRuntimeScopeResourceMetrics
  >()
  let evaluated = 0
  let divergences = 0
  let wouldGrant = 0
  let wouldRevoke = 0
  let unresolved = 0
  const byReason = emptyReasonMetrics()

  for (const observation of observations) {
    assertObservationContract(observation)
    evaluated += 1
    const resourceMetrics = byResourceType.get(observation.resourceType) ?? emptyResourceMetrics()
    resourceMetrics.evaluated += 1
    byReason[observation.proposedReason] += 1

    if (UNRESOLVED_REASONS.has(observation.proposedReason)) {
      unresolved += 1
      resourceMetrics.unresolved += 1
    }
    if (observation.divergence) {
      divergences += 1
      resourceMetrics.divergences += 1
      if (observation.legacyAllowed) {
        wouldRevoke += 1
        resourceMetrics.wouldRevoke += 1
      } else {
        wouldGrant += 1
        resourceMetrics.wouldGrant += 1
      }
    }
    byResourceType.set(observation.resourceType, resourceMetrics)
  }

  return Object.freeze({
    total: observations.length,
    evaluated,
    divergences,
    wouldGrant,
    wouldRevoke,
    unresolved,
    byReason: Object.freeze({ ...byReason }) as Readonly<
      Record<MultiEntityRuntimeScopeDecisionReason, number>
    >,
    byResourceType: Object.fromEntries(
      RUNTIME_RESOURCE_TYPES.map((resourceType) => [
        resourceType,
        Object.freeze({ ...(byResourceType.get(resourceType) ?? emptyResourceMetrics()) }),
      ])
    ) as Record<MultiEntityRuntimeResourceType, MultiEntityRuntimeScopeResourceMetrics>,
  })
}

export function createMultiEntityRuntimeScopeShadowEvidenceManifest(
  snapshot: MultiEntityRuntimeScopeShadowSnapshot
): MultiEntityRuntimeScopeShadowEvidenceManifest {
  const plan = planMultiEntityRuntimeScopeShadow(snapshot)
  return Object.freeze({
    schemaVersion: 1,
    kind: 'cep_multi_entity_runtime_scope_shadow',
    mode: 'shadow_evidence',
    canWrite: false,
    canApply: false,
    changePermissions: false,
    verdict: plan.verdict,
    metrics: plan.metrics,
  })
}

export function serializeMultiEntityRuntimeScopeShadowEvidenceManifest(
  snapshot: MultiEntityRuntimeScopeShadowSnapshot
): string {
  return JSON.stringify(createMultiEntityRuntimeScopeShadowEvidenceManifest(snapshot))
}

/**
 * Runs one explicitly staging-only observation. There is no persistence
 * callback, endpoint registration, apply callback or provider invocation.
 */
export async function runMultiEntityRuntimeScopeShadowEvidence(
  options: MultiEntityRuntimeScopeShadowRunnerOptions
): Promise<MultiEntityRuntimeScopeShadowRunnerResult> {
  if (
    !isObjectRecord(options) ||
    typeof options.loadSnapshot !== 'function' ||
    (options.environment !== undefined && !isObjectRecord(options.environment))
  ) {
    return Object.freeze({
      status: 'failed',
      reason: 'shadow_planning_failed',
      canWrite: false,
      canApply: false,
      changePermissions: false,
    })
  }

  const gate = resolveMultiEntityRuntimeScopeShadowRunnerGate(options.environment)
  if (gate.reason !== 'staging_enabled') {
    return Object.freeze({
      status: 'skipped',
      reason: gate.reason,
      canWrite: false,
      canApply: false,
      changePermissions: false,
    })
  }

  let snapshot: MultiEntityRuntimeScopeShadowSnapshot
  try {
    snapshot = await options.loadSnapshot()
  } catch {
    return Object.freeze({
      status: 'failed',
      reason: 'snapshot_load_failed',
      canWrite: false,
      canApply: false,
      changePermissions: false,
    })
  }

  try {
    const manifest = createMultiEntityRuntimeScopeShadowEvidenceManifest(snapshot)
    return Object.freeze({
      status: 'observed',
      reason: 'shadow_observed',
      canWrite: false,
      canApply: false,
      changePermissions: false,
      manifest,
      serializedManifest: JSON.stringify(manifest),
    })
  } catch {
    return Object.freeze({
      status: 'failed',
      reason: 'shadow_planning_failed',
      canWrite: false,
      canApply: false,
      changePermissions: false,
    })
  }
}

interface MutableMultiEntityRuntimeScopeResourceMetrics {
  evaluated: number
  divergences: number
  wouldGrant: number
  wouldRevoke: number
  unresolved: number
}

function emptyResourceMetrics(): MutableMultiEntityRuntimeScopeResourceMetrics {
  return { evaluated: 0, divergences: 0, wouldGrant: 0, wouldRevoke: 0, unresolved: 0 }
}

function emptyReasonMetrics(): Record<MultiEntityRuntimeScopeDecisionReason, number> {
  return Object.fromEntries(RUNTIME_SCOPE_REASONS.map((reason) => [reason, 0])) as Record<
    MultiEntityRuntimeScopeDecisionReason,
    number
  >
}

function runtimeScopeVerdict(
  metrics: MultiEntityRuntimeScopeMetrics
): MultiEntityRuntimeScopeShadowVerdict {
  if (metrics.total === 0) return 'insufficient_evidence'
  return metrics.divergences > 0 || metrics.unresolved > 0 ? 'blocked' : 'ready'
}

function assertObservationContract(observation: RedactedMultiEntityRuntimeScopeObservation): void {
  if (
    !observation ||
    observation.mode !== 'shadow' ||
    !isRuntimeResourceType(observation.resourceType) ||
    typeof observation.legacyAllowed !== 'boolean' ||
    typeof observation.proposedAllowed !== 'boolean' ||
    typeof observation.proposedReason !== 'string' ||
    !RUNTIME_SCOPE_REASON_SET.has(observation.proposedReason) ||
    typeof observation.divergence !== 'boolean' ||
    observation.divergence !== (observation.legacyAllowed !== observation.proposedAllowed) ||
    (observation.proposedAllowed && observation.proposedReason !== 'scope_match') ||
    (!observation.proposedAllowed && observation.proposedReason === 'scope_match')
  ) {
    throw new Error('Invalid redacted multi-entity runtime scope observation.')
  }
}

function decisionReasonIsConsistent(
  allowed: boolean,
  reason: MultiEntityRuntimeScopeDecisionReason
): boolean {
  return allowed ? reason === 'scope_match' : reason !== 'scope_match'
}

function isRuntimeScopeShadowRecord(value: unknown): value is MultiEntityRuntimeScopeShadowRecord {
  if (
    !isObjectRecord(value) ||
    !hasOnlyKeys(value, ['context', 'resourceType', 'resourceId', 'resource', 'legacyAllowed'])
  ) {
    return false
  }
  if (
    !isRuntimeResourceType(value.resourceType) ||
    !validIdentifier(value.resourceId) ||
    typeof value.legacyAllowed !== 'boolean' ||
    !isRuntimeScopeContext(value.context)
  ) {
    return false
  }
  if (value.resource !== null) {
    if (
      !isObjectRecord(value.resource) ||
      !hasOnlyKeys(value.resource, [
        'resourceType',
        'resourceId',
        'tenantId',
        'legalEntityId',
        'campusId',
      ])
    ) {
      return false
    }
  }
  return true
}

function isRuntimeScopeContext(value: unknown): value is MultiEntityRuntimeScopeContext {
  return (
    isObjectRecord(value) &&
    hasOnlyKeys(value, ['tenantId', 'legalEntityId', 'campusId']) &&
    validIdentifier(value.tenantId) &&
    optionalScopeValue(value.legalEntityId) &&
    optionalScopeValue(value.campusId)
  )
}

function optionalScopeValue(value: unknown): boolean {
  return value === undefined || value === null || validIdentifier(value)
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const allowed = new Set(keys)
  return Object.keys(value).every((key) => allowed.has(key))
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function validIdentifier(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 255
}

function isRuntimeResourceType(value: unknown): value is MultiEntityRuntimeResourceType {
  return (
    value === 'enrollment' ||
    value === 'course_run' ||
    value === 'campaign' ||
    value === 'lead' ||
    value === 'campus' ||
    value === 'classroom' ||
    value === 'media'
  )
}
