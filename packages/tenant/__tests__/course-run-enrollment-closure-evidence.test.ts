import { describe, expect, it } from 'vitest'

import type {
  CourseRunEnrollmentClosureCampaign,
  CourseRunEnrollmentClosureCourseRun,
  CourseRunEnrollmentClosureInput,
  CourseRunEnrollmentClosureScope,
  CourseRunEnrollmentClosureSession,
} from '../src/course-run-enrollment-closure'
import {
  assertCourseRunEnrollmentClosureEvidenceArtifact,
  createCourseRunEnrollmentClosureEvidenceArtifact,
  serializeCourseRunEnrollmentClosureEvidenceArtifact,
  type CourseRunEnrollmentClosureEvidenceInput,
  type CourseRunEnrollmentClosureEvidenceRole,
  type CourseRunEnrollmentClosureEvidenceSample,
} from '../src/course-run-enrollment-closure-evidence'

export const enrollmentClosureCampaignReviewReference =
  'review://campaign/cep-multi-entity/staging-v1'
export const enrollmentClosureReadinessReviewReference = 'review://staging/readiness/v1'
export const enrollmentClosureSourceDigest = `sha256:${'a'.repeat(64)}`
export const enrollmentClosureTargetTenantDigest = `sha256:${'b'.repeat(64)}`

const scope: CourseRunEnrollmentClosureScope = {
  tenantId: 'tenant-private',
  legalEntityId: 'entity-sur-private',
  courseRunId: 'run-private',
}

function courseRun(
  change: Partial<CourseRunEnrollmentClosureCourseRun> = {}
): CourseRunEnrollmentClosureCourseRun {
  return {
    ...scope,
    trainingType: 'private',
    operationalStatus: 'enrollment_open',
    enrollmentStatus: 'open',
    startDate: '2026-07-18T09:00:00+02:00',
    maxStudents: 20,
    currentEnrollments: 10,
    ...change,
  }
}

function sessions(): CourseRunEnrollmentClosureSession[] {
  return Array.from({ length: 7 }, (_, index) => ({
    ...scope,
    id: `session-private-${index + 1}`,
    startsAt: `2026-07-${String(18 + index).padStart(2, '0')}T09:00:00+02:00`,
    status: 'scheduled' as const,
  }))
}

function campaign(status: CourseRunEnrollmentClosureCampaign['status'] = 'active') {
  return { ...scope, id: 'campaign-private', status }
}

function base(
  change: Partial<CourseRunEnrollmentClosureInput> = {}
): CourseRunEnrollmentClosureInput {
  return {
    scope,
    now: '2026-07-17T12:00:00+02:00',
    courseRun: courseRun(),
    sessions: [],
    campaigns: [campaign()],
    ...change,
  }
}

function sample(
  role: CourseRunEnrollmentClosureEvidenceRole
): CourseRunEnrollmentClosureEvidenceSample {
  const reviewReference = `review://enrollment-closure/${role}/v1`
  if (role === 'before_start_open') {
    return { role, reviewReference, input: base() }
  }
  if (role === 'capacity_full_closes') {
    return {
      role,
      reviewReference,
      input: base({ courseRun: courseRun({ currentEnrollments: 20 }) }),
    }
  }
  if (role === 'sixth_session_open') {
    return {
      role,
      reviewReference,
      input: base({ now: '2026-07-23T10:00:00+02:00', sessions: sessions() }),
    }
  }
  if (role === 'seventh_session_closes') {
    return {
      role,
      reviewReference,
      input: base({ now: '2026-07-24T10:00:00+02:00', sessions: sessions() }),
    }
  }
  if (role === 'cycle_before_deadline_open') {
    return {
      role,
      reviewReference,
      input: base({
        now: '2026-09-15T12:00:00+02:00',
        courseRun: courseRun({
          trainingType: 'cycle',
          startDate: '2026-09-01T09:00:00+02:00',
          officialEnrollmentDeadline: '2026-09-30',
        }),
      }),
    }
  }
  if (role === 'cycle_after_deadline_closes') {
    return {
      role,
      reviewReference,
      input: base({
        now: '2026-10-01T12:00:00+02:00',
        courseRun: courseRun({
          trainingType: 'cycle',
          startDate: '2026-09-01T09:00:00+02:00',
          officialEnrollmentDeadline: '2026-09-30',
        }),
      }),
    }
  }
  if (role === 'cycle_missing_deadline_blocked') {
    return {
      role,
      reviewReference,
      input: base({
        now: '2026-09-15T12:00:00+02:00',
        courseRun: courseRun({
          trainingType: 'cycle',
          startDate: '2026-09-01T09:00:00+02:00',
        }),
      }),
    }
  }
  if (role === 'cross_scope_blocked') {
    const crossSessions = sessions()
    crossSessions[6] = { ...crossSessions[6]!, legalEntityId: 'entity-norte-private' }
    return {
      role,
      reviewReference,
      input: base({
        now: '2026-07-24T10:00:00+02:00',
        sessions: crossSessions,
        campaigns: [{ ...campaign(), tenantId: 'other-tenant-private' }],
      }),
    }
  }
  return {
    role,
    reviewReference,
    input: base({
      now: '2026-07-24T10:00:00+02:00',
      courseRun: courseRun({ enrollmentStatus: 'closed' }),
      sessions: sessions(),
      campaigns: [campaign('paused')],
    }),
  }
}

export function enrollmentClosureEvidenceSamples(): CourseRunEnrollmentClosureEvidenceSample[] {
  return [
    sample('before_start_open'),
    sample('capacity_full_closes'),
    sample('sixth_session_open'),
    sample('seventh_session_closes'),
    sample('cycle_before_deadline_open'),
    sample('cycle_after_deadline_closes'),
    sample('cycle_missing_deadline_blocked'),
    sample('cross_scope_blocked'),
    sample('paused_campaign_not_reactivated'),
  ]
}

export function enrollmentClosureEvidenceInput(): CourseRunEnrollmentClosureEvidenceInput {
  return {
    campaignReviewReference: enrollmentClosureCampaignReviewReference,
    readinessReviewReference: enrollmentClosureReadinessReviewReference,
    sourceDigest: enrollmentClosureSourceDigest,
    targetTenantDigest: enrollmentClosureTargetTenantDigest,
    samples: enrollmentClosureEvidenceSamples(),
  }
}

describe('course-run enrollment closure evidence', () => {
  it('seals nine semantic cases and four runner gates without operational authority', () => {
    const artifact = createCourseRunEnrollmentClosureEvidenceArtifact(
      enrollmentClosureEvidenceInput()
    )
    expect(artifact).toMatchObject({
      schemaVersion: 1,
      kind: 'cep_course_run_enrollment_closure_shadow_evidence',
      mode: 'nine_case_fail_closed_shadow_review',
      verdict: 'eligible_for_manual_staging_binding',
      canBindAutomatically: false,
      canMarkVerified: false,
      canLoadSnapshot: false,
      canWrite: false,
      canPauseAds: false,
      canExecutePause: false,
      canActivate: false,
      canChangePermissions: false,
      metrics: {
        requiredCases: 9,
        plannedCases: 7,
        blockedCases: 2,
        openCases: 3,
        closedCases: 4,
        proposedPauseCases: 3,
        runnerGateCases: 4,
        runnerBlockedCases: 3,
        runnerStagingCases: 1,
        snapshotLoads: 0,
        writes: 0,
        pausesExecuted: 0,
      },
    })
    expect(artifact.cases).toHaveLength(9)
    expect(() => assertCourseRunEnrollmentClosureEvidenceArtifact(artifact)).not.toThrow()
  })

  it('is deterministic under sample reordering', () => {
    const input = enrollmentClosureEvidenceInput()
    expect(
      serializeCourseRunEnrollmentClosureEvidenceArtifact({
        ...input,
        samples: [...input.samples].reverse(),
      })
    ).toBe(serializeCourseRunEnrollmentClosureEvidenceArtifact(input))
  })

  it('rejects missing, duplicate and mislabeled cases', () => {
    const input = enrollmentClosureEvidenceInput()
    for (const samples of [
      input.samples.slice(1),
      [
        input.samples[0]!,
        { ...input.samples[0]!, reviewReference: 'review://duplicate/v1' },
        ...input.samples.slice(2),
      ],
      input.samples.map((entry) =>
        entry.role === 'sixth_session_open'
          ? { ...entry, role: 'seventh_session_closes' as const }
          : entry
      ),
    ]) {
      expect(() => createCourseRunEnrollmentClosureEvidenceArtifact({ ...input, samples })).toThrow(
        'COURSE_RUN_ENROLLMENT_CLOSURE_EVIDENCE_INVALID'
      )
    }
  })

  it('rejects a cross-scope case that no longer crosses scope', () => {
    const input = enrollmentClosureEvidenceInput()
    const source = input.samples.find(({ role }) => role === 'cross_scope_blocked')!
    const local = {
      ...source,
      input: {
        ...source.input,
        sessions: sessions(),
        campaigns: [campaign()],
      },
    }
    expect(() =>
      createCourseRunEnrollmentClosureEvidenceArtifact({
        ...input,
        samples: input.samples.map((entry) =>
          entry.role === 'cross_scope_blocked' ? local : entry
        ),
      })
    ).toThrow('COURSE_RUN_ENROLLMENT_CLOSURE_EVIDENCE_INVALID')
  })

  it.each([
    ['artifact digest', { artifactDigest: `sha256:${'f'.repeat(64)}` }],
    ['write capability', { canWrite: true }],
    ['pause capability', { canExecutePause: true }],
    ['runner digest', { runnerContractDigest: `sha256:${'e'.repeat(64)}` }],
  ])('rejects forged sealed evidence: %s', (_label, change) => {
    const artifact = createCourseRunEnrollmentClosureEvidenceArtifact(
      enrollmentClosureEvidenceInput()
    )
    expect(() =>
      assertCourseRunEnrollmentClosureEvidenceArtifact({ ...artifact, ...change })
    ).toThrow('COURSE_RUN_ENROLLMENT_CLOSURE_EVIDENCE_INVALID')
  })

  it('redacts identifiers and exports no loader, write, pause or activation operation', async () => {
    const serialized = JSON.stringify(
      createCourseRunEnrollmentClosureEvidenceArtifact(enrollmentClosureEvidenceInput())
    )
    for (const value of [
      'tenant-private',
      'entity-sur-private',
      'entity-norte-private',
      'campaign-private',
      'session-private',
      'review://',
    ]) {
      expect(serialized).not.toContain(value)
    }
    const module = await import('../src/course-run-enrollment-closure-evidence')
    expect(
      Object.keys(module).filter((key) =>
        /load|execute|apply|write|pause|activate|permission/i.test(key)
      )
    ).toEqual([])
  })
})
