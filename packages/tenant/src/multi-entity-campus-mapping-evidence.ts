import { createHash } from 'node:crypto'

export type CampusMappingEvidenceRole = 'existing_entity' | 'cep_sur_pilot'
export type CampusMappingRecordStatus = 'validated' | 'inactive'

export interface CampusMappingCampusRecord {
  readonly id: string
  readonly tenantId: string
  readonly status: CampusMappingRecordStatus
}

export interface CampusMappingClassroomRecord {
  readonly id: string
  readonly tenantId: string
  readonly campusId: string
  readonly status: CampusMappingRecordStatus
}

export interface CampusMappingBindingRecord {
  readonly id: string
  readonly tenantId: string
  readonly legalEntityId: string
  readonly campusId: string
  readonly status: CampusMappingRecordStatus
}

export interface CampusMappingEvidenceSample {
  readonly tenantId: string
  readonly legalEntityId: string
  readonly role: CampusMappingEvidenceRole
  readonly entityReviewReference: string
  readonly pilotReviewReference?: string
  readonly campuses: readonly CampusMappingCampusRecord[]
  readonly classrooms: readonly CampusMappingClassroomRecord[]
  readonly bindings: readonly CampusMappingBindingRecord[]
}

export interface CampusMappingEvidenceInput {
  readonly reviewEnvironment: 'staging'
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly samples: readonly CampusMappingEvidenceSample[]
}

export interface CampusMappingEntityEvidenceArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_multi_entity_campus_mapping_entity_evidence'
  readonly role: CampusMappingEvidenceRole
  readonly verdict: 'eligible_for_manual_binding'
  readonly scopeDigest: string
  readonly entityReviewReferenceDigest: string
  readonly pilotReviewReferenceDigest: string | null
  readonly campusMappingDigest: string
  readonly classroomMappingDigest: string
  readonly bindingDigest: string
  readonly validatedCampuses: number
  readonly validatedClassrooms: number
  readonly validatedBindings: number
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
}

export interface CampusMappingEvidenceArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_multi_entity_campus_mapping_review_evidence'
  readonly mode: 'three_entity_redacted_campus_mapping_review'
  readonly verdict: 'eligible_for_manual_staging_binding'
  readonly canReadPayload: false
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canDeploy: false
  readonly canActivate: false
  readonly canWrite: false
  readonly canApply: false
  readonly canChangePermissions: false
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly entities: readonly CampusMappingEntityEvidenceArtifact[]
  readonly metrics: {
    readonly expectedEntities: 3
    readonly mappedEntities: 3
    readonly validatedCampuses: number
    readonly validatedClassrooms: number
    readonly validatedBindings: number
    readonly orphanCampuses: 0
    readonly orphanClassrooms: 0
    readonly crossEntityRecords: 0
    readonly payloadReads: 0
    readonly writes: 0
  }
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
}

const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/
const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,254}$/
const ARTIFACT_KEYS = new Set([
  'schemaVersion',
  'kind',
  'mode',
  'verdict',
  'canReadPayload',
  'canBindAutomatically',
  'canMarkVerified',
  'canDeploy',
  'canActivate',
  'canWrite',
  'canApply',
  'canChangePermissions',
  'sourceDigest',
  'targetTenantDigest',
  'campaignReviewReferenceDigest',
  'readinessReviewReferenceDigest',
  'entities',
  'metrics',
  'artifactDigest',
  'evidenceReference',
])
const ENTITY_ARTIFACT_KEYS = new Set([
  'schemaVersion',
  'kind',
  'role',
  'verdict',
  'scopeDigest',
  'entityReviewReferenceDigest',
  'pilotReviewReferenceDigest',
  'campusMappingDigest',
  'classroomMappingDigest',
  'bindingDigest',
  'validatedCampuses',
  'validatedClassrooms',
  'validatedBindings',
  'artifactDigest',
  'evidenceReference',
])
const METRIC_KEYS = new Set([
  'expectedEntities',
  'mappedEntities',
  'validatedCampuses',
  'validatedClassrooms',
  'validatedBindings',
  'orphanCampuses',
  'orphanClassrooms',
  'crossEntityRecords',
  'payloadReads',
  'writes',
])

/**
 * Reviews current campus and classroom ownership in memory. It emits only
 * digests and counts; it cannot read Payload, mutate topology or bind a gate.
 */
export function createCampusMappingEvidenceArtifact(
  input: CampusMappingEvidenceInput
): CampusMappingEvidenceArtifact {
  validateInput(input)

  const entities = input.samples.map((sample) => createEntityArtifact(sample))
  const canonicalEntities = Object.freeze(
    [...entities].sort((left, right) => left.scopeDigest.localeCompare(right.scopeDigest))
  )
  const metrics = Object.freeze({
    expectedEntities: 3 as const,
    mappedEntities: 3 as const,
    validatedCampuses: canonicalEntities.reduce(
      (total, entity) => total + entity.validatedCampuses,
      0
    ),
    validatedClassrooms: canonicalEntities.reduce(
      (total, entity) => total + entity.validatedClassrooms,
      0
    ),
    validatedBindings: canonicalEntities.reduce(
      (total, entity) => total + entity.validatedBindings,
      0
    ),
    orphanCampuses: 0 as const,
    orphanClassrooms: 0 as const,
    crossEntityRecords: 0 as const,
    payloadReads: 0 as const,
    writes: 0 as const,
  })
  const canonical = {
    schemaVersion: 1 as const,
    kind: 'cep_multi_entity_campus_mapping_review_evidence' as const,
    mode: 'three_entity_redacted_campus_mapping_review' as const,
    verdict: 'eligible_for_manual_staging_binding' as const,
    canReadPayload: false as const,
    canBindAutomatically: false as const,
    canMarkVerified: false as const,
    canDeploy: false as const,
    canActivate: false as const,
    canWrite: false as const,
    canApply: false as const,
    canChangePermissions: false as const,
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: digest(input.campaignReviewReference),
    readinessReviewReferenceDigest: digest(input.readinessReviewReference),
    entities: canonicalEntities,
    metrics,
  }
  const artifactDigest = digest(JSON.stringify(canonical))
  const artifact = Object.freeze({
    ...canonical,
    artifactDigest,
    evidenceReference: evidenceReference(artifactDigest),
  })
  assertCampusMappingEvidenceArtifact(artifact)
  return artifact
}

export function assertCampusMappingEvidenceArtifact(
  value: unknown
): asserts value is CampusMappingEvidenceArtifact {
  if (!value || typeof value !== 'object' || !exactKeys(value, ARTIFACT_KEYS)) invalidEvidence()
  const artifact = value as CampusMappingEvidenceArtifact
  if (
    artifact.schemaVersion !== 1 ||
    artifact.kind !== 'cep_multi_entity_campus_mapping_review_evidence' ||
    artifact.mode !== 'three_entity_redacted_campus_mapping_review' ||
    artifact.verdict !== 'eligible_for_manual_staging_binding' ||
    artifact.canReadPayload !== false ||
    artifact.canBindAutomatically !== false ||
    artifact.canMarkVerified !== false ||
    artifact.canDeploy !== false ||
    artifact.canActivate !== false ||
    artifact.canWrite !== false ||
    artifact.canApply !== false ||
    artifact.canChangePermissions !== false ||
    !DIGEST_PATTERN.test(artifact.sourceDigest) ||
    !DIGEST_PATTERN.test(artifact.targetTenantDigest) ||
    !DIGEST_PATTERN.test(artifact.campaignReviewReferenceDigest) ||
    !DIGEST_PATTERN.test(artifact.readinessReviewReferenceDigest) ||
    !Array.isArray(artifact.entities) ||
    artifact.entities.length !== 3 ||
    !artifact.metrics ||
    typeof artifact.metrics !== 'object' ||
    !exactKeys(artifact.metrics, METRIC_KEYS) ||
    artifact.metrics.expectedEntities !== 3 ||
    artifact.metrics.mappedEntities !== 3 ||
    artifact.metrics.orphanCampuses !== 0 ||
    artifact.metrics.orphanClassrooms !== 0 ||
    artifact.metrics.crossEntityRecords !== 0 ||
    artifact.metrics.payloadReads !== 0 ||
    artifact.metrics.writes !== 0 ||
    !DIGEST_PATTERN.test(artifact.artifactDigest) ||
    artifact.evidenceReference !== evidenceReference(artifact.artifactDigest)
  ) {
    invalidEvidence()
  }

  const scopes = new Set<string>()
  const campusMappings = new Set<string>()
  const classroomMappings = new Set<string>()
  const bindings = new Set<string>()
  const reviews = new Set([
    artifact.campaignReviewReferenceDigest,
    artifact.readinessReviewReferenceDigest,
  ])
  let pilots = 0
  let previousScope = ''
  for (const entity of artifact.entities) {
    assertEntityArtifact(entity)
    if (
      (previousScope && previousScope.localeCompare(entity.scopeDigest) >= 0) ||
      scopes.has(entity.scopeDigest) ||
      campusMappings.has(entity.campusMappingDigest) ||
      classroomMappings.has(entity.classroomMappingDigest) ||
      bindings.has(entity.bindingDigest) ||
      reviews.has(entity.entityReviewReferenceDigest)
    ) {
      invalidEvidence()
    }
    previousScope = entity.scopeDigest
    scopes.add(entity.scopeDigest)
    campusMappings.add(entity.campusMappingDigest)
    classroomMappings.add(entity.classroomMappingDigest)
    bindings.add(entity.bindingDigest)
    reviews.add(entity.entityReviewReferenceDigest)
    if (entity.pilotReviewReferenceDigest !== null) {
      if (reviews.has(entity.pilotReviewReferenceDigest)) invalidEvidence()
      reviews.add(entity.pilotReviewReferenceDigest)
      pilots += 1
    }
  }
  if (pilots !== 1) invalidEvidence()
  if (
    artifact.metrics.validatedCampuses !==
      artifact.entities.reduce((total, entity) => total + entity.validatedCampuses, 0) ||
    artifact.metrics.validatedClassrooms !==
      artifact.entities.reduce((total, entity) => total + entity.validatedClassrooms, 0) ||
    artifact.metrics.validatedBindings !==
      artifact.entities.reduce((total, entity) => total + entity.validatedBindings, 0)
  ) {
    invalidEvidence()
  }

  const canonical = {
    schemaVersion: 1 as const,
    kind: artifact.kind,
    mode: artifact.mode,
    verdict: artifact.verdict,
    canReadPayload: artifact.canReadPayload,
    canBindAutomatically: artifact.canBindAutomatically,
    canMarkVerified: artifact.canMarkVerified,
    canDeploy: artifact.canDeploy,
    canActivate: artifact.canActivate,
    canWrite: artifact.canWrite,
    canApply: artifact.canApply,
    canChangePermissions: artifact.canChangePermissions,
    sourceDigest: artifact.sourceDigest,
    targetTenantDigest: artifact.targetTenantDigest,
    campaignReviewReferenceDigest: artifact.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: artifact.readinessReviewReferenceDigest,
    entities: artifact.entities,
    metrics: artifact.metrics,
  }
  if (artifact.artifactDigest !== digest(JSON.stringify(canonical))) invalidEvidence()
}

export function serializeCampusMappingEvidenceArtifact(input: CampusMappingEvidenceInput): string {
  return JSON.stringify(createCampusMappingEvidenceArtifact(input))
}

function validateInput(input: CampusMappingEvidenceInput): void {
  if (
    !input ||
    typeof input !== 'object' ||
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
    invalidEvidence()
  }

  const entityIds = new Set<string>()
  const campusIds = new Set<string>()
  const classroomIds = new Set<string>()
  const bindingIds = new Set<string>()
  const reviews = new Set([input.campaignReviewReference, input.readinessReviewReference])
  const roles = new Set<CampusMappingEvidenceRole>()
  const tenantId = input.samples[0]!.tenantId
  let pilots = 0

  for (const sample of input.samples) {
    validateSample(sample)
    if (sample.tenantId !== tenantId) invalidEvidence()
    if (
      entityIds.has(sample.legalEntityId) ||
      (sample.role === 'cep_sur_pilot' && roles.has('cep_sur_pilot'))
    ) {
      invalidEvidence()
    }
    if (reviews.has(sample.entityReviewReference)) invalidEvidence()
    entityIds.add(sample.legalEntityId)
    roles.add(sample.role)
    reviews.add(sample.entityReviewReference)
    if (sample.pilotReviewReference !== undefined) {
      if (
        sample.role !== 'cep_sur_pilot' ||
        reviews.has(sample.pilotReviewReference) ||
        sample.pilotReviewReference === sample.entityReviewReference
      ) {
        invalidEvidence()
      }
      reviews.add(sample.pilotReviewReference)
      pilots += 1
    } else if (sample.role === 'cep_sur_pilot') {
      invalidEvidence()
    }

    for (const campus of sample.campuses) {
      if (campus.tenantId !== tenantId || campusIds.has(campus.id)) invalidEvidence()
      campusIds.add(campus.id)
    }
    for (const classroom of sample.classrooms) {
      if (classroom.tenantId !== tenantId || classroomIds.has(classroom.id)) invalidEvidence()
      classroomIds.add(classroom.id)
    }
    for (const binding of sample.bindings) {
      if (binding.tenantId !== tenantId || bindingIds.has(binding.id)) invalidEvidence()
      bindingIds.add(binding.id)
    }
  }
  if (roles.size !== 2 || !roles.has('existing_entity') || !roles.has('cep_sur_pilot')) {
    invalidEvidence()
  }
  if (pilots !== 1) invalidEvidence()
}

function validateSample(sample: CampusMappingEvidenceSample): void {
  if (
    !sample ||
    typeof sample !== 'object' ||
    !validIdentifier(sample.tenantId) ||
    !validIdentifier(sample.legalEntityId) ||
    !['existing_entity', 'cep_sur_pilot'].includes(sample.role) ||
    !validReview(sample.entityReviewReference) ||
    !Array.isArray(sample.campuses) ||
    sample.campuses.length === 0 ||
    !Array.isArray(sample.classrooms) ||
    sample.classrooms.length === 0 ||
    !Array.isArray(sample.bindings)
  ) {
    invalidEvidence()
  }
  for (const campus of sample.campuses) {
    if (
      !campus ||
      !validIdentifier(campus.id) ||
      !validIdentifier(campus.tenantId) ||
      !['validated', 'inactive'].includes(campus.status)
    ) {
      invalidEvidence()
    }
  }
  for (const classroom of sample.classrooms) {
    if (
      !classroom ||
      !validIdentifier(classroom.id) ||
      !validIdentifier(classroom.tenantId) ||
      !validIdentifier(classroom.campusId) ||
      !['validated', 'inactive'].includes(classroom.status)
    ) {
      invalidEvidence()
    }
  }
  for (const binding of sample.bindings) {
    if (
      !binding ||
      !validIdentifier(binding.id) ||
      !validIdentifier(binding.tenantId) ||
      !validIdentifier(binding.legalEntityId) ||
      !validIdentifier(binding.campusId) ||
      !['validated', 'inactive'].includes(binding.status)
    ) {
      invalidEvidence()
    }
  }
}

function createEntityArtifact(
  sample: CampusMappingEvidenceSample
): CampusMappingEntityEvidenceArtifact {
  const activeCampuses = sample.campuses.filter(({ status }) => status === 'validated')
  const activeClassrooms = sample.classrooms.filter(({ status }) => status === 'validated')
  const activeBindings = sample.bindings.filter(({ status }) => status === 'validated')
  if (activeCampuses.length === 0 || activeClassrooms.length === 0) invalidEvidence()

  const campusIds = new Set(activeCampuses.map(({ id }) => id))
  const bindingCampusIds = new Set<string>()
  for (const binding of activeBindings) {
    if (binding.tenantId !== sample.tenantId || binding.legalEntityId !== sample.legalEntityId) {
      invalidEvidence()
    }
    if (!campusIds.has(binding.campusId) || bindingCampusIds.has(binding.campusId)) {
      invalidEvidence()
    }
    bindingCampusIds.add(binding.campusId)
  }
  if (bindingCampusIds.size !== activeCampuses.length) invalidEvidence()

  for (const classroom of activeClassrooms) {
    if (classroom.tenantId !== sample.tenantId || !campusIds.has(classroom.campusId)) {
      invalidEvidence()
    }
  }

  const campusMappingDigest = digest(
    JSON.stringify(
      activeCampuses
        .map(({ id, tenantId, status }) => [id, tenantId, status])
        .sort((left, right) => String(left[0]).localeCompare(String(right[0])))
    )
  )
  const classroomMappingDigest = digest(
    JSON.stringify(
      activeClassrooms
        .map(({ id, tenantId, campusId, status }) => [id, tenantId, campusId, status])
        .sort((left, right) => String(left[0]).localeCompare(String(right[0])))
    )
  )
  const bindingDigest = digest(
    JSON.stringify(
      activeBindings
        .map(({ id, tenantId, legalEntityId, campusId, status }) => [
          id,
          tenantId,
          legalEntityId,
          campusId,
          status,
        ])
        .sort((left, right) => String(left[0]).localeCompare(String(right[0])))
    )
  )
  const canonical = {
    schemaVersion: 1 as const,
    kind: 'cep_multi_entity_campus_mapping_entity_evidence' as const,
    role: sample.role,
    verdict: 'eligible_for_manual_binding' as const,
    scopeDigest: digest(`${sample.tenantId}\u0000${sample.legalEntityId}`),
    entityReviewReferenceDigest: digest(sample.entityReviewReference),
    pilotReviewReferenceDigest:
      sample.pilotReviewReference === undefined ? null : digest(sample.pilotReviewReference),
    campusMappingDigest,
    classroomMappingDigest,
    bindingDigest,
    validatedCampuses: activeCampuses.length,
    validatedClassrooms: activeClassrooms.length,
    validatedBindings: activeBindings.length,
  }
  const artifactDigest = digest(JSON.stringify(canonical))
  return Object.freeze({
    ...canonical,
    artifactDigest,
    evidenceReference: evidenceReference(artifactDigest),
  })
}

function assertEntityArtifact(value: CampusMappingEntityEvidenceArtifact): void {
  if (
    !value ||
    !exactKeys(value, ENTITY_ARTIFACT_KEYS) ||
    value.schemaVersion !== 1 ||
    value.kind !== 'cep_multi_entity_campus_mapping_entity_evidence' ||
    !['existing_entity', 'cep_sur_pilot'].includes(value.role) ||
    value.verdict !== 'eligible_for_manual_binding' ||
    !DIGEST_PATTERN.test(value.scopeDigest) ||
    !DIGEST_PATTERN.test(value.entityReviewReferenceDigest) ||
    (value.pilotReviewReferenceDigest !== null &&
      !DIGEST_PATTERN.test(value.pilotReviewReferenceDigest)) ||
    !DIGEST_PATTERN.test(value.campusMappingDigest) ||
    !DIGEST_PATTERN.test(value.classroomMappingDigest) ||
    !DIGEST_PATTERN.test(value.bindingDigest) ||
    !Number.isSafeInteger(value.validatedCampuses) ||
    value.validatedCampuses < 1 ||
    !Number.isSafeInteger(value.validatedClassrooms) ||
    value.validatedClassrooms < 1 ||
    !Number.isSafeInteger(value.validatedBindings) ||
    value.validatedBindings < 1 ||
    !DIGEST_PATTERN.test(value.artifactDigest) ||
    value.evidenceReference !== evidenceReference(value.artifactDigest)
  ) {
    invalidEvidence()
  }
  const canonical = {
    schemaVersion: 1 as const,
    kind: value.kind,
    role: value.role,
    verdict: value.verdict,
    scopeDigest: value.scopeDigest,
    entityReviewReferenceDigest: value.entityReviewReferenceDigest,
    pilotReviewReferenceDigest: value.pilotReviewReferenceDigest,
    campusMappingDigest: value.campusMappingDigest,
    classroomMappingDigest: value.classroomMappingDigest,
    bindingDigest: value.bindingDigest,
    validatedCampuses: value.validatedCampuses,
    validatedClassrooms: value.validatedClassrooms,
    validatedBindings: value.validatedBindings,
  }
  if (value.artifactDigest !== digest(JSON.stringify(canonical))) invalidEvidence()
}

function validIdentifier(value: unknown): value is string {
  return typeof value === 'string' && IDENTIFIER_PATTERN.test(value)
}

function exactKeys(value: object, expected: ReadonlySet<string>): boolean {
  const keys = Object.keys(value)
  return (
    keys.length === expected.size &&
    keys.every((key) => expected.has(key)) &&
    [...expected].every((key) => Object.prototype.hasOwnProperty.call(value, key))
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

function invalidEvidence(): never {
  throw new Error('MULTI_ENTITY_CAMPUS_MAPPING_EVIDENCE_INVALID')
}
