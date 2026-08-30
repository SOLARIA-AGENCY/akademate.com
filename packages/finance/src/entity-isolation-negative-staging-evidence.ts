import { createHash } from 'node:crypto'

import {
  FINANCE_ENTITY_ISOLATION_NEGATIVE_CASE_ROLES,
  type FinanceEntityIsolationNegativeAuditObservation,
  type FinanceEntityIsolationNegativeCaseRole,
} from './entity-isolation-negative-audit'
import { FINANCE_ISOLATION_AUDIT_FLAG, createFinanceIsolationScopeDigest } from './isolation-audit'

export type FinanceEntityIsolationEvidenceRole = 'existing_entity' | 'cep_sur_pilot'

export interface FinanceEntityIsolationNegativeCaseReview {
  readonly role: FinanceEntityIsolationNegativeCaseRole
  readonly runReviewReference: string
}

export interface FinanceEntityIsolationNegativeStagingEvidenceSample {
  readonly tenantId: string
  readonly legalEntityId: string
  readonly accountingConnectionId: string
  readonly role: FinanceEntityIsolationEvidenceRole
  readonly entityReviewReference: string
  readonly pilotReviewReference?: string
  readonly caseReviews: readonly FinanceEntityIsolationNegativeCaseReview[]
  readonly observation: FinanceEntityIsolationNegativeAuditObservation
}

export interface FinanceEntityIsolationNegativeStagingEvidenceInput {
  readonly executionEnvironment: 'staging'
  readonly runnerFlag: typeof FINANCE_ISOLATION_AUDIT_FLAG
  readonly runnerFlagValue: true
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly samples: readonly FinanceEntityIsolationNegativeStagingEvidenceSample[]
}

export interface FinanceEntityIsolationNegativeCaseReviewArtifact {
  readonly role: FinanceEntityIsolationNegativeCaseRole
  readonly runReviewReferenceDigest: string
}

export interface FinanceEntityIsolationNegativeEvidenceArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_finance_entity_isolation_negative_evidence'
  readonly role: FinanceEntityIsolationEvidenceRole
  readonly verdict: 'eligible_for_manual_binding'
  readonly scopeDigest: string
  readonly entityReviewReferenceDigest: string
  readonly pilotReviewReferenceDigest: string | null
  readonly caseReviews: readonly FinanceEntityIsolationNegativeCaseReviewArtifact[]
  readonly observationDigest: string
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
}

export interface FinanceEntityIsolationNegativeStagingEvidenceManifest {
  readonly schemaVersion: 1
  readonly kind: 'cep_finance_entity_isolation_negative_staging_evidence'
  readonly mode: 'three_entity_scope_bound_negative_observations'
  readonly verdict: 'eligible_for_manual_staging_binding'
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
    readonly verifiedNegativeCases: 9
    readonly pilotEntities: 1
  }
  readonly entities: readonly FinanceEntityIsolationNegativeEvidenceArtifact[]
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
  'caseReviews',
  'observation',
])
const PILOT_SAMPLE_KEYS = new Set([...SAMPLE_KEYS, 'pilotReviewReference'])
const CASE_REVIEW_KEYS = new Set(['role', 'runReviewReference'])
const OBSERVATION_KEYS = new Set([
  'schemaVersion',
  'mode',
  'scopeDigest',
  'verdict',
  'canWrite',
  'canApply',
  'metrics',
  'cases',
])
const OBSERVATION_METRIC_KEYS = new Set([
  'expectedCases',
  'evaluatedCases',
  'rejectedCases',
  'gapCases',
  'isolationBreaches',
])
const OBSERVATION_CASE_KEYS = new Set(['role', 'verdict', 'isolationBreaches'])
const CASE_REVIEW_ARTIFACT_KEYS = new Set(['role', 'runReviewReferenceDigest'])
const ENTITY_ARTIFACT_KEYS = new Set([
  'schemaVersion',
  'kind',
  'role',
  'verdict',
  'scopeDigest',
  'entityReviewReferenceDigest',
  'pilotReviewReferenceDigest',
  'caseReviews',
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
const MANIFEST_METRIC_KEYS = new Set([
  'expectedEntities',
  'observedEntities',
  'verifiedNegativeCases',
  'pilotEntities',
])

/** Seals exactly three scope-bound entity observations without operational authority. */
export function createFinanceEntityIsolationNegativeStagingEvidenceManifest(
  input: FinanceEntityIsolationNegativeStagingEvidenceInput
): FinanceEntityIsolationNegativeStagingEvidenceManifest {
  validateInput(input)
  const campaignReviewReferenceDigest = digest(input.campaignReviewReference)
  const readinessReviewReferenceDigest = digest(input.readinessReviewReference)
  const entities = Object.freeze(
    input.samples
      .map((sample) => createEntityArtifact(sample))
      .sort((left, right) => left.scopeDigest.localeCompare(right.scopeDigest))
  )
  const metrics = Object.freeze({
    expectedEntities: 3 as const,
    observedEntities: 3 as const,
    verifiedNegativeCases: 9 as const,
    pilotEntities: 1 as const,
  })
  const canonical = canonicalManifest({
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

export function assertFinanceEntityIsolationNegativeStagingEvidenceManifest(
  value: unknown
): asserts value is FinanceEntityIsolationNegativeStagingEvidenceManifest {
  if (!value || typeof value !== 'object' || !exactKeys(value, MANIFEST_KEYS)) invalidEvidence()
  const manifest = value as FinanceEntityIsolationNegativeStagingEvidenceManifest
  if (
    manifest.schemaVersion !== 1 ||
    manifest.kind !== 'cep_finance_entity_isolation_negative_staging_evidence' ||
    manifest.mode !== 'three_entity_scope_bound_negative_observations' ||
    manifest.verdict !== 'eligible_for_manual_staging_binding' ||
    manifest.canBindAutomatically !== false ||
    manifest.canMarkVerified !== false ||
    manifest.canDeploy !== false ||
    manifest.canActivate !== false ||
    manifest.canChangePermissions !== false ||
    !validBoundDigests(manifest) ||
    !manifest.metrics ||
    typeof manifest.metrics !== 'object' ||
    !exactKeys(manifest.metrics, MANIFEST_METRIC_KEYS) ||
    manifest.metrics.expectedEntities !== 3 ||
    manifest.metrics.observedEntities !== 3 ||
    manifest.metrics.verifiedNegativeCases !== 9 ||
    manifest.metrics.pilotEntities !== 1 ||
    !Array.isArray(manifest.entities) ||
    manifest.entities.length !== 3
  ) {
    invalidEvidence()
  }

  const scopeDigests = new Set<string>()
  const observationDigests = new Set<string>()
  const reviewDigests = new Set([
    manifest.campaignReviewReferenceDigest,
    manifest.readinessReviewReferenceDigest,
  ])
  let pilots = 0
  let previousScope = ''
  for (const entity of manifest.entities) {
    assertEntityArtifact(entity)
    if (
      (previousScope && previousScope.localeCompare(entity.scopeDigest) >= 0) ||
      scopeDigests.has(entity.scopeDigest) ||
      observationDigests.has(entity.observationDigest) ||
      reviewDigests.has(entity.entityReviewReferenceDigest)
    ) {
      invalidEvidence()
    }
    previousScope = entity.scopeDigest
    scopeDigests.add(entity.scopeDigest)
    observationDigests.add(entity.observationDigest)
    reviewDigests.add(entity.entityReviewReferenceDigest)
    for (const review of entity.caseReviews) {
      if (reviewDigests.has(review.runReviewReferenceDigest)) invalidEvidence()
      reviewDigests.add(review.runReviewReferenceDigest)
    }
    if (entity.pilotReviewReferenceDigest !== null) {
      if (reviewDigests.has(entity.pilotReviewReferenceDigest)) invalidEvidence()
      reviewDigests.add(entity.pilotReviewReferenceDigest)
      pilots += 1
    }
  }
  if (pilots !== 1) invalidEvidence()
  const canonical = canonicalManifest({
    sourceDigest: manifest.sourceDigest,
    targetTenantDigest: manifest.targetTenantDigest,
    campaignReviewReferenceDigest: manifest.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: manifest.readinessReviewReferenceDigest,
    metrics: manifest.metrics,
    entities: manifest.entities,
  })
  if (
    manifest.artifactDigest !== digest(JSON.stringify(canonical)) ||
    manifest.evidenceReference !== evidenceReference(manifest.artifactDigest)
  ) {
    invalidEvidence()
  }
}

export function serializeFinanceEntityIsolationNegativeStagingEvidenceManifest(
  input: FinanceEntityIsolationNegativeStagingEvidenceInput
): string {
  return JSON.stringify(createFinanceEntityIsolationNegativeStagingEvidenceManifest(input))
}

function validateInput(input: FinanceEntityIsolationNegativeStagingEvidenceInput): void {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    input.executionEnvironment !== 'staging' ||
    input.runnerFlag !== FINANCE_ISOLATION_AUDIT_FLAG ||
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
  const scopeDigests = new Set<string>()
  const observationDigests = new Set<string>()
  const reviews = new Set([input.campaignReviewReference, input.readinessReviewReference])
  let tenantId: string | null = null
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
      !validReviewReference(sample.entityReviewReference) ||
      reviews.has(sample.entityReviewReference) ||
      !validPilotShape(sample)
    ) {
      invalidEvidence()
    }
    reviews.add(sample.entityReviewReference)
    if (sample.pilotReviewReference) {
      if (reviews.has(sample.pilotReviewReference)) invalidEvidence()
      reviews.add(sample.pilotReviewReference)
      pilots += 1
    }
    if (!validateCaseReviews(sample.caseReviews, reviews)) invalidEvidence()
    tenantId ??= sample.tenantId
    const scopeDigest = createFinanceIsolationScopeDigest({
      tenantId: sample.tenantId,
      legalEntityId: sample.legalEntityId,
      connectionId: sample.accountingConnectionId,
    })
    const observationDigest = validateObservation(sample.observation, scopeDigest)
    if (
      sample.tenantId !== tenantId ||
      entityIds.has(sample.legalEntityId) ||
      connectionIds.has(sample.accountingConnectionId) ||
      scopeDigests.has(scopeDigest) ||
      observationDigests.has(observationDigest)
    ) {
      invalidEvidence()
    }
    entityIds.add(sample.legalEntityId)
    connectionIds.add(sample.accountingConnectionId)
    scopeDigests.add(scopeDigest)
    observationDigests.add(observationDigest)
  }
  if (pilots !== 1) invalidEvidence()
}

function validateCaseReviews(
  caseReviews: readonly FinanceEntityIsolationNegativeCaseReview[],
  sharedReviews: Set<string>
): boolean {
  if (!Array.isArray(caseReviews) || caseReviews.length !== 3) return false
  const roles = new Set<FinanceEntityIsolationNegativeCaseRole>()
  const localReviews = new Set<string>()
  for (const current of caseReviews) {
    if (
      !current ||
      typeof current !== 'object' ||
      !exactKeys(current, CASE_REVIEW_KEYS) ||
      !FINANCE_ENTITY_ISOLATION_NEGATIVE_CASE_ROLES.includes(current.role) ||
      roles.has(current.role) ||
      !validReviewReference(current.runReviewReference) ||
      sharedReviews.has(current.runReviewReference) ||
      localReviews.has(current.runReviewReference)
    ) {
      return false
    }
    roles.add(current.role)
    localReviews.add(current.runReviewReference)
  }
  for (const review of localReviews) sharedReviews.add(review)
  return FINANCE_ENTITY_ISOLATION_NEGATIVE_CASE_ROLES.every((role) => roles.has(role))
}

function validateObservation(
  observation: FinanceEntityIsolationNegativeAuditObservation,
  expectedScopeDigest: string
): string {
  if (
    !observation ||
    typeof observation !== 'object' ||
    !exactKeys(observation, OBSERVATION_KEYS) ||
    observation.schemaVersion !== 1 ||
    observation.mode !== 'three_case_entity_finance_isolation_negative_audit' ||
    observation.scopeDigest !== expectedScopeDigest ||
    observation.verdict !== 'all_breaches_rejected' ||
    observation.canWrite !== false ||
    observation.canApply !== false ||
    !observation.metrics ||
    typeof observation.metrics !== 'object' ||
    !exactKeys(observation.metrics, OBSERVATION_METRIC_KEYS) ||
    observation.metrics.expectedCases !== 3 ||
    observation.metrics.evaluatedCases !== 3 ||
    observation.metrics.rejectedCases !== 3 ||
    observation.metrics.gapCases !== 0 ||
    !positiveInteger(observation.metrics.isolationBreaches) ||
    !Array.isArray(observation.cases) ||
    observation.cases.length !== 3
  ) {
    invalidEvidence()
  }
  let previousRole = ''
  let totalBreaches = 0
  const roles = new Set<FinanceEntityIsolationNegativeCaseRole>()
  for (const current of observation.cases) {
    if (
      !current ||
      typeof current !== 'object' ||
      !exactKeys(current, OBSERVATION_CASE_KEYS) ||
      !FINANCE_ENTITY_ISOLATION_NEGATIVE_CASE_ROLES.includes(current.role) ||
      (previousRole && previousRole.localeCompare(current.role) >= 0) ||
      roles.has(current.role) ||
      current.verdict !== 'breach_detected' ||
      !positiveInteger(current.isolationBreaches)
    ) {
      invalidEvidence()
    }
    previousRole = current.role
    roles.add(current.role)
    totalBreaches += current.isolationBreaches
  }
  if (
    FINANCE_ENTITY_ISOLATION_NEGATIVE_CASE_ROLES.some((role) => !roles.has(role)) ||
    totalBreaches !== observation.metrics.isolationBreaches
  ) {
    invalidEvidence()
  }
  return digest(JSON.stringify(canonicalObservation(observation)))
}

function createEntityArtifact(
  sample: FinanceEntityIsolationNegativeStagingEvidenceSample
): FinanceEntityIsolationNegativeEvidenceArtifact {
  const caseReviews = Object.freeze(
    sample.caseReviews
      .map((current) =>
        Object.freeze({
          role: current.role,
          runReviewReferenceDigest: digest(current.runReviewReference),
        })
      )
      .sort((left, right) => left.role.localeCompare(right.role))
  )
  const canonical = {
    schemaVersion: 1 as const,
    kind: 'cep_finance_entity_isolation_negative_evidence' as const,
    role: sample.role,
    verdict: 'eligible_for_manual_binding' as const,
    scopeDigest: sample.observation.scopeDigest,
    entityReviewReferenceDigest: digest(sample.entityReviewReference),
    pilotReviewReferenceDigest:
      sample.pilotReviewReference === undefined ? null : digest(sample.pilotReviewReference),
    caseReviews,
    observationDigest: digest(JSON.stringify(canonicalObservation(sample.observation))),
  }
  const artifactDigest = digest(JSON.stringify(canonical))
  return Object.freeze({
    ...canonical,
    artifactDigest,
    evidenceReference: evidenceReference(artifactDigest),
  })
}

function assertEntityArtifact(artifact: FinanceEntityIsolationNegativeEvidenceArtifact): void {
  if (
    !artifact ||
    typeof artifact !== 'object' ||
    !exactKeys(artifact, ENTITY_ARTIFACT_KEYS) ||
    artifact.schemaVersion !== 1 ||
    artifact.kind !== 'cep_finance_entity_isolation_negative_evidence' ||
    !['existing_entity', 'cep_sur_pilot'].includes(artifact.role) ||
    artifact.verdict !== 'eligible_for_manual_binding' ||
    !DIGEST_PATTERN.test(artifact.scopeDigest) ||
    !DIGEST_PATTERN.test(artifact.entityReviewReferenceDigest) ||
    (artifact.role === 'cep_sur_pilot') !==
      (typeof artifact.pilotReviewReferenceDigest === 'string') ||
    (artifact.pilotReviewReferenceDigest !== null &&
      !DIGEST_PATTERN.test(artifact.pilotReviewReferenceDigest)) ||
    !DIGEST_PATTERN.test(artifact.observationDigest) ||
    !Array.isArray(artifact.caseReviews) ||
    artifact.caseReviews.length !== 3
  ) {
    invalidEvidence()
  }
  let previousRole = ''
  const roles = new Set<FinanceEntityIsolationNegativeCaseRole>()
  const reviews = new Set<string>()
  for (const current of artifact.caseReviews) {
    if (
      !current ||
      typeof current !== 'object' ||
      !exactKeys(current, CASE_REVIEW_ARTIFACT_KEYS) ||
      !FINANCE_ENTITY_ISOLATION_NEGATIVE_CASE_ROLES.includes(current.role) ||
      (previousRole && previousRole.localeCompare(current.role) >= 0) ||
      roles.has(current.role) ||
      !DIGEST_PATTERN.test(current.runReviewReferenceDigest) ||
      reviews.has(current.runReviewReferenceDigest)
    ) {
      invalidEvidence()
    }
    previousRole = current.role
    roles.add(current.role)
    reviews.add(current.runReviewReferenceDigest)
  }
  const canonical = {
    schemaVersion: artifact.schemaVersion,
    kind: artifact.kind,
    role: artifact.role,
    verdict: artifact.verdict,
    scopeDigest: artifact.scopeDigest,
    entityReviewReferenceDigest: artifact.entityReviewReferenceDigest,
    pilotReviewReferenceDigest: artifact.pilotReviewReferenceDigest,
    caseReviews: artifact.caseReviews,
    observationDigest: artifact.observationDigest,
  }
  if (
    FINANCE_ENTITY_ISOLATION_NEGATIVE_CASE_ROLES.some((role) => !roles.has(role)) ||
    artifact.artifactDigest !== digest(JSON.stringify(canonical)) ||
    artifact.evidenceReference !== evidenceReference(artifact.artifactDigest)
  ) {
    invalidEvidence()
  }
}

function canonicalObservation(observation: FinanceEntityIsolationNegativeAuditObservation) {
  return {
    schemaVersion: observation.schemaVersion,
    mode: observation.mode,
    scopeDigest: observation.scopeDigest,
    verdict: observation.verdict,
    canWrite: observation.canWrite,
    canApply: observation.canApply,
    metrics: {
      expectedCases: observation.metrics.expectedCases,
      evaluatedCases: observation.metrics.evaluatedCases,
      rejectedCases: observation.metrics.rejectedCases,
      gapCases: observation.metrics.gapCases,
      isolationBreaches: observation.metrics.isolationBreaches,
    },
    cases: observation.cases.map((current) => ({
      role: current.role,
      verdict: current.verdict,
      isolationBreaches: current.isolationBreaches,
    })),
  }
}

function canonicalManifest(input: {
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly metrics: FinanceEntityIsolationNegativeStagingEvidenceManifest['metrics']
  readonly entities: readonly FinanceEntityIsolationNegativeEvidenceArtifact[]
}) {
  return {
    schemaVersion: 1 as const,
    kind: 'cep_finance_entity_isolation_negative_staging_evidence' as const,
    mode: 'three_entity_scope_bound_negative_observations' as const,
    verdict: 'eligible_for_manual_staging_binding' as const,
    canBindAutomatically: false as const,
    canMarkVerified: false as const,
    canDeploy: false as const,
    canActivate: false as const,
    canChangePermissions: false as const,
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: input.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: input.readinessReviewReferenceDigest,
    metrics: input.metrics,
    entities: input.entities,
  }
}

function validPilotShape(sample: FinanceEntityIsolationNegativeStagingEvidenceSample): boolean {
  return sample.role === 'cep_sur_pilot'
    ? validReviewReference(sample.pilotReviewReference) &&
        sample.pilotReviewReference !== sample.entityReviewReference
    : sample.role === 'existing_entity' && sample.pilotReviewReference === undefined
}

function validBoundDigests(
  manifest: FinanceEntityIsolationNegativeStagingEvidenceManifest
): boolean {
  return (
    DIGEST_PATTERN.test(manifest.sourceDigest) &&
    DIGEST_PATTERN.test(manifest.targetTenantDigest) &&
    manifest.sourceDigest !== manifest.targetTenantDigest &&
    DIGEST_PATTERN.test(manifest.campaignReviewReferenceDigest) &&
    DIGEST_PATTERN.test(manifest.readinessReviewReferenceDigest) &&
    manifest.campaignReviewReferenceDigest !== manifest.readinessReviewReferenceDigest &&
    DIGEST_PATTERN.test(manifest.artifactDigest) &&
    typeof manifest.evidenceReference === 'string'
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

function validReviewReference(value: unknown): value is string {
  return typeof value === 'string' && REVIEW_REFERENCE_PATTERN.test(value)
}

function validIdentifier(value: unknown): value is string {
  return (
    typeof value === 'string' && value.length > 0 && value.length <= 500 && value.trim() === value
  )
}

function positiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0
}

function digest(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function evidenceReference(value: string): `evidence://sha256/${string}` {
  return `evidence://sha256/${value.slice('sha256:'.length)}`
}

function invalidEvidence(): never {
  throw new Error('FINANCE_ENTITY_ISOLATION_NEGATIVE_STAGING_EVIDENCE_INVALID')
}
