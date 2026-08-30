import { createHash } from 'node:crypto'

import { createFinanceIsolationScopeDigest } from './isolation-audit'

export type FinanceAccountingConnectionEvidenceRole = 'existing_entity' | 'cep_sur_pilot'

export interface FinanceAccountingConnectionStagingEvidenceSample {
  readonly tenantId: string
  readonly legalEntityId: string
  readonly accountingConnectionId: string
  readonly provider: string
  readonly externalCompanyId: string
  readonly integrationMode: 'read_only'
  readonly connectionStatus: 'active'
  readonly reviewedState: 'configured_not_resolved'
  readonly role: FinanceAccountingConnectionEvidenceRole
  readonly entityReviewReference: string
  readonly connectionReviewReference: string
  readonly pilotReviewReference?: string
}

export interface FinanceAccountingConnectionStagingEvidenceInput {
  readonly reviewEnvironment: 'staging'
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly samples: readonly FinanceAccountingConnectionStagingEvidenceSample[]
}

export interface FinanceAccountingConnectionEvidenceArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_finance_accounting_connection_review_evidence'
  readonly role: FinanceAccountingConnectionEvidenceRole
  readonly verdict: 'eligible_for_manual_binding'
  readonly reviewedState: 'configured_not_resolved'
  readonly scopeDigest: string
  readonly connectionBindingDigest: string
  readonly externalCompanyBindingDigest: string
  readonly entityReviewReferenceDigest: string
  readonly connectionReviewReferenceDigest: string
  readonly pilotReviewReferenceDigest: string | null
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
}

export interface FinanceAccountingConnectionStagingEvidenceManifest {
  readonly schemaVersion: 1
  readonly kind: 'cep_finance_accounting_connection_staging_evidence'
  readonly mode: 'three_entity_redacted_connection_review'
  readonly verdict: 'eligible_for_manual_staging_binding'
  readonly canResolveSecret: false
  readonly canConnectProvider: false
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
    readonly reviewedConnections: 3
    readonly readOnlyConnections: 3
    readonly activeConnections: 3
    readonly pilotEntities: 1
    readonly resolvedSecrets: 0
    readonly liveProviderConnections: 0
  }
  readonly entities: readonly FinanceAccountingConnectionEvidenceArtifact[]
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
  'provider',
  'externalCompanyId',
  'integrationMode',
  'connectionStatus',
  'reviewedState',
  'role',
  'entityReviewReference',
  'connectionReviewReference',
])
const PILOT_SAMPLE_KEYS = new Set([...SAMPLE_KEYS, 'pilotReviewReference'])
const ENTITY_ARTIFACT_KEYS = new Set([
  'schemaVersion',
  'kind',
  'role',
  'verdict',
  'reviewedState',
  'scopeDigest',
  'connectionBindingDigest',
  'externalCompanyBindingDigest',
  'entityReviewReferenceDigest',
  'connectionReviewReferenceDigest',
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
  'canConnectProvider',
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
  'reviewedConnections',
  'readOnlyConnections',
  'activeConnections',
  'pilotEntities',
  'resolvedSecrets',
  'liveProviderConnections',
])

/**
 * Seals reviewed connection metadata without accepting secret references or
 * claiming provider connectivity. Secret and provider gates remain separate.
 */
export function createFinanceAccountingConnectionStagingEvidenceManifest(
  input: FinanceAccountingConnectionStagingEvidenceInput
): FinanceAccountingConnectionStagingEvidenceManifest {
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
    reviewedConnections: 3 as const,
    readOnlyConnections: 3 as const,
    activeConnections: 3 as const,
    pilotEntities: 1 as const,
    resolvedSecrets: 0 as const,
    liveProviderConnections: 0 as const,
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

export function assertFinanceAccountingConnectionStagingEvidenceManifest(
  value: unknown
): asserts value is FinanceAccountingConnectionStagingEvidenceManifest {
  if (!value || typeof value !== 'object' || !exactKeys(value, MANIFEST_KEYS)) invalidEvidence()
  const manifest = value as FinanceAccountingConnectionStagingEvidenceManifest
  if (
    manifest.schemaVersion !== 1 ||
    manifest.kind !== 'cep_finance_accounting_connection_staging_evidence' ||
    manifest.mode !== 'three_entity_redacted_connection_review' ||
    manifest.verdict !== 'eligible_for_manual_staging_binding' ||
    manifest.canResolveSecret !== false ||
    manifest.canConnectProvider !== false ||
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
    manifest.metrics.reviewedConnections !== 3 ||
    manifest.metrics.readOnlyConnections !== 3 ||
    manifest.metrics.activeConnections !== 3 ||
    manifest.metrics.pilotEntities !== 1 ||
    manifest.metrics.resolvedSecrets !== 0 ||
    manifest.metrics.liveProviderConnections !== 0 ||
    !Array.isArray(manifest.entities) ||
    manifest.entities.length !== 3
  ) {
    invalidEvidence()
  }

  const scopes = new Set<string>()
  const bindings = new Set<string>()
  const externalCompanies = new Set<string>()
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
      bindings.has(entity.connectionBindingDigest) ||
      externalCompanies.has(entity.externalCompanyBindingDigest) ||
      reviews.has(entity.entityReviewReferenceDigest) ||
      reviews.has(entity.connectionReviewReferenceDigest)
    ) {
      invalidEvidence()
    }
    previousScope = entity.scopeDigest
    scopes.add(entity.scopeDigest)
    bindings.add(entity.connectionBindingDigest)
    externalCompanies.add(entity.externalCompanyBindingDigest)
    reviews.add(entity.entityReviewReferenceDigest)
    reviews.add(entity.connectionReviewReferenceDigest)
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

export function serializeFinanceAccountingConnectionStagingEvidenceManifest(
  input: FinanceAccountingConnectionStagingEvidenceInput
): string {
  return JSON.stringify(createFinanceAccountingConnectionStagingEvidenceManifest(input))
}

function validateInput(input: FinanceAccountingConnectionStagingEvidenceInput): void {
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
  const externalCompanies = new Set<string>()
  const reviews = new Set([input.campaignReviewReference, input.readinessReviewReference])
  let tenantId: string | null = null
  let pilots = 0
  for (const sample of input.samples) {
    const expectedKeys = sample?.role === 'cep_sur_pilot' ? PILOT_SAMPLE_KEYS : SAMPLE_KEYS
    if (
      !sample ||
      typeof sample !== 'object' ||
      !exactKeys(sample, expectedKeys) ||
      !validIdentifier(sample.tenantId, 500) ||
      !validIdentifier(sample.legalEntityId, 500) ||
      !validIdentifier(sample.accountingConnectionId, 500) ||
      !validIdentifier(sample.provider, 100) ||
      !validIdentifier(sample.externalCompanyId, 500) ||
      sample.integrationMode !== 'read_only' ||
      sample.connectionStatus !== 'active' ||
      sample.reviewedState !== 'configured_not_resolved' ||
      !validReviewReference(sample.entityReviewReference) ||
      !validReviewReference(sample.connectionReviewReference) ||
      sample.entityReviewReference === sample.connectionReviewReference ||
      reviews.has(sample.entityReviewReference) ||
      reviews.has(sample.connectionReviewReference) ||
      !validPilotShape(sample)
    ) {
      invalidEvidence()
    }
    tenantId ??= sample.tenantId
    const externalCompanyKey = `${sample.provider}\u0000${sample.externalCompanyId}`
    if (
      sample.tenantId !== tenantId ||
      entityIds.has(sample.legalEntityId) ||
      connectionIds.has(sample.accountingConnectionId) ||
      externalCompanies.has(externalCompanyKey)
    ) {
      invalidEvidence()
    }
    reviews.add(sample.entityReviewReference)
    reviews.add(sample.connectionReviewReference)
    if (sample.pilotReviewReference) {
      if (reviews.has(sample.pilotReviewReference)) invalidEvidence()
      reviews.add(sample.pilotReviewReference)
      pilots += 1
    }
    entityIds.add(sample.legalEntityId)
    connectionIds.add(sample.accountingConnectionId)
    externalCompanies.add(externalCompanyKey)
  }
  if (pilots !== 1) invalidEvidence()
}

function createEntityArtifact(
  sample: FinanceAccountingConnectionStagingEvidenceSample
): FinanceAccountingConnectionEvidenceArtifact {
  const canonical = {
    schemaVersion: 1 as const,
    kind: 'cep_finance_accounting_connection_review_evidence' as const,
    role: sample.role,
    verdict: 'eligible_for_manual_binding' as const,
    reviewedState: 'configured_not_resolved' as const,
    scopeDigest: createFinanceIsolationScopeDigest({
      tenantId: sample.tenantId,
      legalEntityId: sample.legalEntityId,
      connectionId: sample.accountingConnectionId,
    }),
    connectionBindingDigest: digest(
      JSON.stringify([
        sample.tenantId,
        sample.legalEntityId,
        sample.accountingConnectionId,
        sample.provider,
        sample.externalCompanyId,
      ])
    ),
    externalCompanyBindingDigest: digest(
      JSON.stringify([sample.provider, sample.externalCompanyId])
    ),
    entityReviewReferenceDigest: digest(sample.entityReviewReference),
    connectionReviewReferenceDigest: digest(sample.connectionReviewReference),
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

function assertEntityArtifact(artifact: FinanceAccountingConnectionEvidenceArtifact): void {
  if (
    !artifact ||
    typeof artifact !== 'object' ||
    !exactKeys(artifact, ENTITY_ARTIFACT_KEYS) ||
    artifact.schemaVersion !== 1 ||
    artifact.kind !== 'cep_finance_accounting_connection_review_evidence' ||
    !['existing_entity', 'cep_sur_pilot'].includes(artifact.role) ||
    artifact.verdict !== 'eligible_for_manual_binding' ||
    artifact.reviewedState !== 'configured_not_resolved' ||
    !DIGEST_PATTERN.test(artifact.scopeDigest) ||
    !DIGEST_PATTERN.test(artifact.connectionBindingDigest) ||
    !DIGEST_PATTERN.test(artifact.externalCompanyBindingDigest) ||
    !DIGEST_PATTERN.test(artifact.entityReviewReferenceDigest) ||
    !DIGEST_PATTERN.test(artifact.connectionReviewReferenceDigest) ||
    artifact.entityReviewReferenceDigest === artifact.connectionReviewReferenceDigest ||
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
    reviewedState: artifact.reviewedState,
    scopeDigest: artifact.scopeDigest,
    connectionBindingDigest: artifact.connectionBindingDigest,
    externalCompanyBindingDigest: artifact.externalCompanyBindingDigest,
    entityReviewReferenceDigest: artifact.entityReviewReferenceDigest,
    connectionReviewReferenceDigest: artifact.connectionReviewReferenceDigest,
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
  readonly metrics: FinanceAccountingConnectionStagingEvidenceManifest['metrics']
  readonly entities: readonly FinanceAccountingConnectionEvidenceArtifact[]
}) {
  return {
    schemaVersion: 1 as const,
    kind: 'cep_finance_accounting_connection_staging_evidence' as const,
    mode: 'three_entity_redacted_connection_review' as const,
    verdict: 'eligible_for_manual_staging_binding' as const,
    canResolveSecret: false as const,
    canConnectProvider: false as const,
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

function validPilotShape(sample: FinanceAccountingConnectionStagingEvidenceSample): boolean {
  return sample.role === 'cep_sur_pilot'
    ? validReviewReference(sample.pilotReviewReference) &&
        sample.pilotReviewReference !== sample.entityReviewReference &&
        sample.pilotReviewReference !== sample.connectionReviewReference
    : sample.role === 'existing_entity' && sample.pilotReviewReference === undefined
}

function validBoundDigests(manifest: FinanceAccountingConnectionStagingEvidenceManifest): boolean {
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

function validIdentifier(value: unknown, max: number): value is string {
  return (
    typeof value === 'string' && value.length > 0 && value.length <= max && value.trim() === value
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
  throw new Error('FINANCE_ACCOUNTING_CONNECTION_STAGING_EVIDENCE_INVALID')
}
