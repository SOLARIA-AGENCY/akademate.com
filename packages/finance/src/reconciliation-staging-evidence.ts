import { createHash } from 'node:crypto'

import { createFinanceIsolationScopeDigest } from './isolation-audit'
import {
  FINANCE_RECONCILIATION_SHADOW_RUNNER_FLAG,
  type FinanceReconciliationShadowObservation,
} from './reconciliation-shadow-runner'

export type FinanceReconciliationEvidenceRole = 'existing_entity' | 'cep_sur_pilot'

export interface FinanceReconciliationStagingEvidenceSample {
  readonly tenantId: string
  readonly legalEntityId: string
  readonly accountingConnectionId: string
  readonly role: FinanceReconciliationEvidenceRole
  readonly entityReviewReference: string
  readonly runReviewReference: string
  readonly pilotReviewReference?: string
  readonly observation: FinanceReconciliationShadowObservation
}

export interface FinanceReconciliationStagingEvidenceInput {
  readonly executionEnvironment: 'staging'
  readonly runnerFlag: typeof FINANCE_RECONCILIATION_SHADOW_RUNNER_FLAG
  readonly runnerFlagValue: true
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly samples: readonly FinanceReconciliationStagingEvidenceSample[]
}

export interface FinanceReconciliationEntityEvidenceArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_finance_reconciliation_entity_evidence'
  readonly role: FinanceReconciliationEvidenceRole
  readonly verdict: 'eligible_for_manual_binding' | 'blocked'
  readonly scopeDigest: string
  readonly entityReviewReferenceDigest: string
  readonly runReviewReferenceDigest: string
  readonly pilotReviewReferenceDigest: string | null
  readonly observationDigest: string
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
}

export interface FinanceReconciliationStagingEvidenceManifest {
  readonly schemaVersion: 1
  readonly kind: 'cep_finance_reconciliation_staging_evidence'
  readonly mode: 'three_entity_content_addressed_observations'
  readonly verdict: 'eligible_for_manual_staging_binding' | 'blocked'
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canDeploy: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
  readonly metrics: {
    readonly expectedEntities: 3
    readonly observedEntities: 3
    readonly plannedEntities: number
    readonly blockedEntities: number
    readonly pilotEntities: 1
  }
  readonly entities: readonly FinanceReconciliationEntityEvidenceArtifact[]
}

const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/
const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const INPUT_KEYS = new Set([
  'executionEnvironment',
  'runnerFlag',
  'runnerFlagValue',
  'campaignReviewReference',
  'readinessReviewReference',
  'sourceDigest',
  'targetTenantDigest',
  'samples',
])
const SAMPLE_KEYS = new Set([
  'tenantId',
  'legalEntityId',
  'accountingConnectionId',
  'role',
  'entityReviewReference',
  'runReviewReference',
  'observation',
])
const PILOT_SAMPLE_KEYS = new Set([...SAMPLE_KEYS, 'pilotReviewReference'])
const OBSERVATION_KEYS = new Set([
  'schemaVersion',
  'mode',
  'verdict',
  'canWrite',
  'canApply',
  'metrics',
])
const OBSERVATION_METRIC_NAMES = [
  'accountingTransactions',
  'sourceRecords',
  'projectedRecords',
  'ignoredRecords',
  'blockedRecords',
  'projectionIssues',
  'reconciliationTransactions',
  'proposed',
  'unmatched',
  'ambiguous',
  'conflicted',
] as const
const OBSERVATION_METRICS_KEYS = new Set<string>(OBSERVATION_METRIC_NAMES)
const ENTITY_ARTIFACT_KEYS = new Set([
  'schemaVersion',
  'kind',
  'role',
  'verdict',
  'scopeDigest',
  'entityReviewReferenceDigest',
  'runReviewReferenceDigest',
  'pilotReviewReferenceDigest',
  'observationDigest',
  'artifactDigest',
  'evidenceReference',
])
const MANIFEST_KEYS = new Set([
  'schemaVersion',
  'kind',
  'mode',
  'verdict',
  'canBindAutomatically',
  'canMarkVerified',
  'canDeploy',
  'canActivate',
  'canChangePermissions',
  'sourceDigest',
  'targetTenantDigest',
  'campaignReviewReferenceDigest',
  'readinessReviewReferenceDigest',
  'artifactDigest',
  'evidenceReference',
  'metrics',
  'entities',
])
const MANIFEST_METRICS_KEYS = new Set([
  'expectedEntities',
  'observedEntities',
  'plannedEntities',
  'blockedEntities',
  'pilotEntities',
])

/**
 * Seals exactly three independently scoped reconciliation observations. The
 * output contains no financial totals or raw identifiers and can only be used
 * as input to a later manual binding review.
 */
export function createFinanceReconciliationStagingEvidenceManifest(
  input: FinanceReconciliationStagingEvidenceInput
): FinanceReconciliationStagingEvidenceManifest {
  validateInput(input)

  const campaignReviewReferenceDigest = digest(input.campaignReviewReference)
  const readinessReviewReferenceDigest = digest(input.readinessReviewReference)
  const entities = input.samples
    .map((sample) =>
      createEntityArtifact(sample, {
        sourceDigest: input.sourceDigest,
        targetTenantDigest: input.targetTenantDigest,
        campaignReviewReferenceDigest,
        readinessReviewReferenceDigest,
      })
    )
    .sort((left, right) => left.scopeDigest.localeCompare(right.scopeDigest))
  const plannedEntities = entities.filter(
    ({ verdict }) => verdict === 'eligible_for_manual_binding'
  ).length
  const blockedEntities = entities.length - plannedEntities
  const metrics = Object.freeze({
    expectedEntities: 3 as const,
    observedEntities: 3 as const,
    plannedEntities,
    blockedEntities,
    pilotEntities: 1 as const,
  })
  const canonical = canonicalManifestPayload({
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest,
    readinessReviewReferenceDigest,
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

export function assertFinanceReconciliationStagingEvidenceManifest(
  value: unknown
): asserts value is FinanceReconciliationStagingEvidenceManifest {
  if (!value || typeof value !== 'object' || !exactKeys(value, MANIFEST_KEYS)) invalidEvidence()
  const manifest = value as FinanceReconciliationStagingEvidenceManifest
  if (
    manifest.schemaVersion !== 1 ||
    manifest.kind !== 'cep_finance_reconciliation_staging_evidence' ||
    manifest.mode !== 'three_entity_content_addressed_observations' ||
    !['eligible_for_manual_staging_binding', 'blocked'].includes(manifest.verdict) ||
    manifest.canBindAutomatically !== false ||
    manifest.canMarkVerified !== false ||
    manifest.canDeploy !== false ||
    manifest.canActivate !== false ||
    manifest.canChangePermissions !== false ||
    !validBoundDigests(manifest) ||
    !manifest.metrics ||
    typeof manifest.metrics !== 'object' ||
    !exactKeys(manifest.metrics, MANIFEST_METRICS_KEYS) ||
    manifest.metrics.expectedEntities !== 3 ||
    manifest.metrics.observedEntities !== 3 ||
    manifest.metrics.pilotEntities !== 1 ||
    !nonNegativeInteger(manifest.metrics.plannedEntities) ||
    !nonNegativeInteger(manifest.metrics.blockedEntities) ||
    manifest.metrics.plannedEntities + manifest.metrics.blockedEntities !== 3 ||
    !Array.isArray(manifest.entities) ||
    manifest.entities.length !== 3
  ) {
    invalidEvidence()
  }

  const artifactDigests = new Set<string>()
  const scopeDigests = new Set<string>()
  const referenceDigests = new Set<string>([
    manifest.campaignReviewReferenceDigest,
    manifest.readinessReviewReferenceDigest,
  ])
  let plannedEntities = 0
  let pilotEntities = 0
  let previousScopeDigest = ''
  for (const entity of manifest.entities) {
    assertEntityArtifact(entity, {
      sourceDigest: manifest.sourceDigest,
      targetTenantDigest: manifest.targetTenantDigest,
      campaignReviewReferenceDigest: manifest.campaignReviewReferenceDigest,
      readinessReviewReferenceDigest: manifest.readinessReviewReferenceDigest,
    })
    if (previousScopeDigest && previousScopeDigest.localeCompare(entity.scopeDigest) >= 0) {
      invalidEvidence()
    }
    previousScopeDigest = entity.scopeDigest
    if (artifactDigests.has(entity.artifactDigest) || scopeDigests.has(entity.scopeDigest)) {
      invalidEvidence()
    }
    artifactDigests.add(entity.artifactDigest)
    scopeDigests.add(entity.scopeDigest)
    for (const referenceDigest of [
      entity.entityReviewReferenceDigest,
      entity.runReviewReferenceDigest,
      ...(entity.pilotReviewReferenceDigest === null ? [] : [entity.pilotReviewReferenceDigest]),
    ]) {
      if (referenceDigests.has(referenceDigest)) invalidEvidence()
      referenceDigests.add(referenceDigest)
    }
    if (entity.verdict === 'eligible_for_manual_binding') plannedEntities += 1
    if (entity.role === 'cep_sur_pilot') pilotEntities += 1
  }
  const blockedEntities = 3 - plannedEntities
  if (
    pilotEntities !== 1 ||
    plannedEntities !== manifest.metrics.plannedEntities ||
    blockedEntities !== manifest.metrics.blockedEntities ||
    manifest.verdict !== (blockedEntities === 0 ? 'eligible_for_manual_staging_binding' : 'blocked')
  ) {
    invalidEvidence()
  }

  const canonical = canonicalManifestPayload({
    sourceDigest: manifest.sourceDigest,
    targetTenantDigest: manifest.targetTenantDigest,
    campaignReviewReferenceDigest: manifest.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: manifest.readinessReviewReferenceDigest,
    metrics: manifest.metrics,
    entities: manifest.entities,
  })
  if (manifest.artifactDigest !== digest(JSON.stringify(canonical))) invalidEvidence()
}

export function serializeFinanceReconciliationStagingEvidenceManifest(
  input: FinanceReconciliationStagingEvidenceInput
): string {
  return JSON.stringify(createFinanceReconciliationStagingEvidenceManifest(input))
}

function validateInput(input: FinanceReconciliationStagingEvidenceInput): void {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    input.executionEnvironment !== 'staging' ||
    input.runnerFlag !== FINANCE_RECONCILIATION_SHADOW_RUNNER_FLAG ||
    input.runnerFlagValue !== true ||
    !validReviewReference(input.campaignReviewReference) ||
    !validReviewReference(input.readinessReviewReference) ||
    input.campaignReviewReference === input.readinessReviewReference ||
    !DIGEST_PATTERN.test(input.sourceDigest) ||
    !DIGEST_PATTERN.test(input.targetTenantDigest) ||
    input.sourceDigest === input.targetTenantDigest ||
    !Array.isArray(input.samples) ||
    input.samples.length !== 3
  ) {
    invalidEvidence()
  }

  const entityIds = new Set<string>()
  const connectionIds = new Set<string>()
  const reviewReferences = new Set<string>([
    input.campaignReviewReference,
    input.readinessReviewReference,
  ])
  let tenantId: string | null = null
  let pilotEntities = 0

  for (const sample of input.samples) {
    validateSample(sample)
    tenantId ??= sample.tenantId
    if (
      sample.tenantId !== tenantId ||
      entityIds.has(sample.legalEntityId) ||
      connectionIds.has(sample.accountingConnectionId)
    ) {
      invalidEvidence()
    }
    entityIds.add(sample.legalEntityId)
    connectionIds.add(sample.accountingConnectionId)
    const references = [
      sample.entityReviewReference,
      sample.runReviewReference,
      ...(sample.pilotReviewReference === undefined ? [] : [sample.pilotReviewReference]),
    ]
    for (const reference of references) {
      if (reviewReferences.has(reference)) invalidEvidence()
      reviewReferences.add(reference)
    }
    if (sample.role === 'cep_sur_pilot') pilotEntities += 1
  }
  if (pilotEntities !== 1) invalidEvidence()
}

function validateSample(sample: FinanceReconciliationStagingEvidenceSample): void {
  const expectedKeys = sample?.role === 'cep_sur_pilot' ? PILOT_SAMPLE_KEYS : SAMPLE_KEYS
  if (
    !sample ||
    typeof sample !== 'object' ||
    !exactKeys(sample, expectedKeys) ||
    !validIdentifier(sample.tenantId) ||
    !validIdentifier(sample.legalEntityId) ||
    !validIdentifier(sample.accountingConnectionId) ||
    !['existing_entity', 'cep_sur_pilot'].includes(sample.role) ||
    !validReviewReference(sample.entityReviewReference) ||
    !validReviewReference(sample.runReviewReference) ||
    (sample.role === 'cep_sur_pilot'
      ? !validReviewReference(sample.pilotReviewReference)
      : sample.pilotReviewReference !== undefined)
  ) {
    invalidEvidence()
  }
  validateObservation(sample.observation)
}

function validateObservation(observation: FinanceReconciliationShadowObservation): void {
  if (
    !observation ||
    typeof observation !== 'object' ||
    !exactKeys(observation, OBSERVATION_KEYS) ||
    observation.schemaVersion !== 1 ||
    observation.mode !== 'read_only_finance_reconciliation_shadow' ||
    !['planned', 'blocked'].includes(observation.verdict) ||
    observation.canWrite !== false ||
    observation.canApply !== false ||
    !observation.metrics ||
    typeof observation.metrics !== 'object' ||
    !exactKeys(observation.metrics, OBSERVATION_METRICS_KEYS) ||
    !Object.values(observation.metrics).every(nonNegativeInteger) ||
    observation.metrics.proposed +
      observation.metrics.unmatched +
      observation.metrics.ambiguous +
      observation.metrics.conflicted !==
      observation.metrics.reconciliationTransactions ||
    (observation.verdict === 'blocked' &&
      (observation.metrics.reconciliationTransactions !== 0 ||
        observation.metrics.proposed !== 0 ||
        observation.metrics.unmatched !== 0 ||
        observation.metrics.ambiguous !== 0 ||
        observation.metrics.conflicted !== 0)) ||
    (observation.verdict === 'planned' &&
      (observation.metrics.blockedRecords !== 0 || observation.metrics.projectionIssues !== 0))
  ) {
    invalidEvidence()
  }
}

function createEntityArtifact(
  sample: FinanceReconciliationStagingEvidenceSample,
  binding: {
    readonly sourceDigest: string
    readonly targetTenantDigest: string
    readonly campaignReviewReferenceDigest: string
    readonly readinessReviewReferenceDigest: string
  }
): FinanceReconciliationEntityEvidenceArtifact {
  const base = {
    schemaVersion: 1 as const,
    kind: 'cep_finance_reconciliation_entity_evidence' as const,
    role: sample.role,
    verdict:
      sample.observation.verdict === 'planned'
        ? ('eligible_for_manual_binding' as const)
        : ('blocked' as const),
    scopeDigest: createFinanceIsolationScopeDigest({
      tenantId: sample.tenantId,
      legalEntityId: sample.legalEntityId,
      connectionId: sample.accountingConnectionId,
    }),
    entityReviewReferenceDigest: digest(sample.entityReviewReference),
    runReviewReferenceDigest: digest(sample.runReviewReference),
    pilotReviewReferenceDigest:
      sample.pilotReviewReference === undefined ? null : digest(sample.pilotReviewReference),
    observationDigest: digest(JSON.stringify(canonicalObservation(sample.observation))),
  }
  const artifactDigest = digest(JSON.stringify({ ...binding, ...base }))
  return Object.freeze({
    ...base,
    artifactDigest,
    evidenceReference: evidenceReference(artifactDigest),
  })
}

function assertEntityArtifact(
  entity: FinanceReconciliationEntityEvidenceArtifact,
  binding: {
    readonly sourceDigest: string
    readonly targetTenantDigest: string
    readonly campaignReviewReferenceDigest: string
    readonly readinessReviewReferenceDigest: string
  }
): void {
  if (
    !entity ||
    typeof entity !== 'object' ||
    !exactKeys(entity, ENTITY_ARTIFACT_KEYS) ||
    entity.schemaVersion !== 1 ||
    entity.kind !== 'cep_finance_reconciliation_entity_evidence' ||
    !['existing_entity', 'cep_sur_pilot'].includes(entity.role) ||
    !['eligible_for_manual_binding', 'blocked'].includes(entity.verdict) ||
    !DIGEST_PATTERN.test(entity.scopeDigest) ||
    !DIGEST_PATTERN.test(entity.entityReviewReferenceDigest) ||
    !DIGEST_PATTERN.test(entity.runReviewReferenceDigest) ||
    (entity.role === 'cep_sur_pilot'
      ? !DIGEST_PATTERN.test(entity.pilotReviewReferenceDigest ?? '')
      : entity.pilotReviewReferenceDigest !== null) ||
    !DIGEST_PATTERN.test(entity.observationDigest) ||
    !DIGEST_PATTERN.test(entity.artifactDigest) ||
    entity.evidenceReference !== evidenceReference(entity.artifactDigest)
  ) {
    invalidEvidence()
  }
  const canonical = {
    schemaVersion: entity.schemaVersion,
    kind: entity.kind,
    role: entity.role,
    verdict: entity.verdict,
    scopeDigest: entity.scopeDigest,
    entityReviewReferenceDigest: entity.entityReviewReferenceDigest,
    runReviewReferenceDigest: entity.runReviewReferenceDigest,
    pilotReviewReferenceDigest: entity.pilotReviewReferenceDigest,
    observationDigest: entity.observationDigest,
  }
  if (entity.artifactDigest !== digest(JSON.stringify({ ...binding, ...canonical }))) {
    invalidEvidence()
  }
}

function canonicalObservation(observation: FinanceReconciliationShadowObservation) {
  return {
    schemaVersion: 1 as const,
    mode: 'read_only_finance_reconciliation_shadow' as const,
    verdict: observation.verdict,
    canWrite: false as const,
    canApply: false as const,
    metrics: Object.fromEntries(
      OBSERVATION_METRIC_NAMES.map((key) => [key, observation.metrics[key]])
    ),
  }
}

function canonicalManifestPayload(input: {
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly metrics: FinanceReconciliationStagingEvidenceManifest['metrics']
  readonly entities: readonly FinanceReconciliationEntityEvidenceArtifact[]
}) {
  const blocked = input.metrics.blockedEntities > 0
  return Object.freeze({
    schemaVersion: 1 as const,
    kind: 'cep_finance_reconciliation_staging_evidence' as const,
    mode: 'three_entity_content_addressed_observations' as const,
    verdict: blocked ? ('blocked' as const) : ('eligible_for_manual_staging_binding' as const),
    canBindAutomatically: false as const,
    canMarkVerified: false as const,
    canDeploy: false as const,
    canActivate: false as const,
    canChangePermissions: false as const,
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: input.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: input.readinessReviewReferenceDigest,
    metrics: Object.freeze({ ...input.metrics }),
    entities: Object.freeze(input.entities.map((entity) => Object.freeze({ ...entity }))),
  })
}

function validBoundDigests(manifest: FinanceReconciliationStagingEvidenceManifest): boolean {
  return (
    DIGEST_PATTERN.test(manifest.sourceDigest) &&
    DIGEST_PATTERN.test(manifest.targetTenantDigest) &&
    manifest.sourceDigest !== manifest.targetTenantDigest &&
    DIGEST_PATTERN.test(manifest.campaignReviewReferenceDigest) &&
    DIGEST_PATTERN.test(manifest.readinessReviewReferenceDigest) &&
    manifest.campaignReviewReferenceDigest !== manifest.readinessReviewReferenceDigest &&
    DIGEST_PATTERN.test(manifest.artifactDigest) &&
    manifest.evidenceReference === evidenceReference(manifest.artifactDigest)
  )
}

function exactKeys(value: object, expected: ReadonlySet<string>): boolean {
  const keys = Object.keys(value)
  return (
    keys.length === expected.size &&
    keys.every((key) => expected.has(key)) &&
    [...expected].every((key) => Object.prototype.hasOwnProperty.call(value, key))
  )
}

function validIdentifier(value: unknown): value is string {
  return (
    typeof value === 'string' && value.length > 0 && value.length <= 500 && value.trim() === value
  )
}

function validReviewReference(value: unknown): value is string {
  return typeof value === 'string' && REVIEW_REFERENCE_PATTERN.test(value)
}

function nonNegativeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0
}

function digest(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function evidenceReference(value: string): `evidence://sha256/${string}` {
  return `evidence://sha256/${value.slice('sha256:'.length)}`
}

function invalidEvidence(): never {
  throw new Error('FINANCE_RECONCILIATION_STAGING_EVIDENCE_INVALID')
}
