import { createHash } from 'node:crypto'

import type {
  ReviewedExternalRelationshipMapping,
  ReviewedPaymentSourceBinding,
} from './external-operational-readers'
import { createFinanceIsolationScopeDigest } from './isolation-audit'

export type FinancePaymentSourceEvidenceRole = 'existing_entity' | 'cep_sur_pilot'

export interface FinancePaymentSourceContractObservation {
  readonly schemaVersion: 1
  readonly mode: 'read_only_payment_source_contract_inspection'
  readonly verdict: 'contract_satisfied'
  readonly accountingScopeDigest: string
  readonly paymentSourceScopeDigest: string
  readonly providerAccountBindingDigest: string
  readonly relationshipMappingDigest: string
  readonly hasReviewedEnrollmentMappings: true
  readonly contractVersion: 1
  readonly operations: readonly ['list_payment_events']
  readonly pagination: {
    readonly mode: 'cursor'
    readonly minimumPageSize: 1
    readonly maximumPageSize: 1000
    readonly maximumPages: 1000
    readonly cycleDetectionRequired: true
  }
  readonly canReadPaymentEvents: true
  readonly canInvokeProvider: false
  readonly canWriteProvider: false
  readonly canExposeCredential: false
  readonly canPersistRawPayload: false
}

export interface FinancePaymentSourceInspectionInput extends ReviewedPaymentSourceBinding {
  readonly accountingConnectionId: string
}

export interface FinancePaymentSourceStagingEvidenceSample {
  readonly tenantId: string
  readonly legalEntityId: string
  readonly accountingConnectionId: string
  readonly paymentSourceConnectionId: string
  readonly provider: string
  readonly externalAccountId: string
  readonly integrationMode: 'read_only'
  readonly connectionStatus: 'active'
  readonly enrollmentMappings: readonly ReviewedExternalRelationshipMapping[]
  readonly role: FinancePaymentSourceEvidenceRole
  readonly entityReviewReference: string
  readonly sourceReviewReference: string
  readonly pilotReviewReference?: string
  readonly observation: FinancePaymentSourceContractObservation
}

export interface FinancePaymentSourceStagingEvidenceInput {
  readonly reviewEnvironment: 'staging'
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly samples: readonly FinancePaymentSourceStagingEvidenceSample[]
}

export interface FinancePaymentSourceEvidenceArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_finance_payment_source_review_evidence'
  readonly role: FinancePaymentSourceEvidenceRole
  readonly verdict: 'eligible_for_manual_binding'
  readonly accountingScopeDigest: string
  readonly paymentSourceScopeDigest: string
  readonly providerAccountBindingDigest: string
  readonly relationshipMappingDigest: string
  readonly entityReviewReferenceDigest: string
  readonly sourceReviewReferenceDigest: string
  readonly pilotReviewReferenceDigest: string | null
  readonly observationDigest: string
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
}

export interface FinancePaymentSourceStagingEvidenceManifest {
  readonly schemaVersion: 1
  readonly kind: 'cep_finance_payment_source_staging_evidence'
  readonly mode: 'three_entity_non_invoking_payment_source_review'
  readonly verdict: 'eligible_for_manual_staging_binding'
  readonly canInvokeProvider: false
  readonly canResolveSecret: false
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
    readonly reviewedSources: 3
    readonly activeSources: 3
    readonly readOnlySources: 3
    readonly sourcesWithReviewedEnrollmentMappings: 3
    readonly pilotEntities: 1
    readonly providerInvocations: 0
    readonly providerWriteOperations: 0
  }
  readonly entities: readonly FinancePaymentSourceEvidenceArtifact[]
}

const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/
const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const SOURCE_KEYS = new Set([
  'tenantId',
  'legalEntityId',
  'accountingConnectionId',
  'sourceConnectionId',
  'provider',
  'externalAccountId',
  'integrationMode',
  'connectionStatus',
  'reviewReference',
  'client',
  'enrollmentMappings',
])
const CLIENT_KEYS = new Set(['provider', 'listPaymentEvents'])
const MAPPING_KEYS = new Set(['externalId', 'localId'])
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
  'paymentSourceConnectionId',
  'provider',
  'externalAccountId',
  'integrationMode',
  'connectionStatus',
  'enrollmentMappings',
  'role',
  'entityReviewReference',
  'sourceReviewReference',
  'observation',
])
const PILOT_SAMPLE_KEYS = new Set([...SAMPLE_KEYS, 'pilotReviewReference'])
const OBSERVATION_KEYS = new Set([
  'schemaVersion',
  'mode',
  'verdict',
  'accountingScopeDigest',
  'paymentSourceScopeDigest',
  'providerAccountBindingDigest',
  'relationshipMappingDigest',
  'hasReviewedEnrollmentMappings',
  'contractVersion',
  'operations',
  'pagination',
  'canReadPaymentEvents',
  'canInvokeProvider',
  'canWriteProvider',
  'canExposeCredential',
  'canPersistRawPayload',
])
const PAGINATION_KEYS = new Set([
  'mode',
  'minimumPageSize',
  'maximumPageSize',
  'maximumPages',
  'cycleDetectionRequired',
])
const ENTITY_ARTIFACT_KEYS = new Set([
  'schemaVersion',
  'kind',
  'role',
  'verdict',
  'accountingScopeDigest',
  'paymentSourceScopeDigest',
  'providerAccountBindingDigest',
  'relationshipMappingDigest',
  'entityReviewReferenceDigest',
  'sourceReviewReferenceDigest',
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
  'canInvokeProvider',
  'canResolveSecret',
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
  'reviewedSources',
  'activeSources',
  'readOnlySources',
  'sourcesWithReviewedEnrollmentMappings',
  'pilotEntities',
  'providerInvocations',
  'providerWriteOperations',
])
const MAX_RELATIONSHIPS = 100_000

/** Inspects one reviewed payment source without invoking its provider client. */
export function inspectFinancePaymentSourceContract(
  source: FinancePaymentSourceInspectionInput
): FinancePaymentSourceContractObservation {
  validateInspectionSource(source)
  const paymentSourceScopeDigest = createFinancePaymentSourceScopeDigest({
    tenantId: source.tenantId,
    legalEntityId: source.legalEntityId,
    sourceConnectionId: source.sourceConnectionId,
  })
  return Object.freeze({
    schemaVersion: 1,
    mode: 'read_only_payment_source_contract_inspection',
    verdict: 'contract_satisfied',
    accountingScopeDigest: createFinanceIsolationScopeDigest({
      tenantId: source.tenantId,
      legalEntityId: source.legalEntityId,
      connectionId: source.accountingConnectionId,
    }),
    paymentSourceScopeDigest,
    providerAccountBindingDigest: providerAccountDigest(source.provider, source.externalAccountId),
    relationshipMappingDigest: relationshipDigest(
      paymentSourceScopeDigest,
      source.enrollmentMappings
    ),
    hasReviewedEnrollmentMappings: true,
    contractVersion: 1,
    operations: Object.freeze(['list_payment_events'] as const),
    pagination: Object.freeze({
      mode: 'cursor',
      minimumPageSize: 1,
      maximumPageSize: 1000,
      maximumPages: 1000,
      cycleDetectionRequired: true,
    }),
    canReadPaymentEvents: true,
    canInvokeProvider: false,
    canWriteProvider: false,
    canExposeCredential: false,
    canPersistRawPayload: false,
  })
}

export function createFinancePaymentSourceScopeDigest(input: {
  readonly tenantId: string
  readonly legalEntityId: string
  readonly sourceConnectionId: string
}): string {
  return digest(
    JSON.stringify([
      'finance_payment_source_scope_v1',
      input.tenantId,
      input.legalEntityId,
      input.sourceConnectionId,
    ])
  )
}

export function createFinancePaymentSourceStagingEvidenceManifest(
  input: FinancePaymentSourceStagingEvidenceInput
): FinancePaymentSourceStagingEvidenceManifest {
  validateInput(input)
  const campaignReviewReferenceDigest = digest(input.campaignReviewReference)
  const readinessReviewReferenceDigest = digest(input.readinessReviewReference)
  const entities = Object.freeze(
    input.samples
      .map(createEntityArtifact)
      .sort((left, right) =>
        left.paymentSourceScopeDigest.localeCompare(right.paymentSourceScopeDigest)
      )
  )
  const metrics = Object.freeze({
    expectedEntities: 3 as const,
    reviewedSources: 3 as const,
    activeSources: 3 as const,
    readOnlySources: 3 as const,
    sourcesWithReviewedEnrollmentMappings: 3 as const,
    pilotEntities: 1 as const,
    providerInvocations: 0 as const,
    providerWriteOperations: 0 as const,
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

export function assertFinancePaymentSourceStagingEvidenceManifest(
  value: unknown
): asserts value is FinancePaymentSourceStagingEvidenceManifest {
  if (!value || typeof value !== 'object' || !exactKeys(value, MANIFEST_KEYS)) invalidEvidence()
  const manifest = value as FinancePaymentSourceStagingEvidenceManifest
  if (
    manifest.schemaVersion !== 1 ||
    manifest.kind !== 'cep_finance_payment_source_staging_evidence' ||
    manifest.mode !== 'three_entity_non_invoking_payment_source_review' ||
    manifest.verdict !== 'eligible_for_manual_staging_binding' ||
    manifest.canInvokeProvider !== false ||
    manifest.canResolveSecret !== false ||
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
    manifest.metrics.reviewedSources !== 3 ||
    manifest.metrics.activeSources !== 3 ||
    manifest.metrics.readOnlySources !== 3 ||
    manifest.metrics.sourcesWithReviewedEnrollmentMappings !== 3 ||
    manifest.metrics.pilotEntities !== 1 ||
    manifest.metrics.providerInvocations !== 0 ||
    manifest.metrics.providerWriteOperations !== 0 ||
    !Array.isArray(manifest.entities) ||
    manifest.entities.length !== 3
  ) {
    invalidEvidence()
  }

  const accountingScopes = new Set<string>()
  const sourceScopes = new Set<string>()
  const providerAccounts = new Set<string>()
  const mappingDigests = new Set<string>()
  const observations = new Set<string>()
  const reviews = new Set([
    manifest.campaignReviewReferenceDigest,
    manifest.readinessReviewReferenceDigest,
  ])
  let pilots = 0
  let previousScope = ''
  for (const entity of manifest.entities) {
    assertEntityArtifact(entity)
    if (
      (previousScope && previousScope.localeCompare(entity.paymentSourceScopeDigest) >= 0) ||
      accountingScopes.has(entity.accountingScopeDigest) ||
      sourceScopes.has(entity.paymentSourceScopeDigest) ||
      providerAccounts.has(entity.providerAccountBindingDigest) ||
      mappingDigests.has(entity.relationshipMappingDigest) ||
      observations.has(entity.observationDigest) ||
      reviews.has(entity.entityReviewReferenceDigest) ||
      reviews.has(entity.sourceReviewReferenceDigest)
    ) {
      invalidEvidence()
    }
    previousScope = entity.paymentSourceScopeDigest
    accountingScopes.add(entity.accountingScopeDigest)
    sourceScopes.add(entity.paymentSourceScopeDigest)
    providerAccounts.add(entity.providerAccountBindingDigest)
    mappingDigests.add(entity.relationshipMappingDigest)
    observations.add(entity.observationDigest)
    reviews.add(entity.entityReviewReferenceDigest)
    reviews.add(entity.sourceReviewReferenceDigest)
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

export function serializeFinancePaymentSourceStagingEvidenceManifest(
  input: FinancePaymentSourceStagingEvidenceInput
): string {
  return JSON.stringify(createFinancePaymentSourceStagingEvidenceManifest(input))
}

function validateInspectionSource(source: FinancePaymentSourceInspectionInput): void {
  if (
    !source ||
    typeof source !== 'object' ||
    !exactKeys(source, SOURCE_KEYS) ||
    !validIdentifier(source.tenantId, 500) ||
    !validIdentifier(source.legalEntityId, 500) ||
    !validIdentifier(source.accountingConnectionId, 500) ||
    !validIdentifier(source.sourceConnectionId, 500) ||
    !validIdentifier(source.provider, 100) ||
    !validIdentifier(source.externalAccountId, 500) ||
    source.integrationMode !== 'read_only' ||
    source.connectionStatus !== 'active' ||
    !validReviewReference(source.reviewReference) ||
    !source.client ||
    typeof source.client !== 'object' ||
    !exactKeys(source.client, CLIENT_KEYS) ||
    source.client.provider !== source.provider ||
    typeof source.client.listPaymentEvents !== 'function'
  ) {
    invalidEvidence()
  }
  validateRelationships(source.enrollmentMappings)
}

function validateInput(input: FinancePaymentSourceStagingEvidenceInput): void {
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
  const accountingConnections = new Set<string>()
  const paymentConnections = new Set<string>()
  const providerAccounts = new Set<string>()
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
      !validIdentifier(sample.paymentSourceConnectionId, 500) ||
      !validIdentifier(sample.provider, 100) ||
      !validIdentifier(sample.externalAccountId, 500) ||
      sample.integrationMode !== 'read_only' ||
      sample.connectionStatus !== 'active' ||
      !validReviewReference(sample.entityReviewReference) ||
      !validReviewReference(sample.sourceReviewReference) ||
      sample.entityReviewReference === sample.sourceReviewReference ||
      reviews.has(sample.entityReviewReference) ||
      reviews.has(sample.sourceReviewReference) ||
      !validPilotShape(sample)
    ) {
      invalidEvidence()
    }
    tenantId ??= sample.tenantId
    const accountBinding = providerAccountDigest(sample.provider, sample.externalAccountId)
    validateRelationships(sample.enrollmentMappings)
    const paymentSourceScopeDigest = createFinancePaymentSourceScopeDigest({
      tenantId: sample.tenantId,
      legalEntityId: sample.legalEntityId,
      sourceConnectionId: sample.paymentSourceConnectionId,
    })
    validateObservation(sample.observation, {
      accountingScopeDigest: createFinanceIsolationScopeDigest({
        tenantId: sample.tenantId,
        legalEntityId: sample.legalEntityId,
        connectionId: sample.accountingConnectionId,
      }),
      paymentSourceScopeDigest,
      providerAccountBindingDigest: accountBinding,
      relationshipMappingDigest: relationshipDigest(
        paymentSourceScopeDigest,
        sample.enrollmentMappings
      ),
    })
    if (
      sample.tenantId !== tenantId ||
      entityIds.has(sample.legalEntityId) ||
      accountingConnections.has(sample.accountingConnectionId) ||
      paymentConnections.has(sample.paymentSourceConnectionId) ||
      providerAccounts.has(accountBinding)
    ) {
      invalidEvidence()
    }
    entityIds.add(sample.legalEntityId)
    accountingConnections.add(sample.accountingConnectionId)
    paymentConnections.add(sample.paymentSourceConnectionId)
    providerAccounts.add(accountBinding)
    reviews.add(sample.entityReviewReference)
    reviews.add(sample.sourceReviewReference)
    if (sample.pilotReviewReference) {
      if (reviews.has(sample.pilotReviewReference)) invalidEvidence()
      reviews.add(sample.pilotReviewReference)
      pilots += 1
    }
  }
  if (pilots !== 1) invalidEvidence()
}

function validateObservation(
  observation: FinancePaymentSourceContractObservation,
  expected: {
    readonly accountingScopeDigest: string
    readonly paymentSourceScopeDigest: string
    readonly providerAccountBindingDigest: string
    readonly relationshipMappingDigest: string
  }
): void {
  if (
    !observation ||
    typeof observation !== 'object' ||
    !exactKeys(observation, OBSERVATION_KEYS) ||
    observation.schemaVersion !== 1 ||
    observation.mode !== 'read_only_payment_source_contract_inspection' ||
    observation.verdict !== 'contract_satisfied' ||
    observation.accountingScopeDigest !== expected.accountingScopeDigest ||
    observation.paymentSourceScopeDigest !== expected.paymentSourceScopeDigest ||
    observation.providerAccountBindingDigest !== expected.providerAccountBindingDigest ||
    observation.relationshipMappingDigest !== expected.relationshipMappingDigest ||
    observation.hasReviewedEnrollmentMappings !== true ||
    observation.contractVersion !== 1 ||
    !Array.isArray(observation.operations) ||
    observation.operations.length !== 1 ||
    observation.operations[0] !== 'list_payment_events' ||
    !observation.pagination ||
    typeof observation.pagination !== 'object' ||
    !exactKeys(observation.pagination, PAGINATION_KEYS) ||
    observation.pagination.mode !== 'cursor' ||
    observation.pagination.minimumPageSize !== 1 ||
    observation.pagination.maximumPageSize !== 1000 ||
    observation.pagination.maximumPages !== 1000 ||
    observation.pagination.cycleDetectionRequired !== true ||
    observation.canReadPaymentEvents !== true ||
    observation.canInvokeProvider !== false ||
    observation.canWriteProvider !== false ||
    observation.canExposeCredential !== false ||
    observation.canPersistRawPayload !== false
  ) {
    invalidEvidence()
  }
}

function createEntityArtifact(
  sample: FinancePaymentSourceStagingEvidenceSample
): FinancePaymentSourceEvidenceArtifact {
  const canonical = {
    schemaVersion: 1 as const,
    kind: 'cep_finance_payment_source_review_evidence' as const,
    role: sample.role,
    verdict: 'eligible_for_manual_binding' as const,
    accountingScopeDigest: sample.observation.accountingScopeDigest,
    paymentSourceScopeDigest: sample.observation.paymentSourceScopeDigest,
    providerAccountBindingDigest: sample.observation.providerAccountBindingDigest,
    relationshipMappingDigest: sample.observation.relationshipMappingDigest,
    entityReviewReferenceDigest: digest(sample.entityReviewReference),
    sourceReviewReferenceDigest: digest(sample.sourceReviewReference),
    pilotReviewReferenceDigest:
      sample.pilotReviewReference === undefined ? null : digest(sample.pilotReviewReference),
    observationDigest: digest(JSON.stringify(canonicalObservation(sample.observation))),
  }
  const artifactDigest = digest(JSON.stringify(canonical))
  return Object.freeze({
    ...canonical,
    artifactDigest,
    evidenceReference: evidenceReference(artifactDigest),
  })
}

function assertEntityArtifact(artifact: FinancePaymentSourceEvidenceArtifact): void {
  if (
    !artifact ||
    typeof artifact !== 'object' ||
    !exactKeys(artifact, ENTITY_ARTIFACT_KEYS) ||
    artifact.schemaVersion !== 1 ||
    artifact.kind !== 'cep_finance_payment_source_review_evidence' ||
    !['existing_entity', 'cep_sur_pilot'].includes(artifact.role) ||
    artifact.verdict !== 'eligible_for_manual_binding' ||
    !DIGEST_PATTERN.test(artifact.accountingScopeDigest) ||
    !DIGEST_PATTERN.test(artifact.paymentSourceScopeDigest) ||
    !DIGEST_PATTERN.test(artifact.providerAccountBindingDigest) ||
    !DIGEST_PATTERN.test(artifact.relationshipMappingDigest) ||
    !DIGEST_PATTERN.test(artifact.entityReviewReferenceDigest) ||
    !DIGEST_PATTERN.test(artifact.sourceReviewReferenceDigest) ||
    artifact.entityReviewReferenceDigest === artifact.sourceReviewReferenceDigest ||
    !DIGEST_PATTERN.test(artifact.observationDigest) ||
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
    accountingScopeDigest: artifact.accountingScopeDigest,
    paymentSourceScopeDigest: artifact.paymentSourceScopeDigest,
    providerAccountBindingDigest: artifact.providerAccountBindingDigest,
    relationshipMappingDigest: artifact.relationshipMappingDigest,
    entityReviewReferenceDigest: artifact.entityReviewReferenceDigest,
    sourceReviewReferenceDigest: artifact.sourceReviewReferenceDigest,
    pilotReviewReferenceDigest: artifact.pilotReviewReferenceDigest,
    observationDigest: artifact.observationDigest,
  }
  if (
    artifact.artifactDigest !== digest(JSON.stringify(canonical)) ||
    artifact.evidenceReference !== evidenceReference(artifact.artifactDigest)
  ) {
    invalidEvidence()
  }
}

function validateRelationships(
  relationships: readonly ReviewedExternalRelationshipMapping[]
): void {
  if (
    !Array.isArray(relationships) ||
    relationships.length < 1 ||
    relationships.length > MAX_RELATIONSHIPS
  ) {
    invalidEvidence()
  }
  const externalIds = new Set<string>()
  const localIds = new Set<string>()
  for (const relationship of relationships) {
    const localKey = localRelationshipKey(relationship?.localId)
    if (
      !relationship ||
      typeof relationship !== 'object' ||
      !exactKeys(relationship, MAPPING_KEYS) ||
      !validIdentifier(relationship.externalId, 500) ||
      localKey === null ||
      externalIds.has(relationship.externalId) ||
      localIds.has(localKey)
    ) {
      invalidEvidence()
    }
    externalIds.add(relationship.externalId)
    localIds.add(localKey)
  }
}

function relationshipDigest(
  sourceScopeDigest: string,
  relationships: readonly ReviewedExternalRelationshipMapping[]
): string {
  const canonical = relationships
    .map((relationship) => [
      relationship.externalId,
      typeof relationship.localId,
      String(relationship.localId),
    ])
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)))
  return digest(JSON.stringify([sourceScopeDigest, canonical]))
}

function localRelationshipKey(value: unknown): string | null {
  if (typeof value === 'string' && validIdentifier(value, 500)) return `string:${value}`
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) {
    return `number:${value}`
  }
  return null
}

function validPilotShape(sample: FinancePaymentSourceStagingEvidenceSample): boolean {
  return sample.role === 'cep_sur_pilot'
    ? validReviewReference(sample.pilotReviewReference) &&
        sample.pilotReviewReference !== sample.entityReviewReference &&
        sample.pilotReviewReference !== sample.sourceReviewReference
    : sample.role === 'existing_entity' && sample.pilotReviewReference === undefined
}

function canonicalObservation(observation: FinancePaymentSourceContractObservation) {
  return {
    schemaVersion: observation.schemaVersion,
    mode: observation.mode,
    verdict: observation.verdict,
    accountingScopeDigest: observation.accountingScopeDigest,
    paymentSourceScopeDigest: observation.paymentSourceScopeDigest,
    providerAccountBindingDigest: observation.providerAccountBindingDigest,
    relationshipMappingDigest: observation.relationshipMappingDigest,
    hasReviewedEnrollmentMappings: observation.hasReviewedEnrollmentMappings,
    contractVersion: observation.contractVersion,
    operations: observation.operations,
    pagination: observation.pagination,
    canReadPaymentEvents: observation.canReadPaymentEvents,
    canInvokeProvider: observation.canInvokeProvider,
    canWriteProvider: observation.canWriteProvider,
    canExposeCredential: observation.canExposeCredential,
    canPersistRawPayload: observation.canPersistRawPayload,
  }
}

function canonicalManifest(input: {
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly metrics: FinancePaymentSourceStagingEvidenceManifest['metrics']
  readonly entities: readonly FinancePaymentSourceEvidenceArtifact[]
}) {
  return {
    schemaVersion: 1 as const,
    kind: 'cep_finance_payment_source_staging_evidence' as const,
    mode: 'three_entity_non_invoking_payment_source_review' as const,
    verdict: 'eligible_for_manual_staging_binding' as const,
    canInvokeProvider: false as const,
    canResolveSecret: false as const,
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

function providerAccountDigest(provider: string, externalAccountId: string): string {
  return digest(JSON.stringify([provider, externalAccountId]))
}

function validBoundDigests(manifest: FinancePaymentSourceStagingEvidenceManifest): boolean {
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

function validIdentifier(value: unknown, maximum: number): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= maximum &&
    value.trim() === value
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
  throw new Error('FINANCE_PAYMENT_SOURCE_STAGING_EVIDENCE_INVALID')
}
