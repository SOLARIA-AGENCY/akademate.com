import { createHash } from 'node:crypto'

import { createFinanceIsolationScopeDigest } from '../../../../packages/finance/src'
import {
  assertMultiEntityRollbackRehearsalEvidenceArtifact,
  type MultiEntityRollbackRehearsalEvidenceArtifact,
} from '../../../../packages/tenant/src/multi-entity-rollback-rehearsal-evidence'
import {
  createRedactedMultiEntityRollbackObservation,
  planMultiEntityRollbackDrill,
  type MultiEntityRollbackDrillInput,
} from '../../../../packages/tenant/src/multi-entity-rollback-drill'
import type { EntityScopedRecordType } from '../../../../packages/tenant/src/multi-entity-backfill'

export type EntityRollbackEvidenceRole = 'existing_entity' | 'cep_sur_pilot'

export interface EntityRollbackStagingEvidenceSample {
  readonly tenantId: string
  readonly legalEntityId: string
  readonly accountingConnectionId: string
  readonly role: EntityRollbackEvidenceRole
  readonly entityReviewReference: string
  readonly rollbackReviewReference: string
  readonly pilotReviewReference?: string
  readonly drillInput: MultiEntityRollbackDrillInput
}

export interface EntityRollbackStagingEvidenceInput {
  readonly reviewEnvironment: 'staging'
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly globalRollbackArtifact: MultiEntityRollbackRehearsalEvidenceArtifact
  readonly samples: readonly EntityRollbackStagingEvidenceSample[]
}

export interface EntityRollbackEvidenceArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_multi_entity_entity_rollback_review_evidence'
  readonly role: EntityRollbackEvidenceRole
  readonly verdict: 'eligible_for_manual_binding'
  readonly accountingScopeDigest: string
  readonly globalRollbackArtifactDigest: string
  readonly accessBaselineDigest: string
  readonly recordSetDigest: string
  readonly entityReviewReferenceDigest: string
  readonly rollbackReviewReferenceDigest: string
  readonly pilotReviewReferenceDigest: string | null
  readonly observationDigest: string
  readonly metrics: {
    readonly knownFlags: 9
    readonly flagsToDisable: 0
    readonly totalRecords: 6
    readonly reversibleRecords: 6
    readonly alreadyRestoredRecords: 0
    readonly conflictedRecords: 0
    readonly issues: 0
  }
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
}

export interface EntityRollbackStagingEvidenceManifest {
  readonly schemaVersion: 1
  readonly kind: 'cep_multi_entity_entity_rollback_staging_evidence'
  readonly mode: 'three_entity_compare_and_set_rollback_review'
  readonly verdict: 'eligible_for_manual_staging_binding'
  readonly canWrite: false
  readonly canApply: false
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canDeploy: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly globalRollbackArtifactDigest: string
  readonly accessBaselineDigest: string
  readonly metrics: {
    readonly expectedEntities: 3
    readonly reviewedEntityRollbacks: 3
    readonly readyEntityRollbacks: 3
    readonly recordTypesPerEntity: 6
    readonly reversibleRecords: 18
    readonly conflictedRecords: 0
    readonly pilotEntities: 1
    readonly appliedRollbacks: 0
  }
  readonly entities: readonly EntityRollbackEvidenceArtifact[]
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
}

const RECORD_TYPES: readonly EntityScopedRecordType[] = [
  'classroom',
  'course_run',
  'enrollment',
  'lead',
  'campaign',
  'advertising_spend',
]
const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/
const REVIEW_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const INPUT_KEYS = new Set([
  'reviewEnvironment',
  'campaignReviewReference',
  'readinessReviewReference',
  'sourceDigest',
  'targetTenantDigest',
  'globalRollbackArtifact',
  'samples',
])
const SAMPLE_KEYS = new Set([
  'tenantId',
  'legalEntityId',
  'accountingConnectionId',
  'role',
  'entityReviewReference',
  'rollbackReviewReference',
  'drillInput',
])
const PILOT_SAMPLE_KEYS = new Set([...SAMPLE_KEYS, 'pilotReviewReference'])
const ENTITY_KEYS = new Set([
  'schemaVersion',
  'kind',
  'role',
  'verdict',
  'accountingScopeDigest',
  'globalRollbackArtifactDigest',
  'accessBaselineDigest',
  'recordSetDigest',
  'entityReviewReferenceDigest',
  'rollbackReviewReferenceDigest',
  'pilotReviewReferenceDigest',
  'observationDigest',
  'metrics',
  'artifactDigest',
  'evidenceReference',
])
const ENTITY_METRIC_KEYS = new Set([
  'knownFlags',
  'flagsToDisable',
  'totalRecords',
  'reversibleRecords',
  'alreadyRestoredRecords',
  'conflictedRecords',
  'issues',
])
const MANIFEST_KEYS = new Set([
  'schemaVersion',
  'kind',
  'mode',
  'verdict',
  'canWrite',
  'canApply',
  'canBindAutomatically',
  'canMarkVerified',
  'canDeploy',
  'canActivate',
  'canChangePermissions',
  'sourceDigest',
  'targetTenantDigest',
  'campaignReviewReferenceDigest',
  'readinessReviewReferenceDigest',
  'globalRollbackArtifactDigest',
  'accessBaselineDigest',
  'metrics',
  'entities',
  'artifactDigest',
  'evidenceReference',
])
const MANIFEST_METRIC_KEYS = new Set([
  'expectedEntities',
  'reviewedEntityRollbacks',
  'readyEntityRollbacks',
  'recordTypesPerEntity',
  'reversibleRecords',
  'conflictedRecords',
  'pilotEntities',
  'appliedRollbacks',
])

/** Seals three entity-specific rollback dry-runs without applying any action. */
export function createEntityRollbackStagingEvidenceManifest(
  input: EntityRollbackStagingEvidenceInput
): EntityRollbackStagingEvidenceManifest {
  validateInput(input)
  const entities = Object.freeze(
    input.samples
      .map((sample) => createEntityArtifact(sample, input.globalRollbackArtifact))
      .sort((left, right) => left.accountingScopeDigest.localeCompare(right.accountingScopeDigest))
  )
  const metrics = Object.freeze({
    expectedEntities: 3 as const,
    reviewedEntityRollbacks: 3 as const,
    readyEntityRollbacks: 3 as const,
    recordTypesPerEntity: 6 as const,
    reversibleRecords: 18 as const,
    conflictedRecords: 0 as const,
    pilotEntities: 1 as const,
    appliedRollbacks: 0 as const,
  })
  const canonical = canonicalManifest({
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: digest(input.campaignReviewReference),
    readinessReviewReferenceDigest: digest(input.readinessReviewReference),
    globalRollbackArtifactDigest: input.globalRollbackArtifact.artifactDigest,
    accessBaselineDigest: input.globalRollbackArtifact.accessBaselineDigest,
    metrics,
    entities,
  })
  const artifactDigest = digest(JSON.stringify(canonical))
  return Object.freeze({
    ...canonical,
    artifactDigest,
    evidenceReference: evidenceReference(artifactDigest),
  })
}

export function assertEntityRollbackStagingEvidenceManifest(
  value: unknown
): asserts value is EntityRollbackStagingEvidenceManifest {
  if (!value || typeof value !== 'object' || !exactKeys(value, MANIFEST_KEYS)) invalid()
  const manifest = value as EntityRollbackStagingEvidenceManifest
  if (
    manifest.schemaVersion !== 1 ||
    manifest.kind !== 'cep_multi_entity_entity_rollback_staging_evidence' ||
    manifest.mode !== 'three_entity_compare_and_set_rollback_review' ||
    manifest.verdict !== 'eligible_for_manual_staging_binding' ||
    manifest.canWrite !== false ||
    manifest.canApply !== false ||
    manifest.canBindAutomatically !== false ||
    manifest.canMarkVerified !== false ||
    manifest.canDeploy !== false ||
    manifest.canActivate !== false ||
    manifest.canChangePermissions !== false ||
    !validManifestDigests(manifest) ||
    !manifest.metrics ||
    typeof manifest.metrics !== 'object' ||
    !exactKeys(manifest.metrics, MANIFEST_METRIC_KEYS) ||
    manifest.metrics.expectedEntities !== 3 ||
    manifest.metrics.reviewedEntityRollbacks !== 3 ||
    manifest.metrics.readyEntityRollbacks !== 3 ||
    manifest.metrics.recordTypesPerEntity !== 6 ||
    manifest.metrics.reversibleRecords !== 18 ||
    manifest.metrics.conflictedRecords !== 0 ||
    manifest.metrics.pilotEntities !== 1 ||
    manifest.metrics.appliedRollbacks !== 0 ||
    !Array.isArray(manifest.entities) ||
    manifest.entities.length !== 3
  ) {
    invalid()
  }
  const scopes = new Set<string>()
  const recordSets = new Set<string>()
  const reviews = new Set([
    manifest.campaignReviewReferenceDigest,
    manifest.readinessReviewReferenceDigest,
  ])
  let previous = ''
  let pilots = 0
  for (const entity of manifest.entities) {
    assertEntity(entity)
    if (
      (previous && previous.localeCompare(entity.accountingScopeDigest) >= 0) ||
      scopes.has(entity.accountingScopeDigest) ||
      recordSets.has(entity.recordSetDigest) ||
      entity.globalRollbackArtifactDigest !== manifest.globalRollbackArtifactDigest ||
      entity.accessBaselineDigest !== manifest.accessBaselineDigest ||
      reviews.has(entity.entityReviewReferenceDigest) ||
      reviews.has(entity.rollbackReviewReferenceDigest)
    ) {
      invalid()
    }
    previous = entity.accountingScopeDigest
    scopes.add(entity.accountingScopeDigest)
    recordSets.add(entity.recordSetDigest)
    reviews.add(entity.entityReviewReferenceDigest)
    reviews.add(entity.rollbackReviewReferenceDigest)
    if (entity.pilotReviewReferenceDigest !== null) {
      if (reviews.has(entity.pilotReviewReferenceDigest)) invalid()
      reviews.add(entity.pilotReviewReferenceDigest)
      pilots += 1
    }
  }
  if (pilots !== 1) invalid()
  const canonical = canonicalManifest({
    sourceDigest: manifest.sourceDigest,
    targetTenantDigest: manifest.targetTenantDigest,
    campaignReviewReferenceDigest: manifest.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: manifest.readinessReviewReferenceDigest,
    globalRollbackArtifactDigest: manifest.globalRollbackArtifactDigest,
    accessBaselineDigest: manifest.accessBaselineDigest,
    metrics: manifest.metrics,
    entities: manifest.entities,
  })
  if (
    manifest.artifactDigest !== digest(JSON.stringify(canonical)) ||
    manifest.evidenceReference !== evidenceReference(manifest.artifactDigest)
  ) {
    invalid()
  }
}

export function serializeEntityRollbackStagingEvidenceManifest(
  input: EntityRollbackStagingEvidenceInput
): string {
  return JSON.stringify(createEntityRollbackStagingEvidenceManifest(input))
}

function validateInput(input: EntityRollbackStagingEvidenceInput): void {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    input.reviewEnvironment !== 'staging' ||
    !validReview(input.campaignReviewReference) ||
    !validReview(input.readinessReviewReference) ||
    input.campaignReviewReference === input.readinessReviewReference ||
    !DIGEST_PATTERN.test(input.sourceDigest) ||
    !DIGEST_PATTERN.test(input.targetTenantDigest) ||
    input.sourceDigest === input.targetTenantDigest ||
    !Array.isArray(input.samples) ||
    input.samples.length !== 3
  ) {
    invalid()
  }
  try {
    assertMultiEntityRollbackRehearsalEvidenceArtifact(input.globalRollbackArtifact)
  } catch {
    invalid()
  }
  if (
    input.globalRollbackArtifact.sourceDigest !== input.sourceDigest ||
    input.globalRollbackArtifact.targetTenantDigest !== input.targetTenantDigest ||
    input.globalRollbackArtifact.campaignReviewReferenceDigest !==
      digest(input.campaignReviewReference) ||
    input.globalRollbackArtifact.readinessReviewReferenceDigest !==
      digest(input.readinessReviewReference)
  ) {
    invalid()
  }
  const entities = new Set<string>()
  const connections = new Set<string>()
  const records = new Set<string>()
  const reviews = new Set([input.campaignReviewReference, input.readinessReviewReference])
  let tenant: string | null = null
  let pilots = 0
  for (const sample of input.samples) {
    const expectedKeys = sample?.role === 'cep_sur_pilot' ? PILOT_SAMPLE_KEYS : SAMPLE_KEYS
    if (
      !sample ||
      typeof sample !== 'object' ||
      !exactKeys(sample, expectedKeys) ||
      !validIdentifier(sample.tenantId) ||
      !validIdentifier(sample.legalEntityId) ||
      !validIdentifier(sample.accountingConnectionId) ||
      !validReview(sample.entityReviewReference) ||
      !validReview(sample.rollbackReviewReference) ||
      reviews.has(sample.entityReviewReference) ||
      reviews.has(sample.rollbackReviewReference) ||
      !validPilot(sample)
    ) {
      invalid()
    }
    tenant ??= sample.tenantId
    validateDrill(sample, input.globalRollbackArtifact, records)
    if (
      sample.tenantId !== tenant ||
      entities.has(sample.legalEntityId) ||
      connections.has(sample.accountingConnectionId)
    ) {
      invalid()
    }
    entities.add(sample.legalEntityId)
    connections.add(sample.accountingConnectionId)
    reviews.add(sample.entityReviewReference)
    reviews.add(sample.rollbackReviewReference)
    if (sample.pilotReviewReference) {
      if (reviews.has(sample.pilotReviewReference)) invalid()
      reviews.add(sample.pilotReviewReference)
      pilots += 1
    }
  }
  if (pilots !== 1) invalid()
}

function validateDrill(
  sample: EntityRollbackStagingEvidenceSample,
  global: MultiEntityRollbackRehearsalEvidenceArtifact,
  globalRecords: Set<string>
): void {
  if (
    sample.drillInput?.targetTenantId !== sample.tenantId ||
    sample.drillInput.reviewReference !== sample.rollbackReviewReference ||
    sample.drillInput.accessBaseline.capturedDigest !== global.accessBaselineDigest ||
    sample.drillInput.accessBaseline.currentDigest !== global.accessBaselineDigest ||
    sample.drillInput.records.length !== 6
  ) {
    invalid()
  }
  let plan: ReturnType<typeof planMultiEntityRollbackDrill>
  try {
    plan = planMultiEntityRollbackDrill(sample.drillInput)
  } catch {
    invalid()
  }
  const recordTypes = new Set<EntityScopedRecordType>()
  for (const record of sample.drillInput.records) {
    const key = `${record.recordType}\u0000${record.recordId}`
    if (
      record.tenantId !== sample.tenantId ||
      record.expectedLegalEntityId !== sample.legalEntityId ||
      record.currentLegalEntityId !== sample.legalEntityId ||
      record.operation !== 'restore_null_if_unchanged' ||
      record.restoreLegalEntityId !== null ||
      recordTypes.has(record.recordType) ||
      globalRecords.has(key)
    ) {
      invalid()
    }
    recordTypes.add(record.recordType)
    globalRecords.add(key)
  }
  if (
    !RECORD_TYPES.every((type) => recordTypes.has(type)) ||
    !plan.ready ||
    !plan.accessBaselineMatches ||
    plan.flagActions.length !== 0 ||
    plan.summary.knownFlags !== 9 ||
    plan.summary.flagsToDisable !== 0 ||
    plan.summary.totalRecords !== 6 ||
    plan.summary.reversibleRecords !== 6 ||
    plan.summary.alreadyRestoredRecords !== 0 ||
    plan.summary.conflictedRecords !== 0 ||
    plan.summary.issues !== 0
  ) {
    invalid()
  }
}

function createEntityArtifact(
  sample: EntityRollbackStagingEvidenceSample,
  global: MultiEntityRollbackRehearsalEvidenceArtifact
): EntityRollbackEvidenceArtifact {
  const plan = planMultiEntityRollbackDrill(sample.drillInput)
  const observation = createRedactedMultiEntityRollbackObservation(plan)
  const canonical = {
    schemaVersion: 1 as const,
    kind: 'cep_multi_entity_entity_rollback_review_evidence' as const,
    role: sample.role,
    verdict: 'eligible_for_manual_binding' as const,
    accountingScopeDigest: createFinanceIsolationScopeDigest({
      tenantId: sample.tenantId,
      legalEntityId: sample.legalEntityId,
      connectionId: sample.accountingConnectionId,
    }),
    globalRollbackArtifactDigest: global.artifactDigest,
    accessBaselineDigest: global.accessBaselineDigest,
    recordSetDigest: digest(
      JSON.stringify(
        sample.drillInput.records
          .map((record) => [
            record.recordType,
            record.recordId,
            record.tenantId,
            record.expectedLegalEntityId,
          ])
          .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)))
      )
    ),
    entityReviewReferenceDigest: digest(sample.entityReviewReference),
    rollbackReviewReferenceDigest: digest(sample.rollbackReviewReference),
    pilotReviewReferenceDigest:
      sample.pilotReviewReference === undefined ? null : digest(sample.pilotReviewReference),
    observationDigest: digest(JSON.stringify(observation)),
    metrics: Object.freeze({
      knownFlags: 9 as const,
      flagsToDisable: 0 as const,
      totalRecords: 6 as const,
      reversibleRecords: 6 as const,
      alreadyRestoredRecords: 0 as const,
      conflictedRecords: 0 as const,
      issues: 0 as const,
    }),
  }
  const artifactDigest = digest(JSON.stringify(canonical))
  return Object.freeze({
    ...canonical,
    artifactDigest,
    evidenceReference: evidenceReference(artifactDigest),
  })
}

function assertEntity(entity: EntityRollbackEvidenceArtifact): void {
  if (
    !entity ||
    typeof entity !== 'object' ||
    !exactKeys(entity, ENTITY_KEYS) ||
    entity.schemaVersion !== 1 ||
    entity.kind !== 'cep_multi_entity_entity_rollback_review_evidence' ||
    !['existing_entity', 'cep_sur_pilot'].includes(entity.role) ||
    entity.verdict !== 'eligible_for_manual_binding' ||
    ![
      entity.accountingScopeDigest,
      entity.globalRollbackArtifactDigest,
      entity.accessBaselineDigest,
      entity.recordSetDigest,
      entity.entityReviewReferenceDigest,
      entity.rollbackReviewReferenceDigest,
      entity.observationDigest,
      entity.artifactDigest,
    ].every((value) => DIGEST_PATTERN.test(value)) ||
    !entity.metrics ||
    typeof entity.metrics !== 'object' ||
    !exactKeys(entity.metrics, ENTITY_METRIC_KEYS) ||
    entity.metrics.knownFlags !== 9 ||
    entity.metrics.flagsToDisable !== 0 ||
    entity.metrics.totalRecords !== 6 ||
    entity.metrics.reversibleRecords !== 6 ||
    entity.metrics.alreadyRestoredRecords !== 0 ||
    entity.metrics.conflictedRecords !== 0 ||
    entity.metrics.issues !== 0 ||
    (entity.role === 'cep_sur_pilot') !== (typeof entity.pilotReviewReferenceDigest === 'string')
  ) {
    invalid()
  }
  const canonical = {
    schemaVersion: entity.schemaVersion,
    kind: entity.kind,
    role: entity.role,
    verdict: entity.verdict,
    accountingScopeDigest: entity.accountingScopeDigest,
    globalRollbackArtifactDigest: entity.globalRollbackArtifactDigest,
    accessBaselineDigest: entity.accessBaselineDigest,
    recordSetDigest: entity.recordSetDigest,
    entityReviewReferenceDigest: entity.entityReviewReferenceDigest,
    rollbackReviewReferenceDigest: entity.rollbackReviewReferenceDigest,
    pilotReviewReferenceDigest: entity.pilotReviewReferenceDigest,
    observationDigest: entity.observationDigest,
    metrics: entity.metrics,
  }
  if (
    entity.artifactDigest !== digest(JSON.stringify(canonical)) ||
    entity.evidenceReference !== evidenceReference(entity.artifactDigest)
  ) {
    invalid()
  }
}

function canonicalManifest(input: {
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly globalRollbackArtifactDigest: string
  readonly accessBaselineDigest: string
  readonly metrics: EntityRollbackStagingEvidenceManifest['metrics']
  readonly entities: readonly EntityRollbackEvidenceArtifact[]
}) {
  return {
    schemaVersion: 1 as const,
    kind: 'cep_multi_entity_entity_rollback_staging_evidence' as const,
    mode: 'three_entity_compare_and_set_rollback_review' as const,
    verdict: 'eligible_for_manual_staging_binding' as const,
    canWrite: false as const,
    canApply: false as const,
    canBindAutomatically: false as const,
    canMarkVerified: false as const,
    canDeploy: false as const,
    canActivate: false as const,
    canChangePermissions: false as const,
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: input.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: input.readinessReviewReferenceDigest,
    globalRollbackArtifactDigest: input.globalRollbackArtifactDigest,
    accessBaselineDigest: input.accessBaselineDigest,
    metrics: input.metrics,
    entities: input.entities,
  }
}

function validManifestDigests(value: EntityRollbackStagingEvidenceManifest): boolean {
  return (
    [
      value.sourceDigest,
      value.targetTenantDigest,
      value.campaignReviewReferenceDigest,
      value.readinessReviewReferenceDigest,
      value.globalRollbackArtifactDigest,
      value.accessBaselineDigest,
      value.artifactDigest,
    ].every((item) => DIGEST_PATTERN.test(item)) &&
    value.sourceDigest !== value.targetTenantDigest &&
    value.campaignReviewReferenceDigest !== value.readinessReviewReferenceDigest
  )
}

function validPilot(sample: EntityRollbackStagingEvidenceSample): boolean {
  return sample.role === 'cep_sur_pilot'
    ? validReview(sample.pilotReviewReference) &&
        sample.pilotReviewReference !== sample.entityReviewReference &&
        sample.pilotReviewReference !== sample.rollbackReviewReference
    : sample.role === 'existing_entity' && sample.pilotReviewReference === undefined
}

function exactKeys(value: object, expected: ReadonlySet<string>): boolean {
  const keys = Object.keys(value)
  return keys.length === expected.size && keys.every((key) => expected.has(key))
}

function validIdentifier(value: unknown): value is string {
  return (
    typeof value === 'string' && value.length > 0 && value.length <= 255 && value.trim() === value
  )
}

function validReview(value: unknown): value is string {
  return typeof value === 'string' && REVIEW_PATTERN.test(value)
}

function digest(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function evidenceReference(value: string): `evidence://sha256/${string}` {
  return `evidence://sha256/${value.slice('sha256:'.length)}`
}

function invalid(): never {
  throw new Error('ENTITY_ROLLBACK_STAGING_EVIDENCE_INVALID')
}
