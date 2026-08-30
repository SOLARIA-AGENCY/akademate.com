import { createHash } from 'node:crypto'

import {
  validateMultiEntityResourceOwnership,
  type ClassroomOwnershipRecord,
  type CourseRunOwnershipRecord,
  type MasterCourseResourceRecord,
  type MasterTeacherResourceRecord,
  type MultiEntityOperationalResources,
  type MultiEntityResourceIssueCode,
} from './multi-entity-resources'
import { validateMultiEntityTopology, type MultiEntityTopology } from './multi-entity-topology'

export type SharedCourseCatalogEvidenceRole =
  | 'three_entity_shared_master_ready'
  | 'independent_master_courses_ready'
  | 'duplicate_master_course_blocked'
  | 'missing_master_course_blocked'
  | 'cross_tenant_master_course_blocked'
  | 'cross_entity_campus_blocked'
  | 'cross_entity_classroom_blocked'
  | 'cross_entity_teacher_assignment_blocked'

export interface SharedCourseCatalogReviewGraph {
  readonly topology: MultiEntityTopology
  readonly courses: readonly MasterCourseResourceRecord[]
  readonly teachers: readonly MasterTeacherResourceRecord[]
  readonly classrooms: readonly ClassroomOwnershipRecord[]
  readonly courseRuns: readonly CourseRunOwnershipRecord[]
}

export interface SharedCourseCatalogEvidenceSample {
  readonly role: SharedCourseCatalogEvidenceRole
  readonly reviewReference: string
  readonly graph: SharedCourseCatalogReviewGraph
}

export interface SharedCourseCatalogEvidenceInput {
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly samples: readonly SharedCourseCatalogEvidenceSample[]
}

export interface SharedCourseCatalogEvidenceArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_multi_entity_shared_course_catalog_evidence'
  readonly mode: 'eight_case_shared_master_course_review'
  readonly verdict: 'eligible_for_manual_staging_binding'
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canReadPayload: false
  readonly canWrite: false
  readonly canCreateCourse: false
  readonly canCreateCourseRun: false
  readonly canAssignCourseRun: false
  readonly canProcessEnrollments: false
  readonly canProcessCampaigns: false
  readonly canProcessFinance: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly cases: readonly {
    readonly role: SharedCourseCatalogEvidenceRole
    readonly verdict: 'ready' | 'blocked'
    readonly expectedIssues: readonly MultiEntityResourceIssueCode[]
    readonly reviewReferenceDigest: string
    readonly observationDigest: string
    readonly masterCourses: number
    readonly distinctMasterCourses: number
    readonly courseRuns: number
    readonly legalEntitiesUsed: number
    readonly campusesUsed: number
    readonly classroomsUsed: number
    readonly teacherAssignmentsUsed: number
    readonly sharedMasterCourses: number
    readonly issues: number
  }[]
  readonly metrics: {
    readonly requiredCases: 8
    readonly readyCases: 2
    readonly blockedCases: 6
    readonly sharedMasterReadyCases: 1
    readonly catalogIntegrityBlockedCases: 3
    readonly localOwnershipBlockedCases: 3
    readonly payloadReads: 0
    readonly writes: 0
    readonly coursesCreated: 0
    readonly courseRunsCreated: 0
    readonly assignmentsChanged: 0
    readonly enrollmentsProcessed: 0
    readonly campaignsProcessed: 0
    readonly financeRecordsProcessed: 0
  }
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
}

type SealedCase = SharedCourseCatalogEvidenceArtifact['cases'][number]
type Counts = Omit<
  SealedCase,
  'role' | 'verdict' | 'expectedIssues' | 'reviewReferenceDigest' | 'observationDigest'
>
type RoleExpectation = Pick<SealedCase, 'verdict' | 'expectedIssues'> & Counts

const ROLES: readonly SharedCourseCatalogEvidenceRole[] = [
  'three_entity_shared_master_ready',
  'independent_master_courses_ready',
  'duplicate_master_course_blocked',
  'missing_master_course_blocked',
  'cross_tenant_master_course_blocked',
  'cross_entity_campus_blocked',
  'cross_entity_classroom_blocked',
  'cross_entity_teacher_assignment_blocked',
]
const EXPECTED: Readonly<Record<SharedCourseCatalogEvidenceRole, RoleExpectation>> = Object.freeze({
  three_entity_shared_master_ready: expectation('ready', [], 1, 1, 3, 3, 3, 3, 3, 1),
  independent_master_courses_ready: expectation('ready', [], 3, 3, 3, 3, 3, 3, 3, 0),
  duplicate_master_course_blocked: expectation(
    'blocked',
    ['duplicate_record_id'],
    2,
    1,
    1,
    1,
    1,
    1,
    1,
    0
  ),
  missing_master_course_blocked: expectation('blocked', ['course_missing'], 0, 0, 1, 1, 1, 1, 1, 0),
  cross_tenant_master_course_blocked: expectation(
    'blocked',
    ['tenant_mismatch'],
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    0
  ),
  cross_entity_campus_blocked: expectation(
    'blocked',
    ['campus_out_of_entity'],
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    0
  ),
  cross_entity_classroom_blocked: expectation(
    'blocked',
    ['classroom_campus_mismatch', 'classroom_entity_mismatch'],
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0
  ),
  cross_entity_teacher_assignment_blocked: expectation(
    'blocked',
    ['staff_assignment_campus_mismatch', 'staff_assignment_entity_mismatch'],
    1,
    1,
    1,
    1,
    1,
    0,
    1,
    0
  ),
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
const SAMPLE_KEYS = new Set(['role', 'reviewReference', 'graph'])
const GRAPH_KEYS = new Set(['topology', 'courses', 'teachers', 'classrooms', 'courseRuns'])
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
const MASTER_KEYS = new Set(['id', 'tenantId'])
const CLASSROOM_KEYS = new Set(['id', 'tenantId', 'legalEntityId', 'campusId'])
const COURSE_RUN_KEYS = new Set([
  'id',
  'tenantId',
  'legalEntityId',
  'courseId',
  'campusId',
  'classroomId',
  'staffAssignmentIds',
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
  'canCreateCourse',
  'canCreateCourseRun',
  'canAssignCourseRun',
  'canProcessEnrollments',
  'canProcessCampaigns',
  'canProcessFinance',
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
  'expectedIssues',
  'reviewReferenceDigest',
  'observationDigest',
  'masterCourses',
  'distinctMasterCourses',
  'courseRuns',
  'legalEntitiesUsed',
  'campusesUsed',
  'classroomsUsed',
  'teacherAssignmentsUsed',
  'sharedMasterCourses',
  'issues',
])
const METRICS_KEYS = new Set([
  'requiredCases',
  'readyCases',
  'blockedCases',
  'sharedMasterReadyCases',
  'catalogIntegrityBlockedCases',
  'localOwnershipBlockedCases',
  'payloadReads',
  'writes',
  'coursesCreated',
  'courseRunsCreated',
  'assignmentsChanged',
  'enrollmentsProcessed',
  'campaignsProcessed',
  'financeRecordsProcessed',
])

/** Reviews master-course sharing and entity-local course runs entirely in memory. */
export function createSharedCourseCatalogEvidenceArtifact(
  input: SharedCourseCatalogEvidenceInput
): SharedCourseCatalogEvidenceArtifact {
  validateInput(input)
  const roles = new Set<SharedCourseCatalogEvidenceRole>()
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
    validateGraphShape(sample.graph)
    if (validateMultiEntityTopology(sample.graph.topology).length !== 0) invalidEvidence()
    roles.add(sample.role)
    reviews.add(sample.reviewReference)
    const observation = observe(sample.graph)
    const expected = EXPECTED[sample.role]
    if (!matches(observation, expected)) invalidEvidence()
    const { issueCodes: _issueCodes, ...counts } = observation
    return Object.freeze({
      role: sample.role,
      verdict: expected.verdict,
      expectedIssues: Object.freeze([...expected.expectedIssues]),
      reviewReferenceDigest: digest(sample.reviewReference),
      observationDigest: digest(JSON.stringify(observation)),
      ...counts,
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
  assertSharedCourseCatalogEvidenceArtifact(artifact)
  return artifact
}

export function assertSharedCourseCatalogEvidenceArtifact(
  value: unknown
): asserts value is SharedCourseCatalogEvidenceArtifact {
  if (!value || typeof value !== 'object' || !exactKeys(value, ARTIFACT_KEYS)) invalidEvidence()
  const artifact = value as SharedCourseCatalogEvidenceArtifact
  if (
    artifact.schemaVersion !== 1 ||
    artifact.kind !== 'cep_multi_entity_shared_course_catalog_evidence' ||
    artifact.mode !== 'eight_case_shared_master_course_review' ||
    artifact.verdict !== 'eligible_for_manual_staging_binding' ||
    artifact.canBindAutomatically !== false ||
    artifact.canMarkVerified !== false ||
    artifact.canReadPayload !== false ||
    artifact.canWrite !== false ||
    artifact.canCreateCourse !== false ||
    artifact.canCreateCourseRun !== false ||
    artifact.canAssignCourseRun !== false ||
    artifact.canProcessEnrollments !== false ||
    artifact.canProcessCampaigns !== false ||
    artifact.canProcessFinance !== false ||
    artifact.canActivate !== false ||
    artifact.canChangePermissions !== false ||
    !validDigest(artifact.sourceDigest) ||
    !validDigest(artifact.targetTenantDigest) ||
    artifact.sourceDigest === artifact.targetTenantDigest ||
    !validDigest(artifact.campaignReviewReferenceDigest) ||
    !validDigest(artifact.readinessReviewReferenceDigest) ||
    artifact.campaignReviewReferenceDigest === artifact.readinessReviewReferenceDigest ||
    !Array.isArray(artifact.cases) ||
    artifact.cases.length !== 8 ||
    !artifact.metrics ||
    !exactKeys(artifact.metrics, METRICS_KEYS) ||
    artifact.metrics.requiredCases !== 8 ||
    artifact.metrics.readyCases !== 2 ||
    artifact.metrics.blockedCases !== 6 ||
    artifact.metrics.sharedMasterReadyCases !== 1 ||
    artifact.metrics.catalogIntegrityBlockedCases !== 3 ||
    artifact.metrics.localOwnershipBlockedCases !== 3 ||
    artifact.metrics.payloadReads !== 0 ||
    artifact.metrics.writes !== 0 ||
    artifact.metrics.coursesCreated !== 0 ||
    artifact.metrics.courseRunsCreated !== 0 ||
    artifact.metrics.assignmentsChanged !== 0 ||
    artifact.metrics.enrollmentsProcessed !== 0 ||
    artifact.metrics.campaignsProcessed !== 0 ||
    artifact.metrics.financeRecordsProcessed !== 0 ||
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

export function serializeSharedCourseCatalogEvidenceArtifact(
  input: SharedCourseCatalogEvidenceInput
): string {
  return JSON.stringify(createSharedCourseCatalogEvidenceArtifact(input))
}

function observe(graph: SharedCourseCatalogReviewGraph): Counts & {
  readonly issueCodes: readonly MultiEntityResourceIssueCode[]
} {
  const resources: MultiEntityOperationalResources = {
    ...graph,
    enrollments: [],
    campaigns: [],
    leads: [],
    advertisingSpends: [],
  }
  const issues = validateMultiEntityResourceOwnership(resources)
  const courseEntities = new Map<string, Set<string>>()
  for (const run of graph.courseRuns) {
    const entities = courseEntities.get(run.courseId) ?? new Set<string>()
    entities.add(run.legalEntityId)
    courseEntities.set(run.courseId, entities)
  }
  return Object.freeze({
    masterCourses: graph.courses.length,
    distinctMasterCourses: new Set(graph.courses.map(({ id }) => id)).size,
    courseRuns: graph.courseRuns.length,
    legalEntitiesUsed: new Set(graph.courseRuns.map(({ legalEntityId }) => legalEntityId)).size,
    campusesUsed: new Set(graph.courseRuns.flatMap(({ campusId }) => (campusId ? [campusId] : [])))
      .size,
    classroomsUsed: new Set(
      graph.courseRuns.flatMap(({ classroomId }) => (classroomId ? [classroomId] : []))
    ).size,
    teacherAssignmentsUsed: new Set(
      graph.courseRuns.flatMap(({ staffAssignmentIds }) => staffAssignmentIds)
    ).size,
    sharedMasterCourses: [...courseEntities.values()].filter((entities) => entities.size > 1)
      .length,
    issues: issues.length,
    issueCodes: Object.freeze(issues.map(({ code }) => code)),
  })
}

function matches(
  observation: Counts & { readonly issueCodes?: readonly MultiEntityResourceIssueCode[] },
  expected: RoleExpectation
): boolean {
  return (
    observation.masterCourses === expected.masterCourses &&
    observation.distinctMasterCourses === expected.distinctMasterCourses &&
    observation.courseRuns === expected.courseRuns &&
    observation.legalEntitiesUsed === expected.legalEntitiesUsed &&
    observation.campusesUsed === expected.campusesUsed &&
    observation.classroomsUsed === expected.classroomsUsed &&
    observation.teacherAssignmentsUsed === expected.teacherAssignmentsUsed &&
    observation.sharedMasterCourses === expected.sharedMasterCourses &&
    observation.issues === expected.issues &&
    (observation.issueCodes === undefined ||
      JSON.stringify(observation.issueCodes) === JSON.stringify(expected.expectedIssues))
  )
}

function validateCases(cases: readonly SealedCase[]): void {
  const roles = new Set<SharedCourseCatalogEvidenceRole>()
  let previous = ''
  for (const item of cases) {
    const encoded = JSON.stringify(item)
    const expected = EXPECTED[item.role]
    if (
      !item ||
      typeof item !== 'object' ||
      !exactKeys(item, CASE_KEYS) ||
      !ROLES.includes(item.role) ||
      roles.has(item.role) ||
      !expected ||
      item.verdict !== expected.verdict ||
      JSON.stringify(item.expectedIssues) !== JSON.stringify(expected.expectedIssues) ||
      !matches(item, expected) ||
      !validDigest(item.reviewReferenceDigest) ||
      !validDigest(item.observationDigest) ||
      (previous !== '' && previous.localeCompare(encoded) >= 0)
    ) {
      invalidEvidence()
    }
    roles.add(item.role)
    previous = encoded
  }
  if (!ROLES.every((role) => roles.has(role))) invalidEvidence()
}

function validateInput(input: SharedCourseCatalogEvidenceInput): void {
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
    input.samples.length !== 8
  ) {
    invalidEvidence()
  }
}

function validateGraphShape(graph: SharedCourseCatalogReviewGraph): void {
  const topology = graph?.topology
  if (
    !graph ||
    typeof graph !== 'object' ||
    !exactKeys(graph, GRAPH_KEYS) ||
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
    topology.accountingConnections.length !== 0 ||
    !Array.isArray(graph.courses) ||
    !graph.courses.every((record) => exactKeys(record, MASTER_KEYS)) ||
    !Array.isArray(graph.teachers) ||
    !graph.teachers.every((record) => exactKeys(record, MASTER_KEYS)) ||
    !Array.isArray(graph.classrooms) ||
    !graph.classrooms.every((record) => exactKeys(record, CLASSROOM_KEYS)) ||
    !Array.isArray(graph.courseRuns) ||
    !graph.courseRuns.every(
      (record) => exactKeys(record, COURSE_RUN_KEYS) && Array.isArray(record.staffAssignmentIds)
    )
  ) {
    invalidEvidence()
  }
}

function expectation(
  verdict: 'ready' | 'blocked',
  expectedIssues: readonly MultiEntityResourceIssueCode[],
  masterCourses: number,
  distinctMasterCourses: number,
  courseRuns: number,
  legalEntitiesUsed: number,
  campusesUsed: number,
  classroomsUsed: number,
  teacherAssignmentsUsed: number,
  sharedMasterCourses: number
): RoleExpectation {
  return Object.freeze({
    verdict,
    expectedIssues: Object.freeze([...expectedIssues]),
    masterCourses,
    distinctMasterCourses,
    courseRuns,
    legalEntitiesUsed,
    campusesUsed,
    classroomsUsed,
    teacherAssignmentsUsed,
    sharedMasterCourses,
    issues: expectedIssues.length,
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
    kind: 'cep_multi_entity_shared_course_catalog_evidence' as const,
    mode: 'eight_case_shared_master_course_review' as const,
    verdict: 'eligible_for_manual_staging_binding' as const,
    canBindAutomatically: false as const,
    canMarkVerified: false as const,
    canReadPayload: false as const,
    canWrite: false as const,
    canCreateCourse: false as const,
    canCreateCourseRun: false as const,
    canAssignCourseRun: false as const,
    canProcessEnrollments: false as const,
    canProcessCampaigns: false as const,
    canProcessFinance: false as const,
    canActivate: false as const,
    canChangePermissions: false as const,
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: input.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: input.readinessReviewReferenceDigest,
    cases: input.cases,
    metrics: Object.freeze({
      requiredCases: 8 as const,
      readyCases: 2 as const,
      blockedCases: 6 as const,
      sharedMasterReadyCases: 1 as const,
      catalogIntegrityBlockedCases: 3 as const,
      localOwnershipBlockedCases: 3 as const,
      payloadReads: 0 as const,
      writes: 0 as const,
      coursesCreated: 0 as const,
      courseRunsCreated: 0 as const,
      assignmentsChanged: 0 as const,
      enrollmentsProcessed: 0 as const,
      campaignsProcessed: 0 as const,
      financeRecordsProcessed: 0 as const,
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
  throw new Error('SHARED_COURSE_CATALOG_EVIDENCE_INVALID')
}
