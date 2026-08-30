export const MULTI_ENTITY_GLOBAL_STAGING_GATES = [
  'schema_authority_decided',
  'node22_runtime_verified',
  'access_baseline_captured',
  'access_unchanged_verified',
  'all_feature_flags_default_off',
  'restored_backup_verified',
  'expand_only_migration_reviewed',
  'migration_dry_run_verified',
  'backfill_dry_run_verified',
  'rollback_rehearsed',
  'unified_public_web_reviewed',
  'shared_course_catalog_reviewed',
  'shared_teacher_registry_reviewed',
  'teacher_schedule_shadow_verified',
  'enrollment_closure_shadow_verified',
  'authorization_shadow_verified',
  'nominal_permission_phase_lock_verified',
  'financial_isolation_harness_verified',
  'accounting_import_staging_verified',
  'observability_redaction_verified',
] as const

export const MULTI_ENTITY_ENTITY_STAGING_GATES = [
  'legal_profile_reviewed',
  'campus_mapping_reviewed',
  'accounting_connection_reviewed',
  'secret_reference_configured',
  'accounting_provider_contract_verified',
  'payload_relationship_scope_reviewed',
  'payment_source_reviewed',
  'advertising_source_reviewed',
  'entity_rollback_reviewed',
  'isolation_negative_cases_verified',
  'finance_shadow_observed',
  'enrollment_campaign_scope_reviewed',
] as const

export type MultiEntityGlobalStagingGate = (typeof MULTI_ENTITY_GLOBAL_STAGING_GATES)[number]
export type MultiEntityEntityStagingGate = (typeof MULTI_ENTITY_ENTITY_STAGING_GATES)[number]
export type MultiEntityStagingEvidenceStatus = 'verified' | 'pending' | 'failed'
export type MultiEntityStagingGateStatus = MultiEntityStagingEvidenceStatus | 'missing'

export interface MultiEntityStagingEvidence {
  readonly status: MultiEntityStagingEvidenceStatus
  readonly evidenceReference?: string
}

export interface MultiEntityStagingEntityCandidate {
  readonly tenantId: string
  readonly legalEntityId: string
  readonly accountingConnectionId: string
  readonly role: 'existing_entity' | 'cep_sur_pilot'
  readonly reviewReference: string
  readonly pilotReviewReference?: string
  readonly checks: Readonly<
    Partial<Record<MultiEntityEntityStagingGate, MultiEntityStagingEvidence>>
  >
}

export interface MultiEntityStagingReadinessInput {
  readonly readinessReviewReference: string
  readonly globalChecks: Readonly<
    Partial<Record<MultiEntityGlobalStagingGate, MultiEntityStagingEvidence>>
  >
  readonly entities: readonly MultiEntityStagingEntityCandidate[]
}

export interface MultiEntityStagingGateMetrics {
  readonly scope: 'global' | 'entity'
  readonly gate: MultiEntityGlobalStagingGate | MultiEntityEntityStagingGate
  readonly required: number
  readonly verified: number
  readonly pending: number
  readonly failed: number
  readonly missing: number
}

export type MultiEntityStagingReadinessVerdict =
  | 'insufficient_evidence'
  | 'blocked'
  | 'ready_for_staging_review'

export interface MultiEntityStagingReadinessManifest {
  readonly schemaVersion: 1
  readonly kind: 'cep_multi_entity_staging_readiness'
  readonly mode: 'evidence_gate_only'
  readonly verdict: MultiEntityStagingReadinessVerdict
  readonly canDeploy: false
  readonly canMigrate: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly metrics: {
    readonly expectedEntities: 3
    readonly globalChecks: number
    readonly entityChecks: number
    readonly totalChecks: number
    readonly verified: number
    readonly pending: number
    readonly failed: number
    readonly missing: number
    readonly blockingChecks: number
  }
  readonly gates: readonly MultiEntityStagingGateMetrics[]
}

const EXPECTED_ENTITY_COUNT = 3
const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const EVIDENCE_REFERENCE_PATTERN = /^evidence:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const INPUT_KEYS = new Set(['readinessReviewReference', 'globalChecks', 'entities'])
const ENTITY_KEYS = new Set([
  'tenantId',
  'legalEntityId',
  'accountingConnectionId',
  'role',
  'reviewReference',
  'pilotReviewReference',
  'checks',
])
const EVIDENCE_KEYS = new Set(['status', 'evidenceReference'])

/**
 * Produces an identifier-free readiness manifest. A positive verdict only
 * means that every declared gate carries a syntactically valid evidence
 * reference; it never authorizes staging, migration, activation or access
 * changes.
 */
export function planMultiEntityStagingReadiness(
  input: MultiEntityStagingReadinessInput
): MultiEntityStagingReadinessManifest {
  validateInputShape(input)
  validateEntities(input.entities, input.readinessReviewReference)

  const gates: MultiEntityStagingGateMetrics[] = []
  for (const gate of MULTI_ENTITY_GLOBAL_STAGING_GATES) {
    gates.push(
      freezeGateMetrics({
        scope: 'global',
        gate,
        required: 1,
        ...summarizeEvidence([ownEvidence(input.globalChecks, gate)]),
      })
    )
  }
  for (const gate of MULTI_ENTITY_ENTITY_STAGING_GATES) {
    gates.push(
      freezeGateMetrics({
        scope: 'entity',
        gate,
        required: EXPECTED_ENTITY_COUNT,
        ...summarizeEvidence(input.entities.map((entity) => ownEvidence(entity.checks, gate))),
      })
    )
  }

  const totals = gates.reduce(
    (result, gate) => ({
      verified: result.verified + gate.verified,
      pending: result.pending + gate.pending,
      failed: result.failed + gate.failed,
      missing: result.missing + gate.missing,
    }),
    { verified: 0, pending: 0, failed: 0, missing: 0 }
  )
  const globalChecks = MULTI_ENTITY_GLOBAL_STAGING_GATES.length
  const entityChecks = MULTI_ENTITY_ENTITY_STAGING_GATES.length * EXPECTED_ENTITY_COUNT
  const totalChecks = globalChecks + entityChecks
  const blockingChecks = totals.pending + totals.failed + totals.missing
  const verdict: MultiEntityStagingReadinessVerdict =
    totals.failed > 0
      ? 'blocked'
      : totals.pending > 0 || totals.missing > 0
        ? 'insufficient_evidence'
        : 'ready_for_staging_review'

  return Object.freeze({
    schemaVersion: 1,
    kind: 'cep_multi_entity_staging_readiness',
    mode: 'evidence_gate_only',
    verdict,
    canDeploy: false,
    canMigrate: false,
    canActivate: false,
    canChangePermissions: false,
    metrics: Object.freeze({
      expectedEntities: EXPECTED_ENTITY_COUNT,
      globalChecks,
      entityChecks,
      totalChecks,
      ...totals,
      blockingChecks,
    }),
    gates: Object.freeze(gates),
  })
}

export function serializeMultiEntityStagingReadiness(
  input: MultiEntityStagingReadinessInput
): string {
  return JSON.stringify(planMultiEntityStagingReadiness(input))
}

function validateInputShape(input: MultiEntityStagingReadinessInput): void {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    !validReviewReference(input.readinessReviewReference) ||
    !input.globalChecks ||
    typeof input.globalChecks !== 'object' ||
    Array.isArray(input.globalChecks) ||
    !Array.isArray(input.entities) ||
    input.entities.length !== EXPECTED_ENTITY_COUNT
  ) {
    throw readinessError('MULTI_ENTITY_STAGING_INPUT_INVALID')
  }
  validateCheckKeys(input.globalChecks, new Set(MULTI_ENTITY_GLOBAL_STAGING_GATES))
}

function validateEntities(
  entities: readonly MultiEntityStagingEntityCandidate[],
  readinessReviewReference: string
): void {
  const entityKeys = new Set<string>()
  const connectionIds = new Set<string>()
  const reviewReferences = new Set<string>([readinessReviewReference])
  let tenantId: string | null = null
  let pilots = 0

  for (const entity of entities) {
    if (
      !entity ||
      typeof entity !== 'object' ||
      !exactKeys(entity, ENTITY_KEYS) ||
      !validIdentifier(entity.tenantId) ||
      !validIdentifier(entity.legalEntityId) ||
      !validIdentifier(entity.accountingConnectionId) ||
      !validReviewReference(entity.reviewReference) ||
      !entity.checks ||
      typeof entity.checks !== 'object' ||
      Array.isArray(entity.checks)
    ) {
      throw readinessError('MULTI_ENTITY_STAGING_ENTITY_INVALID')
    }
    validateCheckKeys(entity.checks, new Set(MULTI_ENTITY_ENTITY_STAGING_GATES))

    const pilotShape =
      entity.role === 'cep_sur_pilot'
        ? validReviewReference(entity.pilotReviewReference) &&
          entity.pilotReviewReference !== entity.reviewReference
        : entity.role === 'existing_entity' && entity.pilotReviewReference === undefined
    if (!pilotShape) throw readinessError('MULTI_ENTITY_STAGING_ENTITY_INVALID')

    tenantId ??= entity.tenantId
    if (entity.tenantId !== tenantId) throw readinessError('MULTI_ENTITY_STAGING_TENANT_MISMATCH')
    const entityKey = `${entity.tenantId}\u0000${entity.legalEntityId}`
    if (entityKeys.has(entityKey)) throw readinessError('MULTI_ENTITY_STAGING_DUPLICATE_ENTITY')
    if (connectionIds.has(entity.accountingConnectionId)) {
      throw readinessError('MULTI_ENTITY_STAGING_SHARED_CONNECTION')
    }
    if (
      reviewReferences.has(entity.reviewReference) ||
      (entity.pilotReviewReference !== undefined &&
        reviewReferences.has(entity.pilotReviewReference))
    ) {
      throw readinessError('MULTI_ENTITY_STAGING_REVIEW_REUSED')
    }

    entityKeys.add(entityKey)
    connectionIds.add(entity.accountingConnectionId)
    reviewReferences.add(entity.reviewReference)
    if (entity.pilotReviewReference !== undefined) {
      reviewReferences.add(entity.pilotReviewReference)
    }
    if (entity.role === 'cep_sur_pilot') pilots += 1
  }

  if (pilots !== 1) throw readinessError('MULTI_ENTITY_STAGING_PILOT_COUNT_INVALID')
}

function validateCheckKeys(
  checks: Readonly<Record<string, unknown>>,
  allowedGates: ReadonlySet<string>
): void {
  for (const key of Object.keys(checks)) {
    if (!allowedGates.has(key)) throw readinessError('MULTI_ENTITY_STAGING_GATE_UNKNOWN')
    validateEvidence(checks[key])
  }
}

function validateEvidence(value: unknown): asserts value is MultiEntityStagingEvidence {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    !exactKeys(value, EVIDENCE_KEYS)
  ) {
    throw readinessError('MULTI_ENTITY_STAGING_EVIDENCE_INVALID')
  }
  const evidence = value as Partial<MultiEntityStagingEvidence>
  if (!['verified', 'pending', 'failed'].includes(evidence.status ?? '')) {
    throw readinessError('MULTI_ENTITY_STAGING_EVIDENCE_INVALID')
  }
  if (
    evidence.status === 'verified'
      ? !validEvidenceReference(evidence.evidenceReference)
      : evidence.evidenceReference !== undefined &&
        !validEvidenceReference(evidence.evidenceReference)
  ) {
    throw readinessError('MULTI_ENTITY_STAGING_EVIDENCE_INVALID')
  }
}

function summarizeEvidence(
  evidence: readonly (MultiEntityStagingEvidence | undefined)[]
): Pick<MultiEntityStagingGateMetrics, 'verified' | 'pending' | 'failed' | 'missing'> {
  let verified = 0
  let pending = 0
  let failed = 0
  let missing = 0
  for (const item of evidence) {
    if (item === undefined) missing += 1
    else if (item.status === 'verified') verified += 1
    else if (item.status === 'pending') pending += 1
    else failed += 1
  }
  return { verified, pending, failed, missing }
}

function ownEvidence<TGate extends string>(
  checks: Readonly<Partial<Record<TGate, MultiEntityStagingEvidence>>>,
  gate: TGate
): MultiEntityStagingEvidence | undefined {
  return Object.prototype.hasOwnProperty.call(checks, gate) ? checks[gate] : undefined
}

function freezeGateMetrics(metrics: MultiEntityStagingGateMetrics): MultiEntityStagingGateMetrics {
  return Object.freeze(metrics)
}

function exactKeys(value: object, allowed: ReadonlySet<string>): boolean {
  return Object.keys(value).every((key) => allowed.has(key))
}

function validIdentifier(value: unknown): value is string {
  return (
    typeof value === 'string' && value.length > 0 && value.length <= 500 && value.trim() === value
  )
}

function validReviewReference(value: unknown): value is string {
  return typeof value === 'string' && REVIEW_REFERENCE_PATTERN.test(value)
}

function validEvidenceReference(value: unknown): value is string {
  return typeof value === 'string' && EVIDENCE_REFERENCE_PATTERN.test(value)
}

function readinessError(code: string): Error & { readonly code: string } {
  return Object.assign(new Error('Multi-entity staging readiness input is invalid.'), { code })
}
