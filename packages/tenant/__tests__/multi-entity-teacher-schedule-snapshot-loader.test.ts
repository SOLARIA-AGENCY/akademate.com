import { describe, expect, it, vi } from 'vitest'
import {
  TeacherScheduleSnapshotLoaderError,
  createTeacherScheduleSnapshotLoader,
  loadTeacherScheduleSnapshot,
  type TeacherScheduleSnapshotLoaderOptions,
  type TeacherScheduleSnapshotPage,
} from '../src/multi-entity-teacher-schedule-snapshot-loader'
import {
  MULTI_ENTITY_TEACHER_SCHEDULE_SHADOW_RUNNER_ENVIRONMENT,
  MULTI_ENTITY_TEACHER_SCHEDULE_SHADOW_RUNNER_FLAG,
  runTeacherScheduleShadowEvidence,
} from '../src/multi-entity-teacher-schedule-runner'
import type { MultiEntityTopology } from '../src/multi-entity-topology'

const topology: MultiEntityTopology = {
  legalEntities: [
    { id: 'entity-norte', tenantId: 'cep', status: 'validated' },
    { id: 'entity-sur', tenantId: 'cep', status: 'proposed' },
  ],
  campuses: [
    { id: 'campus-norte', tenantId: 'cep' },
    { id: 'campus-sur', tenantId: 'cep' },
  ],
  campusBindings: [
    {
      id: 'binding-norte',
      tenantId: 'cep',
      legalEntityId: 'entity-norte',
      campusId: 'campus-norte',
      status: 'validated',
    },
    {
      id: 'binding-sur',
      tenantId: 'cep',
      legalEntityId: 'entity-sur',
      campusId: 'campus-sur',
      status: 'proposed',
    },
  ],
  staffAssignments: [
    {
      id: 'assignment-norte',
      tenantId: 'cep',
      legalEntityId: 'entity-norte',
      staffId: 'teacher-shared',
      campusIds: ['campus-norte'],
      status: 'validated',
    },
    {
      id: 'assignment-sur',
      tenantId: 'cep',
      legalEntityId: 'entity-sur',
      staffId: 'teacher-shared',
      campusIds: ['campus-sur'],
      status: 'proposed',
    },
  ],
  accountingConnections: [],
}

const baseRun = {
  id: 'run-norte',
  tenant: 'cep',
  campus: 'campus-norte',
  instructor: 'teacher-shared',
  start_date: '2026-09-01',
  end_date: '2026-09-30',
  schedule_days: ['monday'],
  schedule_time_start: '09:00:00',
  schedule_time_end: '11:00:00',
  planning_status: 'published',
} as const

function page(
  docs: TeacherScheduleSnapshotPage['docs'],
  pageNumber: number,
  totalDocs: number,
  totalPages: number
): TeacherScheduleSnapshotPage {
  const hasNextPage = pageNumber < totalPages
  return {
    docs,
    page: pageNumber,
    totalDocs,
    totalPages,
    hasNextPage,
    nextPage: hasNextPage ? pageNumber + 1 : null,
  }
}

function optionsWith(
  readCourseRunsPage: TeacherScheduleSnapshotLoaderOptions['readCourseRunsPage'],
  overrides: Partial<TeacherScheduleSnapshotLoaderOptions> = {}
): TeacherScheduleSnapshotLoaderOptions {
  return {
    targetTenantId: 'cep',
    topology,
    reviewedEntityResolutions: [
      {
        courseRunId: 'run-norte',
        legalEntityId: 'entity-norte',
        reviewReference: 'review://course-run/run-norte',
      },
    ],
    readCourseRunsPage,
    pageSize: 1,
    maxPages: 10,
    maxRecords: 10,
    ...overrides,
  }
}

function expectLoaderCode(action: () => Promise<unknown>, code: string): Promise<void> {
  return expect(action()).rejects.toEqual(
    expect.objectContaining<Partial<TeacherScheduleSnapshotLoaderError>>({ code })
  )
}

describe('teacher schedule staging snapshot loader', () => {
  it('loads stable pages with current access and enriches only reviewed entity resolutions', async () => {
    const secondRun = {
      ...baseRun,
      id: 'run-sur',
      legalEntity: 'entity-sur',
      campus: 'campus-sur',
      schedule_time_start: '11:00:00',
      schedule_time_end: '13:00:00',
    }
    const pages = [page([baseRun], 1, 2, 2), page([secondRun], 2, 2, 2)]
    const before = JSON.stringify(pages)
    const readCourseRunsPage = vi.fn(async ({ page: pageNumber }) => pages[pageNumber - 1]!)

    const snapshot = await loadTeacherScheduleSnapshot(optionsWith(readCourseRunsPage))

    expect(JSON.stringify(pages)).toBe(before)
    expect(readCourseRunsPage).toHaveBeenNthCalledWith(1, {
      tenantId: 'cep',
      page: 1,
      limit: 1,
      depth: 0,
      overrideAccess: false,
      accessMode: 'current_effective_access',
    })
    expect(readCourseRunsPage).toHaveBeenNthCalledWith(2, {
      tenantId: 'cep',
      page: 2,
      limit: 1,
      depth: 0,
      overrideAccess: false,
      accessMode: 'current_effective_access',
    })
    expect(snapshot).toMatchObject({
      targetTenantId: 'cep',
      maxCourseRuns: 10,
      courseRuns: [
        { id: 'run-norte', legalEntity: 'entity-norte' },
        { id: 'run-sur', legalEntity: 'entity-sur' },
      ],
    })
    expect(Object.isFrozen(snapshot.courseRuns)).toBe(true)
    expect(Object.isFrozen(snapshot.courseRuns[0])).toBe(true)
  })

  it('leaves an unresolved entity absent instead of inferring it from campus', async () => {
    const snapshot = await loadTeacherScheduleSnapshot(
      optionsWith(async () => page([baseRun], 1, 1, 1), {
        reviewedEntityResolutions: [],
      })
    )

    expect(snapshot.courseRuns[0]).not.toHaveProperty('legalEntity')
  })

  it('rejects records outside the requested tenant', async () => {
    await expectLoaderCode(
      () =>
        loadTeacherScheduleSnapshot(
          optionsWith(async () => page([{ ...baseRun, tenant: 'other-tenant' }], 1, 1, 1))
        ),
      'TEACHER_SCHEDULE_SNAPSHOT_TENANT_BOUNDARY_VIOLATION'
    )
  })

  it('rejects duplicate course runs across pages', async () => {
    const pages = [page([baseRun], 1, 2, 2), page([baseRun], 2, 2, 2)]
    await expectLoaderCode(
      () =>
        loadTeacherScheduleSnapshot(
          optionsWith(async ({ page: pageNumber }) => pages[pageNumber - 1]!)
        ),
      'TEACHER_SCHEDULE_SNAPSHOT_DUPLICATE_COURSE_RUN'
    )
  })

  it('rejects pagination metadata that changes between pages', async () => {
    const pages = [page([baseRun], 1, 2, 2), page([{ ...baseRun, id: 'run-sur' }], 2, 3, 3)]
    await expectLoaderCode(
      () =>
        loadTeacherScheduleSnapshot(
          optionsWith(async ({ page: pageNumber }) => pages[pageNumber - 1]!)
        ),
      'TEACHER_SCHEDULE_SNAPSHOT_PAGINATION_CHANGED'
    )
  })

  it('rejects duplicate, invalid and conflicting reviewed resolutions', async () => {
    const reader = async () => page([baseRun], 1, 1, 1)
    await expectLoaderCode(
      () =>
        loadTeacherScheduleSnapshot(
          optionsWith(reader, {
            reviewedEntityResolutions: [
              {
                courseRunId: 'run-norte',
                legalEntityId: 'entity-norte',
                reviewReference: 'review://course-run/one',
              },
              {
                courseRunId: 'run-norte',
                legalEntityId: 'entity-norte',
                reviewReference: 'review://course-run/two',
              },
            ],
          })
        ),
      'TEACHER_SCHEDULE_SNAPSHOT_RESOLUTION_DUPLICATE'
    )
    await expectLoaderCode(
      () =>
        loadTeacherScheduleSnapshot(
          optionsWith(reader, {
            reviewedEntityResolutions: [
              {
                courseRunId: 'run-norte',
                legalEntityId: 'missing-entity',
                reviewReference: 'not-reviewed',
              },
            ],
          })
        ),
      'TEACHER_SCHEDULE_SNAPSHOT_RESOLUTION_INVALID'
    )
    await expectLoaderCode(
      () =>
        loadTeacherScheduleSnapshot(
          optionsWith(async () => page([{ ...baseRun, legalEntity: 'entity-sur' }], 1, 1, 1))
        ),
      'TEACHER_SCHEDULE_SNAPSHOT_ENTITY_RESOLUTION_CONFLICT'
    )
  })

  it('enforces page and record bounds before accepting the snapshot', async () => {
    await expectLoaderCode(
      () =>
        loadTeacherScheduleSnapshot(
          optionsWith(async () => page([baseRun], 1, 2, 2), { maxPages: 1 })
        ),
      'TEACHER_SCHEDULE_SNAPSHOT_PAGE_LIMIT_EXCEEDED'
    )
    await expectLoaderCode(
      () =>
        loadTeacherScheduleSnapshot(
          optionsWith(async () => page([baseRun], 1, 2, 2), { maxRecords: 1 })
        ),
      'TEACHER_SCHEDULE_SNAPSHOT_RECORD_LIMIT_EXCEEDED'
    )
  })

  it('rejects malformed loader configuration before reading', async () => {
    const readCourseRunsPage = vi.fn(async () => page([], 1, 0, 0))
    await expectLoaderCode(
      () =>
        loadTeacherScheduleSnapshot(optionsWith(readCourseRunsPage, { topology: null as never })),
      'TEACHER_SCHEDULE_SNAPSHOT_INVALID_CONFIGURATION'
    )
    expect(readCourseRunsPage).not.toHaveBeenCalled()
  })

  it('composes with the staging runner without exposing snapshot identifiers', async () => {
    const loadSnapshot = createTeacherScheduleSnapshotLoader(
      optionsWith(async () => page([baseRun], 1, 1, 1))
    )
    const result = await runTeacherScheduleShadowEvidence({
      environment: {
        [MULTI_ENTITY_TEACHER_SCHEDULE_SHADOW_RUNNER_FLAG]: 'true',
        [MULTI_ENTITY_TEACHER_SCHEDULE_SHADOW_RUNNER_ENVIRONMENT]: 'staging',
      },
      loadSnapshot,
    })

    expect(result).toMatchObject({
      status: 'observed',
      observation: { verdict: 'ready', projection: { projectedCourseRuns: 1 } },
    })
    expect(JSON.stringify(result)).not.toContain('run-norte')
    expect(JSON.stringify(result)).not.toContain('teacher-shared')
  })
})
