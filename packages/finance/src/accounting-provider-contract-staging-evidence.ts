import { createHash } from 'node:crypto'

import type { AccountingConnectionScope, AccountingReadClient } from './contracts'
import { createFinanceIsolationScopeDigest } from './isolation-audit'
import { assertAccountingReadBinding } from './sync'

export type FinanceAccountingProviderContractEvidenceRole = 'existing_entity' | 'cep_sur_pilot'

export interface FinanceAccountingProviderContractObservation {
  readonly schemaVersion: 1
  readonly mode: 'read_only_accounting_provider_contract_inspection'
  readonly verdict: 'contract_satisfied'
  readonly scopeDigest: string
  readonly providerCompanyBindingDigest: string
  readonly contractVersion: 1
  readonly operations: readonly ['list_transactions']
  readonly pagination: {
    readonly mode: 'cursor'
    readonly minimumPageSize: 1
    readonly maximumPageSize: 500
    readonly maximumPages: 1000
    readonly cycleDetectionRequired: true
  }
  readonly canReadTransactions: true
  readonly canInvokeProvider: false
  readonly canWriteProvider: false
  readonly canExposeCredential: false
  readonly canPersistRawPayload: false
}

export interface FinanceAccountingProviderContractStagingEvidenceSample {
  readonly tenantId: string
  readonly legalEntityId: string
  readonly accountingConnectionId: string
  readonly provider: string
  readonly externalCompanyId: string
  readonly role: FinanceAccountingProviderContractEvidenceRole
  readonly entityReviewReference: string
  readonly contractReviewReference: string
  readonly pilotReviewReference?: string
  readonly observation: FinanceAccountingProviderContractObservation
}

export interface FinanceAccountingProviderContractStagingEvidenceInput {
  readonly reviewEnvironment: 'staging'
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly samples: readonly FinanceAccountingProviderContractStagingEvidenceSample[]
}

export interface FinanceAccountingProviderContractEvidenceArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_finance_accounting_provider_contract_evidence'
  readonly role: FinanceAccountingProviderContractEvidenceRole
  readonly verdict: 'eligible_for_manual_binding'
  readonly scopeDigest: string
  readonly providerCompanyBindingDigest: string
  readonly entityReviewReferenceDigest: string
  readonly contractReviewReferenceDigest: string
  readonly pilotReviewReferenceDigest: string | null
  readonly observationDigest: string
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
}

export interface FinanceAccountingProviderContractStagingEvidenceManifest {
  readonly schemaVersion: 1
  readonly kind: 'cep_finance_accounting_provider_contract_staging_evidence'
  readonly mode: 'three_entity_non_invoking_provider_contract_review'
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
    readonly reviewedContracts: 3
    readonly readOnlyContracts: 3
    readonly pilotEntities: 1
    readonly providerInvocations: 0
    readonly providerWriteOperations: 0
  }
  readonly entities: readonly FinanceAccountingProviderContractEvidenceArtifact[]
}

const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/
const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const CLIENT_KEYS = new Set(['provider', 'listTransactions'])
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
  'role',
  'entityReviewReference',
  'contractReviewReference',
  'observation',
])
const PILOT_SAMPLE_KEYS = new Set([...SAMPLE_KEYS, 'pilotReviewReference'])
const OBSERVATION_KEYS = new Set([
  'schemaVersion',
  'mode',
  'verdict',
  'scopeDigest',
  'providerCompanyBindingDigest',
  'contractVersion',
  'operations',
  'pagination',
  'canReadTransactions',
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
  'scopeDigest',
  'providerCompanyBindingDigest',
  'entityReviewReferenceDigest',
  'contractReviewReferenceDigest',
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
  'reviewedContracts',
  'readOnlyContracts',
  'pilotEntities',
  'providerInvocations',
  'providerWriteOperations',
])

/** Inspects the projected client shape and binding without invoking its reader. */
export function inspectFinanceAccountingProviderContract(
  scope: AccountingConnectionScope,
  client: AccountingReadClient
): FinanceAccountingProviderContractObservation {
  if (!client || typeof client !== 'object' || !exactKeys(client, CLIENT_KEYS)) invalidEvidence()
  try {
    assertAccountingReadBinding(scope, client)
  } catch {
    invalidEvidence()
  }
  return Object.freeze({
    schemaVersion: 1,
    mode: 'read_only_accounting_provider_contract_inspection',
    verdict: 'contract_satisfied',
    scopeDigest: createFinanceIsolationScopeDigest(scope),
    providerCompanyBindingDigest: providerCompanyDigest(scope.provider, scope.externalCompanyId),
    contractVersion: 1,
    operations: Object.freeze(['list_transactions'] as const),
    pagination: Object.freeze({
      mode: 'cursor',
      minimumPageSize: 1,
      maximumPageSize: 500,
      maximumPages: 1000,
      cycleDetectionRequired: true,
    }),
    canReadTransactions: true,
    canInvokeProvider: false,
    canWriteProvider: false,
    canExposeCredential: false,
    canPersistRawPayload: false,
  })
}

export function createFinanceAccountingProviderContractStagingEvidenceManifest(
  input: FinanceAccountingProviderContractStagingEvidenceInput
): FinanceAccountingProviderContractStagingEvidenceManifest {
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
    reviewedContracts: 3 as const,
    readOnlyContracts: 3 as const,
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

export function assertFinanceAccountingProviderContractStagingEvidenceManifest(
  value: unknown
): asserts value is FinanceAccountingProviderContractStagingEvidenceManifest {
  if (!value || typeof value !== 'object' || !exactKeys(value, MANIFEST_KEYS)) invalidEvidence()
  const manifest = value as FinanceAccountingProviderContractStagingEvidenceManifest
  if (
    manifest.schemaVersion !== 1 ||
    manifest.kind !== 'cep_finance_accounting_provider_contract_staging_evidence' ||
    manifest.mode !== 'three_entity_non_invoking_provider_contract_review' ||
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
    manifest.metrics.reviewedContracts !== 3 ||
    manifest.metrics.readOnlyContracts !== 3 ||
    manifest.metrics.pilotEntities !== 1 ||
    manifest.metrics.providerInvocations !== 0 ||
    manifest.metrics.providerWriteOperations !== 0 ||
    !Array.isArray(manifest.entities) ||
    manifest.entities.length !== 3
  ) {
    invalidEvidence()
  }
  const scopes = new Set<string>()
  const providerCompanies = new Set<string>()
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
      (previousScope && previousScope.localeCompare(entity.scopeDigest) >= 0) ||
      scopes.has(entity.scopeDigest) ||
      providerCompanies.has(entity.providerCompanyBindingDigest) ||
      observations.has(entity.observationDigest) ||
      reviews.has(entity.entityReviewReferenceDigest) ||
      reviews.has(entity.contractReviewReferenceDigest)
    ) {
      invalidEvidence()
    }
    previousScope = entity.scopeDigest
    scopes.add(entity.scopeDigest)
    providerCompanies.add(entity.providerCompanyBindingDigest)
    observations.add(entity.observationDigest)
    reviews.add(entity.entityReviewReferenceDigest)
    reviews.add(entity.contractReviewReferenceDigest)
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

export function serializeFinanceAccountingProviderContractStagingEvidenceManifest(
  input: FinanceAccountingProviderContractStagingEvidenceInput
): string {
  return JSON.stringify(createFinanceAccountingProviderContractStagingEvidenceManifest(input))
}

function validateInput(input: FinanceAccountingProviderContractStagingEvidenceInput): void {
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
  const providerCompanies = new Set<string>()
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
      !validIdentifier(sample.externalCompanyId, 255) ||
      !validReviewReference(sample.entityReviewReference) ||
      !validReviewReference(sample.contractReviewReference) ||
      sample.entityReviewReference === sample.contractReviewReference ||
      reviews.has(sample.entityReviewReference) ||
      reviews.has(sample.contractReviewReference) ||
      !validPilotShape(sample)
    ) {
      invalidEvidence()
    }
    tenantId ??= sample.tenantId
    const providerCompany = providerCompanyDigest(sample.provider, sample.externalCompanyId)
    validateObservation(sample.observation, {
      scopeDigest: createFinanceIsolationScopeDigest({
        tenantId: sample.tenantId,
        legalEntityId: sample.legalEntityId,
        connectionId: sample.accountingConnectionId,
      }),
      providerCompanyBindingDigest: providerCompany,
    })
    if (
      sample.tenantId !== tenantId ||
      entityIds.has(sample.legalEntityId) ||
      connectionIds.has(sample.accountingConnectionId) ||
      providerCompanies.has(providerCompany)
    ) {
      invalidEvidence()
    }
    reviews.add(sample.entityReviewReference)
    reviews.add(sample.contractReviewReference)
    if (sample.pilotReviewReference) {
      if (reviews.has(sample.pilotReviewReference)) invalidEvidence()
      reviews.add(sample.pilotReviewReference)
      pilots += 1
    }
    entityIds.add(sample.legalEntityId)
    connectionIds.add(sample.accountingConnectionId)
    providerCompanies.add(providerCompany)
  }
  if (pilots !== 1) invalidEvidence()
}

function validateObservation(
  observation: FinanceAccountingProviderContractObservation,
  expected: { readonly scopeDigest: string; readonly providerCompanyBindingDigest: string }
): void {
  if (
    !observation ||
    typeof observation !== 'object' ||
    !exactKeys(observation, OBSERVATION_KEYS) ||
    observation.schemaVersion !== 1 ||
    observation.mode !== 'read_only_accounting_provider_contract_inspection' ||
    observation.verdict !== 'contract_satisfied' ||
    observation.scopeDigest !== expected.scopeDigest ||
    observation.providerCompanyBindingDigest !== expected.providerCompanyBindingDigest ||
    observation.contractVersion !== 1 ||
    !Array.isArray(observation.operations) ||
    observation.operations.length !== 1 ||
    observation.operations[0] !== 'list_transactions' ||
    !observation.pagination ||
    typeof observation.pagination !== 'object' ||
    !exactKeys(observation.pagination, PAGINATION_KEYS) ||
    observation.pagination.mode !== 'cursor' ||
    observation.pagination.minimumPageSize !== 1 ||
    observation.pagination.maximumPageSize !== 500 ||
    observation.pagination.maximumPages !== 1000 ||
    observation.pagination.cycleDetectionRequired !== true ||
    observation.canReadTransactions !== true ||
    observation.canInvokeProvider !== false ||
    observation.canWriteProvider !== false ||
    observation.canExposeCredential !== false ||
    observation.canPersistRawPayload !== false
  ) {
    invalidEvidence()
  }
}

function createEntityArtifact(
  sample: FinanceAccountingProviderContractStagingEvidenceSample
): FinanceAccountingProviderContractEvidenceArtifact {
  const canonical = {
    schemaVersion: 1 as const,
    kind: 'cep_finance_accounting_provider_contract_evidence' as const,
    role: sample.role,
    verdict: 'eligible_for_manual_binding' as const,
    scopeDigest: sample.observation.scopeDigest,
    providerCompanyBindingDigest: sample.observation.providerCompanyBindingDigest,
    entityReviewReferenceDigest: digest(sample.entityReviewReference),
    contractReviewReferenceDigest: digest(sample.contractReviewReference),
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

function assertEntityArtifact(artifact: FinanceAccountingProviderContractEvidenceArtifact): void {
  if (
    !artifact ||
    typeof artifact !== 'object' ||
    !exactKeys(artifact, ENTITY_ARTIFACT_KEYS) ||
    artifact.schemaVersion !== 1 ||
    artifact.kind !== 'cep_finance_accounting_provider_contract_evidence' ||
    !['existing_entity', 'cep_sur_pilot'].includes(artifact.role) ||
    artifact.verdict !== 'eligible_for_manual_binding' ||
    !DIGEST_PATTERN.test(artifact.scopeDigest) ||
    !DIGEST_PATTERN.test(artifact.providerCompanyBindingDigest) ||
    !DIGEST_PATTERN.test(artifact.entityReviewReferenceDigest) ||
    !DIGEST_PATTERN.test(artifact.contractReviewReferenceDigest) ||
    artifact.entityReviewReferenceDigest === artifact.contractReviewReferenceDigest ||
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
    scopeDigest: artifact.scopeDigest,
    providerCompanyBindingDigest: artifact.providerCompanyBindingDigest,
    entityReviewReferenceDigest: artifact.entityReviewReferenceDigest,
    contractReviewReferenceDigest: artifact.contractReviewReferenceDigest,
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

function canonicalObservation(observation: FinanceAccountingProviderContractObservation) {
  return {
    schemaVersion: observation.schemaVersion,
    mode: observation.mode,
    verdict: observation.verdict,
    scopeDigest: observation.scopeDigest,
    providerCompanyBindingDigest: observation.providerCompanyBindingDigest,
    contractVersion: observation.contractVersion,
    operations: observation.operations,
    pagination: observation.pagination,
    canReadTransactions: observation.canReadTransactions,
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
  readonly metrics: FinanceAccountingProviderContractStagingEvidenceManifest['metrics']
  readonly entities: readonly FinanceAccountingProviderContractEvidenceArtifact[]
}) {
  return {
    schemaVersion: 1 as const,
    kind: 'cep_finance_accounting_provider_contract_staging_evidence' as const,
    mode: 'three_entity_non_invoking_provider_contract_review' as const,
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

function providerCompanyDigest(provider: string, externalCompanyId: string): string {
  return digest(JSON.stringify([provider, externalCompanyId]))
}

function validPilotShape(sample: FinanceAccountingProviderContractStagingEvidenceSample): boolean {
  return sample.role === 'cep_sur_pilot'
    ? validReviewReference(sample.pilotReviewReference) &&
        sample.pilotReviewReference !== sample.entityReviewReference &&
        sample.pilotReviewReference !== sample.contractReviewReference
    : sample.role === 'existing_entity' && sample.pilotReviewReference === undefined
}

function validBoundDigests(
  manifest: FinanceAccountingProviderContractStagingEvidenceManifest
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
  throw new Error('FINANCE_ACCOUNTING_PROVIDER_CONTRACT_STAGING_EVIDENCE_INVALID')
}
