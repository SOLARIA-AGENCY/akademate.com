import { createHash } from 'node:crypto'

import {
  validateMultiEntityTopology,
  type MultiEntityTopology,
  type MultiEntityTopologyIssueCode,
} from './multi-entity-topology'

export type SharedTeacherRegistryEvidenceRole =
  | 'three_entity_shared_master_ready'
  | 'same_entity_duplicate_active_blocked'
  | 'suspended_history_ready'
  | 'cross_entity_campus_blocked'
  | 'cross_tenant_assignment_blocked'
  | 'missing_entity_blocked'
  | 'independent_master_teachers_ready'

export interface SharedTeacherRegistryEvidenceSample {
  readonly role: SharedTeacherRegistryEvidenceRole
  readonly reviewReference: string
  readonly topology: MultiEntityTopology
}

export interface SharedTeacherRegistryEvidenceInput {
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly samples: readonly SharedTeacherRegistryEvidenceSample[]
}

export interface SharedTeacherRegistryEvidenceArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_multi_entity_shared_teacher_registry_evidence'
  readonly mode: 'seven_case_shared_master_teacher_review'
  readonly verdict: 'eligible_for_manual_staging_binding'
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canReadPayload: false
  readonly canWrite: false
  readonly canCreateTeacher: false
  readonly canAssignTeacher: false
  readonly canStoreEconomicTerms: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly cases: readonly {
    readonly role: SharedTeacherRegistryEvidenceRole
    readonly verdict: 'ready' | 'blocked'
    readonly expectedIssue: MultiEntityTopologyIssueCode | null
    readonly reviewReferenceDigest: string
    readonly observationDigest: string
    readonly legalEntities: number
    readonly campuses: number
    readonly assignments: number
    readonly activeAssignments: number
    readonly suspendedAssignments: number
    readonly distinctMasterTeachers: number
    readonly sharedMasterTeachers: number
    readonly issues: number
  }[]
  readonly metrics: {
    readonly requiredCases: 7
    readonly readyCases: 3
    readonly blockedCases: 4
    readonly sharedMasterReadyCases: 1
    readonly duplicateBlockedCases: 1
    readonly boundaryBlockedCases: 3
    readonly payloadReads: 0
    readonly writes: 0
    readonly teachersCreated: 0
    readonly assignmentsChanged: 0
    readonly economicTermsProcessed: 0
  }
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
}

type SealedCase = SharedTeacherRegistryEvidenceArtifact['cases'][number]
type RoleExpectation = Pick<SealedCase, 'verdict' | 'expectedIssue'> &
  Omit<
    SealedCase,
    'role' | 'verdict' | 'expectedIssue' | 'reviewReferenceDigest' | 'observationDigest'
  >

const ROLES: readonly SharedTeacherRegistryEvidenceRole[] = [
  'three_entity_shared_master_ready',
  'same_entity_duplicate_active_blocked',
  'suspended_history_ready',
  'cross_entity_campus_blocked',
  'cross_tenant_assignment_blocked',
  'missing_entity_blocked',
  'independent_master_teachers_ready',
]
const EXPECTED: Readonly<Record<SharedTeacherRegistryEvidenceRole, RoleExpectation>> =
  Object.freeze({
    three_entity_shared_master_ready: expectation('ready', null, 3, 3, 3, 3, 0, 1, 1, 0),
    same_entity_duplicate_active_blocked: expectation(
      'blocked',
      'staff_assignment_duplicate',
      1,
      1,
      2,
      2,
      0,
      1,
      0,
      1
    ),
    suspended_history_ready: expectation('ready', null, 1, 1, 2, 1, 1, 1, 0, 0),
    cross_entity_campus_blocked: expectation(
      'blocked',
      'staff_campus_out_of_entity',
      2,
      2,
      1,
      1,
      0,
      1,
      0,
      1
    ),
    cross_tenant_assignment_blocked: expectation(
      'blocked',
      'tenant_mismatch',
      1,
      0,
      1,
      1,
      0,
      1,
      0,
      1
    ),
    missing_entity_blocked: expectation('blocked', 'legal_entity_missing', 0, 0, 1, 1, 0, 1, 0, 1),
    independent_master_teachers_ready: expectation('ready', null, 3, 3, 3, 3, 0, 3, 0, 0),
  })

const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/
const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const INPUT_KEYS = new Set([
  'campaignReviewReference',
  'readinessReviewReference',
  'sourceDigest',
  'targetTenantDigest',
  'samples',
])
const SAMPLE_KEYS = new Set(['role', 'reviewReference', 'topology'])
const TOPOLOGY_KEYS = new Set([
  'legalEntities',
  'campuses',
  'campusBindings',
  'staffAssignments',
  'accountingConnections',
])
const LEGAL_ENTITY_KEYS = new Set(['id', 'tenantId', 'status'])
const CAMPUS_KEYS = new Set(['id', 'tenantId'])
const CAMPUS_BINDING_KEYS = new Set(['id', 'tenantId', 'legalEntityId', 'campusId', 'status'])
const ASSIGNMENT_KEYS = new Set([
  'id',
  'tenantId',
  'legalEntityId',
  'staffId',
  'campusIds',
  'status',
])
const ARTIFACT_KEYS = new Set([
  'schemaVersion',
  'kind',
  'mode',
  'verdict',
  'canBindAutomatically',
  'canMarkVerified',
  'canReadPayload',
  'canWrite',
  'canCreateTeacher',
  'canAssignTeacher',
  'canStoreEconomicTerms',
  'canActivate',
  'canChangePermissions',
  'sourceDigest',
  'targetTenantDigest',
  'campaignReviewReferenceDigest',
  'readinessReviewReferenceDigest',
  'cases',
  'metrics',
  'artifactDigest',
  'evidenceReference',
])
const CASE_KEYS = new Set([
  'role',
  'verdict',
  'expectedIssue',
  'reviewReferenceDigest',
  'observationDigest',
  'legalEntities',
  'campuses',
  'assignments',
  'activeAssignments',
  'suspendedAssignments',
  'distinctMasterTeachers',
  'sharedMasterTeachers',
  'issues',
])
const METRICS_KEYS = new Set([
  'requiredCases',
  'readyCases',
  'blockedCases',
  'sharedMasterReadyCases',
  'duplicateBlockedCases',
  'boundaryBlockedCases',
  'payloadReads',
  'writes',
  'teachersCreated',
  'assignmentsChanged',
  'economicTermsProcessed',
])

/** Reviews the shared-master topology in memory; it never loads or mutates teachers. */
export function createSharedTeacherRegistryEvidenceArtifact(
  input: SharedTeacherRegistryEvidenceInput
): SharedTeacherRegistryEvidenceArtifact {
  validateInput(input)
  const roles = new Set<SharedTeacherRegistryEvidenceRole>()
  const reviews = new Set([input.campaignReviewReference, input.readinessReviewReference])
  const cases = input.samples.map((sample) => {
    if (
      !sample ||
      typeof sample !== 'object' ||
      !exactKeys(sample, SAMPLE_KEYS) ||
      !ROLES.includes(sample.role) ||
      roles.has(sample.role) ||
      !REVIEW_REFERENCE_PATTERN.test(sample.reviewReference) ||
      reviews.has(sample.reviewReference)
    ) {
      invalidEvidence()
    }
    validateTopologyShape(sample.topology)
    roles.add(sample.role)
    reviews.add(sample.reviewReference)
    const observation = observe(sample.topology)
    const expected = EXPECTED[sample.role]
    if (
      !matchesCounts(observation, expected) ||
      (expected.expectedIssue === null
        ? observation.issueCodes.length !== 0
        : observation.issueCodes.length !== 1 ||
          observation.issueCodes[0] !== expected.expectedIssue)
    ) {
      invalidEvidence()
    }
    const { issueCodes: _issueCodes, ...redactedObservation } = observation
    return Object.freeze({
      role: sample.role,
      verdict: expected.verdict,
      expectedIssue: expected.expectedIssue,
      reviewReferenceDigest: digest(sample.reviewReference),
      observationDigest: digest(JSON.stringify(observation)),
      ...redactedObservation,
    })
  })
  if (!ROLES.every((role) => roles.has(role))) invalidEvidence()
  const canonicalCases = Object.freeze(cases.sort(compareCases))
  const canonical = artifactPayload({
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: digest(input.campaignReviewReference),
    readinessReviewReferenceDigest: digest(input.readinessReviewReference),
    cases: canonicalCases,
  })
  const artifactDigest = digest(JSON.stringify(canonical))
  const artifact = Object.freeze({
    ...canonical,
    artifactDigest,
    evidenceReference: evidenceReference(artifactDigest),
  })
  assertSharedTeacherRegistryEvidenceArtifact(artifact)
  return artifact
}

export function assertSharedTeacherRegistryEvidenceArtifact(
  value: unknown
): asserts value is SharedTeacherRegistryEvidenceArtifact {
  if (!value || typeof value !== 'object' || !exactKeys(value, ARTIFACT_KEYS)) invalidEvidence()
  const artifact = value as SharedTeacherRegistryEvidenceArtifact
  if (
    artifact.schemaVersion !== 1 ||
    artifact.kind !== 'cep_multi_entity_shared_teacher_registry_evidence' ||
    artifact.mode !== 'seven_case_shared_master_teacher_review' ||
    artifact.verdict !== 'eligible_for_manual_staging_binding' ||
    artifact.canBindAutomatically !== false ||
    artifact.canMarkVerified !== false ||
    artifact.canReadPayload !== false ||
    artifact.canWrite !== false ||
    artifact.canCreateTeacher !== false ||
    artifact.canAssignTeacher !== false ||
    artifact.canStoreEconomicTerms !== false ||
    artifact.canActivate !== false ||
    artifact.canChangePermissions !== false ||
    !validDigest(artifact.sourceDigest) ||
    !validDigest(artifact.targetTenantDigest) ||
    artifact.sourceDigest === artifact.targetTenantDigest ||
    !validDigest(artifact.campaignReviewReferenceDigest) ||
    !validDigest(artifact.readinessReviewReferenceDigest) ||
    artifact.campaignReviewReferenceDigest === artifact.readinessReviewReferenceDigest ||
    !Array.isArray(artifact.cases) ||
    artifact.cases.length !== 7 ||
    !artifact.metrics ||
    !exactKeys(artifact.metrics, METRICS_KEYS) ||
    artifact.metrics.requiredCases !== 7 ||
    artifact.metrics.readyCases !== 3 ||
    artifact.metrics.blockedCases !== 4 ||
    artifact.metrics.sharedMasterReadyCases !== 1 ||
    artifact.metrics.duplicateBlockedCases !== 1 ||
    artifact.metrics.boundaryBlockedCases !== 3 ||
    artifact.metrics.payloadReads !== 0 ||
    artifact.metrics.writes !== 0 ||
    artifact.metrics.teachersCreated !== 0 ||
    artifact.metrics.assignmentsChanged !== 0 ||
    artifact.metrics.economicTermsProcessed !== 0 ||
    artifact.evidenceReference !== evidenceReference(artifact.artifactDigest)
  ) {
    invalidEvidence()
  }
  validateCases(artifact.cases)
  const canonical = artifactPayload({
    sourceDigest: artifact.sourceDigest,
    targetTenantDigest: artifact.targetTenantDigest,
    campaignReviewReferenceDigest: artifact.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: artifact.readinessReviewReferenceDigest,
    cases: artifact.cases,
  })
  if (artifact.artifactDigest !== digest(JSON.stringify(canonical))) invalidEvidence()
}

export function serializeSharedTeacherRegistryEvidenceArtifact(
  input: SharedTeacherRegistryEvidenceInput
): string {
  return JSON.stringify(createSharedTeacherRegistryEvidenceArtifact(input))
}

function observe(
  topology: MultiEntityTopology
): Omit<
  SealedCase,
  'role' | 'verdict' | 'expectedIssue' | 'reviewReferenceDigest' | 'observationDigest'
> & { readonly issueCodes: readonly MultiEntityTopologyIssueCode[] } {
  const issues = validateMultiEntityTopology(topology)
  const active = topology.staffAssignments.filter(({ status }) => status !== 'suspended')
  const masterEntities = new Map<string, Set<string>>()
  for (const assignment of active) {
    const entities = masterEntities.get(assignment.staffId) ?? new Set<string>()
    entities.add(assignment.legalEntityId)
    masterEntities.set(assignment.staffId, entities)
  }
  return Object.freeze({
    legalEntities: topology.legalEntities.length,
    campuses: topology.campuses.length,
    assignments: topology.staffAssignments.length,
    activeAssignments: active.length,
    suspendedAssignments: topology.staffAssignments.length - active.length,
    distinctMasterTeachers: new Set(topology.staffAssignments.map(({ staffId }) => staffId)).size,
    sharedMasterTeachers: [...masterEntities.values()].filter((entities) => entities.size > 1)
      .length,
    issues: issues.length,
    issueCodes: Object.freeze(issues.map(({ code }) => code).sort()),
  })
}

function matchesCounts(
  observation: Omit<
    SealedCase,
    'role' | 'verdict' | 'expectedIssue' | 'reviewReferenceDigest' | 'observationDigest'
  >,
  expected: RoleExpectation
) {
  return (
    observation.legalEntities === expected.legalEntities &&
    observation.campuses === expected.campuses &&
    observation.assignments === expected.assignments &&
    observation.activeAssignments === expected.activeAssignments &&
    observation.suspendedAssignments === expected.suspendedAssignments &&
    observation.distinctMasterTeachers === expected.distinctMasterTeachers &&
    observation.sharedMasterTeachers === expected.sharedMasterTeachers &&
    observation.issues === expected.issues
  )
}

function validateCases(cases: readonly SealedCase[]): void {
  const roles = new Set<SharedTeacherRegistryEvidenceRole>()
  let previous = ''
  for (const item of cases) {
    const encoded = JSON.stringify(item)
    if (
      !item ||
      typeof item !== 'object' ||
      !exactKeys(item, CASE_KEYS) ||
      !ROLES.includes(item.role) ||
      roles.has(item.role) ||
      !validDigest(item.reviewReferenceDigest) ||
      !validDigest(item.observationDigest) ||
      !matchesCounts(item, EXPECTED[item.role]) ||
      item.verdict !== EXPECTED[item.role].verdict ||
      item.expectedIssue !== EXPECTED[item.role].expectedIssue ||
      (previous !== '' && previous.localeCompare(encoded) >= 0)
    ) {
      invalidEvidence()
    }
    roles.add(item.role)
    previous = encoded
  }
  if (!ROLES.every((role) => roles.has(role))) invalidEvidence()
}

function validateInput(input: SharedTeacherRegistryEvidenceInput): void {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    !REVIEW_REFERENCE_PATTERN.test(input.campaignReviewReference) ||
    !REVIEW_REFERENCE_PATTERN.test(input.readinessReviewReference) ||
    input.campaignReviewReference === input.readinessReviewReference ||
    !validDigest(input.sourceDigest) ||
    !validDigest(input.targetTenantDigest) ||
    input.sourceDigest === input.targetTenantDigest ||
    !Array.isArray(input.samples) ||
    input.samples.length !== 7
  ) {
    invalidEvidence()
  }
}

function validateTopologyShape(topology: MultiEntityTopology): void {
  if (
    !topology ||
    typeof topology !== 'object' ||
    !exactKeys(topology, TOPOLOGY_KEYS) ||
    !Array.isArray(topology.legalEntities) ||
    !topology.legalEntities.every((record) => exactKeys(record, LEGAL_ENTITY_KEYS)) ||
    !Array.isArray(topology.campuses) ||
    !topology.campuses.every((record) => exactKeys(record, CAMPUS_KEYS)) ||
    !Array.isArray(topology.campusBindings) ||
    !topology.campusBindings.every((record) => exactKeys(record, CAMPUS_BINDING_KEYS)) ||
    !Array.isArray(topology.staffAssignments) ||
    !topology.staffAssignments.every(
      (record) => exactKeys(record, ASSIGNMENT_KEYS) && Array.isArray(record.campusIds)
    ) ||
    !Array.isArray(topology.accountingConnections) ||
    topology.accountingConnections.length !== 0
  ) {
    invalidEvidence()
  }
}

function expectation(
  verdict: 'ready' | 'blocked',
  expectedIssue: MultiEntityTopologyIssueCode | null,
  legalEntities: number,
  campuses: number,
  assignments: number,
  activeAssignments: number,
  suspendedAssignments: number,
  distinctMasterTeachers: number,
  sharedMasterTeachers: number,
  issues: number
): RoleExpectation {
  return Object.freeze({
    verdict,
    expectedIssue,
    legalEntities,
    campuses,
    assignments,
    activeAssignments,
    suspendedAssignments,
    distinctMasterTeachers,
    sharedMasterTeachers,
    issues,
  })
}

function artifactPayload(input: {
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly cases: readonly SealedCase[]
}) {
  return Object.freeze({
    schemaVersion: 1 as const,
    kind: 'cep_multi_entity_shared_teacher_registry_evidence' as const,
    mode: 'seven_case_shared_master_teacher_review' as const,
    verdict: 'eligible_for_manual_staging_binding' as const,
    canBindAutomatically: false as const,
    canMarkVerified: false as const,
    canReadPayload: false as const,
    canWrite: false as const,
    canCreateTeacher: false as const,
    canAssignTeacher: false as const,
    canStoreEconomicTerms: false as const,
    canActivate: false as const,
    canChangePermissions: false as const,
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: input.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: input.readinessReviewReferenceDigest,
    cases: input.cases,
    metrics: Object.freeze({
      requiredCases: 7 as const,
      readyCases: 3 as const,
      blockedCases: 4 as const,
      sharedMasterReadyCases: 1 as const,
      duplicateBlockedCases: 1 as const,
      boundaryBlockedCases: 3 as const,
      payloadReads: 0 as const,
      writes: 0 as const,
      teachersCreated: 0 as const,
      assignmentsChanged: 0 as const,
      economicTermsProcessed: 0 as const,
    }),
  })
}

function compareCases(left: SealedCase, right: SealedCase): number {
  return JSON.stringify(left).localeCompare(JSON.stringify(right))
}

function exactKeys(value: object, expected: ReadonlySet<string>): boolean {
  const keys = Object.keys(value)
  return keys.length === expected.size && keys.every((key) => expected.has(key))
}

function validDigest(value: string): boolean {
  return DIGEST_PATTERN.test(value)
}

function digest(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function evidenceReference(value: string): `evidence://sha256/${string}` {
  return `evidence://sha256/${value.slice('sha256:'.length)}`
}

function invalidEvidence(): never {
  throw new Error('SHARED_TEACHER_REGISTRY_EVIDENCE_INVALID')
}
