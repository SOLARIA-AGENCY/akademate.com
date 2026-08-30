import { describe, expect, it } from 'vitest'

import {
  assertSharedCourseCatalogEvidenceArtifact,
  createSharedCourseCatalogEvidenceArtifact,
  serializeSharedCourseCatalogEvidenceArtifact,
  type SharedCourseCatalogEvidenceInput,
  type SharedCourseCatalogEvidenceRole,
  type SharedCourseCatalogReviewGraph,
} from '../src/multi-entity-course-catalog-evidence'
import type { MultiEntityTopology } from '../src/multi-entity-topology'

const campaignReviewReference = 'review://campaign/cep-multi-entity/staging-v1'
const readinessReviewReference = 'review://staging/readiness/v1'
const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`

function topology(): MultiEntityTopology {
  return {
    legalEntities: [1, 2, 3].map((index) => ({
      id: `entity-${index}-private`,
      tenantId: 'tenant-private',
      status: 'validated' as const,
    })),
    campuses: [1, 2, 3].map((index) => ({
      id: `campus-${index}-private`,
      tenantId: 'tenant-private',
    })),
    campusBindings: [1, 2, 3].map((index) => ({
      id: `binding-${index}-private`,
      tenantId: 'tenant-private',
      legalEntityId: `entity-${index}-private`,
      campusId: `campus-${index}-private`,
      status: 'validated' as const,
    })),
    staffAssignments: [1, 2, 3].map((index) => ({
      id: `assignment-${index}-private`,
      tenantId: 'tenant-private',
      legalEntityId: `entity-${index}-private`,
      staffId: 'teacher-shared-private',
      campusIds: [`campus-${index}-private`],
      status: 'validated' as const,
    })),
    accountingConnections: [],
  }
}

function classroom(index: number) {
  return {
    id: `classroom-${index}-private`,
    tenantId: 'tenant-private',
    legalEntityId: `entity-${index}-private`,
    campusId: `campus-${index}-private`,
  }
}

function run(index: number, courseId = 'course-shared-private') {
  return {
    id: `run-${index}-private`,
    tenantId: 'tenant-private',
    legalEntityId: `entity-${index}-private`,
    courseId,
    campusId: `campus-${index}-private`,
    classroomId: `classroom-${index}-private`,
    staffAssignmentIds: [`assignment-${index}-private`],
  }
}

function sharedGraph(): SharedCourseCatalogReviewGraph {
  return {
    topology: topology(),
    courses: [{ id: 'course-shared-private', tenantId: 'tenant-private' }],
    teachers: [{ id: 'teacher-shared-private', tenantId: 'tenant-private' }],
    classrooms: [classroom(1), classroom(2), classroom(3)],
    courseRuns: [run(1), run(2), run(3)],
  }
}

function graph(role: SharedCourseCatalogEvidenceRole): SharedCourseCatalogReviewGraph {
  const shared = sharedGraph()
  if (role === 'three_entity_shared_master_ready') return shared
  if (role === 'independent_master_courses_ready') {
    return {
      ...shared,
      courses: [1, 2, 3].map((index) => ({
        id: `course-${index}-private`,
        tenantId: 'tenant-private',
      })),
      courseRuns: [1, 2, 3].map((index) => run(index, `course-${index}-private`)),
    }
  }
  const one = { ...shared, classrooms: [classroom(1)], courseRuns: [run(1)] }
  if (role === 'duplicate_master_course_blocked') {
    return { ...one, courses: [shared.courses[0]!, shared.courses[0]!] }
  }
  if (role === 'missing_master_course_blocked') return { ...one, courses: [] }
  if (role === 'cross_tenant_master_course_blocked') {
    return { ...one, courses: [{ ...shared.courses[0]!, tenantId: 'other-tenant-private' }] }
  }
  if (role === 'cross_entity_campus_blocked') {
    return {
      topology: topology(),
      courses: shared.courses,
      teachers: [],
      classrooms: [],
      courseRuns: [
        {
          ...run(1),
          campusId: 'campus-2-private',
          classroomId: null,
          staffAssignmentIds: [],
        },
      ],
    }
  }
  if (role === 'cross_entity_classroom_blocked') {
    return {
      topology: topology(),
      courses: shared.courses,
      teachers: [],
      classrooms: [classroom(2)],
      courseRuns: [{ ...run(1), classroomId: 'classroom-2-private', staffAssignmentIds: [] }],
    }
  }
  return {
    topology: topology(),
    courses: shared.courses,
    teachers: shared.teachers,
    classrooms: [],
    courseRuns: [
      {
        ...run(1),
        classroomId: null,
        staffAssignmentIds: ['assignment-2-private'],
      },
    ],
  }
}

const roles: readonly SharedCourseCatalogEvidenceRole[] = [
  'three_entity_shared_master_ready',
  'independent_master_courses_ready',
  'duplicate_master_course_blocked',
  'missing_master_course_blocked',
  'cross_tenant_master_course_blocked',
  'cross_entity_campus_blocked',
  'cross_entity_classroom_blocked',
  'cross_entity_teacher_assignment_blocked',
]

function input(): SharedCourseCatalogEvidenceInput {
  return {
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: roles.map((role) => ({
      role,
      reviewReference: `review://course-catalog/${role}/v1`,
      graph: graph(role),
    })),
  }
}

describe('shared course catalog evidence', () => {
  it('seals shared masters and entity-local course runs without operational authority', () => {
    const artifact = createSharedCourseCatalogEvidenceArtifact(input())
    expect(artifact).toMatchObject({
      kind: 'cep_multi_entity_shared_course_catalog_evidence',
      mode: 'eight_case_shared_master_course_review',
      verdict: 'eligible_for_manual_staging_binding',
      canReadPayload: false,
      canWrite: false,
      canCreateCourse: false,
      canCreateCourseRun: false,
      canAssignCourseRun: false,
      canProcessEnrollments: false,
      canProcessCampaigns: false,
      canProcessFinance: false,
      canActivate: false,
      canChangePermissions: false,
      metrics: {
        requiredCases: 8,
        readyCases: 2,
        blockedCases: 6,
        sharedMasterReadyCases: 1,
        catalogIntegrityBlockedCases: 3,
        localOwnershipBlockedCases: 3,
        payloadReads: 0,
        writes: 0,
        coursesCreated: 0,
        courseRunsCreated: 0,
        assignmentsChanged: 0,
        enrollmentsProcessed: 0,
        campaignsProcessed: 0,
        financeRecordsProcessed: 0,
      },
    })
    expect(artifact.cases).toHaveLength(8)
    expect(() => assertSharedCourseCatalogEvidenceArtifact(artifact)).not.toThrow()
  })

  it('is deterministic under sample reordering', () => {
    const source = input()
    expect(
      serializeSharedCourseCatalogEvidenceArtifact({
        ...source,
        samples: [...source.samples].reverse(),
      })
    ).toBe(serializeSharedCourseCatalogEvidenceArtifact(source))
  })

  it('rejects missing, duplicate and mislabeled cases', () => {
    const source = input()
    for (const samples of [
      source.samples.slice(1),
      [
        source.samples[0]!,
        { ...source.samples[0]!, reviewReference: 'review://course-catalog/duplicate/v1' },
        ...source.samples.slice(2),
      ],
      source.samples.map((entry) =>
        entry.role === 'independent_master_courses_ready'
          ? { ...entry, role: 'three_entity_shared_master_ready' as const }
          : entry
      ),
    ]) {
      expect(() => createSharedCourseCatalogEvidenceArtifact({ ...source, samples })).toThrow(
        'SHARED_COURSE_CATALOG_EVIDENCE_INVALID'
      )
    }
  })

  it('rejects operational or financial collections outside the review graph', () => {
    const source = input()
    const first = source.samples[0]!
    for (const changedGraph of [
      { ...first.graph, enrollments: [] },
      { ...first.graph, campaigns: [] },
      { ...first.graph, advertisingSpends: [] },
      { ...first.graph, financeRecords: [] },
    ] as unknown as SharedCourseCatalogReviewGraph[]) {
      expect(() =>
        createSharedCourseCatalogEvidenceArtifact({
          ...source,
          samples: source.samples.map((entry, index) =>
            index === 0 ? { ...entry, graph: changedGraph } : entry
          ),
        })
      ).toThrow('SHARED_COURSE_CATALOG_EVIDENCE_INVALID')
    }
  })

  it.each([
    ['digest', { artifactDigest: `sha256:${'f'.repeat(64)}` }],
    ['write', { canWrite: true }],
    ['create course', { canCreateCourse: true }],
    ['process finance', { canProcessFinance: true }],
  ])('rejects forged sealed evidence: %s', (_label, change) => {
    const artifact = createSharedCourseCatalogEvidenceArtifact(input())
    expect(() => assertSharedCourseCatalogEvidenceArtifact({ ...artifact, ...change })).toThrow(
      'SHARED_COURSE_CATALOG_EVIDENCE_INVALID'
    )
  })

  it('redacts source identifiers and exports no operational function', async () => {
    const serialized = JSON.stringify(createSharedCourseCatalogEvidenceArtifact(input()))
    for (const value of [
      'tenant-private',
      'entity-1-private',
      'course-shared-private',
      'run-1-private',
      'classroom-1-private',
      'review://',
    ]) {
      expect(serialized).not.toContain(value)
    }
    const module = await import('../src/multi-entity-course-catalog-evidence')
    expect(
      Object.keys(module).some((key) =>
        /load|write|createCourse|assignCourseRun|finance/i.test(key)
      )
    ).toBe(false)
  })
})
