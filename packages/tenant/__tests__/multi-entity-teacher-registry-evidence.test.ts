import { describe, expect, it } from 'vitest'

import {
  assertSharedTeacherRegistryEvidenceArtifact,
  createSharedTeacherRegistryEvidenceArtifact,
  serializeSharedTeacherRegistryEvidenceArtifact,
  type SharedTeacherRegistryEvidenceInput,
  type SharedTeacherRegistryEvidenceRole,
  type SharedTeacherRegistryEvidenceSample,
} from '../src/multi-entity-teacher-registry-evidence'
import type { MultiEntityTopology } from '../src/multi-entity-topology'

const campaignReviewReference = 'review://campaign/cep-multi-entity/staging-v1'
const readinessReviewReference = 'review://staging/readiness/v1'
const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`

function entity(index: number, tenantId = 'tenant-private') {
  return { id: `entity-${index}-private`, tenantId, status: 'validated' as const }
}

function campus(index: number, tenantId = 'tenant-private') {
  return { id: `campus-${index}-private`, tenantId }
}

function binding(index: number, legalEntityId = `entity-${index}-private`) {
  return {
    id: `binding-${index}-private`,
    tenantId: 'tenant-private',
    legalEntityId,
    campusId: `campus-${index}-private`,
    status: 'validated' as const,
  }
}

function assignment(
  index: number,
  staffId = 'teacher-shared-private',
  change: Partial<MultiEntityTopology['staffAssignments'][number]> = {}
) {
  return {
    id: `assignment-${index}-${staffId}-private`,
    tenantId: 'tenant-private',
    legalEntityId: `entity-${index}-private`,
    staffId,
    campusIds: [`campus-${index}-private`],
    status: 'validated' as const,
    ...change,
  }
}

function topology(
  legalEntities: MultiEntityTopology['legalEntities'],
  campuses: MultiEntityTopology['campuses'],
  campusBindings: MultiEntityTopology['campusBindings'],
  staffAssignments: MultiEntityTopology['staffAssignments']
): MultiEntityTopology {
  return { legalEntities, campuses, campusBindings, staffAssignments, accountingConnections: [] }
}

function sample(role: SharedTeacherRegistryEvidenceRole): SharedTeacherRegistryEvidenceSample {
  const reviewReference = `review://teacher-registry/${role}/v1`
  if (role === 'three_entity_shared_master_ready') {
    return {
      role,
      reviewReference,
      topology: topology(
        [entity(1), entity(2), entity(3)],
        [campus(1), campus(2), campus(3)],
        [binding(1), binding(2), binding(3)],
        [assignment(1), assignment(2), assignment(3)]
      ),
    }
  }
  if (role === 'same_entity_duplicate_active_blocked') {
    return {
      role,
      reviewReference,
      topology: topology(
        [entity(1)],
        [campus(1)],
        [binding(1)],
        [
          assignment(1),
          assignment(1, 'teacher-shared-private', { id: 'assignment-duplicate-private' }),
        ]
      ),
    }
  }
  if (role === 'suspended_history_ready') {
    return {
      role,
      reviewReference,
      topology: topology(
        [entity(1)],
        [campus(1)],
        [binding(1)],
        [
          assignment(1),
          assignment(1, 'teacher-shared-private', {
            id: 'assignment-old-private',
            status: 'suspended',
          }),
        ]
      ),
    }
  }
  if (role === 'cross_entity_campus_blocked') {
    return {
      role,
      reviewReference,
      topology: topology(
        [entity(1), entity(2)],
        [campus(1), campus(2)],
        [binding(1), binding(2)],
        [assignment(1, 'teacher-shared-private', { campusIds: ['campus-2-private'] })]
      ),
    }
  }
  if (role === 'cross_tenant_assignment_blocked') {
    return {
      role,
      reviewReference,
      topology: topology(
        [entity(1)],
        [],
        [],
        [
          assignment(1, 'teacher-shared-private', {
            tenantId: 'other-tenant-private',
            campusIds: [],
          }),
        ]
      ),
    }
  }
  if (role === 'missing_entity_blocked') {
    return {
      role,
      reviewReference,
      topology: topology([], [], [], [assignment(1, 'teacher-shared-private', { campusIds: [] })]),
    }
  }
  return {
    role,
    reviewReference,
    topology: topology(
      [entity(1), entity(2), entity(3)],
      [campus(1), campus(2), campus(3)],
      [binding(1), binding(2), binding(3)],
      [
        assignment(1, 'teacher-one-private'),
        assignment(2, 'teacher-two-private'),
        assignment(3, 'teacher-three-private'),
      ]
    ),
  }
}

function samples() {
  return [
    sample('three_entity_shared_master_ready'),
    sample('same_entity_duplicate_active_blocked'),
    sample('suspended_history_ready'),
    sample('cross_entity_campus_blocked'),
    sample('cross_tenant_assignment_blocked'),
    sample('missing_entity_blocked'),
    sample('independent_master_teachers_ready'),
  ]
}

function input(): SharedTeacherRegistryEvidenceInput {
  return {
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: samples(),
  }
}

describe('shared teacher registry evidence', () => {
  it('seals seven reviewed cases without teacher, permission or economic authority', () => {
    const artifact = createSharedTeacherRegistryEvidenceArtifact(input())
    expect(artifact).toMatchObject({
      kind: 'cep_multi_entity_shared_teacher_registry_evidence',
      mode: 'seven_case_shared_master_teacher_review',
      verdict: 'eligible_for_manual_staging_binding',
      canReadPayload: false,
      canWrite: false,
      canCreateTeacher: false,
      canAssignTeacher: false,
      canStoreEconomicTerms: false,
      canActivate: false,
      canChangePermissions: false,
      metrics: {
        requiredCases: 7,
        readyCases: 3,
        blockedCases: 4,
        sharedMasterReadyCases: 1,
        duplicateBlockedCases: 1,
        boundaryBlockedCases: 3,
        payloadReads: 0,
        writes: 0,
        teachersCreated: 0,
        assignmentsChanged: 0,
        economicTermsProcessed: 0,
      },
    })
    expect(artifact.cases).toHaveLength(7)
    expect(() => assertSharedTeacherRegistryEvidenceArtifact(artifact)).not.toThrow()
  })

  it('is deterministic under sample reordering', () => {
    const source = input()
    expect(
      serializeSharedTeacherRegistryEvidenceArtifact({
        ...source,
        samples: [...source.samples].reverse(),
      })
    ).toBe(serializeSharedTeacherRegistryEvidenceArtifact(source))
  })

  it('rejects missing, duplicate and mislabeled cases', () => {
    const source = input()
    for (const changed of [
      source.samples.slice(1),
      [
        source.samples[0]!,
        { ...source.samples[0]!, reviewReference: 'review://teacher-registry/duplicate/v1' },
        ...source.samples.slice(2),
      ],
      source.samples.map((entry) =>
        entry.role === 'independent_master_teachers_ready'
          ? { ...entry, role: 'three_entity_shared_master_ready' as const }
          : entry
      ),
    ]) {
      expect(() =>
        createSharedTeacherRegistryEvidenceArtifact({ ...source, samples: changed })
      ).toThrow('SHARED_TEACHER_REGISTRY_EVIDENCE_INVALID')
    }
  })

  it('rejects economic records and unknown topology fields', () => {
    const source = input()
    const first = source.samples[0]!
    const accounting = {
      id: 'accounting-private',
      tenantId: 'tenant-private',
      legalEntityId: 'entity-1-private',
      provider: 'provider',
      externalCompanyId: 'company-private',
      secretReference: 'vault://private/accounting',
      integrationMode: 'read_only' as const,
      status: 'draft' as const,
    }
    for (const changedTopology of [
      { ...first.topology, accountingConnections: [accounting] },
      { ...first.topology, economicTerms: true } as unknown as MultiEntityTopology,
    ]) {
      expect(() =>
        createSharedTeacherRegistryEvidenceArtifact({
          ...source,
          samples: source.samples.map((entry, index) =>
            index === 0 ? { ...entry, topology: changedTopology } : entry
          ),
        })
      ).toThrow('SHARED_TEACHER_REGISTRY_EVIDENCE_INVALID')
    }
  })

  it.each([
    ['digest', { artifactDigest: `sha256:${'f'.repeat(64)}` }],
    ['write', { canWrite: true }],
    ['create teacher', { canCreateTeacher: true }],
    ['economic terms', { canStoreEconomicTerms: true }],
  ])('rejects forged sealed evidence: %s', (_label, change) => {
    const artifact = createSharedTeacherRegistryEvidenceArtifact(input())
    expect(() => assertSharedTeacherRegistryEvidenceArtifact({ ...artifact, ...change })).toThrow(
      'SHARED_TEACHER_REGISTRY_EVIDENCE_INVALID'
    )
  })

  it('redacts all source identifiers and exports no operational method', async () => {
    const serialized = JSON.stringify(createSharedTeacherRegistryEvidenceArtifact(input()))
    for (const value of [
      'tenant-private',
      'entity-1-private',
      'campus-1-private',
      'teacher-shared-private',
      'assignment-1',
      'review://',
    ]) {
      expect(serialized).not.toContain(value)
    }
    const module = await import('../src/multi-entity-teacher-registry-evidence')
    expect(
      Object.keys(module).some((key) =>
        /load|write|createTeacher|assignTeacher|economic/i.test(key)
      )
    ).toBe(false)
  })
})
