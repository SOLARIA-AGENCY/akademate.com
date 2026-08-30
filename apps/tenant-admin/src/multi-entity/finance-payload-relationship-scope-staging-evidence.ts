import { createHash } from 'node:crypto'

import {
  inspectFinanceAdvertisingSourceContract,
  inspectFinancePaymentSourceContract,
  type FinanceAdvertisingSourceEvidenceArtifact,
  type FinanceAdvertisingSourceInspectionInput,
  type FinancePaymentSourceEvidenceArtifact,
  type FinancePaymentSourceInspectionInput,
} from '../../../../packages/finance/src'
import type { ReviewedPayloadFinanceEntityPlan } from './finance-payload-relationship-readers'

export type FinancePayloadRelationshipScopeEvidenceRole = 'existing_entity' | 'cep_sur_pilot'

export interface FinancePayloadRelationshipScopeStagingEvidenceSample {
  readonly accountingConnectionId: string
  readonly payloadPlan: ReviewedPayloadFinanceEntityPlan
  readonly paymentSource: FinancePaymentSourceInspectionInput
  readonly paymentSourceArtifact: FinancePaymentSourceEvidenceArtifact
  readonly advertisingSource: FinanceAdvertisingSourceInspectionInput
  readonly advertisingSourceArtifact: FinanceAdvertisingSourceEvidenceArtifact
  readonly role: FinancePayloadRelationshipScopeEvidenceRole
  readonly entityReviewReference: string
  readonly pilotReviewReference?: string
}

export interface FinancePayloadRelationshipScopeStagingEvidenceInput {
  readonly reviewEnvironment: 'staging'
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly samples: readonly FinancePayloadRelationshipScopeStagingEvidenceSample[]
}

export interface FinancePayloadRelationshipScopeEvidenceArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_finance_payload_relationship_scope_review_evidence'
  readonly role: FinancePayloadRelationshipScopeEvidenceRole
  readonly verdict: 'eligible_for_manual_binding'
  readonly accountingScopeDigest: string
  readonly payloadScopeDigest: string
  readonly payloadPlanDigest: string
  readonly enrollmentCoverageDigest: string
  readonly campaignCoverageDigest: string
  readonly paymentSourceScopeDigest: string
  readonly paymentRelationshipMappingDigest: string
  readonly advertisingSourceScopeDigest: string
  readonly advertisingRelationshipMappingDigest: string
  readonly entityReviewReferenceDigest: string
  readonly payloadPlanReviewReferenceDigest: string
  readonly pilotReviewReferenceDigest: string | null
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
}

export interface FinancePayloadRelationshipScopeStagingEvidenceManifest {
  readonly schemaVersion: 1
  readonly kind: 'cep_finance_payload_relationship_scope_staging_evidence'
  readonly mode: 'three_entity_cross_source_payload_relationship_review'
  readonly verdict: 'eligible_for_manual_staging_binding'
  readonly canReadPayload: false
  readonly canInvokeProvider: false
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canDeploy: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly canUsePlatformSuperadmin: false
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
  readonly metrics: {
    readonly expectedEntities: 3
    readonly reviewedPayloadPlans: 3
    readonly exactEnrollmentCoverages: 3
    readonly exactCampaignCoverages: 3
    readonly linkedPaymentSources: 3
    readonly linkedAdvertisingSources: 3
    readonly pilotEntities: 1
    readonly payloadReads: 0
    readonly providerInvocations: 0
  }
  readonly entities: readonly FinancePayloadRelationshipScopeEvidenceArtifact[]
}

const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/
const REVIEW_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const PAYLOAD_TENANT_PATTERN = /^[1-9]\d*$/
const INPUT_KEYS = new Set([
  'reviewEnvironment',
  'campaignReviewReference',
  'readinessReviewReference',
  'sourceDigest',
  'targetTenantDigest',
  'samples',
])
const SAMPLE_KEYS = new Set([
  'accountingConnectionId',
  'payloadPlan',
  'paymentSource',
  'paymentSourceArtifact',
  'advertisingSource',
  'advertisingSourceArtifact',
  'role',
  'entityReviewReference',
])
const PILOT_SAMPLE_KEYS = new Set([...SAMPLE_KEYS, 'pilotReviewReference'])
const PLAN_KEYS = new Set([
  'tenantId',
  'legalEntityId',
  'payloadTenantId',
  'reviewReference',
  'enrollmentIds',
  'courseRunIds',
  'campaignIds',
])
const ENTITY_KEYS = new Set([
  'schemaVersion',
  'kind',
  'role',
  'verdict',
  'accountingScopeDigest',
  'payloadScopeDigest',
  'payloadPlanDigest',
  'enrollmentCoverageDigest',
  'campaignCoverageDigest',
  'paymentSourceScopeDigest',
  'paymentRelationshipMappingDigest',
  'advertisingSourceScopeDigest',
  'advertisingRelationshipMappingDigest',
  'entityReviewReferenceDigest',
  'payloadPlanReviewReferenceDigest',
  'pilotReviewReferenceDigest',
  'artifactDigest',
  'evidenceReference',
])
const MANIFEST_KEYS = new Set([
  'schemaVersion',
  'kind',
  'mode',
  'verdict',
  'canReadPayload',
  'canInvokeProvider',
  'canBindAutomatically',
  'canMarkVerified',
  'canDeploy',
  'canActivate',
  'canChangePermissions',
  'canUsePlatformSuperadmin',
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
  'reviewedPayloadPlans',
  'exactEnrollmentCoverages',
  'exactCampaignCoverages',
  'linkedPaymentSources',
  'linkedAdvertisingSources',
  'pilotEntities',
  'payloadReads',
  'providerInvocations',
])
const MAX_IDS = 100_000

/** Seals exact local relationship coverage without reading Payload or providers. */
export function createFinancePayloadRelationshipScopeStagingEvidenceManifest(
  input: FinancePayloadRelationshipScopeStagingEvidenceInput
): FinancePayloadRelationshipScopeStagingEvidenceManifest {
  validateInput(input)
  const entities = Object.freeze(
    input.samples
      .map(createEntityArtifact)
      .sort((left, right) => left.payloadScopeDigest.localeCompare(right.payloadScopeDigest))
  )
  const metrics = Object.freeze({
    expectedEntities: 3 as const,
    reviewedPayloadPlans: 3 as const,
    exactEnrollmentCoverages: 3 as const,
    exactCampaignCoverages: 3 as const,
    linkedPaymentSources: 3 as const,
    linkedAdvertisingSources: 3 as const,
    pilotEntities: 1 as const,
    payloadReads: 0 as const,
    providerInvocations: 0 as const,
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

export function assertFinancePayloadRelationshipScopeStagingEvidenceManifest(
  value: unknown
): asserts value is FinancePayloadRelationshipScopeStagingEvidenceManifest {
  if (!value || typeof value !== 'object' || !exactKeys(value, MANIFEST_KEYS)) invalid()
  const manifest = value as FinancePayloadRelationshipScopeStagingEvidenceManifest
  if (
    manifest.schemaVersion !== 1 ||
    manifest.kind !== 'cep_finance_payload_relationship_scope_staging_evidence' ||
    manifest.mode !== 'three_entity_cross_source_payload_relationship_review' ||
    manifest.verdict !== 'eligible_for_manual_staging_binding' ||
    manifest.canReadPayload !== false ||
    manifest.canInvokeProvider !== false ||
    manifest.canBindAutomatically !== false ||
    manifest.canMarkVerified !== false ||
    manifest.canDeploy !== false ||
    manifest.canActivate !== false ||
    manifest.canChangePermissions !== false ||
    manifest.canUsePlatformSuperadmin !== false ||
    !validManifestDigests(manifest) ||
    !manifest.metrics ||
    typeof manifest.metrics !== 'object' ||
    !exactKeys(manifest.metrics, METRIC_KEYS) ||
    manifest.metrics.expectedEntities !== 3 ||
    manifest.metrics.reviewedPayloadPlans !== 3 ||
    manifest.metrics.exactEnrollmentCoverages !== 3 ||
    manifest.metrics.exactCampaignCoverages !== 3 ||
    manifest.metrics.linkedPaymentSources !== 3 ||
    manifest.metrics.linkedAdvertisingSources !== 3 ||
    manifest.metrics.pilotEntities !== 1 ||
    manifest.metrics.payloadReads !== 0 ||
    manifest.metrics.providerInvocations !== 0 ||
    !Array.isArray(manifest.entities) ||
    manifest.entities.length !== 3
  ) {
    invalid()
  }
  const uniqueFields: Array<keyof FinancePayloadRelationshipScopeEvidenceArtifact> = [
    'accountingScopeDigest',
    'payloadScopeDigest',
    'payloadPlanDigest',
    'enrollmentCoverageDigest',
    'campaignCoverageDigest',
    'paymentSourceScopeDigest',
    'paymentRelationshipMappingDigest',
    'advertisingSourceScopeDigest',
    'advertisingRelationshipMappingDigest',
    'entityReviewReferenceDigest',
    'payloadPlanReviewReferenceDigest',
  ]
  const seen = new Map(uniqueFields.map((field) => [field, new Set<string>()]))
  const reviews = new Set([
    manifest.campaignReviewReferenceDigest,
    manifest.readinessReviewReferenceDigest,
  ])
  let previous = ''
  let pilots = 0
  for (const entity of manifest.entities) {
    assertEntity(entity)
    if (previous && previous.localeCompare(entity.payloadScopeDigest) >= 0) invalid()
    previous = entity.payloadScopeDigest
    for (const field of uniqueFields) {
      const value = entity[field] as string
      if (seen.get(field)!.has(value)) invalid()
      seen.get(field)!.add(value)
    }
    if (
      reviews.has(entity.entityReviewReferenceDigest) ||
      reviews.has(entity.payloadPlanReviewReferenceDigest)
    ) {
      invalid()
    }
    reviews.add(entity.entityReviewReferenceDigest)
    reviews.add(entity.payloadPlanReviewReferenceDigest)
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

export function serializeFinancePayloadRelationshipScopeStagingEvidenceManifest(
  input: FinancePayloadRelationshipScopeStagingEvidenceInput
): string {
  return JSON.stringify(createFinancePayloadRelationshipScopeStagingEvidenceManifest(input))
}

function validateInput(input: FinancePayloadRelationshipScopeStagingEvidenceInput): void {
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
  const legalEntities = new Set<string>()
  const accountingConnections = new Set<string>()
  const payloadPlans = new Set<string>()
  const enrollmentOwners = new Set<number>()
  const courseRunOwners = new Set<number>()
  const campaignOwners = new Set<number>()
  const reviews = new Set([input.campaignReviewReference, input.readinessReviewReference])
  let tenantId: string | null = null
  let payloadTenantId: string | null = null
  let pilots = 0
  for (const sample of input.samples) {
    const expectedKeys = sample?.role === 'cep_sur_pilot' ? PILOT_SAMPLE_KEYS : SAMPLE_KEYS
    if (
      !sample ||
      typeof sample !== 'object' ||
      !exactKeys(sample, expectedKeys) ||
      !validIdentifier(sample.accountingConnectionId, 500) ||
      !validReview(sample.entityReviewReference) ||
      reviews.has(sample.entityReviewReference) ||
      !validPilot(sample)
    ) {
      invalid()
    }
    const plan = validatePlan(sample.payloadPlan)
    const payment = inspectFinancePaymentSourceContract(sample.paymentSource)
    const advertising = inspectFinanceAdvertisingSourceContract(sample.advertisingSource)
    validateSourceLinks(sample, plan, payment, advertising)
    tenantId ??= plan.tenantId
    payloadTenantId ??= plan.payloadTenantId
    const planKey = digest(JSON.stringify(canonicalPlan(plan)))
    if (
      plan.tenantId !== tenantId ||
      plan.payloadTenantId !== payloadTenantId ||
      legalEntities.has(plan.legalEntityId) ||
      accountingConnections.has(sample.accountingConnectionId) ||
      payloadPlans.has(planKey)
    ) {
      invalid()
    }
    claimIds(enrollmentOwners, plan.enrollmentIds)
    claimIds(courseRunOwners, plan.courseRunIds)
    claimIds(campaignOwners, plan.campaignIds)
    legalEntities.add(plan.legalEntityId)
    accountingConnections.add(sample.accountingConnectionId)
    payloadPlans.add(planKey)
    reviews.add(sample.entityReviewReference)
    if (reviews.has(plan.reviewReference)) invalid()
    reviews.add(plan.reviewReference)
    if (sample.pilotReviewReference) {
      if (reviews.has(sample.pilotReviewReference)) invalid()
      reviews.add(sample.pilotReviewReference)
      pilots += 1
    }
  }
  if (pilots !== 1) invalid()
}

function validateSourceLinks(
  sample: FinancePayloadRelationshipScopeStagingEvidenceSample,
  plan: ReviewedPayloadFinanceEntityPlan,
  payment: ReturnType<typeof inspectFinancePaymentSourceContract>,
  advertising: ReturnType<typeof inspectFinanceAdvertisingSourceContract>
): void {
  const entityReviewDigest = digest(sample.entityReviewReference)
  if (
    sample.paymentSource.tenantId !== plan.tenantId ||
    sample.paymentSource.legalEntityId !== plan.legalEntityId ||
    sample.paymentSource.accountingConnectionId !== sample.accountingConnectionId ||
    sample.advertisingSource.tenantId !== plan.tenantId ||
    sample.advertisingSource.legalEntityId !== plan.legalEntityId ||
    sample.advertisingSource.accountingConnectionId !== sample.accountingConnectionId ||
    payment.accountingScopeDigest !== advertising.accountingScopeDigest ||
    sample.paymentSourceArtifact.role !== sample.role ||
    sample.advertisingSourceArtifact.role !== sample.role ||
    sample.paymentSourceArtifact.entityReviewReferenceDigest !== entityReviewDigest ||
    sample.advertisingSourceArtifact.entityReviewReferenceDigest !== entityReviewDigest ||
    sample.paymentSourceArtifact.sourceReviewReferenceDigest !==
      digest(sample.paymentSource.reviewReference) ||
    sample.advertisingSourceArtifact.sourceReviewReferenceDigest !==
      digest(sample.advertisingSource.reviewReference) ||
    sample.paymentSourceArtifact.accountingScopeDigest !== payment.accountingScopeDigest ||
    sample.paymentSourceArtifact.paymentSourceScopeDigest !== payment.paymentSourceScopeDigest ||
    sample.paymentSourceArtifact.relationshipMappingDigest !== payment.relationshipMappingDigest ||
    sample.advertisingSourceArtifact.accountingScopeDigest !== advertising.accountingScopeDigest ||
    sample.advertisingSourceArtifact.advertisingSourceScopeDigest !==
      advertising.advertisingSourceScopeDigest ||
    sample.advertisingSourceArtifact.relationshipMappingDigest !==
      advertising.relationshipMappingDigest ||
    !sameIds(mappingLocalIds(sample.paymentSource.enrollmentMappings), plan.enrollmentIds) ||
    !sameIds(mappingLocalIds(sample.advertisingSource.campaignMappings), plan.campaignIds)
  ) {
    invalid()
  }
}

function validatePlan(plan: ReviewedPayloadFinanceEntityPlan): ReviewedPayloadFinanceEntityPlan {
  if (
    !plan ||
    typeof plan !== 'object' ||
    !exactKeys(plan, PLAN_KEYS) ||
    !validIdentifier(plan.tenantId, 500) ||
    !validIdentifier(plan.legalEntityId, 500) ||
    typeof plan.payloadTenantId !== 'string' ||
    !PAYLOAD_TENANT_PATTERN.test(plan.payloadTenantId) ||
    !validReview(plan.reviewReference) ||
    !validIdList(plan.enrollmentIds) ||
    !validIdList(plan.courseRunIds) ||
    !validIdList(plan.campaignIds) ||
    (plan.enrollmentIds.length > 0 && plan.courseRunIds.length === 0)
  ) {
    invalid()
  }
  return plan
}

function createEntityArtifact(
  sample: FinancePayloadRelationshipScopeStagingEvidenceSample
): FinancePayloadRelationshipScopeEvidenceArtifact {
  const plan = sample.payloadPlan
  const payment = inspectFinancePaymentSourceContract(sample.paymentSource)
  const advertising = inspectFinanceAdvertisingSourceContract(sample.advertisingSource)
  const canonical = {
    schemaVersion: 1 as const,
    kind: 'cep_finance_payload_relationship_scope_review_evidence' as const,
    role: sample.role,
    verdict: 'eligible_for_manual_binding' as const,
    accountingScopeDigest: payment.accountingScopeDigest,
    payloadScopeDigest: digest(
      JSON.stringify([
        'finance_payload_scope_v1',
        plan.tenantId,
        plan.legalEntityId,
        plan.payloadTenantId,
      ])
    ),
    payloadPlanDigest: digest(JSON.stringify(canonicalPlan(plan))),
    enrollmentCoverageDigest: idsDigest('enrollment', plan.enrollmentIds),
    campaignCoverageDigest: idsDigest('campaign', plan.campaignIds),
    paymentSourceScopeDigest: payment.paymentSourceScopeDigest,
    paymentRelationshipMappingDigest: payment.relationshipMappingDigest,
    advertisingSourceScopeDigest: advertising.advertisingSourceScopeDigest,
    advertisingRelationshipMappingDigest: advertising.relationshipMappingDigest,
    entityReviewReferenceDigest: digest(sample.entityReviewReference),
    payloadPlanReviewReferenceDigest: digest(plan.reviewReference),
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

function assertEntity(entity: FinancePayloadRelationshipScopeEvidenceArtifact): void {
  if (
    !entity ||
    typeof entity !== 'object' ||
    !exactKeys(entity, ENTITY_KEYS) ||
    entity.schemaVersion !== 1 ||
    entity.kind !== 'cep_finance_payload_relationship_scope_review_evidence' ||
    !['existing_entity', 'cep_sur_pilot'].includes(entity.role) ||
    entity.verdict !== 'eligible_for_manual_binding' ||
    !Object.entries(entity)
      .filter(([key]) => key.endsWith('Digest'))
      .every(
        ([, value]) => value === null || (typeof value === 'string' && DIGEST_PATTERN.test(value))
      ) ||
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
    payloadScopeDigest: entity.payloadScopeDigest,
    payloadPlanDigest: entity.payloadPlanDigest,
    enrollmentCoverageDigest: entity.enrollmentCoverageDigest,
    campaignCoverageDigest: entity.campaignCoverageDigest,
    paymentSourceScopeDigest: entity.paymentSourceScopeDigest,
    paymentRelationshipMappingDigest: entity.paymentRelationshipMappingDigest,
    advertisingSourceScopeDigest: entity.advertisingSourceScopeDigest,
    advertisingRelationshipMappingDigest: entity.advertisingRelationshipMappingDigest,
    entityReviewReferenceDigest: entity.entityReviewReferenceDigest,
    payloadPlanReviewReferenceDigest: entity.payloadPlanReviewReferenceDigest,
    pilotReviewReferenceDigest: entity.pilotReviewReferenceDigest,
  }
  if (
    entity.artifactDigest !== digest(JSON.stringify(canonical)) ||
    entity.evidenceReference !== evidenceReference(entity.artifactDigest)
  ) {
    invalid()
  }
}

function canonicalPlan(plan: ReviewedPayloadFinanceEntityPlan) {
  return {
    schemaVersion: 1,
    tenantIdDigest: digest(plan.tenantId),
    legalEntityIdDigest: digest(plan.legalEntityId),
    payloadTenantIdDigest: digest(plan.payloadTenantId),
    reviewReferenceDigest: digest(plan.reviewReference),
    enrollmentIdsDigest: idsDigest('enrollment', plan.enrollmentIds),
    courseRunIdsDigest: idsDigest('course_run', plan.courseRunIds),
    campaignIdsDigest: idsDigest('campaign', plan.campaignIds),
  }
}

function mappingLocalIds(
  mappings: readonly { readonly localId: string | number }[]
): readonly number[] {
  const ids = mappings.map(({ localId }) =>
    typeof localId === 'number' && positiveInteger(localId) ? localId : NaN
  )
  if (ids.some((id) => !Number.isFinite(id))) invalid()
  return ids.sort((left, right) => left - right)
}

function sameIds(left: readonly number[], right: readonly number[]): boolean {
  return (
    JSON.stringify([...left].sort((a, b) => a - b)) ===
    JSON.stringify([...right].sort((a, b) => a - b))
  )
}

function validIdList(value: readonly number[]): boolean {
  return (
    Array.isArray(value) &&
    value.length <= MAX_IDS &&
    value.every(positiveInteger) &&
    new Set(value).size === value.length
  )
}

function claimIds(owner: Set<number>, values: readonly number[]): void {
  for (const value of values) {
    if (owner.has(value)) invalid()
    owner.add(value)
  }
}

function positiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

function idsDigest(kind: string, values: readonly number[]): string {
  return digest(JSON.stringify([kind, [...values].sort((a, b) => a - b)]))
}

function validPilot(sample: FinancePayloadRelationshipScopeStagingEvidenceSample): boolean {
  return sample.role === 'cep_sur_pilot'
    ? validReview(sample.pilotReviewReference) &&
        sample.pilotReviewReference !== sample.entityReviewReference &&
        sample.pilotReviewReference !== sample.payloadPlan?.reviewReference
    : sample.role === 'existing_entity' && sample.pilotReviewReference === undefined
}

function canonicalManifest(input: {
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly metrics: FinancePayloadRelationshipScopeStagingEvidenceManifest['metrics']
  readonly entities: readonly FinancePayloadRelationshipScopeEvidenceArtifact[]
}) {
  return {
    schemaVersion: 1 as const,
    kind: 'cep_finance_payload_relationship_scope_staging_evidence' as const,
    mode: 'three_entity_cross_source_payload_relationship_review' as const,
    verdict: 'eligible_for_manual_staging_binding' as const,
    canReadPayload: false as const,
    canInvokeProvider: false as const,
    canBindAutomatically: false as const,
    canMarkVerified: false as const,
    canDeploy: false as const,
    canActivate: false as const,
    canChangePermissions: false as const,
    canUsePlatformSuperadmin: false as const,
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: input.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: input.readinessReviewReferenceDigest,
    metrics: input.metrics,
    entities: input.entities,
  }
}

function validManifestDigests(value: FinancePayloadRelationshipScopeStagingEvidenceManifest) {
  return (
    [
      value.sourceDigest,
      value.targetTenantDigest,
      value.campaignReviewReferenceDigest,
      value.readinessReviewReferenceDigest,
      value.artifactDigest,
    ].every((item) => DIGEST_PATTERN.test(item)) &&
    value.sourceDigest !== value.targetTenantDigest &&
    value.campaignReviewReferenceDigest !== value.readinessReviewReferenceDigest
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
  return typeof value === 'string' && REVIEW_PATTERN.test(value)
}

function digest(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function evidenceReference(value: string): `evidence://sha256/${string}` {
  return `evidence://sha256/${value.slice('sha256:'.length)}`
}

function invalid(): never {
  throw new Error('FINANCE_PAYLOAD_RELATIONSHIP_SCOPE_STAGING_EVIDENCE_INVALID')
}
