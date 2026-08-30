import { createHash } from 'node:crypto'

import { isAccountingSecretReference } from './accounting-source-registry'
import { createFinanceIsolationScopeDigest } from './isolation-audit'

export type FinanceAccountingSecretEvidenceRole = 'existing_entity' | 'cep_sur_pilot'
export type FinanceAccountingSecretBackend = 'op' | 'vault' | 'aws_sm' | 'gcp_sm'

export interface FinanceAccountingSecretReferenceStagingEvidenceSample {
  readonly tenantId: string
  readonly legalEntityId: string
  readonly accountingConnectionId: string
  readonly secretReference: string
  readonly configuredState: 'reference_configured_not_resolved'
  readonly role: FinanceAccountingSecretEvidenceRole
  readonly entityReviewReference: string
  readonly secretReviewReference: string
  readonly pilotReviewReference?: string
}

export interface FinanceAccountingSecretReferenceStagingEvidenceInput {
  readonly reviewEnvironment: 'staging'
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly samples: readonly FinanceAccountingSecretReferenceStagingEvidenceSample[]
}

export interface FinanceAccountingSecretReferenceEvidenceArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_finance_secret_reference_configuration_evidence'
  readonly role: FinanceAccountingSecretEvidenceRole
  readonly verdict: 'eligible_for_manual_binding'
  readonly configuredState: 'reference_configured_not_resolved'
  readonly scopeDigest: string
  readonly secretReferenceDigest: string
  readonly secretBackend: FinanceAccountingSecretBackend
  readonly entityReviewReferenceDigest: string
  readonly secretReviewReferenceDigest: string
  readonly pilotReviewReferenceDigest: string | null
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
}

export interface FinanceAccountingSecretReferenceStagingEvidenceManifest {
  readonly schemaVersion: 1
  readonly kind: 'cep_finance_secret_reference_staging_evidence'
  readonly mode: 'three_entity_opaque_secret_reference_review'
  readonly verdict: 'eligible_for_manual_staging_binding'
  readonly canResolveSecret: false
  readonly canReadCredential: false
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
    readonly configuredReferences: 3
    readonly uniqueReferences: 3
    readonly pilotEntities: 1
    readonly resolvedSecrets: 0
    readonly readCredentials: 0
  }
  readonly entities: readonly FinanceAccountingSecretReferenceEvidenceArtifact[]
}

const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/
const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const INPUT_KEYS = new Set([
  'reviewEnvironment',
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
  'secretReference',
  'configuredState',
  'role',
  'entityReviewReference',
  'secretReviewReference',
])
const PILOT_SAMPLE_KEYS = new Set([...SAMPLE_KEYS, 'pilotReviewReference'])
const ENTITY_ARTIFACT_KEYS = new Set([
  'schemaVersion',
  'kind',
  'role',
  'verdict',
  'configuredState',
  'scopeDigest',
  'secretReferenceDigest',
  'secretBackend',
  'entityReviewReferenceDigest',
  'secretReviewReferenceDigest',
  'pilotReviewReferenceDigest',
  'artifactDigest',
  'evidenceReference',
])
const MANIFEST_KEYS = new Set([
  'schemaVersion',
  'kind',
  'mode',
  'verdict',
  'canResolveSecret',
  'canReadCredential',
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
  'configuredReferences',
  'uniqueReferences',
  'pilotEntities',
  'resolvedSecrets',
  'readCredentials',
])

/** Seals opaque reference reviews without resolving or exposing credentials. */
export function createFinanceAccountingSecretReferenceStagingEvidenceManifest(
  input: FinanceAccountingSecretReferenceStagingEvidenceInput
): FinanceAccountingSecretReferenceStagingEvidenceManifest {
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
    configuredReferences: 3 as const,
    uniqueReferences: 3 as const,
    pilotEntities: 1 as const,
    resolvedSecrets: 0 as const,
    readCredentials: 0 as const,
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

export function assertFinanceAccountingSecretReferenceStagingEvidenceManifest(
  value: unknown
): asserts value is FinanceAccountingSecretReferenceStagingEvidenceManifest {
  if (!value || typeof value !== 'object' || !exactKeys(value, MANIFEST_KEYS)) invalidEvidence()
  const manifest = value as FinanceAccountingSecretReferenceStagingEvidenceManifest
  if (
    manifest.schemaVersion !== 1 ||
    manifest.kind !== 'cep_finance_secret_reference_staging_evidence' ||
    manifest.mode !== 'three_entity_opaque_secret_reference_review' ||
    manifest.verdict !== 'eligible_for_manual_staging_binding' ||
    manifest.canResolveSecret !== false ||
    manifest.canReadCredential !== false ||
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
    manifest.metrics.configuredReferences !== 3 ||
    manifest.metrics.uniqueReferences !== 3 ||
    manifest.metrics.pilotEntities !== 1 ||
    manifest.metrics.resolvedSecrets !== 0 ||
    manifest.metrics.readCredentials !== 0 ||
    !Array.isArray(manifest.entities) ||
    manifest.entities.length !== 3
  ) {
    invalidEvidence()
  }

  const scopes = new Set<string>()
  const secretDigests = new Set<string>()
  const reviews = new Set([
    manifest.campaignReviewReferenceDigest,
    manifest.readinessReviewReferenceDigest,
  ])
  let pilots = 0
  let previousScope = ''
  for (const entity of manifest.entities) {
    assertEntityArtifact(entity)
    if (
      (previousScope && previousScope.localeCompare(entity.scopeDigest) >= 0) ||
      scopes.has(entity.scopeDigest) ||
      secretDigests.has(entity.secretReferenceDigest) ||
      reviews.has(entity.entityReviewReferenceDigest) ||
      reviews.has(entity.secretReviewReferenceDigest)
    ) {
      invalidEvidence()
    }
    previousScope = entity.scopeDigest
    scopes.add(entity.scopeDigest)
    secretDigests.add(entity.secretReferenceDigest)
    reviews.add(entity.entityReviewReferenceDigest)
    reviews.add(entity.secretReviewReferenceDigest)
    if (entity.pilotReviewReferenceDigest !== null) {
      if (reviews.has(entity.pilotReviewReferenceDigest)) invalidEvidence()
      reviews.add(entity.pilotReviewReferenceDigest)
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

export function serializeFinanceAccountingSecretReferenceStagingEvidenceManifest(
  input: FinanceAccountingSecretReferenceStagingEvidenceInput
): string {
  return JSON.stringify(createFinanceAccountingSecretReferenceStagingEvidenceManifest(input))
}

function validateInput(input: FinanceAccountingSecretReferenceStagingEvidenceInput): void {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    input.reviewEnvironment !== 'staging' ||
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
  const secretReferences = new Set<string>()
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
      !isAccountingSecretReference(sample.secretReference) ||
      sample.configuredState !== 'reference_configured_not_resolved' ||
      !validReviewReference(sample.entityReviewReference) ||
      !validReviewReference(sample.secretReviewReference) ||
      sample.entityReviewReference === sample.secretReviewReference ||
      reviews.has(sample.entityReviewReference) ||
      reviews.has(sample.secretReviewReference) ||
      !validPilotShape(sample)
    ) {
      invalidEvidence()
    }
    tenantId ??= sample.tenantId
    if (
      sample.tenantId !== tenantId ||
      entityIds.has(sample.legalEntityId) ||
      connectionIds.has(sample.accountingConnectionId) ||
      secretReferences.has(sample.secretReference)
    ) {
      invalidEvidence()
    }
    reviews.add(sample.entityReviewReference)
    reviews.add(sample.secretReviewReference)
    if (sample.pilotReviewReference) {
      if (reviews.has(sample.pilotReviewReference)) invalidEvidence()
      reviews.add(sample.pilotReviewReference)
      pilots += 1
    }
    entityIds.add(sample.legalEntityId)
    connectionIds.add(sample.accountingConnectionId)
    secretReferences.add(sample.secretReference)
  }
  if (pilots !== 1) invalidEvidence()
}

function createEntityArtifact(
  sample: FinanceAccountingSecretReferenceStagingEvidenceSample
): FinanceAccountingSecretReferenceEvidenceArtifact {
  const canonical = {
    schemaVersion: 1 as const,
    kind: 'cep_finance_secret_reference_configuration_evidence' as const,
    role: sample.role,
    verdict: 'eligible_for_manual_binding' as const,
    configuredState: 'reference_configured_not_resolved' as const,
    scopeDigest: createFinanceIsolationScopeDigest({
      tenantId: sample.tenantId,
      legalEntityId: sample.legalEntityId,
      connectionId: sample.accountingConnectionId,
    }),
    secretReferenceDigest: digest(sample.secretReference),
    secretBackend: secretBackend(sample.secretReference),
    entityReviewReferenceDigest: digest(sample.entityReviewReference),
    secretReviewReferenceDigest: digest(sample.secretReviewReference),
    pilotReviewReferenceDigest:
      sample.pilotReviewReference === undefined ? null : digest(sample.pilotReviewReference),
  }
  const artifactDigest = digest(JSON.stringify(canonical))
  return Object.freeze({
    ...canonical,
    artifactDigest,
    evidenceReference: evidenceReference(artifactDigest),
  })
}

function assertEntityArtifact(artifact: FinanceAccountingSecretReferenceEvidenceArtifact): void {
  if (
    !artifact ||
    typeof artifact !== 'object' ||
    !exactKeys(artifact, ENTITY_ARTIFACT_KEYS) ||
    artifact.schemaVersion !== 1 ||
    artifact.kind !== 'cep_finance_secret_reference_configuration_evidence' ||
    !['existing_entity', 'cep_sur_pilot'].includes(artifact.role) ||
    artifact.verdict !== 'eligible_for_manual_binding' ||
    artifact.configuredState !== 'reference_configured_not_resolved' ||
    !DIGEST_PATTERN.test(artifact.scopeDigest) ||
    !DIGEST_PATTERN.test(artifact.secretReferenceDigest) ||
    !['op', 'vault', 'aws_sm', 'gcp_sm'].includes(artifact.secretBackend) ||
    !DIGEST_PATTERN.test(artifact.entityReviewReferenceDigest) ||
    !DIGEST_PATTERN.test(artifact.secretReviewReferenceDigest) ||
    artifact.entityReviewReferenceDigest === artifact.secretReviewReferenceDigest ||
    (artifact.role === 'cep_sur_pilot') !==
      (typeof artifact.pilotReviewReferenceDigest === 'string') ||
    (artifact.pilotReviewReferenceDigest !== null &&
      !DIGEST_PATTERN.test(artifact.pilotReviewReferenceDigest))
  ) {
    invalidEvidence()
  }
  const canonical = {
    schemaVersion: artifact.schemaVersion,
    kind: artifact.kind,
    role: artifact.role,
    verdict: artifact.verdict,
    configuredState: artifact.configuredState,
    scopeDigest: artifact.scopeDigest,
    secretReferenceDigest: artifact.secretReferenceDigest,
    secretBackend: artifact.secretBackend,
    entityReviewReferenceDigest: artifact.entityReviewReferenceDigest,
    secretReviewReferenceDigest: artifact.secretReviewReferenceDigest,
    pilotReviewReferenceDigest: artifact.pilotReviewReferenceDigest,
  }
  if (
    artifact.artifactDigest !== digest(JSON.stringify(canonical)) ||
    artifact.evidenceReference !== evidenceReference(artifact.artifactDigest)
  ) {
    invalidEvidence()
  }
}

function canonicalManifest(input: {
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly metrics: FinanceAccountingSecretReferenceStagingEvidenceManifest['metrics']
  readonly entities: readonly FinanceAccountingSecretReferenceEvidenceArtifact[]
}) {
  return {
    schemaVersion: 1 as const,
    kind: 'cep_finance_secret_reference_staging_evidence' as const,
    mode: 'three_entity_opaque_secret_reference_review' as const,
    verdict: 'eligible_for_manual_staging_binding' as const,
    canResolveSecret: false as const,
    canReadCredential: false as const,
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

function secretBackend(reference: string): FinanceAccountingSecretBackend {
  if (reference.startsWith('op://')) return 'op'
  if (reference.startsWith('vault://')) return 'vault'
  if (reference.startsWith('aws-sm://')) return 'aws_sm'
  if (reference.startsWith('gcp-sm://')) return 'gcp_sm'
  invalidEvidence()
}

function validPilotShape(sample: FinanceAccountingSecretReferenceStagingEvidenceSample): boolean {
  return sample.role === 'cep_sur_pilot'
    ? validReviewReference(sample.pilotReviewReference) &&
        sample.pilotReviewReference !== sample.entityReviewReference &&
        sample.pilotReviewReference !== sample.secretReviewReference
    : sample.role === 'existing_entity' && sample.pilotReviewReference === undefined
}

function validBoundDigests(
  manifest: FinanceAccountingSecretReferenceStagingEvidenceManifest
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

function validIdentifier(value: unknown): value is string {
  return (
    typeof value === 'string' && value.length > 0 && value.length <= 500 && value.trim() === value
  )
}

function validReviewReference(value: unknown): value is string {
  return typeof value === 'string' && REVIEW_REFERENCE_PATTERN.test(value)
}

function digest(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function evidenceReference(value: string): `evidence://sha256/${string}` {
  return `evidence://sha256/${value.slice('sha256:'.length)}`
}

function invalidEvidence(): never {
  throw new Error('FINANCE_ACCOUNTING_SECRET_REFERENCE_STAGING_EVIDENCE_INVALID')
}
