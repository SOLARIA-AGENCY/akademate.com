import { createHash } from 'node:crypto'

import type {
  ReviewedAdvertisingSpendSourceBinding,
  ReviewedExternalRelationshipMapping,
} from './external-operational-readers'
import { createFinanceIsolationScopeDigest } from './isolation-audit'

export type FinanceAdvertisingSourceEvidenceRole = 'existing_entity' | 'cep_sur_pilot'

export interface FinanceAdvertisingSourceContractObservation {
  readonly schemaVersion: 1
  readonly mode: 'read_only_daily_advertising_source_contract_inspection'
  readonly verdict: 'contract_satisfied'
  readonly accountingScopeDigest: string
  readonly advertisingSourceScopeDigest: string
  readonly providerAccountBindingDigest: string
  readonly relationshipMappingDigest: string
  readonly hasReviewedCampaignMappings: true
  readonly dataGranularity: 'daily'
  readonly metricStates: readonly ['api_error', 'loaded', 'not_available', 'zero_real']
  readonly requiresExplicitCurrency: true
  readonly contractVersion: 1
  readonly operations: readonly ['list_daily_advertising_spend']
  readonly pagination: {
    readonly mode: 'cursor'
    readonly minimumPageSize: 1
    readonly maximumPageSize: 1000
    readonly maximumPages: 1000
    readonly cycleDetectionRequired: true
  }
  readonly canReadDailySpend: true
  readonly canInvokeProvider: false
  readonly canWriteProvider: false
  readonly canPauseCampaign: false
  readonly canExposeCredential: false
  readonly canPersistRawPayload: false
}

export interface FinanceAdvertisingSourceInspectionInput extends ReviewedAdvertisingSpendSourceBinding {
  readonly accountingConnectionId: string
}

export interface FinanceAdvertisingSourceStagingEvidenceSample {
  readonly tenantId: string
  readonly legalEntityId: string
  readonly accountingConnectionId: string
  readonly advertisingSourceConnectionId: string
  readonly provider: string
  readonly externalAccountId: string
  readonly integrationMode: 'read_only'
  readonly connectionStatus: 'active'
  readonly campaignMappings: readonly ReviewedExternalRelationshipMapping[]
  readonly role: FinanceAdvertisingSourceEvidenceRole
  readonly entityReviewReference: string
  readonly sourceReviewReference: string
  readonly pilotReviewReference?: string
  readonly observation: FinanceAdvertisingSourceContractObservation
}

export interface FinanceAdvertisingSourceStagingEvidenceInput {
  readonly reviewEnvironment: 'staging'
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly samples: readonly FinanceAdvertisingSourceStagingEvidenceSample[]
}

export interface FinanceAdvertisingSourceEvidenceArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_finance_advertising_source_review_evidence'
  readonly role: FinanceAdvertisingSourceEvidenceRole
  readonly verdict: 'eligible_for_manual_binding'
  readonly accountingScopeDigest: string
  readonly advertisingSourceScopeDigest: string
  readonly providerAccountBindingDigest: string
  readonly relationshipMappingDigest: string
  readonly entityReviewReferenceDigest: string
  readonly sourceReviewReferenceDigest: string
  readonly pilotReviewReferenceDigest: string | null
  readonly observationDigest: string
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
}

export interface FinanceAdvertisingSourceStagingEvidenceManifest {
  readonly schemaVersion: 1
  readonly kind: 'cep_finance_advertising_source_staging_evidence'
  readonly mode: 'three_entity_non_invoking_daily_advertising_source_review'
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
    readonly sourcesWithReviewedCampaignMappings: 3
    readonly dailyGranularitySources: 3
    readonly pilotEntities: 1
    readonly providerInvocations: 0
    readonly providerWriteOperations: 0
  }
  readonly entities: readonly FinanceAdvertisingSourceEvidenceArtifact[]
}

const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/
const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const MAX_RELATIONSHIPS = 100_000
const METRIC_STATES = Object.freeze(['api_error', 'loaded', 'not_available', 'zero_real'] as const)
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
  'campaignMappings',
])
const CLIENT_KEYS = new Set(['provider', 'listDailyAdvertisingSpend'])
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
  'advertisingSourceConnectionId',
  'provider',
  'externalAccountId',
  'integrationMode',
  'connectionStatus',
  'campaignMappings',
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
  'advertisingSourceScopeDigest',
  'providerAccountBindingDigest',
  'relationshipMappingDigest',
  'hasReviewedCampaignMappings',
  'dataGranularity',
  'metricStates',
  'requiresExplicitCurrency',
  'contractVersion',
  'operations',
  'pagination',
  'canReadDailySpend',
  'canInvokeProvider',
  'canWriteProvider',
  'canPauseCampaign',
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
const ENTITY_KEYS = new Set([
  'schemaVersion',
  'kind',
  'role',
  'verdict',
  'accountingScopeDigest',
  'advertisingSourceScopeDigest',
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
const METRIC_KEYS = new Set([
  'expectedEntities',
  'reviewedSources',
  'activeSources',
  'readOnlySources',
  'sourcesWithReviewedCampaignMappings',
  'dailyGranularitySources',
  'pilotEntities',
  'providerInvocations',
  'providerWriteOperations',
])

/** Inspects one reviewed advertising source without invoking its client. */
export function inspectFinanceAdvertisingSourceContract(
  source: FinanceAdvertisingSourceInspectionInput
): FinanceAdvertisingSourceContractObservation {
  validateInspectionSource(source)
  const advertisingSourceScopeDigest = createFinanceAdvertisingSourceScopeDigest({
    tenantId: source.tenantId,
    legalEntityId: source.legalEntityId,
    sourceConnectionId: source.sourceConnectionId,
  })
  return Object.freeze({
    schemaVersion: 1,
    mode: 'read_only_daily_advertising_source_contract_inspection',
    verdict: 'contract_satisfied',
    accountingScopeDigest: accountingScopeDigest(source),
    advertisingSourceScopeDigest,
    providerAccountBindingDigest: digest(
      JSON.stringify([source.provider, source.externalAccountId])
    ),
    relationshipMappingDigest: relationshipDigest(
      advertisingSourceScopeDigest,
      source.campaignMappings
    ),
    hasReviewedCampaignMappings: true,
    dataGranularity: 'daily',
    metricStates: METRIC_STATES,
    requiresExplicitCurrency: true,
    contractVersion: 1,
    operations: Object.freeze(['list_daily_advertising_spend'] as const),
    pagination: Object.freeze({
      mode: 'cursor',
      minimumPageSize: 1,
      maximumPageSize: 1000,
      maximumPages: 1000,
      cycleDetectionRequired: true,
    }),
    canReadDailySpend: true,
    canInvokeProvider: false,
    canWriteProvider: false,
    canPauseCampaign: false,
    canExposeCredential: false,
    canPersistRawPayload: false,
  })
}

export function createFinanceAdvertisingSourceScopeDigest(input: {
  readonly tenantId: string
  readonly legalEntityId: string
  readonly sourceConnectionId: string
}): string {
  return digest(
    JSON.stringify([
      'finance_advertising_source_scope_v1',
      input.tenantId,
      input.legalEntityId,
      input.sourceConnectionId,
    ])
  )
}

export function createFinanceAdvertisingSourceStagingEvidenceManifest(
  input: FinanceAdvertisingSourceStagingEvidenceInput
): FinanceAdvertisingSourceStagingEvidenceManifest {
  validateInput(input)
  const entities = Object.freeze(
    input.samples
      .map(createEntityArtifact)
      .sort((a, b) => a.advertisingSourceScopeDigest.localeCompare(b.advertisingSourceScopeDigest))
  )
  const metrics = Object.freeze({
    expectedEntities: 3 as const,
    reviewedSources: 3 as const,
    activeSources: 3 as const,
    readOnlySources: 3 as const,
    sourcesWithReviewedCampaignMappings: 3 as const,
    dailyGranularitySources: 3 as const,
    pilotEntities: 1 as const,
    providerInvocations: 0 as const,
    providerWriteOperations: 0 as const,
  })
  const canonical = canonicalManifest({
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: digest(input.campaignReviewReference),
    readinessReviewReferenceDigest: digest(input.readinessReviewReference),
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

export function assertFinanceAdvertisingSourceStagingEvidenceManifest(
  value: unknown
): asserts value is FinanceAdvertisingSourceStagingEvidenceManifest {
  if (!value || typeof value !== 'object' || !exactKeys(value, MANIFEST_KEYS)) invalid()
  const manifest = value as FinanceAdvertisingSourceStagingEvidenceManifest
  if (
    manifest.schemaVersion !== 1 ||
    manifest.kind !== 'cep_finance_advertising_source_staging_evidence' ||
    manifest.mode !== 'three_entity_non_invoking_daily_advertising_source_review' ||
    manifest.verdict !== 'eligible_for_manual_staging_binding' ||
    manifest.canInvokeProvider !== false ||
    manifest.canResolveSecret !== false ||
    manifest.canBindAutomatically !== false ||
    manifest.canMarkVerified !== false ||
    manifest.canDeploy !== false ||
    manifest.canActivate !== false ||
    manifest.canChangePermissions !== false ||
    !validManifestDigests(manifest) ||
    !manifest.metrics ||
    typeof manifest.metrics !== 'object' ||
    !exactKeys(manifest.metrics, METRIC_KEYS) ||
    manifest.metrics.expectedEntities !== 3 ||
    manifest.metrics.reviewedSources !== 3 ||
    manifest.metrics.activeSources !== 3 ||
    manifest.metrics.readOnlySources !== 3 ||
    manifest.metrics.sourcesWithReviewedCampaignMappings !== 3 ||
    manifest.metrics.dailyGranularitySources !== 3 ||
    manifest.metrics.pilotEntities !== 1 ||
    manifest.metrics.providerInvocations !== 0 ||
    manifest.metrics.providerWriteOperations !== 0 ||
    !Array.isArray(manifest.entities) ||
    manifest.entities.length !== 3
  ) {
    invalid()
  }
  const accountingScopes = new Set<string>()
  const sourceScopes = new Set<string>()
  const accounts = new Set<string>()
  const mappings = new Set<string>()
  const observations = new Set<string>()
  const reviews = new Set([
    manifest.campaignReviewReferenceDigest,
    manifest.readinessReviewReferenceDigest,
  ])
  let previous = ''
  let pilots = 0
  for (const entity of manifest.entities) {
    assertEntity(entity)
    if (
      (previous && previous.localeCompare(entity.advertisingSourceScopeDigest) >= 0) ||
      accountingScopes.has(entity.accountingScopeDigest) ||
      sourceScopes.has(entity.advertisingSourceScopeDigest) ||
      accounts.has(entity.providerAccountBindingDigest) ||
      mappings.has(entity.relationshipMappingDigest) ||
      observations.has(entity.observationDigest) ||
      reviews.has(entity.entityReviewReferenceDigest) ||
      reviews.has(entity.sourceReviewReferenceDigest)
    ) {
      invalid()
    }
    previous = entity.advertisingSourceScopeDigest
    accountingScopes.add(entity.accountingScopeDigest)
    sourceScopes.add(entity.advertisingSourceScopeDigest)
    accounts.add(entity.providerAccountBindingDigest)
    mappings.add(entity.relationshipMappingDigest)
    observations.add(entity.observationDigest)
    reviews.add(entity.entityReviewReferenceDigest)
    reviews.add(entity.sourceReviewReferenceDigest)
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

export function serializeFinanceAdvertisingSourceStagingEvidenceManifest(
  input: FinanceAdvertisingSourceStagingEvidenceInput
): string {
  return JSON.stringify(createFinanceAdvertisingSourceStagingEvidenceManifest(input))
}

function validateInspectionSource(source: FinanceAdvertisingSourceInspectionInput): void {
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
    !validReview(source.reviewReference) ||
    !source.client ||
    typeof source.client !== 'object' ||
    !exactKeys(source.client, CLIENT_KEYS) ||
    source.client.provider !== source.provider ||
    typeof source.client.listDailyAdvertisingSpend !== 'function'
  ) {
    invalid()
  }
  validateRelationships(source.campaignMappings)
}

function validateInput(input: FinanceAdvertisingSourceStagingEvidenceInput): void {
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
  const entities = new Set<string>()
  const accountingConnections = new Set<string>()
  const advertisingConnections = new Set<string>()
  const accounts = new Set<string>()
  const reviews = new Set([input.campaignReviewReference, input.readinessReviewReference])
  let tenant: string | null = null
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
      !validIdentifier(sample.advertisingSourceConnectionId, 500) ||
      !validIdentifier(sample.provider, 100) ||
      !validIdentifier(sample.externalAccountId, 500) ||
      sample.integrationMode !== 'read_only' ||
      sample.connectionStatus !== 'active' ||
      !validReview(sample.entityReviewReference) ||
      !validReview(sample.sourceReviewReference) ||
      sample.entityReviewReference === sample.sourceReviewReference ||
      reviews.has(sample.entityReviewReference) ||
      reviews.has(sample.sourceReviewReference) ||
      !validPilot(sample)
    ) {
      invalid()
    }
    tenant ??= sample.tenantId
    validateRelationships(sample.campaignMappings)
    const sourceScope = createFinanceAdvertisingSourceScopeDigest({
      tenantId: sample.tenantId,
      legalEntityId: sample.legalEntityId,
      sourceConnectionId: sample.advertisingSourceConnectionId,
    })
    const account = digest(JSON.stringify([sample.provider, sample.externalAccountId]))
    validateObservation(sample.observation, {
      accountingScopeDigest: createFinanceIsolationScopeDigest({
        tenantId: sample.tenantId,
        legalEntityId: sample.legalEntityId,
        connectionId: sample.accountingConnectionId,
      }),
      advertisingSourceScopeDigest: sourceScope,
      providerAccountBindingDigest: account,
      relationshipMappingDigest: relationshipDigest(sourceScope, sample.campaignMappings),
    })
    if (
      sample.tenantId !== tenant ||
      entities.has(sample.legalEntityId) ||
      accountingConnections.has(sample.accountingConnectionId) ||
      advertisingConnections.has(sample.advertisingSourceConnectionId) ||
      accounts.has(account)
    ) {
      invalid()
    }
    entities.add(sample.legalEntityId)
    accountingConnections.add(sample.accountingConnectionId)
    advertisingConnections.add(sample.advertisingSourceConnectionId)
    accounts.add(account)
    reviews.add(sample.entityReviewReference)
    reviews.add(sample.sourceReviewReference)
    if (sample.pilotReviewReference) {
      if (reviews.has(sample.pilotReviewReference)) invalid()
      reviews.add(sample.pilotReviewReference)
      pilots += 1
    }
  }
  if (pilots !== 1) invalid()
}

function validateObservation(
  value: FinanceAdvertisingSourceContractObservation,
  expected: Pick<
    FinanceAdvertisingSourceContractObservation,
    | 'accountingScopeDigest'
    | 'advertisingSourceScopeDigest'
    | 'providerAccountBindingDigest'
    | 'relationshipMappingDigest'
  >
): void {
  if (
    !value ||
    typeof value !== 'object' ||
    !exactKeys(value, OBSERVATION_KEYS) ||
    value.schemaVersion !== 1 ||
    value.mode !== 'read_only_daily_advertising_source_contract_inspection' ||
    value.verdict !== 'contract_satisfied' ||
    value.accountingScopeDigest !== expected.accountingScopeDigest ||
    value.advertisingSourceScopeDigest !== expected.advertisingSourceScopeDigest ||
    value.providerAccountBindingDigest !== expected.providerAccountBindingDigest ||
    value.relationshipMappingDigest !== expected.relationshipMappingDigest ||
    value.hasReviewedCampaignMappings !== true ||
    value.dataGranularity !== 'daily' ||
    JSON.stringify(value.metricStates) !== JSON.stringify(METRIC_STATES) ||
    value.requiresExplicitCurrency !== true ||
    value.contractVersion !== 1 ||
    JSON.stringify(value.operations) !== JSON.stringify(['list_daily_advertising_spend']) ||
    !value.pagination ||
    typeof value.pagination !== 'object' ||
    !exactKeys(value.pagination, PAGINATION_KEYS) ||
    value.pagination.mode !== 'cursor' ||
    value.pagination.minimumPageSize !== 1 ||
    value.pagination.maximumPageSize !== 1000 ||
    value.pagination.maximumPages !== 1000 ||
    value.pagination.cycleDetectionRequired !== true ||
    value.canReadDailySpend !== true ||
    value.canInvokeProvider !== false ||
    value.canWriteProvider !== false ||
    value.canPauseCampaign !== false ||
    value.canExposeCredential !== false ||
    value.canPersistRawPayload !== false
  ) {
    invalid()
  }
}

function createEntityArtifact(
  sample: FinanceAdvertisingSourceStagingEvidenceSample
): FinanceAdvertisingSourceEvidenceArtifact {
  const canonical = {
    schemaVersion: 1 as const,
    kind: 'cep_finance_advertising_source_review_evidence' as const,
    role: sample.role,
    verdict: 'eligible_for_manual_binding' as const,
    accountingScopeDigest: sample.observation.accountingScopeDigest,
    advertisingSourceScopeDigest: sample.observation.advertisingSourceScopeDigest,
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

function assertEntity(entity: FinanceAdvertisingSourceEvidenceArtifact): void {
  if (
    !entity ||
    typeof entity !== 'object' ||
    !exactKeys(entity, ENTITY_KEYS) ||
    entity.schemaVersion !== 1 ||
    entity.kind !== 'cep_finance_advertising_source_review_evidence' ||
    !['existing_entity', 'cep_sur_pilot'].includes(entity.role) ||
    entity.verdict !== 'eligible_for_manual_binding' ||
    ![
      entity.accountingScopeDigest,
      entity.advertisingSourceScopeDigest,
      entity.providerAccountBindingDigest,
      entity.relationshipMappingDigest,
      entity.entityReviewReferenceDigest,
      entity.sourceReviewReferenceDigest,
      entity.observationDigest,
      entity.artifactDigest,
    ].every((value) => DIGEST_PATTERN.test(value)) ||
    entity.entityReviewReferenceDigest === entity.sourceReviewReferenceDigest ||
    (entity.role === 'cep_sur_pilot') !== (typeof entity.pilotReviewReferenceDigest === 'string') ||
    (entity.pilotReviewReferenceDigest !== null &&
      !DIGEST_PATTERN.test(entity.pilotReviewReferenceDigest))
  ) {
    invalid()
  }
  const canonical = {
    schemaVersion: entity.schemaVersion,
    kind: entity.kind,
    role: entity.role,
    verdict: entity.verdict,
    accountingScopeDigest: entity.accountingScopeDigest,
    advertisingSourceScopeDigest: entity.advertisingSourceScopeDigest,
    providerAccountBindingDigest: entity.providerAccountBindingDigest,
    relationshipMappingDigest: entity.relationshipMappingDigest,
    entityReviewReferenceDigest: entity.entityReviewReferenceDigest,
    sourceReviewReferenceDigest: entity.sourceReviewReferenceDigest,
    pilotReviewReferenceDigest: entity.pilotReviewReferenceDigest,
    observationDigest: entity.observationDigest,
  }
  if (
    entity.artifactDigest !== digest(JSON.stringify(canonical)) ||
    entity.evidenceReference !== evidenceReference(entity.artifactDigest)
  ) {
    invalid()
  }
}

function validateRelationships(values: readonly ReviewedExternalRelationshipMapping[]): void {
  if (!Array.isArray(values) || values.length < 1 || values.length > MAX_RELATIONSHIPS) invalid()
  const external = new Set<string>()
  const local = new Set<string>()
  for (const value of values) {
    const localKey = localRelationshipKey(value?.localId)
    if (
      !value ||
      typeof value !== 'object' ||
      !exactKeys(value, MAPPING_KEYS) ||
      !validIdentifier(value.externalId, 500) ||
      localKey === null ||
      external.has(value.externalId) ||
      local.has(localKey)
    ) {
      invalid()
    }
    external.add(value.externalId)
    local.add(localKey)
  }
}

function relationshipDigest(
  sourceScopeDigest: string,
  values: readonly ReviewedExternalRelationshipMapping[]
): string {
  const canonical = values
    .map((value) => [value.externalId, typeof value.localId, String(value.localId)])
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
  return digest(JSON.stringify([sourceScopeDigest, canonical]))
}

function localRelationshipKey(value: unknown): string | null {
  if (typeof value === 'string' && validIdentifier(value, 500)) return `string:${value}`
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
    ? `number:${value}`
    : null
}

function validPilot(sample: FinanceAdvertisingSourceStagingEvidenceSample): boolean {
  return sample.role === 'cep_sur_pilot'
    ? validReview(sample.pilotReviewReference) &&
        sample.pilotReviewReference !== sample.entityReviewReference &&
        sample.pilotReviewReference !== sample.sourceReviewReference
    : sample.role === 'existing_entity' && sample.pilotReviewReference === undefined
}

function accountingScopeDigest(source: FinanceAdvertisingSourceInspectionInput): string {
  return createFinanceIsolationScopeDigest({
    tenantId: source.tenantId,
    legalEntityId: source.legalEntityId,
    connectionId: source.accountingConnectionId,
  })
}

function canonicalObservation(value: FinanceAdvertisingSourceContractObservation) {
  return {
    schemaVersion: value.schemaVersion,
    mode: value.mode,
    verdict: value.verdict,
    accountingScopeDigest: value.accountingScopeDigest,
    advertisingSourceScopeDigest: value.advertisingSourceScopeDigest,
    providerAccountBindingDigest: value.providerAccountBindingDigest,
    relationshipMappingDigest: value.relationshipMappingDigest,
    hasReviewedCampaignMappings: value.hasReviewedCampaignMappings,
    dataGranularity: value.dataGranularity,
    metricStates: value.metricStates,
    requiresExplicitCurrency: value.requiresExplicitCurrency,
    contractVersion: value.contractVersion,
    operations: value.operations,
    pagination: value.pagination,
    canReadDailySpend: value.canReadDailySpend,
    canInvokeProvider: value.canInvokeProvider,
    canWriteProvider: value.canWriteProvider,
    canPauseCampaign: value.canPauseCampaign,
    canExposeCredential: value.canExposeCredential,
    canPersistRawPayload: value.canPersistRawPayload,
  }
}

function canonicalManifest(input: {
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly metrics: FinanceAdvertisingSourceStagingEvidenceManifest['metrics']
  readonly entities: readonly FinanceAdvertisingSourceEvidenceArtifact[]
}) {
  return {
    schemaVersion: 1 as const,
    kind: 'cep_finance_advertising_source_staging_evidence' as const,
    mode: 'three_entity_non_invoking_daily_advertising_source_review' as const,
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

function validManifestDigests(value: FinanceAdvertisingSourceStagingEvidenceManifest): boolean {
  return (
    [
      value.sourceDigest,
      value.targetTenantDigest,
      value.campaignReviewReferenceDigest,
      value.readinessReviewReferenceDigest,
      value.artifactDigest,
    ].every((item) => DIGEST_PATTERN.test(item)) &&
    value.sourceDigest !== value.targetTenantDigest &&
    value.campaignReviewReferenceDigest !== value.readinessReviewReferenceDigest &&
    typeof value.evidenceReference === 'string'
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

function validReview(value: unknown): value is string {
  return typeof value === 'string' && REVIEW_REFERENCE_PATTERN.test(value)
}

function digest(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function evidenceReference(value: string): `evidence://sha256/${string}` {
  return `evidence://sha256/${value.slice('sha256:'.length)}`
}

function invalid(): never {
  throw new Error('FINANCE_ADVERTISING_SOURCE_STAGING_EVIDENCE_INVALID')
}
