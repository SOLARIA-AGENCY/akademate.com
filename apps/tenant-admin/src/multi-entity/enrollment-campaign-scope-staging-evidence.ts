import { createHash } from 'node:crypto'

import type { ReviewedPayloadFinanceEntityPlan } from './finance-payload-relationship-readers'
import {
  assertFinancePayloadRelationshipScopeStagingEvidenceManifest,
  type FinancePayloadRelationshipScopeEvidenceArtifact,
  type FinancePayloadRelationshipScopeStagingEvidenceManifest,
} from './finance-payload-relationship-scope-staging-evidence'

export type EnrollmentCampaignScopeEvidenceRole = 'existing_entity' | 'cep_sur_pilot'

export interface ReviewedEnrollmentCourseRunRelationship {
  readonly enrollmentId: number
  readonly courseRunId: number
}

export interface ReviewedCampaignCourseRunRelationship {
  readonly campaignId: number
  readonly courseRunId: number
}

export interface EnrollmentCampaignScopeStagingEvidenceSample {
  readonly payloadPlan: ReviewedPayloadFinanceEntityPlan
  readonly enrollmentRelationships: readonly ReviewedEnrollmentCourseRunRelationship[]
  readonly campaignRelationships: readonly ReviewedCampaignCourseRunRelationship[]
  readonly role: EnrollmentCampaignScopeEvidenceRole
  readonly entityReviewReference: string
  readonly relationshipReviewReference: string
  readonly pilotReviewReference?: string
}

export interface EnrollmentCampaignScopeStagingEvidenceInput {
  readonly reviewEnvironment: 'staging'
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly payloadRelationshipScope: FinancePayloadRelationshipScopeStagingEvidenceManifest
  readonly samples: readonly EnrollmentCampaignScopeStagingEvidenceSample[]
}

export interface EnrollmentCampaignScopeEvidenceArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_multi_entity_enrollment_campaign_scope_review_evidence'
  readonly role: EnrollmentCampaignScopeEvidenceRole
  readonly verdict: 'eligible_for_manual_binding'
  readonly accountingScopeDigest: string
  readonly payloadScopeDigest: string
  readonly payloadPlanDigest: string
  readonly payloadRelationshipArtifactDigest: string
  readonly paymentRelationshipMappingDigest: string
  readonly advertisingRelationshipMappingDigest: string
  readonly enrollmentCoverageDigest: string
  readonly campaignCoverageDigest: string
  readonly courseRunCoverageDigest: string
  readonly enrollmentCourseRunGraphDigest: string
  readonly campaignCourseRunGraphDigest: string
  readonly entityReviewReferenceDigest: string
  readonly relationshipReviewReferenceDigest: string
  readonly pilotReviewReferenceDigest: string | null
  readonly metrics: {
    readonly courseRuns: number
    readonly enrollmentRelationships: number
    readonly campaignRelationships: number
  }
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
}

export interface EnrollmentCampaignScopeStagingEvidenceManifest {
  readonly schemaVersion: 1
  readonly kind: 'cep_multi_entity_enrollment_campaign_scope_staging_evidence'
  readonly mode: 'three_entity_reviewed_relationship_graph'
  readonly verdict: 'eligible_for_manual_staging_binding'
  readonly canReadPayload: false
  readonly canReadMeta: false
  readonly canInvokeProvider: false
  readonly canWrite: false
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
  readonly payloadRelationshipScopeArtifactDigest: string
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
  readonly metrics: {
    readonly expectedEntities: 3
    readonly reviewedEntities: 3
    readonly pilotEntities: 1
    readonly reviewedCourseRuns: number
    readonly reviewedEnrollmentRelationships: number
    readonly reviewedCampaignRelationships: number
    readonly payloadReads: 0
    readonly metaReads: 0
    readonly providerInvocations: 0
    readonly writes: 0
  }
  readonly entities: readonly EnrollmentCampaignScopeEvidenceArtifact[]
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
  'payloadRelationshipScope',
  'samples',
])
const SAMPLE_KEYS = new Set([
  'payloadPlan',
  'enrollmentRelationships',
  'campaignRelationships',
  'role',
  'entityReviewReference',
  'relationshipReviewReference',
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
const ENROLLMENT_RELATIONSHIP_KEYS = new Set(['enrollmentId', 'courseRunId'])
const CAMPAIGN_RELATIONSHIP_KEYS = new Set(['campaignId', 'courseRunId'])
const ENTITY_KEYS = new Set([
  'schemaVersion',
  'kind',
  'role',
  'verdict',
  'accountingScopeDigest',
  'payloadScopeDigest',
  'payloadPlanDigest',
  'payloadRelationshipArtifactDigest',
  'paymentRelationshipMappingDigest',
  'advertisingRelationshipMappingDigest',
  'enrollmentCoverageDigest',
  'campaignCoverageDigest',
  'courseRunCoverageDigest',
  'enrollmentCourseRunGraphDigest',
  'campaignCourseRunGraphDigest',
  'entityReviewReferenceDigest',
  'relationshipReviewReferenceDigest',
  'pilotReviewReferenceDigest',
  'metrics',
  'artifactDigest',
  'evidenceReference',
])
const ENTITY_METRIC_KEYS = new Set([
  'courseRuns',
  'enrollmentRelationships',
  'campaignRelationships',
])
const MANIFEST_KEYS = new Set([
  'schemaVersion',
  'kind',
  'mode',
  'verdict',
  'canReadPayload',
  'canReadMeta',
  'canInvokeProvider',
  'canWrite',
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
  'payloadRelationshipScopeArtifactDigest',
  'artifactDigest',
  'evidenceReference',
  'metrics',
  'entities',
])
const MANIFEST_METRIC_KEYS = new Set([
  'expectedEntities',
  'reviewedEntities',
  'pilotEntities',
  'reviewedCourseRuns',
  'reviewedEnrollmentRelationships',
  'reviewedCampaignRelationships',
  'payloadReads',
  'metaReads',
  'providerInvocations',
  'writes',
])
const MAX_IDS = 100_000

/**
 * Seals reviewed enrollment -> course-run and local campaign -> course-run
 * relationships. The preceding Payload-scope artifact already binds external
 * payment/campaign identifiers to those local records, so this composes the
 * chain without exposing identifiers or reading either source.
 */
export function createEnrollmentCampaignScopeStagingEvidenceManifest(
  input: EnrollmentCampaignScopeStagingEvidenceInput
): EnrollmentCampaignScopeStagingEvidenceManifest {
  validateInput(input)
  try {
    assertFinancePayloadRelationshipScopeStagingEvidenceManifest(input.payloadRelationshipScope)
  } catch {
    invalid()
  }
  validateParentContext(input)

  const parentByPlanDigest = new Map(
    input.payloadRelationshipScope.entities.map((entity) => [entity.payloadPlanDigest, entity])
  )
  const owners = {
    enrollments: new Set<number>(),
    campaigns: new Set<number>(),
    courseRuns: new Set<number>(),
    reviews: new Set([input.campaignReviewReference, input.readinessReviewReference]),
  }
  let pilots = 0
  const entities = Object.freeze(
    input.samples
      .map((sample) => {
        validateSample(sample, owners)
        if (sample.role === 'cep_sur_pilot') pilots += 1
        const parent = parentByPlanDigest.get(planDigest(sample.payloadPlan))
        if (!parent) invalid()
        return createEntityArtifact(sample, parent)
      })
      .sort((left, right) => left.payloadScopeDigest.localeCompare(right.payloadScopeDigest))
  )
  if (pilots !== 1 || entities.length !== parentByPlanDigest.size) invalid()

  const metrics = Object.freeze({
    expectedEntities: 3 as const,
    reviewedEntities: 3 as const,
    pilotEntities: 1 as const,
    reviewedCourseRuns: total(entities, 'courseRuns'),
    reviewedEnrollmentRelationships: total(entities, 'enrollmentRelationships'),
    reviewedCampaignRelationships: total(entities, 'campaignRelationships'),
    payloadReads: 0 as const,
    metaReads: 0 as const,
    providerInvocations: 0 as const,
    writes: 0 as const,
  })
  const canonical = canonicalManifest({
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: digest(input.campaignReviewReference),
    readinessReviewReferenceDigest: digest(input.readinessReviewReference),
    payloadRelationshipScopeArtifactDigest: input.payloadRelationshipScope.artifactDigest,
    metrics,
    entities,
  })
  const artifactDigest = digest(JSON.stringify(canonical))
  const manifest = Object.freeze({
    ...canonical,
    artifactDigest,
    evidenceReference: evidenceReference(artifactDigest),
  })
  assertEnrollmentCampaignScopeStagingEvidenceManifest(manifest)
  return manifest
}

export function assertEnrollmentCampaignScopeStagingEvidenceManifest(
  value: unknown
): asserts value is EnrollmentCampaignScopeStagingEvidenceManifest {
  if (!value || typeof value !== 'object' || !exactKeys(value, MANIFEST_KEYS)) invalid()
  const manifest = value as EnrollmentCampaignScopeStagingEvidenceManifest
  if (
    manifest.schemaVersion !== 1 ||
    manifest.kind !== 'cep_multi_entity_enrollment_campaign_scope_staging_evidence' ||
    manifest.mode !== 'three_entity_reviewed_relationship_graph' ||
    manifest.verdict !== 'eligible_for_manual_staging_binding' ||
    manifest.canReadPayload !== false ||
    manifest.canReadMeta !== false ||
    manifest.canInvokeProvider !== false ||
    manifest.canWrite !== false ||
    manifest.canBindAutomatically !== false ||
    manifest.canMarkVerified !== false ||
    manifest.canDeploy !== false ||
    manifest.canActivate !== false ||
    manifest.canChangePermissions !== false ||
    manifest.canUsePlatformSuperadmin !== false ||
    !validDigest(manifest.sourceDigest) ||
    !validDigest(manifest.targetTenantDigest) ||
    !validDigest(manifest.campaignReviewReferenceDigest) ||
    !validDigest(manifest.readinessReviewReferenceDigest) ||
    !validDigest(manifest.payloadRelationshipScopeArtifactDigest) ||
    !manifest.metrics ||
    typeof manifest.metrics !== 'object' ||
    !exactKeys(manifest.metrics, MANIFEST_METRIC_KEYS) ||
    manifest.metrics.expectedEntities !== 3 ||
    manifest.metrics.reviewedEntities !== 3 ||
    manifest.metrics.pilotEntities !== 1 ||
    manifest.metrics.payloadReads !== 0 ||
    manifest.metrics.metaReads !== 0 ||
    manifest.metrics.providerInvocations !== 0 ||
    manifest.metrics.writes !== 0 ||
    !nonNegativeInteger(manifest.metrics.reviewedCourseRuns) ||
    !nonNegativeInteger(manifest.metrics.reviewedEnrollmentRelationships) ||
    !nonNegativeInteger(manifest.metrics.reviewedCampaignRelationships) ||
    !Array.isArray(manifest.entities) ||
    manifest.entities.length !== 3
  ) {
    invalid()
  }
  const uniqueFields: Array<keyof EnrollmentCampaignScopeEvidenceArtifact> = [
    'accountingScopeDigest',
    'payloadScopeDigest',
    'payloadPlanDigest',
    'payloadRelationshipArtifactDigest',
    'enrollmentCoverageDigest',
    'campaignCoverageDigest',
    'courseRunCoverageDigest',
    'enrollmentCourseRunGraphDigest',
    'campaignCourseRunGraphDigest',
    'entityReviewReferenceDigest',
    'relationshipReviewReferenceDigest',
  ]
  const seen = new Map(uniqueFields.map((field) => [field, new Set<string>()]))
  const reviewDigests = new Set([
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
      const fieldValue = entity[field] as string
      if (seen.get(field)!.has(fieldValue)) invalid()
      seen.get(field)!.add(fieldValue)
    }
    for (const reviewDigest of [
      entity.entityReviewReferenceDigest,
      entity.relationshipReviewReferenceDigest,
      entity.pilotReviewReferenceDigest,
    ]) {
      if (reviewDigest === null) continue
      if (reviewDigests.has(reviewDigest)) invalid()
      reviewDigests.add(reviewDigest)
    }
    if (entity.role === 'cep_sur_pilot') pilots += 1
  }
  if (
    pilots !== 1 ||
    manifest.metrics.reviewedCourseRuns !== total(manifest.entities, 'courseRuns') ||
    manifest.metrics.reviewedEnrollmentRelationships !==
      total(manifest.entities, 'enrollmentRelationships') ||
    manifest.metrics.reviewedCampaignRelationships !==
      total(manifest.entities, 'campaignRelationships')
  ) {
    invalid()
  }
  const canonical = canonicalManifest({
    sourceDigest: manifest.sourceDigest,
    targetTenantDigest: manifest.targetTenantDigest,
    campaignReviewReferenceDigest: manifest.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: manifest.readinessReviewReferenceDigest,
    payloadRelationshipScopeArtifactDigest: manifest.payloadRelationshipScopeArtifactDigest,
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

export function serializeEnrollmentCampaignScopeStagingEvidenceManifest(
  input: EnrollmentCampaignScopeStagingEvidenceInput
): string {
  return JSON.stringify(createEnrollmentCampaignScopeStagingEvidenceManifest(input))
}

function validateInput(input: EnrollmentCampaignScopeStagingEvidenceInput): void {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    input.reviewEnvironment !== 'staging' ||
    !validReview(input.campaignReviewReference) ||
    !validReview(input.readinessReviewReference) ||
    input.campaignReviewReference === input.readinessReviewReference ||
    !validDigest(input.sourceDigest) ||
    !validDigest(input.targetTenantDigest) ||
    input.sourceDigest === input.targetTenantDigest ||
    !Array.isArray(input.samples) ||
    input.samples.length !== 3
  ) {
    invalid()
  }
}

function validateParentContext(input: EnrollmentCampaignScopeStagingEvidenceInput): void {
  const parent = input.payloadRelationshipScope
  if (
    parent.sourceDigest !== input.sourceDigest ||
    parent.targetTenantDigest !== input.targetTenantDigest ||
    parent.campaignReviewReferenceDigest !== digest(input.campaignReviewReference) ||
    parent.readinessReviewReferenceDigest !== digest(input.readinessReviewReference) ||
    parent.verdict !== 'eligible_for_manual_staging_binding'
  ) {
    invalid()
  }
}

function validateSample(
  sample: EnrollmentCampaignScopeStagingEvidenceSample,
  owners: {
    enrollments: Set<number>
    campaigns: Set<number>
    courseRuns: Set<number>
    reviews: Set<string>
  }
): void {
  const expectedKeys = sample?.role === 'cep_sur_pilot' ? PILOT_SAMPLE_KEYS : SAMPLE_KEYS
  if (
    !sample ||
    typeof sample !== 'object' ||
    !exactKeys(sample, expectedKeys) ||
    !['existing_entity', 'cep_sur_pilot'].includes(sample.role) ||
    !validReview(sample.entityReviewReference) ||
    !validReview(sample.relationshipReviewReference) ||
    sample.entityReviewReference === sample.relationshipReviewReference ||
    sample.relationshipReviewReference === sample.payloadPlan?.reviewReference ||
    owners.reviews.has(sample.entityReviewReference) ||
    owners.reviews.has(sample.relationshipReviewReference) ||
    (sample.pilotReviewReference !== undefined &&
      owners.reviews.has(sample.pilotReviewReference)) ||
    !validPilot(sample)
  ) {
    invalid()
  }
  validatePlan(sample.payloadPlan)
  validateRelationships(sample)
  claimIds(owners.enrollments, sample.payloadPlan.enrollmentIds)
  claimIds(owners.campaigns, sample.payloadPlan.campaignIds)
  claimIds(owners.courseRuns, sample.payloadPlan.courseRunIds)
  owners.reviews.add(sample.entityReviewReference)
  owners.reviews.add(sample.relationshipReviewReference)
  if (sample.pilotReviewReference !== undefined) {
    owners.reviews.add(sample.pilotReviewReference)
  }
}

function validatePlan(plan: ReviewedPayloadFinanceEntityPlan): void {
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
    ((plan.enrollmentIds.length > 0 || plan.campaignIds.length > 0) &&
      plan.courseRunIds.length === 0)
  ) {
    invalid()
  }
}

function validateRelationships(sample: EnrollmentCampaignScopeStagingEvidenceSample): void {
  if (
    !Array.isArray(sample.enrollmentRelationships) ||
    !Array.isArray(sample.campaignRelationships) ||
    sample.enrollmentRelationships.length > MAX_IDS ||
    sample.campaignRelationships.length > MAX_IDS
  ) {
    invalid()
  }
  const courseRuns = new Set(sample.payloadPlan.courseRunIds)
  const enrollmentIds = new Set<number>()
  for (const relationship of sample.enrollmentRelationships) {
    if (
      !relationship ||
      typeof relationship !== 'object' ||
      !exactKeys(relationship, ENROLLMENT_RELATIONSHIP_KEYS) ||
      !positiveInteger(relationship.enrollmentId) ||
      !positiveInteger(relationship.courseRunId) ||
      !courseRuns.has(relationship.courseRunId) ||
      enrollmentIds.has(relationship.enrollmentId)
    ) {
      invalid()
    }
    enrollmentIds.add(relationship.enrollmentId)
  }
  const campaignIds = new Set<number>()
  for (const relationship of sample.campaignRelationships) {
    if (
      !relationship ||
      typeof relationship !== 'object' ||
      !exactKeys(relationship, CAMPAIGN_RELATIONSHIP_KEYS) ||
      !positiveInteger(relationship.campaignId) ||
      !positiveInteger(relationship.courseRunId) ||
      !courseRuns.has(relationship.courseRunId) ||
      campaignIds.has(relationship.campaignId)
    ) {
      invalid()
    }
    campaignIds.add(relationship.campaignId)
  }
  if (
    !sameIds([...enrollmentIds], sample.payloadPlan.enrollmentIds) ||
    !sameIds([...campaignIds], sample.payloadPlan.campaignIds)
  ) {
    invalid()
  }
}

function createEntityArtifact(
  sample: EnrollmentCampaignScopeStagingEvidenceSample,
  parent: FinancePayloadRelationshipScopeEvidenceArtifact
): EnrollmentCampaignScopeEvidenceArtifact {
  const plan = sample.payloadPlan
  const expected = expectedParentDigests(plan)
  if (
    parent.role !== sample.role ||
    parent.payloadScopeDigest !== expected.payloadScopeDigest ||
    parent.payloadPlanDigest !== expected.payloadPlanDigest ||
    parent.enrollmentCoverageDigest !== expected.enrollmentCoverageDigest ||
    parent.campaignCoverageDigest !== expected.campaignCoverageDigest ||
    parent.entityReviewReferenceDigest !== digest(sample.entityReviewReference)
  ) {
    invalid()
  }
  const metrics = Object.freeze({
    courseRuns: plan.courseRunIds.length,
    enrollmentRelationships: sample.enrollmentRelationships.length,
    campaignRelationships: sample.campaignRelationships.length,
  })
  const canonical = {
    schemaVersion: 1 as const,
    kind: 'cep_multi_entity_enrollment_campaign_scope_review_evidence' as const,
    role: sample.role,
    verdict: 'eligible_for_manual_binding' as const,
    accountingScopeDigest: parent.accountingScopeDigest,
    payloadScopeDigest: parent.payloadScopeDigest,
    payloadPlanDigest: parent.payloadPlanDigest,
    payloadRelationshipArtifactDigest: parent.artifactDigest,
    paymentRelationshipMappingDigest: parent.paymentRelationshipMappingDigest,
    advertisingRelationshipMappingDigest: parent.advertisingRelationshipMappingDigest,
    enrollmentCoverageDigest: parent.enrollmentCoverageDigest,
    campaignCoverageDigest: parent.campaignCoverageDigest,
    courseRunCoverageDigest: idsDigest('course_run', plan.courseRunIds),
    enrollmentCourseRunGraphDigest: relationshipDigest(
      'enrollment_course_run',
      sample.enrollmentRelationships.map(({ enrollmentId, courseRunId }) => [
        enrollmentId,
        courseRunId,
      ])
    ),
    campaignCourseRunGraphDigest: relationshipDigest(
      'campaign_course_run',
      sample.campaignRelationships.map(({ campaignId, courseRunId }) => [campaignId, courseRunId])
    ),
    entityReviewReferenceDigest: digest(sample.entityReviewReference),
    relationshipReviewReferenceDigest: digest(sample.relationshipReviewReference),
    pilotReviewReferenceDigest:
      sample.pilotReviewReference === undefined ? null : digest(sample.pilotReviewReference),
    metrics,
  }
  const artifactDigest = digest(JSON.stringify(canonical))
  return Object.freeze({
    ...canonical,
    artifactDigest,
    evidenceReference: evidenceReference(artifactDigest),
  })
}

function assertEntity(entity: EnrollmentCampaignScopeEvidenceArtifact): void {
  if (
    !entity ||
    typeof entity !== 'object' ||
    !exactKeys(entity, ENTITY_KEYS) ||
    entity.schemaVersion !== 1 ||
    entity.kind !== 'cep_multi_entity_enrollment_campaign_scope_review_evidence' ||
    !['existing_entity', 'cep_sur_pilot'].includes(entity.role) ||
    entity.verdict !== 'eligible_for_manual_binding' ||
    !entity.metrics ||
    typeof entity.metrics !== 'object' ||
    !exactKeys(entity.metrics, ENTITY_METRIC_KEYS) ||
    !nonNegativeInteger(entity.metrics.courseRuns) ||
    !nonNegativeInteger(entity.metrics.enrollmentRelationships) ||
    !nonNegativeInteger(entity.metrics.campaignRelationships) ||
    !Object.entries(entity)
      .filter(([key]) => key.endsWith('Digest'))
      .every(([, value]) => value === null || (typeof value === 'string' && validDigest(value))) ||
    (entity.role === 'cep_sur_pilot') !== (entity.pilotReviewReferenceDigest !== null)
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
    payloadRelationshipArtifactDigest: entity.payloadRelationshipArtifactDigest,
    paymentRelationshipMappingDigest: entity.paymentRelationshipMappingDigest,
    advertisingRelationshipMappingDigest: entity.advertisingRelationshipMappingDigest,
    enrollmentCoverageDigest: entity.enrollmentCoverageDigest,
    campaignCoverageDigest: entity.campaignCoverageDigest,
    courseRunCoverageDigest: entity.courseRunCoverageDigest,
    enrollmentCourseRunGraphDigest: entity.enrollmentCourseRunGraphDigest,
    campaignCourseRunGraphDigest: entity.campaignCourseRunGraphDigest,
    entityReviewReferenceDigest: entity.entityReviewReferenceDigest,
    relationshipReviewReferenceDigest: entity.relationshipReviewReferenceDigest,
    pilotReviewReferenceDigest: entity.pilotReviewReferenceDigest,
    metrics: entity.metrics,
  }
  if (
    entity.artifactDigest !== digest(JSON.stringify(canonical)) ||
    entity.evidenceReference !== evidenceReference(entity.artifactDigest)
  ) {
    invalid()
  }
}

function expectedParentDigests(plan: ReviewedPayloadFinanceEntityPlan) {
  return {
    payloadScopeDigest: digest(
      JSON.stringify([
        'finance_payload_scope_v1',
        plan.tenantId,
        plan.legalEntityId,
        plan.payloadTenantId,
      ])
    ),
    payloadPlanDigest: planDigest(plan),
    enrollmentCoverageDigest: idsDigest('enrollment', plan.enrollmentIds),
    campaignCoverageDigest: idsDigest('campaign', plan.campaignIds),
  }
}

function planDigest(plan: ReviewedPayloadFinanceEntityPlan): string {
  return digest(
    JSON.stringify({
      schemaVersion: 1,
      tenantIdDigest: digest(plan.tenantId),
      legalEntityIdDigest: digest(plan.legalEntityId),
      payloadTenantIdDigest: digest(plan.payloadTenantId),
      reviewReferenceDigest: digest(plan.reviewReference),
      enrollmentIdsDigest: idsDigest('enrollment', plan.enrollmentIds),
      courseRunIdsDigest: idsDigest('course_run', plan.courseRunIds),
      campaignIdsDigest: idsDigest('campaign', plan.campaignIds),
    })
  )
}

function canonicalManifest(input: {
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly payloadRelationshipScopeArtifactDigest: string
  readonly metrics: EnrollmentCampaignScopeStagingEvidenceManifest['metrics']
  readonly entities: readonly EnrollmentCampaignScopeEvidenceArtifact[]
}) {
  return {
    schemaVersion: 1 as const,
    kind: 'cep_multi_entity_enrollment_campaign_scope_staging_evidence' as const,
    mode: 'three_entity_reviewed_relationship_graph' as const,
    verdict: 'eligible_for_manual_staging_binding' as const,
    canReadPayload: false as const,
    canReadMeta: false as const,
    canInvokeProvider: false as const,
    canWrite: false as const,
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
    payloadRelationshipScopeArtifactDigest: input.payloadRelationshipScopeArtifactDigest,
    metrics: input.metrics,
    entities: input.entities,
  }
}

function relationshipDigest(kind: string, values: readonly (readonly [number, number])[]): string {
  return digest(
    JSON.stringify([
      kind,
      [...values].sort((left, right) => left[0] - right[0] || left[1] - right[1]),
    ])
  )
}

function idsDigest(kind: string, values: readonly number[]): string {
  return digest(JSON.stringify([kind, [...values].sort((left, right) => left - right)]))
}

function total(
  entities: readonly EnrollmentCampaignScopeEvidenceArtifact[],
  field: keyof EnrollmentCampaignScopeEvidenceArtifact['metrics']
): number {
  return entities.reduce((sum, entity) => sum + entity.metrics[field], 0)
}

function claimIds(owner: Set<number>, values: readonly number[]): void {
  for (const value of values) {
    if (owner.has(value)) invalid()
    owner.add(value)
  }
}

function sameIds(left: readonly number[], right: readonly number[]): boolean {
  return (
    JSON.stringify([...left].sort((a, b) => a - b)) ===
    JSON.stringify([...right].sort((a, b) => a - b))
  )
}

function validPilot(sample: EnrollmentCampaignScopeStagingEvidenceSample): boolean {
  return sample.role === 'cep_sur_pilot'
    ? validReview(sample.pilotReviewReference) &&
        sample.pilotReviewReference !== sample.entityReviewReference &&
        sample.pilotReviewReference !== sample.relationshipReviewReference &&
        sample.pilotReviewReference !== sample.payloadPlan?.reviewReference
    : sample.role === 'existing_entity' && sample.pilotReviewReference === undefined
}

function validIdList(value: readonly number[]): boolean {
  return (
    Array.isArray(value) &&
    value.length <= MAX_IDS &&
    value.every(positiveInteger) &&
    new Set(value).size === value.length
  )
}

function positiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

function nonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function validIdentifier(value: unknown, max: number): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= max &&
    value === value.trim() &&
    !/[\u0000-\u001f\u007f]/.test(value)
  )
}

function validReview(value: unknown): value is string {
  return typeof value === 'string' && REVIEW_PATTERN.test(value)
}

function validDigest(value: unknown): value is string {
  return typeof value === 'string' && DIGEST_PATTERN.test(value)
}

function exactKeys(value: object, expected: ReadonlySet<string>): boolean {
  const keys = Object.keys(value)
  return keys.length === expected.size && keys.every((key) => expected.has(key))
}

function digest(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function evidenceReference(value: string): `evidence://sha256/${string}` {
  return `evidence://sha256/${value.slice('sha256:'.length)}`
}

function invalid(): never {
  throw new Error('ENROLLMENT_CAMPAIGN_SCOPE_STAGING_EVIDENCE_INVALID')
}
