import { describe, expect, it } from 'vitest'

import {
  COURSE_RUN_ENROLLMENT_MAX_JOINED_SESSIONS,
  createRedactedCourseRunEnrollmentClosureObservation,
  planCourseRunEnrollmentClosure,
  type CourseRunEnrollmentClosureInput,
  type CourseRunEnrollmentClosureSession,
} from '../src/course-run-enrollment-closure'

const scope = {
  tenantId: 'tenant-cep',
  legalEntityId: 'entity-sur',
  courseRunId: 'run-1',
} as const

function sessions(
  seventhStartsAt = '2026-07-25T09:00:00+01:00'
): CourseRunEnrollmentClosureSession[] {
  return Array.from({ length: 7 }, (_, index) => ({
    ...scope,
    id: `session-${index + 1}`,
    startsAt:
      index === 6
        ? seventhStartsAt
        : `2026-07-${String(19 + index).padStart(2, '0')}T09:00:00+01:00`,
    status: index < 5 ? ('completed' as const) : ('scheduled' as const),
  }))
}

function input(
  change: Partial<CourseRunEnrollmentClosureInput> = {}
): CourseRunEnrollmentClosureInput {
  return {
    scope,
    now: '2026-07-24T12:00:00+01:00',
    courseRun: {
      ...scope,
      trainingType: 'private',
      operationalStatus: 'in_progress',
      enrollmentStatus: 'open',
      startDate: '2026-07-19T09:00:00+01:00',
      maxStudents: 20,
      currentEnrollments: 12,
    },
    sessions: sessions(),
    campaigns: [
      { ...scope, id: 'campaign-active', status: 'active' },
      { ...scope, id: 'campaign-paused', status: 'paused' },
    ],
    ...change,
  }
}

function expectCode(action: () => unknown, code: string): void {
  expect(action).toThrowError(expect.objectContaining({ code }))
}

describe('course-run enrollment closure policy', () => {
  it('keeps an ordinary course open through the first six sessions', () => {
    const plan = planCourseRunEnrollmentClosure(input())

    expect(COURSE_RUN_ENROLLMENT_MAX_JOINED_SESSIONS).toBe(6)
    expect(plan).toMatchObject({
      ready: true,
      canWrite: false,
      canPauseAds: false,
      decision: {
        recommendedEnrollmentStatus: 'open',
        reason: 'open_within_session_limit',
        elapsedSessions: 6,
        courseOperationalStatusUnchanged: true,
      },
      campaignActions: [],
    })
  })

  it('closes at the start of the seventh session and only proposes pausing active campaigns', () => {
    const plan = planCourseRunEnrollmentClosure(input({ now: '2026-07-25T09:00:00+01:00' }))

    expect(plan).toMatchObject({
      ready: true,
      decision: {
        currentEnrollmentStatus: 'open',
        recommendedEnrollmentStatus: 'closed',
        reason: 'session_limit_reached',
        elapsedSessions: 7,
        courseOperationalStatusUnchanged: true,
      },
      campaignActions: [
        {
          campaignId: 'campaign-active',
          operation: 'propose_pause',
          reason: 'session_limit_reached',
        },
      ],
      summary: { activeCampaigns: 1, proposedPauses: 1 },
    })
  })

  it('closes for full capacity before the course starts', () => {
    const source = input({
      now: '2026-07-18T12:00:00+01:00',
      sessions: [],
    })
    const plan = planCourseRunEnrollmentClosure({
      ...source,
      courseRun: { ...source.courseRun, currentEnrollments: 20 },
    })

    expect(plan.decision).toMatchObject({
      recommendedEnrollmentStatus: 'closed',
      reason: 'capacity_full',
    })
    expect(plan.campaignActions).toHaveLength(1)
  })

  it('does not expose a draft run as open or propose advertising changes', () => {
    const source = input({ now: '2026-07-18T12:00:00+01:00', sessions: [] })
    const plan = planCourseRunEnrollmentClosure({
      ...source,
      courseRun: { ...source.courseRun, operationalStatus: 'draft' },
    })

    expect(plan.decision).toMatchObject({
      recommendedEnrollmentStatus: 'scheduled',
      reason: 'scheduled',
    })
    expect(plan.campaignActions).toEqual([])
  })

  it('uses an inclusive annual official deadline for cycles instead of session count', () => {
    const source = input({ sessions: [] })
    const cycle = {
      ...source.courseRun,
      trainingType: 'cycle' as const,
      officialEnrollmentDeadline: '2026-09-30',
    }

    const onDeadline = planCourseRunEnrollmentClosure({
      ...source,
      now: '2026-09-30T23:30:00+02:00',
      courseRun: cycle,
    })
    const afterDeadline = planCourseRunEnrollmentClosure({
      ...source,
      now: '2026-10-01T00:01:00+02:00',
      courseRun: cycle,
    })

    expect(onDeadline.decision.reason).toBe('open_before_official_deadline')
    expect(afterDeadline.decision).toMatchObject({
      recommendedEnrollmentStatus: 'closed',
      reason: 'official_deadline_passed',
    })
  })

  it('blocks cycles without an official deadline and never proposes a pause', () => {
    const source = input({ sessions: [] })
    const plan = planCourseRunEnrollmentClosure({
      ...source,
      courseRun: { ...source.courseRun, trainingType: 'cycle' },
    })

    expect(plan).toMatchObject({
      ready: false,
      decision: { reason: 'blocked', recommendedEnrollmentStatus: 'open' },
      campaignActions: [],
      issues: [{ code: 'official_deadline_missing', surface: 'course_run' }],
    })
  })

  it('blocks a missing or incomplete ordinary-session calendar after start', () => {
    const missing = planCourseRunEnrollmentClosure(input({ sessions: [] }))
    const incomplete = planCourseRunEnrollmentClosure(input({ sessions: sessions().slice(0, 6) }))

    expect(missing.issues).toContainEqual({
      code: 'session_calendar_missing',
      surface: 'session',
    })
    expect(incomplete.issues).toContainEqual({
      code: 'session_calendar_incomplete',
      surface: 'session',
    })
    expect(missing.campaignActions).toEqual([])
    expect(incomplete.campaignActions).toEqual([])
  })

  it('fails closed on cross-entity sessions or campaigns', () => {
    const source = input()
    const plan = planCourseRunEnrollmentClosure({
      ...source,
      sessions: [
        ...source.sessions.slice(0, 6),
        { ...source.sessions[6]!, legalEntityId: 'entity-norte' },
      ],
      campaigns: [{ ...source.campaigns[0]!, tenantId: 'another-tenant' }],
    })

    expect(plan.ready).toBe(false)
    expect(plan.issues).toEqual([
      { code: 'scope_mismatch', surface: 'campaign' },
      { code: 'scope_mismatch', surface: 'session' },
    ])
    expect(plan.campaignActions).toEqual([])
  })

  it('keeps manual closure closed and never auto-reactivates a paused campaign', () => {
    const source = input({ campaigns: [{ ...scope, id: 'campaign-paused', status: 'paused' }] })
    const plan = planCourseRunEnrollmentClosure({
      ...source,
      courseRun: { ...source.courseRun, enrollmentStatus: 'closed' },
    })

    expect(plan.decision.reason).toBe('manual_closure')
    expect(plan.campaignActions).toEqual([])
  })

  it('emits an identifier-free observation', () => {
    const observation = createRedactedCourseRunEnrollmentClosureObservation(
      planCourseRunEnrollmentClosure(input({ now: '2026-07-25T09:00:00+01:00' }))
    )
    const serialized = JSON.stringify(observation)

    expect(observation).toMatchObject({
      verdict: 'planned',
      canWrite: false,
      canPauseAds: false,
      decision: { reason: 'session_limit_reached' },
      metrics: { proposedPauses: 1 },
    })
    expect(serialized).not.toContain('tenant-cep')
    expect(serialized).not.toContain('entity-sur')
    expect(serialized).not.toContain('campaign-active')
  })

  it('rejects duplicate records, unknown fields and timestamps without an offset', () => {
    const source = input()
    for (const invalid of [
      { ...source, sessions: [source.sessions[0]!, source.sessions[0]!] },
      { ...source, now: '2026-07-24T12:00:00' },
      { ...source, operatorEmail: 'private@cep.test' },
    ]) {
      expectCode(
        () => planCourseRunEnrollmentClosure(invalid as CourseRunEnrollmentClosureInput),
        'COURSE_RUN_ENROLLMENT_CLOSURE_INPUT_INVALID'
      )
    }
  })
})
