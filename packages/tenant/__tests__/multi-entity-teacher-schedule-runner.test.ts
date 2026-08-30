import { describe, expect, it, vi } from 'vitest'
import {
  MULTI_ENTITY_TEACHER_SCHEDULE_SHADOW_RUNNER_ENVIRONMENT,
  MULTI_ENTITY_TEACHER_SCHEDULE_SHADOW_RUNNER_FLAG,
  resolveTeacherScheduleShadowRunnerGate,
  runTeacherScheduleShadowEvidence,
} from '../src/multi-entity-teacher-schedule-runner'
import type { PayloadTeacherScheduleSnapshot } from '../src/multi-entity-teacher-schedule-projection'

const enabledEnvironment = {
  [MULTI_ENTITY_TEACHER_SCHEDULE_SHADOW_RUNNER_FLAG]: 'true',
  [MULTI_ENTITY_TEACHER_SCHEDULE_SHADOW_RUNNER_ENVIRONMENT]: 'staging',
}

const input: PayloadTeacherScheduleSnapshot = {
  targetTenantId: 'tenant-secret',
  topology: {
    legalEntities: [{ id: 'entity-secret', tenantId: 'tenant-secret', status: 'validated' }],
    campuses: [{ id: 'campus-secret', tenantId: 'tenant-secret' }],
    campusBindings: [
      {
        id: 'binding-secret',
        tenantId: 'tenant-secret',
        legalEntityId: 'entity-secret',
        campusId: 'campus-secret',
        status: 'validated',
      },
    ],
    staffAssignments: [
      {
        id: 'assignment-secret',
        tenantId: 'tenant-secret',
        legalEntityId: 'entity-secret',
        staffId: 'teacher-secret',
        campusIds: ['campus-secret'],
        status: 'validated',
      },
    ],
    accountingConnections: [],
  },
  courseRuns: [
    {
      id: 'run-secret',
      tenant: 'tenant-secret',
      legalEntity: 'entity-secret',
      campus: 'campus-secret',
      instructor: 'teacher-secret',
      start_date: '2026-09-01',
      end_date: '2026-09-30',
      schedule_days: ['monday'],
      schedule_time_start: '09:00:00',
      schedule_time_end: '11:00:00',
      planning_status: 'published',
    },
  ],
}

describe('teacher schedule staging-only shadow runner', () => {
  it('does not call the loader when the feature flag is disabled', async () => {
    const loadSnapshot = vi.fn(async () => input)

    await expect(
      runTeacherScheduleShadowEvidence({ environment: {}, loadSnapshot })
    ).resolves.toEqual({
      status: 'skipped',
      reason: 'flag_disabled',
      canWrite: false,
      canApply: false,
    })
    expect(loadSnapshot).not.toHaveBeenCalled()
  })

  it.each([
    [
      { [MULTI_ENTITY_TEACHER_SCHEDULE_SHADOW_RUNNER_FLAG]: 'true' },
      'environment_missing_or_invalid',
    ],
    [
      {
        [MULTI_ENTITY_TEACHER_SCHEDULE_SHADOW_RUNNER_FLAG]: 'true',
        [MULTI_ENTITY_TEACHER_SCHEDULE_SHADOW_RUNNER_ENVIRONMENT]: 'development',
      },
      'environment_missing_or_invalid',
    ],
    [
      {
        [MULTI_ENTITY_TEACHER_SCHEDULE_SHADOW_RUNNER_FLAG]: 'true',
        [MULTI_ENTITY_TEACHER_SCHEDULE_SHADOW_RUNNER_ENVIRONMENT]: 'production',
      },
      'production_forbidden',
    ],
  ])('fails closed outside explicit staging: %o', async (environment, reason) => {
    const loadSnapshot = vi.fn(async () => input)

    expect(resolveTeacherScheduleShadowRunnerGate(environment)).toEqual({
      enabled: false,
      reason,
    })
    const result = await runTeacherScheduleShadowEvidence({ environment, loadSnapshot })
    expect(result).toMatchObject({ status: 'skipped', reason })
    expect(loadSnapshot).not.toHaveBeenCalled()
  })

  it('loads exactly once and exposes only redacted aggregate evidence', async () => {
    const loadSnapshot = vi.fn(async () => input)
    const result = await runTeacherScheduleShadowEvidence({
      environment: enabledEnvironment,
      loadSnapshot,
    })

    expect(loadSnapshot).toHaveBeenCalledTimes(1)
    expect(result).toMatchObject({
      status: 'observed',
      reason: 'shadow_observed',
      canWrite: false,
      canApply: false,
      observation: {
        verdict: 'ready',
        projection: { sourceCourseRuns: 1, projectedCourseRuns: 1 },
        validation: { conflicts: 0 },
      },
    })
    expect(Object.keys(result)).toEqual([
      'status',
      'reason',
      'canWrite',
      'canApply',
      'observation',
      'serializedObservation',
    ])
    const serialized = JSON.stringify(result)
    for (const secret of [
      'tenant-secret',
      'entity-secret',
      'campus-secret',
      'binding-secret',
      'assignment-secret',
      'teacher-secret',
      'run-secret',
    ]) {
      expect(serialized).not.toContain(secret)
    }
  })

  it('returns blocked evidence as an observation rather than a runner failure', async () => {
    const result = await runTeacherScheduleShadowEvidence({
      environment: enabledEnvironment,
      loadSnapshot: async () => ({
        ...input,
        courseRuns: [{ ...input.courseRuns[0]!, legalEntity: undefined }],
      }),
    })

    expect(result).toMatchObject({
      status: 'observed',
      observation: {
        verdict: 'blocked',
        projectionIssueCounts: { legal_entity_relationship_missing: 1 },
      },
    })
  })

  it('redacts loader failures', async () => {
    const result = await runTeacherScheduleShadowEvidence({
      environment: enabledEnvironment,
      loadSnapshot: async () => {
        throw new Error('teacher-secret bearer-secret')
      },
    })

    expect(result).toEqual({
      status: 'failed',
      reason: 'snapshot_load_failed',
      canWrite: false,
      canApply: false,
    })
    expect(JSON.stringify(result)).not.toContain('bearer-secret')
  })

  it('redacts malformed snapshot failures', async () => {
    const result = await runTeacherScheduleShadowEvidence({
      environment: enabledEnvironment,
      loadSnapshot: async () => null as never,
    })

    expect(result).toEqual({
      status: 'failed',
      reason: 'shadow_planning_failed',
      canWrite: false,
      canApply: false,
    })
  })
})
