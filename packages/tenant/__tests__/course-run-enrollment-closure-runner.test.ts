import { describe, expect, it, vi } from 'vitest'

import {
  COURSE_RUN_ENROLLMENT_CLOSURE_ENVIRONMENT,
  COURSE_RUN_ENROLLMENT_CLOSURE_SHADOW_FLAG,
  resolveCourseRunEnrollmentClosureRunnerGate,
  runCourseRunEnrollmentClosureShadow,
} from '../src/course-run-enrollment-closure-runner'
import type { CourseRunEnrollmentClosureInput } from '../src/course-run-enrollment-closure'

const snapshot: CourseRunEnrollmentClosureInput = {
  scope: { tenantId: 'tenant-cep', legalEntityId: 'entity-sur', courseRunId: 'run-1' },
  now: '2026-07-18T12:00:00+01:00',
  courseRun: {
    tenantId: 'tenant-cep',
    legalEntityId: 'entity-sur',
    courseRunId: 'run-1',
    trainingType: 'private',
    operationalStatus: 'published',
    enrollmentStatus: 'open',
    startDate: '2026-07-19T09:00:00+01:00',
    maxStudents: 20,
    currentEnrollments: 20,
  },
  sessions: [],
  campaigns: [
    {
      tenantId: 'tenant-cep',
      legalEntityId: 'entity-sur',
      courseRunId: 'run-1',
      id: 'campaign-1',
      status: 'active',
    },
  ],
}

const staging = {
  [COURSE_RUN_ENROLLMENT_CLOSURE_SHADOW_FLAG]: 'true',
  [COURSE_RUN_ENROLLMENT_CLOSURE_ENVIRONMENT]: 'staging',
}

describe('course-run enrollment closure shadow runner', () => {
  it('does not invoke the loader when disabled or in production', async () => {
    const loadSnapshot = vi.fn(async () => snapshot)

    expect(resolveCourseRunEnrollmentClosureRunnerGate({})).toEqual({
      enabled: false,
      reason: 'flag_disabled',
    })
    expect(
      resolveCourseRunEnrollmentClosureRunnerGate({
        ...staging,
        [COURSE_RUN_ENROLLMENT_CLOSURE_ENVIRONMENT]: 'production',
      })
    ).toEqual({ enabled: false, reason: 'production_forbidden' })
    await runCourseRunEnrollmentClosureShadow({ loadSnapshot, environment: {} })
    await runCourseRunEnrollmentClosureShadow({
      loadSnapshot,
      environment: {
        ...staging,
        [COURSE_RUN_ENROLLMENT_CLOSURE_ENVIRONMENT]: 'production',
      },
    })

    expect(loadSnapshot).not.toHaveBeenCalled()
  })

  it('observes one staging snapshot without exposing identifiers or apply capabilities', async () => {
    const result = await runCourseRunEnrollmentClosureShadow({
      loadSnapshot: async () => snapshot,
      environment: staging,
    })

    expect(result).toMatchObject({
      status: 'observed',
      reason: 'shadow_observed',
      canWrite: false,
      canPauseAds: false,
      observation: {
        verdict: 'planned',
        decision: { reason: 'capacity_full' },
        metrics: { proposedPauses: 1 },
      },
    })
    expect(JSON.stringify(result)).not.toContain('tenant-cep')
    expect(JSON.stringify(result)).not.toContain('campaign-1')
  })

  it('redacts loader and planner failures to static reasons', async () => {
    const loadFailure = await runCourseRunEnrollmentClosureShadow({
      loadSnapshot: async () => {
        throw new Error('secret provider token')
      },
      environment: staging,
    })
    const planFailure = await runCourseRunEnrollmentClosureShadow({
      loadSnapshot: async () => ({ ...snapshot, now: 'invalid' }),
      environment: staging,
    })

    expect(loadFailure).toEqual({
      status: 'failed',
      reason: 'snapshot_load_failed',
      canWrite: false,
      canPauseAds: false,
    })
    expect(planFailure).toEqual({
      status: 'failed',
      reason: 'shadow_plan_failed',
      canWrite: false,
      canPauseAds: false,
    })
    expect(JSON.stringify([loadFailure, planFailure])).not.toContain('secret')
  })

  it('fails closed for an invalid runner configuration', async () => {
    await expect(runCourseRunEnrollmentClosureShadow(undefined as never)).resolves.toEqual({
      status: 'failed',
      reason: 'snapshot_load_failed',
      canWrite: false,
      canPauseAds: false,
    })
  })
})
