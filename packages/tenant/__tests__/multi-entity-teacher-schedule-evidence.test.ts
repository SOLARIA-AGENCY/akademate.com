import { describe, expect, it } from 'vitest'

import type {
  PayloadTeacherScheduleCourseRunRecord,
  PayloadTeacherScheduleSnapshot,
} from '../src/multi-entity-teacher-schedule-projection'
import {
  assertTeacherScheduleShadowEvidenceArtifact,
  createTeacherScheduleShadowEvidenceArtifact,
  serializeTeacherScheduleShadowEvidenceArtifact,
  type TeacherScheduleShadowEvidenceInput,
  type TeacherScheduleShadowEvidenceRole,
  type TeacherScheduleShadowEvidenceSample,
} from '../src/multi-entity-teacher-schedule-evidence'
import type { MultiEntityTopology } from '../src/multi-entity-topology'

const campaignReviewReference = 'review://campaign/cep-multi-entity/staging-v1'
const readinessReviewReference = 'review://staging/readiness/v1'
const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`

const topology: MultiEntityTopology = {
  legalEntities: [
    { id: 'entity-norte-private', tenantId: 'tenant-private', status: 'validated' },
    { id: 'entity-sur-private', tenantId: 'tenant-private', status: 'proposed' },
  ],
  campuses: [
    { id: 'campus-norte-private', tenantId: 'tenant-private' },
    { id: 'campus-sur-private', tenantId: 'tenant-private' },
  ],
  campusBindings: [
    {
      id: 'binding-norte-private',
      tenantId: 'tenant-private',
      legalEntityId: 'entity-norte-private',
      campusId: 'campus-norte-private',
      status: 'validated',
    },
    {
      id: 'binding-sur-private',
      tenantId: 'tenant-private',
      legalEntityId: 'entity-sur-private',
      campusId: 'campus-sur-private',
      status: 'proposed',
    },
  ],
  staffAssignments: [
    {
      id: 'assignment-norte-shared-private',
      tenantId: 'tenant-private',
      legalEntityId: 'entity-norte-private',
      staffId: 'teacher-shared-private',
      campusIds: ['campus-norte-private'],
      status: 'validated',
    },
    {
      id: 'assignment-sur-shared-private',
      tenantId: 'tenant-private',
      legalEntityId: 'entity-sur-private',
      staffId: 'teacher-shared-private',
      campusIds: ['campus-sur-private'],
      status: 'proposed',
    },
    {
      id: 'assignment-sur-other-private',
      tenantId: 'tenant-private',
      legalEntityId: 'entity-sur-private',
      staffId: 'teacher-other-private',
      campusIds: ['campus-sur-private'],
      status: 'validated',
    },
    {
      id: 'assignment-sur-ambiguous-1-private',
      tenantId: 'tenant-private',
      legalEntityId: 'entity-sur-private',
      staffId: 'teacher-ambiguous-private',
      campusIds: ['campus-sur-private'],
      status: 'suspended',
    },
    {
      id: 'assignment-sur-ambiguous-2-private',
      tenantId: 'tenant-private',
      legalEntityId: 'entity-sur-private',
      staffId: 'teacher-ambiguous-private',
      campusIds: ['campus-sur-private'],
      status: 'suspended',
    },
  ],
  accountingConnections: [],
}

const norteRun: PayloadTeacherScheduleCourseRunRecord = {
  id: 'run-norte-private',
  tenant: 'tenant-private',
  legalEntity: 'entity-norte-private',
  campus: 'campus-norte-private',
  instructor: 'teacher-shared-private',
  start_date: '2026-09-01',
  end_date: '2026-09-30',
  schedule_days: ['monday'],
  schedule_time_start: '09:00:00',
  schedule_time_end: '11:00:00',
  planning_status: 'published',
}

function surRun(
  change: Partial<PayloadTeacherScheduleCourseRunRecord> = {}
): PayloadTeacherScheduleCourseRunRecord {
  return {
    ...norteRun,
    id: 'run-sur-private',
    legalEntity: 'entity-sur-private',
    campus: 'campus-sur-private',
    ...change,
  }
}

function snapshot(
  courseRuns: readonly PayloadTeacherScheduleCourseRunRecord[]
): PayloadTeacherScheduleSnapshot {
  return { targetTenantId: 'tenant-private', topology, courseRuns }
}

function sample(role: TeacherScheduleShadowEvidenceRole): TeacherScheduleShadowEvidenceSample {
  const reviewReference = `review://teacher-schedule/${role}/v1`
  if (role === 'shared_non_overlapping_ready') {
    return {
      role,
      reviewReference,
      snapshot: snapshot([norteRun, surRun({ schedule_days: ['tuesday'] })]),
    }
  }
  if (role === 'shared_overlapping_blocked') {
    return {
      role,
      reviewReference,
      snapshot: snapshot([
        norteRun,
        surRun({ schedule_time_start: '10:00:00', schedule_time_end: '12:00:00' }),
      ]),
    }
  }
  if (role === 'adjacent_slots_ready') {
    return {
      role,
      reviewReference,
      snapshot: snapshot([
        norteRun,
        surRun({ schedule_time_start: '11:00:00', schedule_time_end: '13:00:00' }),
      ]),
    }
  }
  if (role === 'different_teacher_overlap_ready') {
    return {
      role,
      reviewReference,
      snapshot: snapshot([
        norteRun,
        surRun({
          instructor: 'teacher-other-private',
          schedule_time_start: '10:00:00',
          schedule_time_end: '12:00:00',
        }),
      ]),
    }
  }
  if (role === 'missing_assignment_blocked') {
    return {
      role,
      reviewReference,
      snapshot: snapshot([surRun({ instructor: 'teacher-missing-private' })]),
    }
  }
  if (role === 'ambiguous_assignment_blocked') {
    return {
      role,
      reviewReference,
      snapshot: snapshot([surRun({ instructor: 'teacher-ambiguous-private' })]),
    }
  }
  if (role === 'cross_tenant_blocked') {
    return {
      role,
      reviewReference,
      snapshot: snapshot([{ ...norteRun, tenant: 'other-tenant-private' }]),
    }
  }
  return {
    role,
    reviewReference,
    snapshot: snapshot([
      norteRun,
      surRun({
        planning_status: 'cancelled',
        schedule_time_start: '10:00:00',
        schedule_time_end: '12:00:00',
      }),
    ]),
  }
}

function samples(): TeacherScheduleShadowEvidenceSample[] {
  return [
    sample('shared_non_overlapping_ready'),
    sample('shared_overlapping_blocked'),
    sample('adjacent_slots_ready'),
    sample('different_teacher_overlap_ready'),
    sample('missing_assignment_blocked'),
    sample('ambiguous_assignment_blocked'),
    sample('cross_tenant_blocked'),
    sample('cancelled_overlap_ignored'),
  ]
}

function input(): TeacherScheduleShadowEvidenceInput {
  return {
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: samples(),
  }
}

describe('teacher schedule shadow evidence', () => {
  it('seals eight shared-teacher cases and four runner gates without authority', () => {
    const artifact = createTeacherScheduleShadowEvidenceArtifact(input())
    expect(artifact).toMatchObject({
      schemaVersion: 1,
      kind: 'cep_multi_entity_teacher_schedule_shadow_evidence',
      mode: 'eight_case_shared_teacher_schedule_review',
      verdict: 'eligible_for_manual_staging_binding',
      canBindAutomatically: false,
      canMarkVerified: false,
      canLoadSnapshot: false,
      canWrite: false,
      canApply: false,
      canAssignTeacher: false,
      canActivate: false,
      canChangePermissions: false,
      metrics: {
        requiredCases: 8,
        readyCases: 4,
        blockedCases: 4,
        projectionBlockedCases: 3,
        validationConflictCases: 1,
        sharedTeacherReadyCases: 2,
        runnerGateCases: 4,
        runnerBlockedCases: 3,
        runnerStagingCases: 1,
        snapshotLoads: 0,
        writes: 0,
        assignmentsChanged: 0,
      },
    })
    expect(artifact.cases).toHaveLength(8)
    expect(() => assertTeacherScheduleShadowEvidenceArtifact(artifact)).not.toThrow()
  })

  it('is deterministic under sample reordering', () => {
    const source = input()
    expect(
      serializeTeacherScheduleShadowEvidenceArtifact({
        ...source,
        samples: [...source.samples].reverse(),
      })
    ).toBe(serializeTeacherScheduleShadowEvidenceArtifact(source))
  })

  it('rejects missing, duplicate and mislabeled cases', () => {
    const source = input()
    for (const cases of [
      source.samples.slice(1),
      [
        source.samples[0]!,
        { ...source.samples[0]!, reviewReference: 'review://teacher-schedule/duplicate/v1' },
        ...source.samples.slice(2),
      ],
      source.samples.map((entry) =>
        entry.role === 'adjacent_slots_ready'
          ? { ...entry, role: 'shared_overlapping_blocked' as const }
          : entry
      ),
    ]) {
      expect(() =>
        createTeacherScheduleShadowEvidenceArtifact({ ...source, samples: cases })
      ).toThrow('TEACHER_SCHEDULE_SHADOW_EVIDENCE_INVALID')
    }
  })

  it('rejects a cross-tenant case changed back to the target tenant', () => {
    const source = input()
    const cross = source.samples.find(({ role }) => role === 'cross_tenant_blocked')!
    const local = {
      ...cross,
      snapshot: snapshot([norteRun]),
    }
    expect(() =>
      createTeacherScheduleShadowEvidenceArtifact({
        ...source,
        samples: source.samples.map((entry) =>
          entry.role === 'cross_tenant_blocked' ? local : entry
        ),
      })
    ).toThrow('TEACHER_SCHEDULE_SHADOW_EVIDENCE_INVALID')
  })

  it.each([
    ['artifact digest', { artifactDigest: `sha256:${'f'.repeat(64)}` }],
    ['write capability', { canWrite: true }],
    ['assignment capability', { canAssignTeacher: true }],
    ['runner digest', { runnerContractDigest: `sha256:${'e'.repeat(64)}` }],
  ])('rejects forged sealed evidence: %s', (_label, change) => {
    const artifact = createTeacherScheduleShadowEvidenceArtifact(input())
    expect(() => assertTeacherScheduleShadowEvidenceArtifact({ ...artifact, ...change })).toThrow(
      'TEACHER_SCHEDULE_SHADOW_EVIDENCE_INVALID'
    )
  })

  it('redacts identifiers and exports no loader, write or assignment operation', async () => {
    const serialized = JSON.stringify(createTeacherScheduleShadowEvidenceArtifact(input()))
    for (const value of [
      'tenant-private',
      'entity-norte-private',
      'campus-sur-private',
      'teacher-shared-private',
      'assignment-sur-shared-private',
      'run-norte-private',
      'review://',
    ]) {
      expect(serialized).not.toContain(value)
    }
    const module = await import('../src/multi-entity-teacher-schedule-evidence')
    expect(
      Object.keys(module).filter((key) =>
        /load|execute|apply|write|assign|activate|permission/i.test(key)
      )
    ).toEqual([])
  })
})
